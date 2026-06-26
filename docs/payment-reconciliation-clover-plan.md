# Plan — Close the Clover reconciliation blind spot

**Status:** PROPOSED · **Author:** session 2026-06-25 · **Trigger:** TC-2026-0164 (Keely Bitternose, rush) sat `pending_payment` with no way to know if Clover had charged her.

## 🔴 ACTIVE INCIDENT (discovered 2026-06-25)

The Clover payment webhook **stopped auto-confirming orders on 2026-06-04** and has been silent for ~21 days:
- Last automatic confirmation: TC-2026-0128 (2026-06-04 22:19 UTC). **Zero** Clover `webhook_events` rows since.
- All 28 clover_card orders paid since were flipped **`staff:manual`** (sampled 4/4 manual, 0 auto) — staff have been hand-reconciling in batch sessions.
- **9 clover_card orders currently stuck `pending_payment`**, oldest TC-2026-0126 (Jun 4, $294) and TC-2026-0131 (Jun 8, **$760.93**). Whether these were actually charged is **unknown without Clover read access** (MCP token is 401/expired).
- Root cause not yet pinned — consistent with either (a) `CLOVER_WEBHOOK_SECRET` rotated/dropped so every webhook is 401-rejected *before* the `webhook_events` log write, or (b) the Clover webhook subscription/URL was changed/removed. Needs Railway request logs + Clover dashboard webhook config to confirm. June 4-5 also broke the GSC OAuth token — smells like a config/deploy event that window.

Operational actions (cannot be done from the repo): refresh Clover API token → confirm the 9 stuck orders against Clover → repair the webhook secret/subscription.

## Problem

The system never asks Clover "was this order actually paid?" It infers payment state from our own DB + whether the webhook fired. If a Clover `PAYMENT` webhook is ever missed (Clover outage, our deploy downtime, a 5xx during the POST), the order is stuck `pending_payment` forever — the customer was charged, we think they weren't, and nobody finds out until they email. This is the same risk as "telling staff it went through when it didn't," just from the opposite direction.

## Current state (verified this session)

| Surface | What it does | Clover coverage |
|---|---|---|
| `reconcile-payments` cron (GitHub Actions, daily 16:00 UTC) | Wave checks **query Wave GraphQL + self-heal**. Clover Check 3 (route.ts:198-222) only flags `clover_card` orders >24h still pending and says *"check Clover dashboard."* | **Alert-only. Never queries Clover.** |
| `payment-followup` cron (Railway, hourly) | Emails customer recovery link for pending >2h | n/a (customer-facing) |
| `dashboard-alerts` cron (hourly) | `buildRollup` orphans → Telegram; now **rush-aware** after the 2026-06-25 fix | Inference-only |
| `src/lib/payment/clover.ts` | Exports only `createCloverCheckout` | **No read client exists** |
| Clover webhook (route.ts) | On capture: mark paid + ledger + Wave approve/record + receipt + GA4/Meta + Brevo (~450 lines, inline) | The only path that confirms Clover payment today |

The Wave side is fully self-verifying (Checks 1-7 in reconcile). **Clover is the asymmetric gap** — there is no equivalent of `waveQuery` for Clover, so the cron can't auto-detect a missed capture the way it auto-heals Wave drift.

## Blocker (step zero)

Need a Clover **read** token in Railway env. Production provably has only `CLOVER_ECOMM_PRIVATE_KEY` (checkout creation) + `CLOVER_MERCHANT_ID`. Reading `/v3/merchants/{mid}/payments` needs a Clover API token with read scope — the `CLOVER_API_KEY` the MCP uses, **currently expired (401)**. Nothing in #3 can be built or tested until this is minted/refreshed and added as `CLOVER_API_KEY`.

## Design

### Phase A — Clover read client (`src/lib/payment/clover-read.ts`)
- `cloverListPayments({ afterMs, limit })` → `GET /v3/merchants/{mid}/payments` with **multiple `filter=` params** (`createdTime>=X`) per the repo's Clover filter rule — never AND-joined.
- Bearer `CLOVER_API_KEY`, `AbortSignal.timeout(15000)`, throws on non-200 (mirrors `waveQuery`).
- Returns normalized `{ paymentId, amountCents, externalReferenceId, cloverOrderId, createdTime, status }`.
- **Read-only. No mutations** — the customer already captured the charge; we never call Clover write APIs.
- Ships alone first: zero behavior change.

### Phase B — Confirm-paid path (pick one)
The webhook's "captured → paid" block is the canonical confirm logic. Two options:
- **B1 (recommended first): minimal confirm in reconcile.** Reconcile flips `status → payment_received` + `paid_at`, inserts the `order_payments` ledger row (idempotent via existing unique index + `.eq("status","pending_payment")` guard), and fires Telegram. **Wave + receipt are left to the existing reconcile Check 4**, which already self-heals any order with `paid_at` set but Wave unrecorded. Lower risk — reuses proven machinery, touches no live webhook code.
- **B2 (later): extract `confirmOrderPaid()`** into `src/lib/payments/confirm.ts`, called by both webhook and reconcile. Cleaner, but refactors the critical payment path — defer until B1 is proven.

### Phase C — Upgrade reconcile Check 3
Replace the alert-only check:
1. Pull `clover_card` + `pending_payment` orders (split: a **30-min** capture-miss bucket and the existing 24h "likely abandoned" informational bucket).
2. `cloverListPayments` since the oldest pending order's `createdTime`.
3. Match `payment.externalReferenceId === order.payment_reference` (the exact key the webhook uses); fallback `cloverOrderId` / `order_number`.
4. **Clover shows captured + amount within ±$1 tolerance** → run B1 confirm → `clover_capture_recovered` issue → Telegram `✓ recovered missed Clover capture TC-XXXX`.
5. **No Clover payment + order older than threshold** → `clover_unpaid_stale` → Telegram **with customer phone** for a callback (payment-followup already emails; this is the staff escalation).
- Reuse the webhook's amount-sanity guard (reject `<=0` or `> total + 100¢`).

### Phase C.2 — Repeated-attempts & double-capture alerts (the "she tried many times" case)
Once `cloverListPayments` exists, count payment records per pending order and classify — these are the staff alerts requested 2026-06-25:
- **0 captures, N attempts** (declines) → `clover_attempts_no_capture` → "Customer attempted payment N times, none captured — likely card declines. Call them." Include phone.
- **1 capture, order still pending** → `clover_capture_recovered` → self-confirm (missed webhook).
- **2+ captures on one order** → `clover_double_capture` → "Charged N times totalling $X on a $Y order — refund the extras." **Never auto-refund** — alert only.
Note: failed/declined attempts currently leave **no trace in our DB** (declines don't reach our webhook, and `checkout_sessions` isn't order-linked), so this signal is only available via the Clover read client — reinforcing the Phase A dependency.

### ✅ Shipped this session — webhook-silence detector (no token needed)
`buildRollup` now fires RED **"Clover webhook silent"** when ≥2 clover_card orders are created in 24h but `total_24h === 0` Clover webhook events arrive — the exact signature the failed_24h check is blind to (auth-rejected webhooks write no row). This is what would have caught the June-4 outage on day one. Files: `rollup.ts` (RollupInputs.cloverOrders24h + signal), `staff/lifecycle/data.ts` (denominator). Surfaces on `/staff/lifecycle` + hourly Telegram via the existing dashboard-alerts cron.

### Phase D — Cadence
Capture-miss recovery shouldn't wait for the daily run. Add a **second GitHub Actions workflow every 30 min** hitting `reconcile-payments?check=clover` (param runs only the cheap Clover check). Full reconcile stays daily. Mirrors the existing `reconcile-payments-cron.yml`.

## Risks & mitigations
- **Double-confirm / double-charge** → idempotent: `order_payments` unique index, `status='pending_payment'` update guard, `paymentId` as idempotency key. Read-only against Clover.
- **Amount mismatch** → reuse webhook ±$1 tolerance; reject crafted/partial events.
- **Clover token expiry / rate limit** → fail-soft; alert on auth failure (mirror Wave). Existing rollup cron error-rate detector surfaces persistent failures.
- **Runtime** → bounded `limit` + 30-day window.

## Testing (requires live Clover token)
- Unit: match + tolerance logic (pure fn, table tests). Extend the rollup test suite for the rush-urgent change shipped in #2.
- Integration: create test pending order → capture in Clover sandbox → suppress webhook → run reconcile → assert flip + ledger + **no double-record on re-run**.
- `/e2e-test` gate before any Railway push (mandatory, CLAUDE.md).

## Rollout (staged, mirrors how Wave reconcile was introduced)
1. **Mint/refresh Clover read token → Railway `CLOVER_API_KEY`.** (blocker)
2. Ship Phase A read client alone (no behavior change).
3. Ship Phase C in **dry-run** (alert-only, no auto-confirm) on the daily cron; watch Telegram for correct matching for a few days.
4. Enable B1 auto-confirm + add the 30-min cadence.
5. One-shot backfill over current stuck orders (0163/0164) to clear the backlog.

## Done in this session (the quick win, #2)
`is_rush` now escalates an orphan to urgent red Telegram immediately (no 12h wait). Files: `OrphanPanel.tsx` (type), `staff/lifecycle/data.ts` (thread field), `lifecycle/rollup.ts` (urgent predicate). `tsc --noEmit` clean.
