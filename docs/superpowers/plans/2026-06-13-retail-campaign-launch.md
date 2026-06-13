# Retail Campaign Launch (Phase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send the proven cold-email drip to the 251 eligible retail leads via Brevo's own scheduler, reusing the already-built reply-scan + webhook + dashboard, and validate that fresh-niche copy converts before building any send automation (Phase 2).

**Architecture:** No new send engine. Retail drip = a few pre-built Brevo HTML campaigns, each scheduled to the retail Brevo list (251 recipients, under the 300/day free-tier cap). The existing `process-blitz-replies` cron suppresses repliers between steps; the existing Brevo webhook tracks opens/clicks/unsub into `tc_leads`; the existing `/staff/social/blitz` dashboard shows engagement live from the Brevo API.

**Tech Stack:** Next.js 16 / TypeScript (repo) · Supabase (`tc_leads`, `tc_campaigns`, `tc_email_templates`) · Brevo REST API (campaigns + contacts/lists) · vitest · Node scripts in `scripts/`.

**Spec:** `docs/superpowers/specs/2026-06-13-truecolor-email-campaign-v2-design.md`

**Hard constraints (from project rules):**
- Cold mail goes through Brevo **marketing/campaign** channel only (never transactional API).
- `/true-color-campaign-presend-audit` MUST pass before any campaign is scheduled.
- Email copy: subject <50 chars · plain-text fallback · UTM'd `truecolorprinting.ca` links (NEVER a Railway/Vercel URL) · real prices per the $25 order-minimum comms rules · brand-voice mandatories (price + Saskatoon + Roland UV + $40 rush + $35 design in the sequence).
- Retail leads are identified by `industry_tags @> '{retail}'` (NOT `drip_niche`).
- Eligible cohort predicate (verified 2026-06-13 = 251 leads):
  `industry_tags=cs.{retail}` AND `email IS NOT NULL` AND `drip_status='queued'` AND `suppression_reason IS NULL` AND `unsubscribed_at IS NULL` AND `validation_status <> 'invalid'`.

---

## File Structure

- Create: `scripts/blitz/build-retail-cohort.mjs` — selects the eligible retail cohort and (with `--sync`) upserts them into the retail Brevo list; `--dry-run` default. Single responsibility: turn the eligibility predicate into a clean Brevo list, never touching suppressed leads.
- Create: `scripts/blitz/__tests__/build-retail-cohort.test.mjs` — unit test for the eligibility filter (pure function).
- Create: `content/campaigns/retail/` — the 5 drip emails (HTML + plain-text) as source-of-truth files, mirrored into Brevo templates.
- Modify (data, via SQL/API, not code): `tc_email_templates` (5 retail rows), `tc_campaigns` (1 wave row), `tc_leads` (retail cohort `queued→active`).

---

## Task 0: Baseline verification (no code)

**Files:** none — read-only checks.

- [ ] **Step 1: Confirm the reply-scan cron is actually running**

Run:
```bash
gh run list --workflow=cron-blitz-replies.yml --limit 5
```
Expected: recent successful runs. If none/failing, fix the workflow before sending (a dead reply-scan = the original "kept emailing repliers" bug). Also smoke-test the logic:
```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://truecolorprinting.ca/api/cron/process-blitz-replies?dryRun=1" | jq .
```
Expected: `{ "ok": true, ... }`.

- [ ] **Step 2: Confirm the eligible retail cohort count**

Run (uses `.env.local` SUPABASE creds):
```bash
cd "/Users/owner/Downloads/Businesses/TrueColor/TRUE COLOR PRICING /truecolor-estimator"
node -e 'const fs=require("fs");const e=Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["\x27]|["\x27]$/g,"")]}));const u=e.SUPABASE_URL,k=e.SUPABASE_SECRET_KEY||e.SUPABASE_SERVICE_KEY;const f="industry_tags=cs.{retail}&email=not.is.null&drip_status=eq.queued&suppression_reason=is.null&unsubscribed_at=is.null&validation_status=neq.invalid";fetch(`${u}/rest/v1/tc_leads?select=id&${f}`,{headers:{apikey:k,Authorization:`Bearer ${k}`,Prefer:"count=exact",Range:"0-0"}}).then(r=>console.log("eligible retail:",r.headers.get("content-range")))'
```
Expected: `eligible retail: 0-0/251` (±, exact at run time). If it has drifted far from 251, note the new number — it drives the campaign recipient count.

- [ ] **Step 3: Confirm the retail Brevo list + landing page + sender**

Run:
```bash
KEY=$(grep -E "^BREVO_API_KEY=" .env.local | cut -d= -f2-)
curl -s "https://api.brevo.com/v3/contacts/lists/15" -H "api-key: $KEY" | jq '{id,name,totalSubscribers}'
curl -s -o /dev/null -w "retail page: %{http_code}\n" https://truecolorprinting.ca/retail-signs-saskatoon
curl -s "https://api.brevo.com/v3/senders" -H "api-key: $KEY" | jq '.senders[] | {name,email,active}'
```
Expected: list 15 exists (the retail HTML-track list), `/retail-signs-saskatoon` returns 200 (the CTA target), and an active sender on `info@true-color.ca`.

- [ ] **Step 4: Commit a baseline note**

```bash
git commit --allow-empty -m "chore(retail-campaign): Task 0 baseline verified (251 eligible, reply-scan live)"
```

---

## Task 1: Generate the retail drip copy

**Files:**
- Create: `content/campaigns/retail/step1-intro.html` + `.txt` (and steps 2–5)

The sequence reuses the **proven structure** (agriculture/construction). 5 steps, cadence `[0, 7, 14, 30, 45]` days. Every email: subject <50 chars, 200–300 word body, plain-text fallback, one UTM'd CTA to the retail page, real prices.

- [ ] **Step 1: Draft the 5-step sequence with the copywriting skill**

Invoke: `/true-color-campaign retail` (or `marketingskills:cold-email` + `marketingskills:email-sequence`) to draft 5 emails. Required per email:
  - Subject <50 chars, no spam-trigger words.
  - Body 200–300 words, brand voice (no "affordable"/"high quality"/"competitive").
  - At least one real price across the sequence: retail signage anchors — Coroplast from $25, Banners from $66, Window Decals from $25, Business Cards from $45 (per `truecolor-pricing-comms.md`). NEVER a stale "$30 minimum".
  - "Saskatoon/Saskatchewan", "in-house Roland UV", "+$40 same-day rush", "$35 design" appear across the sequence.
  - CTA: `https://truecolorprinting.ca/retail-signs-saskatoon?utm_source=brevo&utm_medium=email&utm_campaign=retail-drip-2026-06`
  - Plain-text fallback for each.

- [ ] **Step 2: Save each email to source files**

Write `content/campaigns/retail/step{1..5}-*.html` and matching `.txt`. These are the version-controlled source of truth that get mirrored into Brevo.

- [ ] **Step 3: Self-check copy against the rules**

Run a grep gate over the drafts:
```bash
grep -riE "railway|vercel|affordable|high quality|competitive|best in class|\\$30 min" content/campaigns/retail/ && echo "FAIL: forbidden token found" || echo "OK: no forbidden tokens"
grep -rL "utm_campaign=retail-drip" content/campaigns/retail/*.html && echo "FAIL: a file is missing the UTM CTA" || echo "OK: all have UTM CTA"
```
Expected: both `OK`.

- [ ] **Step 4: Commit the copy**

```bash
git add content/campaigns/retail/
git commit -m "content(retail-campaign): 5-step drip copy (html + text)"
```

---

## Task 2: Cohort builder script (the data-safety boundary — TDD)

**Files:**
- Create: `scripts/blitz/build-retail-cohort.mjs`
- Test: `scripts/blitz/__tests__/build-retail-cohort.test.mjs`

This is the one piece where a bug emails someone who already opted out. The eligibility filter is a pure function and gets a real test.

- [ ] **Step 1: Write the failing test**

```js
// scripts/blitz/__tests__/build-retail-cohort.test.mjs
import { describe, it, expect } from "vitest";
import { isEligible } from "../build-retail-cohort.mjs";

const base = {
  industry_tags: ["retail"], email: "a@b.com", drip_status: "queued",
  suppression_reason: null, unsubscribed_at: null, validation_status: "valid",
};

describe("isEligible", () => {
  it("accepts a clean queued retail lead with an email", () => {
    expect(isEligible(base)).toBe(true);
  });
  it("rejects a lead with no email", () => {
    expect(isEligible({ ...base, email: null })).toBe(false);
  });
  it("rejects a paused/warm lead", () => {
    expect(isEligible({ ...base, drip_status: "paused", suppression_reason: "replied_warm" })).toBe(false);
  });
  it("rejects an unsubscribed lead even if drip_status looks queued", () => {
    expect(isEligible({ ...base, unsubscribed_at: "2026-05-01T00:00:00Z" })).toBe(false);
  });
  it("rejects a non-retail lead", () => {
    expect(isEligible({ ...base, industry_tags: ["healthcare"] })).toBe(false);
  });
  it("rejects an invalid-email lead", () => {
    expect(isEligible({ ...base, validation_status: "invalid" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/blitz/__tests__/build-retail-cohort.test.mjs`
Expected: FAIL — `isEligible` is not exported / module missing.

- [ ] **Step 3: Write the minimal implementation**

```js
// scripts/blitz/build-retail-cohort.mjs
import fs from "node:fs";

const NICHE = "retail";
const BREVO_LIST_ID = 15; // retail HTML-track list

export function isEligible(lead) {
  return (
    Array.isArray(lead.industry_tags) &&
    lead.industry_tags.includes(NICHE) &&
    !!lead.email &&
    lead.drip_status === "queued" &&
    lead.suppression_reason == null &&
    lead.unsubscribed_at == null &&
    lead.validation_status !== "invalid"
  );
}

function loadEnv() {
  const e = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    if (!line.includes("=") || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    e[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return e;
}

async function main() {
  const sync = process.argv.includes("--sync"); // default = dry-run
  const env = loadEnv();
  const URL = env.SUPABASE_URL;
  const KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;
  const BREVO = env.BREVO_API_KEY;

  // Pull retail leads (server-side filter for the cheap predicates; isEligible re-checks all).
  const sel =
    "select=id,email,industry_tags,drip_status,suppression_reason,unsubscribed_at,validation_status" +
    "&industry_tags=cs.{retail}&email=not.is.null";
  const res = await fetch(`${URL}/rest/v1/tc_leads?${sel}&limit=2000`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const leads = await res.json();
  const eligible = leads.filter(isEligible);
  console.log(`retail leads pulled: ${leads.length} | eligible: ${eligible.length} | mode: ${sync ? "SYNC" : "DRY-RUN"}`);

  if (!sync) {
    console.log("dry-run — first 5 eligible:", eligible.slice(0, 5).map((l) => l.email));
    return;
  }
  if (eligible.length > 300) {
    throw new Error(`refusing to sync ${eligible.length} > 300/day cap — split into chunks first`);
  }
  // Upsert eligible emails into the retail Brevo list (marketing channel).
  let ok = 0;
  for (const l of eligible) {
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": BREVO, "content-type": "application/json" },
      body: JSON.stringify({ email: l.email, listIds: [BREVO_LIST_ID], updateEnabled: true }),
    });
    if (r.ok || r.status === 204) ok++;
    else console.error(`brevo upsert failed ${r.status} for ${l.email}`);
  }
  console.log(`synced ${ok}/${eligible.length} into Brevo list ${BREVO_LIST_ID}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/blitz/__tests__/build-retail-cohort.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: Dry-run the real script**

Run: `node scripts/blitz/build-retail-cohort.mjs`
Expected: `eligible: 251` (±), mode DRY-RUN, 5 sample emails printed. Do NOT pass `--sync` yet.

- [ ] **Step 6: Commit**

```bash
git add scripts/blitz/build-retail-cohort.mjs scripts/blitz/__tests__/build-retail-cohort.test.mjs
git commit -m "feat(retail-campaign): tested eligible-cohort builder (dry-run default)"
```

---

## Task 3: Mirror copy into Brevo + register the templates

**Files:** none in repo — Brevo API + `tc_email_templates` rows.

- [ ] **Step 1: Create 5 Brevo email templates from the source files**

For each step, create a Brevo template tagged `brevo-html-blitz` (so the existing webhook tracks it). Per step (example step 1):
```bash
KEY=$(grep -E "^BREVO_API_KEY=" .env.local | cut -d= -f2-)
curl -s -X POST "https://api.brevo.com/v3/smtp/templates" -H "api-key: $KEY" -H "content-type: application/json" -d "{
  \"templateName\": \"retail-drip step1\",
  \"subject\": \"<subject from step1>\",
  \"sender\": { \"email\": \"info@true-color.ca\" },
  \"htmlContent\": $(jq -Rs . < content/campaigns/retail/step1-intro.html),
  \"tag\": \"brevo-html-blitz\",
  \"isActive\": true
}" | jq '{id}'
```
Record each returned template id.

- [ ] **Step 2: Register the 5 steps in `tc_email_templates`**

Insert one row per step (niche_slug=`retail`, the recorded `brevo_template_id`, step, wait_days `[0,7,14,30,45]`, subject, cta_type=`url`, cta_url=the UTM CTA, sequence_version=`2026-06`). Use the Supabase REST insert:
```bash
node -e 'const fs=require("fs");const e=Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["\x27]|["\x27]$/g,"")]}));const u=e.SUPABASE_URL,k=e.SUPABASE_SECRET_KEY||e.SUPABASE_SERVICE_KEY;const rows=[/* fill 5 objects: {niche_slug:"retail",step:1,wait_days:0,subject:"...",brevo_template_id:NNN,cta_type:"url",cta_url:"...",sequence_version:"2026-06"} */];fetch(`${u}/rest/v1/tc_email_templates`,{method:"POST",headers:{apikey:k,Authorization:`Bearer ${k}`,"content-type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(rows)}).then(r=>console.log("insert status",r.status))'
```
Expected: status 201.

- [ ] **Step 3: Verify**

```bash
node -e '...same env loader...; fetch(`${u}/rest/v1/tc_email_templates?niche_slug=eq.retail&select=step,subject,brevo_template_id,wait_days&order=step`,{headers:{apikey:k,Authorization:`Bearer ${k}`}}).then(r=>r.json()).then(d=>console.log(d))'
```
Expected: 5 rows, each with a real `brevo_template_id` and subject.

---

## Task 4: Pre-send audit gate (MANDATORY)

**Files:** none — gate.

- [ ] **Step 1: Run the project pre-send audit**

Invoke: `/true-color-campaign-presend-audit`
It checks images load, CTA links resolve (200), subject merge tags, and pricing. **Do not proceed past this task until it passes.** Fix any flagged item in the source files (Task 1) and re-mirror the affected Brevo template (Task 3) before continuing.

- [ ] **Step 2: Record the audit result**

```bash
git commit --allow-empty -m "chore(retail-campaign): pre-send audit passed"
```

---

## Task 5: Test batch (20 leads) before the full send

**Files:** none — Brevo + Supabase.

- [ ] **Step 1: Build a 20-lead seed list**

Temporarily cap the cohort: take the first 20 eligible emails from `node scripts/blitz/build-retail-cohort.mjs` output and add them to a throwaway Brevo list (e.g. id from a new `retail-test` list). Include one address you control to watch rendering.

- [ ] **Step 2: Schedule step 1 to the seed list ~1 hour out**

In Brevo: create a campaign from the step-1 template targeting the seed list, scheduled ~1h ahead. Confirm the campaign carries the `brevo-html-blitz` tag.

- [ ] **Step 3: After it sends, verify tracking + reply-scan end-to-end**

- Open the email on your test address, click the CTA. Within minutes, confirm the webhook recorded it:
```bash
node -e '...env loader...; fetch(`${u}/rest/v1/tc_leads?email=eq.<your-test-email>&select=engagement_state,last_opened_at,last_clicked_at`,{headers:{apikey:k,Authorization:`Bearer ${k}`}}).then(r=>r.json()).then(console.log)'
```
Expected: `engagement_state` = `opened` or `clicked`, timestamps set.
- Reply "not interested" from your test address to the email, then run the reply-scan and confirm suppression:
```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://truecolorprinting.ca/api/cron/process-blitz-replies?hours=2" | jq .
node -e '...env loader...; fetch(`${u}/rest/v1/tc_leads?email=eq.<your-test-email>&select=drip_status,suppression_reason`,{headers:{apikey:k,Authorization:`Bearer ${k}`}}).then(r=>r.json()).then(console.log)'
```
Expected: `drip_status` = `unsubscribed`, `suppression_reason` set. **This proves the close-the-loop behavior before any real lead is touched.**

- [ ] **Step 2 gate:** if tracking or suppression did NOT register, STOP and debug the webhook/reply-scan before the full send.

---

## Task 6: Schedule the full retail drip

**Files:** none — Brevo + `tc_campaigns` + `tc_leads`.

- [ ] **Step 1: Sync the full eligible cohort into the retail list**

Run: `node scripts/blitz/build-retail-cohort.mjs --sync`
Expected: `synced 251/251 into Brevo list 15` (the script refuses if >300). Re-confirm list size:
```bash
curl -s "https://api.brevo.com/v3/contacts/lists/15" -H "api-key: $KEY" | jq '.totalSubscribers'
```

- [ ] **Step 2: Create + schedule the 5 campaigns**

In Brevo, create one campaign per step from its template → target list 15 → schedule on the cadence dates (step1 = day 0, step2 = +7, step3 = +14, step4 = +30, step5 = +45). Each carries the `brevo-html-blitz` tag. 251 < 300, so no chunking. Record each `campaignId`.

- [ ] **Step 3: Register the wave in `tc_campaigns`**

Insert one row: `campaign_slug=retail-drip-2026-06`, `niche_slug=retail`, `campaign_name="Retail Drip 2026-06"`, `status=ramping`, `total_enrolled=251`, `landing_page_url=https://truecolorprinting.ca/retail-signs-saskatoon`, `launched_at=<today>`.
```bash
node -e '...env loader...; fetch(`${u}/rest/v1/tc_campaigns`,{method:"POST",headers:{apikey:k,Authorization:`Bearer ${k}`,"content-type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({campaign_slug:"retail-drip-2026-06",niche_slug:"retail",campaign_name:"Retail Drip 2026-06",status:"ramping",total_enrolled:251,landing_page_url:"https://truecolorprinting.ca/retail-signs-saskatoon"})}).then(r=>console.log("campaign row",r.status))'
```
Expected: 201.

- [ ] **Step 4: Flip the cohort `queued → active`**

Mark the enrolled leads so the dashboard funnel + future Phase-2 dedup are correct (suppression filters mean only the eligible 251 flip):
```bash
node -e '...env loader...; const f="industry_tags=cs.{retail}&email=not.is.null&drip_status=eq.queued&suppression_reason=is.null&unsubscribed_at=is.null&validation_status=neq.invalid"; fetch(`${u}/rest/v1/tc_leads?${f}`,{method:"PATCH",headers:{apikey:k,Authorization:`Bearer ${k}`,"content-type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({drip_status:"active",drip_niche:"retail",last_campaign_date:new Date().toISOString().slice(0,10)})}).then(r=>console.log("activated",r.status))'
```
Expected: 204. Re-run the eligible-count check from Task 0 Step 2 → should now be ~0 (all flipped to active).

- [ ] **Step 5: Commit the launch record**

```bash
git commit --allow-empty -m "chore(retail-campaign): retail drip scheduled (251 leads, 5 steps, list 15)"
```

---

## Task 7: Operate + the fan-out runbook

**Files:** none — ongoing operations.

- [ ] **Step 1: Daily watch (first 2 weeks)**

Each morning confirm the reply-scan ran (`gh run list --workflow=cron-blitz-replies.yml --limit 1`), then open `/staff/social/blitz` to watch retail opens/clicks. Reply to warm leads from the info@ inbox (they arrive natively; the scan also Telegram-pings them and sets `paused`/`replied_warm`).

- [ ] **Step 2: Decision gate after step 3 (~day 14)**

Read engagement. If retail clears ~15%+ open / ~5%+ click (Batch 1 was ~30%/24%), the fresh-niche copy converts → green-light the fan-out and the Phase-2 send-cron build. If it underperforms, revise copy before reusing the structure on the next niche.

- [ ] **Step 3: Fan-out (repeat this plan per niche)**

Restaurants next (`industry_tags @> '{restaurants}'`), then salon/school/non-profit/church/hotel/daycare. For each: swap the niche slug + Brevo list id + landing page + cohort predicate, regenerate copy (Task 1), re-run Tasks 2–6. Each niche's eligible cohort is its own ≤300/day check.

- [ ] **Step 4: Schedule the 90-day re-drip (deferred)**

`paused`/`replied_warm` non-converters become eligible for a NEW short sequence (different hook) ~90 days out. This is a Phase-2 item — note it, don't build it now.

---

## Self-Review

**Spec coverage:** §3.1 Phase-1 send (Tasks 5–6) · §3.2 lifecycle/enrollment rule (Task 2 `isEligible` + Task 6 flip) · §3.3 reply-scan reuse (Task 0, Task 5) · §3.4 dashboard/tc_campaigns row (Task 6) · §3.5 content (Task 1) · §3.6 pre-send gate (Task 4) · §4 rollout/fan-out (Task 7). Covered.

**Placeholder note:** Task 3 Step 2 and several steps use `...env loader...` shorthand for the same ~5-line dotenv reader defined fully in Task 0 Step 2 / Task 2 Step 3 — the executor copies that block. The Brevo template-id values and the 5 `tc_email_templates` row objects are intentionally filled at execution time because they don't exist until Task 1/Task 3 create them; each such step names exactly which fields to set.

**Type/name consistency:** `isEligible` predicate is identical in the test, the script, and the SQL filters in Tasks 0/6. Brevo retail list id = 15 everywhere. Cohort predicate string is identical in Task 0 Step 2 and Task 6 Step 4.
