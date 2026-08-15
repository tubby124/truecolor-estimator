# Google Ads Quote Attribution Repair Implementation Plan

> **For Claude Code:** Implement this plan task-by-task. This is the highest-priority True Color PPC reliability item before any keyword, bid, budget, or landing-page optimization.

**Goal:** Make a Google Ads click → website quote request → paid quote flow produce (1) a reliable qualified-lead signal and (2) an idempotent, revenue-valued `quote_won` conversion, without sending a conversion for sales that cannot be truthfully tied to a Google ad.

**Architecture:** The app already persists first/latest paid attribution (`gclid`, `gbraid`, `wbraid`, UTMs) on `quote_requests` and copies it into quote-derived `orders`. It already emits `quote_submit` / `quote_qualified` to GA4 and uploads paid orders through `google_ads_conversion_outbox`. The missing layer is a real Google Ads lead conversion for a successful quote request plus auditable proof that the click identifier survived quote → order → paid conversion.

**Tech stack:** Next.js 16 / TypeScript, Supabase PostgreSQL + migrations, Google Ads tag + Data Manager/offline conversions, GA4 Measurement Protocol, Vitest, Playwright, Railway.

---

## Non-negotiable facts and guardrails

- **Observed problem:** a real sticker sale occurred, but the live report classified it `not_attributable`. That means revenue happened; it does *not* prove the ads failed. It means the paid click identifier was absent when the order entered the outbox.
- Do not backfill or upload a sale as Google Ads revenue unless one of its stored click identifiers (`gclid`, `gbraid`, `wbraid`) is present, or a separately approved Enhanced Conversions for Leads design can prove the match. Never fabricate an ad conversion to improve reporting.
- Do not change Google Ads campaign status, targeting, budgets, bids, keywords, or ad copy during this work.
- Do not send customer data to Google beyond the already approved/implemented hashing boundary. If Enhanced Conversions for Leads is added, document the data flow and consent posture before shipping.
- Keep the existing server-side paid-order outbox as the source of truth. Browser-only success events are diagnostics, not revenue truth.
- Existing code already handles quote attribution when the quote is linked correctly:
  - `src/app/api/staff/manual-order/route.ts:168-190` defines the quote attribution fields and warns that omission produces `not_attributable`.
  - `supabase/migrations/20260720100000_quote_conversion_measurement.sql:485-620` copies those fields when materializing a structured quote into an order.
  - `supabase/migrations/20260720110000_google_ads_conversion_outbox.sql:42-96` emits a paid conversion only if exactly one click ID exists; otherwise it correctly marks the row `not_attributable`.
- Existing `quote_submit` is **GA4-only**, not a Google Ads bidding conversion: `src/app/api/cron/google-ads-conversions/route.ts:373-415` sends the durable quote event through GA4 Measurement Protocol.

## Definition of done

1. A valid Google Ads click identifier is captured on a successful website quote request and survives both supported quote-to-order paths.
2. The first successful quote submission fires one deduplicated Google Ads **qualified lead** conversion using an approved action ID/label; retries/duplicate submits do not double count.
3. A quote converted and paid through either structured Pay Now or staff manual order gets one `quote_won` row with the same attribution and enters the offline conversion uploader as `pending`/`submitted`, never `not_attributable`.
4. A direct/manual/non-paid sale remains honestly `not_attributable` and does not contaminate Ads reporting.
5. Dashboard/reporting displays separate counts for: quote requests, Google-paid quote requests, qualified leads uploaded, paid `quote_won` conversions uploaded, and unattributable paid sales.
6. A production smoke test is performed using a non-billable, controlled test record and then cleaned up. No fake transaction may pollute GA4 or Google Ads production reporting.

---

### Task 1: Establish the current attribution truth for the sticker sale

**Objective:** Identify exactly where the click ID disappeared before changing anything.

**Files:**
- Inspect: production Supabase `quote_requests`, `orders`, `google_ads_conversion_outbox`
- Inspect: `src/app/api/quote-request/route.ts`
- Inspect: `src/app/api/staff/manual-order/route.ts`
- Inspect: `supabase/migrations/20260720100000_quote_conversion_measurement.sql`

**Step 1: Locate the actual sale safely**

Use the order number / quote reference already available to staff. Do not put customer name, email, phone, or raw GCLID into logs, commits, issues, or the vault.

**Step 2: Produce a no-PII trace table**

For the matching quote/order/outbox rows, report only:

```text
quote_exists | quote_has_paid_click_id | order_linked_to_quote | order_has_paid_click_id | conversion_type | outbox_status
```

**Step 3: Classify the break**

Use one of these exact outcomes:

- `NO_QUOTE_RECORD`: sale did not begin as a website quote; it cannot inherit quote attribution.
- `QUOTE_UNATTRIBUTED`: quote exists but no paid click ID was captured; investigate landing/cookie/form capture.
- `ORDER_NOT_LINKED`: quote has a paid ID but staff created an unrelated order; fix staff workflow/use `quote_request_id`.
- `COPY_FAILURE`: quote has a paid ID, linked order lacks it; regression in materialization/manual-order copy.
- `OUTBOX_FAILURE`: order has ID but outbox is not uploadable; investigate trigger/uploader.
- `ATTRIBUTED_AND_SENT`: no repair needed for this sample.

**Step 4: Record the sanitized finding**

Append the classification and date to `docs/paid-search/COPY-LEARNING-LOG.md`. Do not label a sale PPC-attributed without the evidence row.

**Step 5: Commit**

```bash
git add docs/paid-search/COPY-LEARNING-LOG.md
git commit -m "docs: record paid quote attribution trace"
```

---

### Task 2: Add an explicit Google Ads qualified-lead conversion contract

**Objective:** Turn a successful, durable website quote request into a Google Ads primary/secondary conversion only after the record exists.

**Files:**
- Modify: `docs/paid-search/campaign-config.mjs`
- Modify: `docs/paid-search/approved-claims.mjs` only if needed for config validation; do not change ad copy
- Modify: `scripts/google-ads/controlled-test-contract.mjs`
- Modify: `scripts/google-ads/live-verification-contract.mjs`
- Modify/Create: relevant Google Ads config tests under `scripts/google-ads/node-tests/`
- Create: a narrowly-scoped client/server conversion helper under `src/lib/google-ads/` or the existing analytics module

**Step 1: Create the conversion action in Google Ads — owner/UI gate**

Create a dedicated conversion action named exactly `quote_submit_qualified` (or document the exact chosen name) under the True Color advertiser account. It must be separate from `purchase_online` and `quote_won`.

Configure it as a lead, count once, no synthetic value, and choose primary vs secondary explicitly. Default recommendation: **secondary until 10–20 verified paid-click quote submissions are observed**, then promote only if lead quality proves acceptable.

Record the action ID, label, counting rule, primary/secondary state, and consent/Enhanced-Conversions decision in the config. Never hardcode an unsourced label in browser code.

**Step 2: Add contract validation**

Write a failing test proving the contract rejects:
- missing lead action ID/label;
- a lead action reusing the purchase or quote_won action ID;
- primary state without the documented evidence gate;
- a malformed `AW-.../...` label.

**Step 3: Implement minimal config support**

Add the lead conversion action to the typed contract and runtime environment requirements. Keep it independent from the revenue upload actions.

**Step 4: Verify config**

Run:

```bash
node scripts/google-ads/config-validator.mjs
node --test scripts/google-ads/node-tests/*.node.mjs
```

Expected: validator reports `VALIDATED`; tests pass.

**Step 5: Commit**

```bash
git add docs/paid-search/campaign-config.mjs scripts/google-ads/
git commit -m "feat: define qualified quote lead conversion contract"
```

---

### Task 3: Fire the lead conversion only after a first-time quote insert

**Objective:** Send one lead conversion after the database confirms a non-duplicate quote request, never on a failed or replayed browser form submit.

**Files:**
- Modify: `src/app/api/quote-request/route.ts`
- Modify: `src/components/paid/PaidQuoteForm.tsx`
- Modify: `src/app/quote/page.tsx`
- Modify: `src/components/contact/ContactForm.tsx` if it uses the same success handler
- Modify/Create tests: `src/lib/__tests__/quote-submission-contract.test.ts`, client helper tests

**Step 1: Write failing tests**

Cover:
- one new quote → exactly one lead conversion dispatch;
- duplicate `submission_key` → no second dispatch;
- API/Turnstile/database failure → no dispatch;
- missing/invalid conversion label → fail closed without breaking quote submission;
- client dispatch carries no raw email, phone, or GCLID in a browser-visible payload.

**Step 2: Choose the transport deliberately**

Use a server-issued success response containing only a short-lived, signed/deduplicated conversion token or a browser conversion dispatch with the approved label. Do not place customer PII in client storage or page props. Preserve the durable DB event as the audit source.

**Step 3: Implement the smallest safe path**

- In `quote-request/route.ts`, only create the lead conversion entitlement when `!isDuplicate` and the quote row successfully exists.
- In the UI, dispatch `gtag('event', 'conversion', { send_to: <approved lead label> })` once after success, with a robust dedupe key based on the quote ID/submission key.
- Keep existing GA4 `generate_lead` and durable `quote_submit` instrumentation; do not replace them.

**Step 4: Run focused tests**

```bash
npx vitest run src/lib/__tests__/quote-submission-contract.test.ts src/lib/analytics/__tests__/paid-funnel-contract.test.ts
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/app/api/quote-request/ src/components/paid/ src/app/quote/ src/components/contact/ src/lib/
git commit -m "feat: fire deduplicated Google Ads quote lead conversion"
```

---

### Task 4: Make quote-to-order attribution impossible to silently drop

**Objective:** Enforce correct quote linkage in both structured Pay Now and staff manual-order paths.

**Files:**
- Inspect/modify: `src/app/api/staff/manual-order/route.ts`
- Inspect/modify: the staff quote UI that launches manual orders
- Inspect: `supabase/migrations/20260720100000_quote_conversion_measurement.sql`
- Create/modify tests: `src/lib/payment/__tests__/quote-link-contract.test.ts`, route tests

**Step 1: Write failing tests**

- A paid Google-attributed quote converted through Pay Now copies its click ID to the new order.
- A staff-made order from an existing quote must send `quote_request_id` and becomes `quote_won`.
- A staff user cannot accidentally create an unlinked manual order from within a quote detail screen without an explicit warning/confirmation.
- An unlinked direct/manual order remains `purchase_online` or the correct non-quote class and does not claim quote attribution.

**Step 2: Verify both actual conversion paths**

The structured SQL path already copies attribution in `materialize_quote_order`. Verify the staff UI passes the quote ID into `POST /api/staff/manual-order`; the route already has safe copy logic when `quote_request_id` is supplied.

**Step 3: Add a staff UI guard if missing**

When a staff member starts from a quote, prefill and lock/visibly show the quote linkage. If they intentionally detach it, require a clear reason and emit an audit event. Do not silently create a fresh order.

**Step 4: Run focused tests**

```bash
npx vitest run src/lib/payment/__tests__/quote-link-contract.test.ts
npx tsc --noEmit
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/app/api/staff/ src/app/staff/ src/lib/payment/ supabase/migrations/
git commit -m "fix: preserve paid attribution through quote orders"
```

---

### Task 5: Surface the truth in the PPC report

**Objective:** Stop making staff infer PPC performance from a revenue outbox alone.

**Files:**
- Modify: `scripts/google-ads/paid-funnel-report.mjs`
- Modify/Create: report tests
- Modify: `docs/paid-search/COPY-LEARNING-LOG.md`

**Step 1: Add no-PII counters**

Print these separately for the selected date window:

```text
website quote requests
quote requests with paid click ID
qualified lead conversions dispatched/uploaded
paid quote_won rows: sent / pending / not_attributable / retry / dead
paid online purchases: sent / pending / not_attributable / retry / dead
```

**Step 2: Add an honest verdict rule**

If attributed revenue is zero but paid quote requests or known closed sales exist, report:

```text
Commercial signal exists; revenue attribution coverage is incomplete.
Do not use reported ROAS to pause or scale this campaign.
```

Do not equate a lack of attribution with a lack of sales.

**Step 3: Test with fixtures**

Include one fixture for each Task 1 classification and assert the right message/counter.

**Step 4: Commit**

```bash
git add scripts/google-ads/ docs/paid-search/COPY-LEARNING-LOG.md
git commit -m "feat: report quote attribution coverage"
```

---

### Task 6: Production verification and rollout

**Objective:** Prove the whole path once without corrupting live marketing data.

**Files:**
- Modify: `docs/paid-search/COPY-LEARNING-LOG.md`
- Create/update: a short runbook in `docs/paid-search/`

**Step 1: Preflight**

Verify production has:
- the correct Ads tag served and CSP permits Google Ads requests;
- the exact qualified lead action ID/label configured;
- action state documented (secondary by default);
- conversion uploader healthy;
- no duplicate test analytics route.

**Step 2: Controlled real-flow smoke**

Use a real Google click only if it is policy-safe and non-billable/test-safe. Submit one quote, confirm its no-PII attribution trace shows a click ID, then convert that same quote using the actual staff/Pay Now workflow. Confirm:

```text
quote request saved → lead conversion exactly once → linked order → quote_won outbox pending/submitted → Google receipt/readback
```

If no safe live test is possible, use a staging environment with Google tag debug tools and document the production verification gate as open. Do not fake `gclid` values in production.

**Step 3: Check reporting after propagation**

Use the read-only funnel report and Google Ads conversion action readback. Confirm the test record is excluded/clearly marked before drawing PPC conclusions.

**Step 4: Document outcome**

Append what passed, what is still blocked, and the exact next action. Only after a verified paid-click quote conversion may bidding strategy be reconsidered.

**Step 5: Commit**

```bash
git add docs/paid-search/
git commit -m "docs: verify quote attribution conversion path"
```

---

## Claude execution prompt

```text
Read docs/plans/2026-08-15-google-ads-quote-attribution-repair.md in full. Treat it as P0 before any PPC optimization. Start with Task 1 and return the sanitized attribution classification for the existing sticker sale. Do not alter Google Ads campaign settings, budgets, bids, keywords, or copy. Do not fabricate or backfill an Ads conversion without evidence. Implement in small commits with the specified tests, and update the learning log after each verified stage.
```
