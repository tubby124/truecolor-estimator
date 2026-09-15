# Transactional email roles — September 15, 2026

## Policy

Customer lifecycle email belongs to the customer. Staff receive only explicit operational alerts. The shared sender no longer reads `SMTP_BCC`, so an old BCC value cannot silently copy a receipt, pickup notice, reminder, quote, proof, or review request to staff.

| Event | Customer email | Staff operational email |
| --- | --- | --- |
| New order | Order confirmation or payment request | New-order alert |
| Confirmed Clover/e-Transfer/manual payment | Itemized receipt | Payment-confirmed alert |
| Confirmed Wave payment | Itemized receipt from the durable payment-effect worker | Existing durable `payment:received` Telegram alert; no customer email is copied to staff |
| In production | None | None |
| Ready for pickup | Pickup notice | None |
| Receipt resend / account receipt | Receipt | None |
| Payment reminder / aging reminder | Reminder | None |
| Proof / review request / customer quote | That customer's message | None |
| Revised artwork uploaded by customer | None | File-update alert |

The customer-facing `payment_received` status continues to use the itemized receipt rather than a duplicate status email. Payment remains evidence of payment, not physical readiness to print or pick up.

## Staff recipients

Explicit operational email recipients are, in order:

1. `STAFF_EMAIL` (default `info@true-color.ca`)
2. Optional `ADMIN_NOTIFY_EMAIL`, de-duplicated case-insensitively

If `hasan.sharif.realtor@gmail.com` should receive these alerts, it must be the value of `ADMIN_NOTIFY_EMAIL`. The legacy `SMTP_BCC` setting is ignored by application code and is not a staff-recipient control. Its live value was not read in this worktree: Railway is not linked here, and no provider configuration was changed.

## Evidence and idempotency

- New-order alerts retain their dedicated staff route; they are not BCC copies.
- The explicit Clover, e-Transfer, and staff-manual payment alerts use `staff-payment-confirmation/<order UUID>` as their provider idempotency key and require the durable `email_log` write. Their call sites sit behind a real `pending_payment` to `payment_received` transition.
- Wave payment effects retain their existing unique outbox effect and Telegram alert, avoiding a second, non-atomic email side effect in that worker.
- Customer receipts retain their existing customer recipient, order linkage, durable log requirement, and receipt idempotency keys. No payment evidence, staff authorization, or customer notice was removed.

## Release and verification boundary

This record describes a local branch change only. No order, payment, provider configuration, deployment, test email, or live recipient readback occurred. Before release, inspect the deployed environment for `STAFF_EMAIL` and the intended optional `ADMIN_NOTIFY_EMAIL`; do not rely on `SMTP_BCC`. After deployment, observe only a normal authorized business event and use the provider record plus recipient-specific evidence before claiming inbox delivery.
