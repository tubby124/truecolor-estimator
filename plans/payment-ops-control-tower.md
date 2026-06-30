# Payment Ops Control Tower Plan

Status: proposed
Created: 2026-06-30
Context: Clover hosted-checkout payments captured successfully while Supabase orders remained `pending_payment`, forcing staff to guess whether the customer paid, abandoned, or saw a card error.

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

## Phase 1: Clover Webhook Setup

Confirm Clover hosted checkout webhook points to the production route.

Current app-compatible URL:

```text
https://truecolorprinting.ca/api/webhooks/clover?k=<CLOVER_WEBHOOK_SECRET>
```

Required event:

```text
PAYMENT
```

Do not rotate `CLOVER_WEBHOOK_SECRET` casually. If it changes in Clover, Railway must be updated at the same time or webhooks will 401.

Future improvement: Clover's hosted checkout screen exposes a Signing Secret. Add first-class signature verification in `src/app/api/webhooks/clover/route.ts`, then remove the query-param secret.

Verification:

- Use Clover's Test URL button.
- Confirm a new `webhook_events` row appears with `event_source=clover`.
- Run `npm run harness:reconcile:7d`.
- Confirm `/api/health` reports `CLOVER_WEBHOOK_SECRET` present.

## Phase 2: Payment Attempts Ledger

Create a `payment_attempts` table separate from order status.

Core fields:

- `order_id`
- `provider`
- `status`: `checkout_opened`, `card_declined`, `payment_captured`, `webhook_missing_recovered`, `abandoned`
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
- Pending attempts older than threshold become `abandoned` if Clover has no successful capture.

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

Run cadence:

- Clover capture recovery should run hourly or every 30 minutes.
- Full Wave/Clover reconciliation can remain daily.

## Phase 6: Email Cleanup

Make emails mirror payment truth.

Customer emails:

- Payment request.
- Payment failed / retry link.
- Payment received receipt.
- eTransfer instructions.
- Ready for pickup.
- Review request.

Staff emails/alerts:

- New order.
- Checkout opened.
- Card declined.
- Payment captured.
- Payment recovered.
- Payment still pending after threshold.

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
