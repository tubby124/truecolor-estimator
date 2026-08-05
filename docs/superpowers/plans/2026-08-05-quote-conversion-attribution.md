# Quote Conversion Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `quote_requests` conversion data reflect reality by attributing paid orders to the quote that produced them, including the ~100% of conversions that happen outside the Pay Now flow.

**Architecture:** Add a second, independent attribution path that matches paid orders to quotes by customer email inside a time window, writing only to `quote_requests` (never to `orders.quote_request_id`, which stays reserved for the structured Pay Now path). Backfill history once, then run hourly via a GitHub Actions cron hitting a new authenticated endpoint. Attribution method is recorded per row so Pay Now and email-match conversions stay distinguishable.

**Tech Stack:** Postgres/Supabase (plpgsql, SECURITY DEFINER RPC), Next.js 16 App Router API routes, Vitest, GitHub Actions cron.

---

## Root cause (verified 2026-08-05, do not re-derive)

The structured quote path is fully built and applied to production, and has **never been used once**:

| Check (all-time, production) | Result |
|---|---:|
| `orders` with `quote_request_id` set | **0** |
| `quote_requests` with `quote_total_cents` set | **0** |
| `quote_requests` with `quote_line_items` set | **0** |
| `quote_requests` with `converted_order_id` set | **0** |
| `quote_requests` with `won_at` / `converted_at` set | **0** |
| `quote_requests` with `quoted_at` set | 45 |

Why: staff answer quotes from Gmail (`info@true-color.ca`) or via `POST /api/staff/quotes/[id]/send-reply`, which sets `replied_at`/`quoted_at` with `has_pay_now: false`. Customers then order through normal checkout or pay in store. Only `POST /api/staff/quotes/[id]/send-quote` → `/pay/<token>` → `materialize_quote_order` sets `orders.quote_request_id`, and the `orders.paid_at` trigger in `supabase/migrations/20260720100000_quote_conversion_measurement.sql:839` joins on that column — so it never matches.

Ground truth for the last 30 days, recovered by joining `quote_requests.email` → `customers.email` → `orders.customer_id`: **7 of 23 quote leads placed 9 orders, 6 paid, $926.30 collected.** The dashboard reports 0.

**This is a measurement gap, not a broken write.** Do not "fix" the Pay Now path — it is correct. Do not change staff workflow; the Gmail-first flow is what is producing the revenue.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20260805120000_quote_email_attribution.sql` (create) | Attribution columns, uniqueness guard, `attribute_quote_conversions()` RPC |
| `src/lib/payment/__tests__/quote-email-attribution.test.ts` (create) | Contract test over the migration source, matching existing repo test style |
| `src/app/api/cron/quote-attribution/route.ts` (create) | Authenticated endpoint invoking the RPC, with heartbeat |
| `.github/workflows/cron-quote-attribution.yml` (create) | Hourly schedule |
| `scripts/backfill-quote-attribution.mjs` (create) | One-time historical backfill with mandatory dry-run |
| `supabase/migrations/20260805130000_quote_conversion_report_view.sql` (create) | `quote_conversion_report` view — the only surface reporting should query |
| `memory/seo-sprints.md` (modify) | Sprint log entry — repo convention requires it |

No `page.tsx` files are touched, so the SEO wave guard hooks do not apply to this work.

---

### Task 1: Attribution migration

**Files:**
- Create: `supabase/migrations/20260805120000_quote_email_attribution.sql`
- Test: `src/lib/payment/__tests__/quote-email-attribution.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/payment/__tests__/quote-email-attribution.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const MIGRATION = "supabase/migrations/20260805120000_quote_email_attribution.sql";

describe("quote email attribution contract", () => {
  it("records how each conversion was attributed", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS attribution_method text");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS attributed_at timestamptz");
    expect(sql).toContain("attribution_method IN ('pay_now', 'email_match')");
  });

  it("never lets two quotes claim the same order", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_converted_order_id_uidx",
    );
  });

  it("leaves the structured Pay Now path untouched", () => {
    const sql = source(MIGRATION);
    expect(sql).not.toContain("UPDATE public.orders");
    expect(sql).toContain("o.quote_request_id IS NULL");
  });

  it("supports a side-effect-free dry run", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("p_dry_run boolean DEFAULT false");
    expect(sql).toContain("AND NOT p_dry_run");
  });

  it("only ever fills empty conversion fields", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("q.converted_order_id IS NULL");
    expect(sql).toContain("won_at = COALESCE(q.won_at,");
    expect(sql).toContain("converted_at = COALESCE(q.converted_at,");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- quote-email-attribution`
Expected: FAIL — `ENOENT: no such file or directory ... 20260805120000_quote_email_attribution.sql`

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20260805120000_quote_email_attribution.sql`:

```sql
-- Quote conversion attribution by customer email.
--
-- Context: the structured Pay Now path (materialize_quote_order) sets
-- orders.quote_request_id and the paid_at trigger stamps won_at/converted_at.
-- That path has never been exercised in production. Staff reply from Gmail and
-- customers order through normal checkout, so conversions are invisible.
--
-- This migration adds an INDEPENDENT attribution path. It writes only to
-- quote_requests. It never writes to orders, so the Pay Now invariants and the
-- orders_quote_request_id_uidx index are unaffected.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS attribution_method text,
  ADD COLUMN IF NOT EXISTS attributed_at timestamptz;

ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_attribution_method_check;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_attribution_method_check
  CHECK (attribution_method IS NULL OR attribution_method IN ('pay_now', 'email_match'));

-- One order may only ever be credited to one quote.
CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_converted_order_id_uidx
  ON public.quote_requests (converted_order_id)
  WHERE converted_order_id IS NOT NULL;

COMMENT ON COLUMN public.quote_requests.attribution_method IS
  'pay_now = materialized through the signed Pay Now token; email_match = inferred from a paid order by the same customer email inside the attribution window.';

CREATE OR REPLACE FUNCTION public.attribute_quote_conversions(
  p_window_days integer DEFAULT 60,
  p_dry_run boolean DEFAULT false
)
RETURNS TABLE (
  quote_id uuid,
  order_id uuid,
  quote_email text,
  quote_created_at timestamptz,
  order_paid_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT
      q.id         AS quote_id,
      o.id         AS order_id,
      lower(btrim(q.email)) AS quote_email,
      q.created_at AS quote_created_at,
      o.paid_at    AS order_paid_at
    FROM public.quote_requests q
    JOIN public.customers c
      ON lower(btrim(c.email)) = lower(btrim(q.email))
    JOIN public.orders o
      ON o.customer_id = c.id
    WHERE q.email IS NOT NULL
      AND btrim(q.email) <> ''
      AND q.converted_order_id IS NULL
      AND q.is_archived IS NOT TRUE
      AND o.paid_at IS NOT NULL
      AND o.paid_at >= q.created_at
      AND o.paid_at < q.created_at + make_interval(days => p_window_days)
      AND o.quote_request_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.quote_requests claimed
        WHERE claimed.converted_order_id = o.id
      )
  ),
  -- Each order is claimed by the earliest quote that could have produced it.
  order_claimed AS (
    SELECT DISTINCT ON (order_id) *
    FROM candidate
    ORDER BY order_id, quote_created_at ASC, quote_id ASC
  ),
  -- Each quote takes at most one order: its earliest paid match.
  final AS (
    SELECT DISTINCT ON (quote_id) *
    FROM order_claimed
    ORDER BY quote_id, order_paid_at ASC, order_id ASC
  ),
  upd AS (
    UPDATE public.quote_requests q
    SET
      converted_order_id = f.order_id,
      checkout_started_at = COALESCE(q.checkout_started_at, f.order_paid_at),
      won_at = COALESCE(q.won_at, f.order_paid_at),
      converted_at = COALESCE(q.converted_at, f.order_paid_at),
      attribution_method = COALESCE(q.attribution_method, 'email_match'),
      attributed_at = COALESCE(q.attributed_at, now()),
      lifecycle_status = 'won'
    FROM final f
    WHERE q.id = f.quote_id
      AND NOT p_dry_run
    RETURNING q.id
  )
  SELECT
    f.quote_id,
    f.order_id,
    f.quote_email,
    f.quote_created_at,
    f.order_paid_at
  FROM final f
  ORDER BY f.order_paid_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.attribute_quote_conversions(integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_quote_conversions(integer, boolean) TO service_role;

-- Label the conversions the Pay Now path already owns, so the two are
-- distinguishable the first time that path is ever used.
UPDATE public.quote_requests
SET attribution_method = 'pay_now',
    attributed_at = COALESCE(attributed_at, converted_at, won_at, now())
WHERE converted_order_id IS NOT NULL
  AND attribution_method IS NULL;
```

Note on the `upd` CTE: Postgres always executes data-modifying CTEs even when the outer query does not reference them, so `p_dry_run = true` yields the match list with zero writes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- quote-email-attribution`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260805120000_quote_email_attribution.sql \
        src/lib/payment/__tests__/quote-email-attribution.test.ts
git commit -m "feat(quotes): attribute paid orders to quotes by customer email"
```

---

### Task 2: Apply the migration and dry-run the backfill

**Files:**
- Create: `scripts/backfill-quote-attribution.mjs`

- [ ] **Step 1: Apply the migration to production**

Run:
```bash
npx supabase db push
```
Expected: `20260805120000_quote_email_attribution.sql` listed as applied, no errors.

- [ ] **Step 2: Write the backfill script**

Create `scripts/backfill-quote-attribution.mjs`:

```javascript
#!/usr/bin/env node
/**
 * One-time historical backfill for quote conversion attribution.
 *
 * Dry run (default):  node scripts/backfill-quote-attribution.mjs
 * Apply:              node scripts/backfill-quote-attribution.mjs --apply
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnv();
const apply = process.argv.includes("--apply");

const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/attribute_quote_conversions`, {
  method: "POST",
  headers: {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ p_window_days: 60, p_dry_run: !apply }),
});

if (!res.ok) {
  console.error(`FAILED ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
console.log(apply ? "APPLIED" : "DRY RUN — no writes");
console.log(`matches: ${rows.length}`);
for (const r of rows) {
  console.log(
    `  quote ${r.quote_created_at.slice(0, 10)} ${r.quote_email} -> order paid ${r.order_paid_at.slice(0, 10)}`,
  );
}
```

- [ ] **Step 3: Run the dry run**

Run: `node scripts/backfill-quote-attribution.mjs`
Expected: `DRY RUN — no writes` and a match list that includes these six known-good pairs verified on 2026-08-05:

```
jinfeierchen@gmail.com        -> order paid 2026-07-31
megha.shreya@insightrix.com   -> order paid 2026-07-31
egnormandeau@gmail.com        -> order paid 2026-07-27
luqiong2000@gmail.com         -> order paid 2026-07-22
fowlplaydecoys@gmail.com      -> order paid 2026-07-21
kg@genieseniorservices.com    -> order paid 2026-07-17
ronan.cossette@thomascare.org -> order paid 2026-07-09
```

**Stop and review with Hasan before Step 4.** If the dry run proposes a match that is obviously wrong (a repeat customer whose paid order predates the quote's subject matter), lower `p_window_days` and re-run rather than applying.

- [ ] **Step 4: Apply the backfill**

Run: `node scripts/backfill-quote-attribution.mjs --apply`
Expected: `APPLIED` with the same match count as the reviewed dry run.

- [ ] **Step 5: Verify in the database**

Run:
```bash
node -e '
const fs=require("fs");const env={};
for(const l of fs.readFileSync(".env.local","utf8").split("\n")){const t=l.trim();if(!t||t.startsWith("#")||!t.includes("="))continue;const i=t.indexOf("=");env[t.slice(0,i)]=t.slice(i+1).replace(/^[\x27"]|[\x27"]$/g,"");}
fetch(env.SUPABASE_URL+"/rest/v1/quote_requests?select=email,won_at,attribution_method&converted_order_id=not.is.null",
{headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:"Bearer "+env.SUPABASE_SERVICE_KEY}})
.then(r=>r.json()).then(d=>{console.log("attributed quotes:",d.length);d.forEach(r=>console.log(" ",r.email,r.won_at?.slice(0,10),r.attribution_method));});'
```
Expected: 7 or more rows, every one with `attribution_method = email_match`.

- [ ] **Step 6: Commit**

```bash
git add scripts/backfill-quote-attribution.mjs
git commit -m "chore(quotes): add one-time quote attribution backfill script"
```

---

### Task 3: Ongoing hourly attribution

**Files:**
- Create: `src/app/api/cron/quote-attribution/route.ts`
- Create: `.github/workflows/cron-quote-attribution.yml`

- [ ] **Step 1: Write the cron route**

Create `src/app/api/cron/quote-attribution/route.ts`:

```typescript
/**
 * GET /api/cron/quote-attribution
 *
 * Attributes newly paid orders to the quote request that produced them, by
 * customer email inside a 60-day window. Complements the structured Pay Now
 * path, which sets orders.quote_request_id directly.
 *
 * Schedule: hourly via .github/workflows/cron-quote-attribution.yml
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordCronRun } from "@/lib/cron/heartbeat";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc("attribute_quote_conversions", {
      p_window_days: 60,
      p_dry_run: false,
    });

    if (error) {
      await recordCronRun("quote-attribution", false, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const attributed = Array.isArray(data) ? data.length : 0;
    await recordCronRun("quote-attribution", true, `attributed=${attributed}`);
    return NextResponse.json({ ok: true, attributed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await recordCronRun("quote-attribution", false, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

`recordCronRun(cronName, ok, detail?)` creates its own service client (`src/lib/cron/heartbeat.ts:15`) — do not pass `supabase` into it.

- [ ] **Step 2: Verify build and lint pass**

Run: `npm run lint && npm run build`
Expected: no errors; `/api/cron/quote-attribution` appears in the route list.

- [ ] **Step 3: Add the schedule**

Create `.github/workflows/cron-quote-attribution.yml`:

```yaml
name: Quote Conversion Attribution

on:
  schedule:
    # Hourly at :20, offset from the other crons.
    - cron: "20 * * * *"
  workflow_dispatch: # allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Call quote-attribution cron endpoint
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://truecolorprinting.ca/api/cron/quote-attribution)
          echo "Response: $STATUS"
          [ "$STATUS" = "200" ] || exit 1
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/quote-attribution/route.ts \
        .github/workflows/cron-quote-attribution.yml
git commit -m "feat(quotes): run quote conversion attribution hourly"
```

- [ ] **Step 5: Deploy and smoke test**

Push to main, wait for the Railway deploy to go healthy, then run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://truecolorprinting.ca/api/cron/quote-attribution
```
Expected: `200`. A second immediate call should also return `200` with `attributed: 0`, proving idempotency.

---

### Task 4: A reporting view that cannot be misread

**Files:**
- Create: `supabase/migrations/20260805130000_quote_conversion_report_view.sql`

`mark_quote_sent` sets `quoted_at` on a plain reply, so `lifecycle_status = 'quoted'` means "staff replied", not "a price was sent" — all 45 historical `quoted_at` rows have `quote_total_cents = NULL`. The staff UI never reads `lifecycle_status`; the only consumers are ad-hoc reporting queries, which is precisely what produced the false "0 conversions, quote pipeline is leaking" read on 2026-08-05. Fix the reporting surface, not the staff RPC.

- [ ] **Step 1: Write the view migration**

Create `supabase/migrations/20260805130000_quote_conversion_report_view.sql`:

```sql
-- Canonical read surface for quote funnel reporting.
--
-- Query this view, never quote_requests.lifecycle_status directly:
-- lifecycle_status = 'quoted' only means a reply was marked sent. It does NOT
-- mean a price was quoted, and its absence does NOT mean the lead did not buy.

CREATE OR REPLACE VIEW public.quote_conversion_report AS
SELECT
  q.id,
  q.created_at,
  q.name,
  q.email,
  q.lifecycle_status,
  q.is_archived,
  (q.replied_at IS NOT NULL)          AS was_replied,
  (q.quote_total_cents IS NOT NULL)   AS was_priced,
  (q.converted_order_id IS NOT NULL)  AS did_convert,
  q.attribution_method,
  q.quote_total_cents,
  q.won_at,
  q.converted_at,
  o.order_number                      AS converted_order_number,
  o.total                             AS converted_order_total,
  o.paid_at                           AS converted_order_paid_at
FROM public.quote_requests q
LEFT JOIN public.orders o
  ON o.id = q.converted_order_id;

COMMENT ON VIEW public.quote_conversion_report IS
  'Truthful quote funnel read surface. was_priced distinguishes a real priced quote from a plain reply; did_convert covers both pay_now and email_match attribution. Reporting must use this view.';

GRANT SELECT ON public.quote_conversion_report TO service_role;
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
npx supabase db push
```
Expected: migration applied, no errors.

Then run:
```bash
node -e '
const fs=require("fs");const env={};
for(const l of fs.readFileSync(".env.local","utf8").split("\n")){const t=l.trim();if(!t||t.startsWith("#")||!t.includes("="))continue;const i=t.indexOf("=");env[t.slice(0,i)]=t.slice(i+1).replace(/^[\x27"]|[\x27"]$/g,"");}
fetch(env.SUPABASE_URL+"/rest/v1/quote_conversion_report?select=email,was_replied,was_priced,did_convert,converted_order_total&created_at=gte.2026-07-06&order=created_at.desc",
{headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:"Bearer "+env.SUPABASE_SERVICE_KEY}})
.then(r=>r.json()).then(d=>{
const conv=d.filter(r=>r.did_convert);
console.log("quotes 30d:",d.length,"| replied:",d.filter(r=>r.was_replied).length,"| priced:",d.filter(r=>r.was_priced).length,"| converted:",conv.length);
console.log("attributed revenue: $"+conv.reduce((s,r)=>s+Number(r.converted_order_total||0),0).toFixed(2));});'
```
Expected: `converted:` is 7 or more and attributed revenue is non-zero — the number that read as 0 before this plan.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260805130000_quote_conversion_report_view.sql
git commit -m "feat(quotes): add truthful quote conversion reporting view"
```

---

### Task 5: Log the sprint

**Files:**
- Modify: `memory/seo-sprints.md`

- [ ] **Step 1: Append the entry**

Add a new `## SEO Phase` entry at the end of `memory/seo-sprints.md` recording: the root cause table from this plan, both migration filenames (`20260805120000_quote_email_attribution.sql`, `20260805130000_quote_conversion_report_view.sql`), the backfill match count actually applied, the instruction that all future quote funnel reporting queries `quote_conversion_report` rather than `quote_requests.lifecycle_status`, and the note that Zara's 2026-08-05 brief in `docs/seo/homepage-ctr-brief-2026-08-05.md` misread this measurement gap as a sales leak.

- [ ] **Step 2: Commit**

```bash
git add memory/seo-sprints.md
git commit -m "docs: log quote attribution fix in sprint log"
```

---

## Out of scope — operational, do these by hand today

Not code. Verified from production data and the `info@true-color.ca` mailbox on 2026-08-05:

1. **Lu Qiong — $341.88 uncollected.** Two `pending_payment` orders from 2026-07-22 ($182.04 and $159.84), never paid, alongside a completed $148.74 order. Fastest real money on the list.
2. **`evert@rvrrsk.cs` bounced.** Delivery Status Notification (Failure), 2026-07-08. The domain is almost certainly a typo for `.ca`. A real lead that was never reached — phone follow-up.
3. **`hannah.melotto@melottogroup.co`** is marked `replied_at` in the database but has zero messages in the mailbox. Either the reply went from another account or the flag is false.
4. **Ignore** `tracy@vettedvas.com`, `daniel@trustedvirtualteam.com`, `dianacruz.mkt@gmail.com`, `gretchensmith3674@gmail.com` — VA/marketing solicitation, already archived, correctly excluded by the `is_archived` filter in Task 1.

## Explicitly not in this plan

- **No homepage or SEO page edits.** The 2026-07-02 commit `9455b75` already rewrote the homepage title targeting `print shop` and `printing near me`; those queries still show 0% CTR a month later, so metadata is not the lever. No `page.tsx` in this plan.
- **No change to the Pay Now path.** `materialize_quote_order`, `/api/pay/quote`, and `send-quote` are correct and stay untouched.
- **No change to staff reply workflow.** Gmail-first quoting is producing the revenue; this plan measures it rather than redirecting it.
