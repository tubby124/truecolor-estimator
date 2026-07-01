# Payment Ops Control Tower Plan

Status: in progress
Created: 2026-06-30
Context: Clover hosted-checkout payments captured successfully while Supabase orders remained `pending_payment`, forcing staff to guess whether the customer paid, abandoned, or saw a card error.

## Progress Log

### 2026-06-30 Continuation After `c12ab8f`

- Repaired linked Supabase project `dczbgraekmzirxknjvwe` migration history by replacing legacy 8-digit local migration versions with timestamped versions:
  - `20260325110000_quote_reply_body.sql`
  - `20260407110000_customers_marketing_consent.sql`
  - `20260511110000_quote_requests_archive_and_total.sql`
- Marked already-live historical schemas as applied, then applied `20260630180000_payment_attempts.sql`.
- Verified `payment_attempts` is reachable through the app service client.
- Added hourly `.github/workflows/cron-payment-followup.yml` cadence for the existing payment follow-up cron.
- Added read-only `/staff/lifecycle` payment health panel with open checkouts, declines, captures, recovered, abandoned, ambiguous, pending-over-threshold, Clover webhook last seen, reconcile last ran, and payment-followup heartbeat.
- Updated `scripts/harness/webhook-health.mjs` so explicit live probes validate `/api/health` and do not fail on local-only preview URL or non-rotated token-length warnings.

## Goal

Make payment state observable end to end:

- Customers see the exact payment outcome and retry path.
- Staff see the exact payment evidence and next action.
- The backend can recover missed Clover captures without manual guessing.
- Wave bookkeeping stays synced only after real money is captured.

## Current Incident Findings

- TC-2026-0169 was captured in Clover for $321.90 but stayed `pending_payment` because no Clover webhook event reached the app.
- TC-2026-0166 had the same class of issue for $27.75.
- TC-2026-0168 had no matching Clover capture and remained genuinely pending by card.
- The reconciliation harness is now clean on hard mismatches after backfilling the verified Clover payments.
- The likely remaining setup issue is Clover's hosted-checkout webhook URL/config.

## Current External Setup

- Clover hosted-checkout webhook URL has been pasted in Clover.
- `CLOVER_SIGNING_SECRET` has been saved in Railway and the Clover route supports first-class `Clover-Signature` verification.
- Legacy `CLOVER_WEBHOOK_SECRET` via the `?k=` query param remains accepted during the transition.
- Clover fallback redirect URLs should be set to `/payment/success`, `/payment/failed`, and `/payment/cancelled` after those pages are implemented. Until then, the existing per-checkout `redirectUrl` still routes real orders to `/order-confirmed?oid=...`.

## Phase 0: Documentation And Repo Discovery

Do this before writing implementation code.

Read:

- Clover hosted checkout webhook docs: payload shape, signing-secret verification format, event types, and decline/void payload fields.
- Current payment creation flow: `src/lib/payment/clover.ts`, `src/app/pay/[token]/page.tsx`, `src/app/api/orders/route.ts`, `src/app/api/staff/manual-order/route.ts`.
- Current webhook flow: `src/app/api/webhooks/clover/route.ts`.
- Current reconciliation flow: `src/app/api/cron/reconcile-payments/route.ts`, `scripts/harness/reconcile-check.mjs`.
- Current staff/account display surfaces: `src/components/staff/orders/StaffOrderCard.tsx`, `src/app/staff/orders/OrdersTable.tsx`, `src/components/account/OrderCard.tsx`, `src/app/order-confirmed/page.tsx`.
- Current lifecycle/alert contract: `.claude/rules/lifecycle-rollup-contract.md`, `src/lib/lifecycle/rollup.ts`, `src/app/staff/lifecycle/data.ts`.

Deliverable:

- A short "allowed APIs and event shapes" note before coding.
- A list of exact files to touch in each phase.
- Confirmation that the plan still matches Clover's real docs.

## Phase 1: Clover Webhook Setup

Confirm Clover hosted checkout webhook points to the production route.

Current transition URL:

```text
https://truecolorprinting.ca/api/webhooks/clover?k=<CLOVER_WEBHOOK_SECRET>
```

Required event:

```text
PAYMENT
```

Do not rotate `CLOVER_WEBHOOK_SECRET` casually. If it changes in Clover, Railway must be updated at the same time or webhooks will 401.

Future improvement: after production signature-only delivery is proven over multiple real Clover webhook events, remove the query-param secret from Clover and from `src/app/api/webhooks/clover/route.ts`.

Verification:

- Use Clover's Test URL button.
- Confirm a new `webhook_events` row appears with `event_source=clover`.
- Run `npm run harness:reconcile:7d`.
- Confirm `/api/health` reports no failures and `CLOVER_SIGNING_SECRET` present.

No-ship condition:

- If Clover's Test URL does not produce any server-side evidence, stop and fix webhook delivery before building UI on top of it.

## Phase 2: Payment Attempts Ledger

Create a `payment_attempts` table separate from order status.

Core fields:

- `order_id`
- `provider`
- `status`: `checkout_opened`, `card_declined`, `payment_captured`, `webhook_missing_recovered`, `abandoned`, `ambiguous`
- `amount`
- `clover_checkout_session_id`
- `clover_order_id`
- `clover_payment_id`
- `failure_code`
- `failure_label`
- `failure_detail`
- `customer_message`
- `raw_event`
- `created_at`
- `updated_at`

Rules:

- `/pay/[token]` writes `checkout_opened` before redirecting to Clover.
- Clover webhook writes `payment_captured` or `card_declined`.
- Reconcile writes `webhook_missing_recovered`.
- Pending attempts older than threshold become `abandoned` if Clover has no successful capture, or `ambiguous` if Clover has amount matches that are not safe to auto-apply.

## Phase 3: Customer Payment UX

Show plain-language failure states anywhere the customer lands after a payment attempt.

Surfaces:

- `/payment/success`
- `/payment/failed`
- `/payment/cancelled`
- `/order-confirmed?oid=...`
- `/account`
- unpaid order card
- retry payment page

Clover dashboard fallback redirect URLs:

```text
Success URL: https://truecolorprinting.ca/payment/success
Failure URL: https://truecolorprinting.ca/payment/failed
Cancel URL:  https://truecolorprinting.ca/payment/cancelled
```

Important rule: these pages are customer-navigation surfaces only. They must never mark an order paid by themselves. Payment truth still comes from the Clover webhook, `order_payments`, and reconciliation.

Page behavior:

- `/payment/success`: reassure the customer that payment is being verified, then route them to `/order-confirmed?oid=...` when an order id is available. If no order id is available, show a neutral "we are verifying your payment" state and a link to contact True Color.
- `/payment/failed`: explain that the card payment did not complete, show the latest decline reason if known, and offer "Try card again" plus "Pay by e-Transfer instead".
- `/payment/cancelled`: explain that checkout was cancelled and the card was not charged by this attempt, then offer "Resume payment", "Pay by e-Transfer", and "Contact us".
- All three pages should noindex, use the normal site shell, and avoid scary wording.

Examples:

- Postal code did not match your card billing address.
- CVV did not match.
- Card was rejected by the bank.
- Payment did not complete. You were not charged.

Actions:

- Try card again.
- Pay by e-Transfer instead.
- Contact True Color.

## Phase 4: Staff Visibility

Staff cards should show evidence, not guesses.

States:

- Awaiting payment
- Checkout opened 12 min ago
- Card declined: Postal code did not match
- Payment captured
- Recovered from Clover
- Paid by eTransfer

Notifications:

- Checkout opened.
- Card declined with reason.
- Payment captured.
- Payment recovered from Clover because webhook was missed.
- Checkout stuck after threshold.

## Phase 5: Reconcile And Alerts

Extend the reconcile safety net shipped in commit `2257237`.

Rules:

- Exact payment found: mark order paid, insert ledger, record Wave payment.
- Decline found: keep order pending, record reason, notify staff, show retry message to customer.
- No payment after threshold: mark attempt abandoned, leave order pending.
- Ambiguous match: alert staff, do not auto-mark paid.
- Remaining: add a dedicated manual-resolution action for ambiguous matches; current implementation surfaces the evidence without mutating payment truth.

Run cadence:

- Clover capture recovery should run hourly or every 30 minutes.
- Full Wave/Clover reconciliation can remain daily.
- Payment follow-up runs hourly via GitHub Actions and records the `payment-followup` heartbeat.

## Phase 6: Email Cleanup

Make emails mirror payment truth.

Customer emails:

- Payment request.
- Payment failed / retry link.
- Payment received receipt.
- eTransfer instructions.
- Checkout cancelled / resume payment.
- Ready for pickup.
- Review request.

Staff emails/alerts:

- New order.
- Checkout opened.
- Card declined.
- Payment captured.
- Payment recovered.
- Payment still pending after threshold.
- Clover webhook/signature failure if events start failing authentication.

## Phase 7: Staff Payment Health Dashboard

Add a payment health panel:

- Open checkouts.
- Declines today.
- Captured payments.
- Recovered payments.
- Pending over threshold.
- Clover webhook last seen.
- Reconcile last ran.
- Payment-followup heartbeat.

## Guardrails

- Redirect pages must never mark orders paid.
- Never expose raw Clover/Wave errors to customers; map them to safe labels.
- Never log or commit `CLOVER_WEBHOOK_SECRET`, `CLOVER_SIGNING_SECRET`, card details, or raw tokens.
- Never auto-refund double captures; alert staff with exact payment IDs and amounts.
- Never move an order beyond `payment_received` unless payment truth is confirmed.
- All silent-failure signals must be registered in `src/lib/lifecycle/rollup.ts` so `/staff/lifecycle` and Telegram agree.
- Any manual override must write an audit event with actor, order number, payment method, amount, and reason.

## Suggested Execution Order

1. Verify Clover webhook delivery now that the URL is saved in Clover.
2. Add signature verification using `CLOVER_SIGNING_SECRET` while keeping the current query-secret path during transition.
3. Add `payment_attempts` migration, types, and write paths.
4. Add customer redirect pages and order/account failure states.
5. Add staff order-card evidence states and notifications.
6. Expand reconciliation to write attempts for recovered/abandoned/ambiguous states.
7. Add payment health dashboard rollup.
8. Clean up email sequence.
9. Run full verification and remove legacy query-secret dependency only after signature verification is proven.

Items 1-7 are substantially implemented as of the 2026-06-30 continuation. Remaining work is mostly Phase 6 email cleanup, a dedicated ambiguous-match manual-resolution action, and eventual removal of the legacy query secret after more production signature evidence.

## Final Verification

- Simulate captured Clover webhook.
- Simulate CVV decline.
- Simulate postal-code decline.
- Simulate webhook missing but Clover payment exists.
- Simulate opened checkout with no payment.
- Confirm `/payment/success`, `/payment/failed`, and `/payment/cancelled` render useful customer actions without mutating order status.
- Confirm staff badge and notification for each case.
- Confirm customer retry/failure copy for each case.
- Confirm Wave only marks paid when money is real.
- Run `npm exec tsc -- --noEmit`.
- Run `npm test`.
- Run `npm run harness:reconcile:7d`.

## New-Chat Handoff Prompt

```text
/truecolor

Task: Execute plans/payment-ops-control-tower.md end to end.

Current state:
- Commit c12ab8f added Clover signature+legacy auth, payment_attempts writes, redirect pages, account/staff visibility, and lifecycle stuck-attempt input.
- Supabase project dczbgraekmzirxknjvwe migration history was repaired and 20260630180000_payment_attempts.sql was applied.
- Local legacy 8-digit migrations were renamed to timestamped versions and marked applied remotely.
- Payment-followup hourly workflow and read-only /staff/lifecycle payment health panel are implemented locally.
- Full Wave/Clover reconciliation remains daily; payment-followup cadence becomes live only after push.

Continue with Phase 6 email cleanup and the dedicated ambiguous-match staff resolution flow.
Do not mutate payment status from redirect pages.
Do not commit secrets.
Do not push until deployment/migration path is reviewed.
Run typecheck, tests, npm run harness:reconcile:7d, and npm run harness:webhooks:probe -- --base https://truecolorprinting.ca before shipping.
```
