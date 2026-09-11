# Staff payment-link copy and balance-due link semantics — release receipt

Release date: September 11, 2026. This is the sanitized, after-release record for staff being able to hand a customer a payment link directly, and for the /pay link amount being redefined as the remaining balance. It is not evidence that any customer has used the new control or that any specific payment was collected through it.

## Scope

[PR #89](https://github.com/tubby124/truecolor-estimator/pull/89) squash-merged to `main` at `a18e7352`.

Two changes shipped together, because the first is a prerequisite for the second:

1. **Staff can copy a payment link.** New staff-only `POST /api/staff/orders/[id]/payment-link` returns the `/pay/{token}` URL plus a ready-to-send message, and the expanded order card in the staff portal gained a **Get payment link** control with **Copy link** and **Copy message**. It sends no email; the existing Resend button still owns that. Each view is audited as `order.payment_link_copied`.
2. **A pay link now charges the remaining balance.** Partial Clover payments leave `orders.total` untouched and the order in `pending_payment` while the amount paid accrues in the `order_payments` ledger. The gateway previously required the token amount to equal the raw `orders.total`, which meant a balance-due link was rejected as stale (`UpdatedLinkPage`) and a full-total link charged a customer who had already paid a deposit a second time. Both behaviors are removed: `remainingBalanceCents()` is now the single definition of what a link charges, used by the gateway and by every path that mints one.

Mint paths moved to the shared ledger-aware resolver `resolveOrderPayLink()`: staff resend, staff copy, staff-assigned discounts, the post-payment retry page, the account order list, orphan recovery on the lifecycle board, and the aging-orders digest. Order-creation mints (`/api/orders`, staff manual order) were deliberately left alone — no payment can exist at creation, so balance and total are equal there. The payment-followup chase cron already used the balance; it was previously landing on `UpdatedLinkPage` for partially-paid customers and now works.

Boundaries: no database migration, no new or changed environment variable, no change to Clover or Wave integration, no change to the email provider, and no change to the customer-facing `/pay` flow for a fully-unpaid order (balance equals total, so the same values are minted and accepted). The aging-orders digest now fails closed (`503`, `required_query_failed=payment-ledger`) instead of assuming nothing was paid when the ledger cannot be read; that is a deliberate change from "send a possibly wrong link" to "send nothing".

## Evidence

| Item | Result |
|---|---|
| Pull-request CI `lint-test` | pass, 5m21s (ESLint, TypeScript strict, unit tests, production build, paid-funnel browser contracts) |
| Pull-request CI `postgres-outbox-regression` | pass, 19s |
| GitGuardian | pass |
| Main-branch CI run [34628067079](https://github.com/tubby124/truecolor-estimator/actions/runs/34628067079) | success on `a18e7352` — ESLint, TypeScript strict, unit tests, production build, browser contracts all `success` |
| Unit tests (local, same commit) | 1,637 passed / 1,637 across 168 files |
| Railway deployment | `45245b52-7ef4-4cd5-b76b-2bd3e33a8487` — SUCCESS |
| `https://truecolorprinting.ca/api/health` | `{"ok":true}` |
| `https://truecolorprinting.ca/staff/orders` | `307` → `/staff/login` (staff gate intact) |
| Unauthenticated `POST /api/staff/orders/<uuid>/payment-link` (live) | `401 {"error":"Unauthorized"}` — a missing route would return `404`, so this is also the deployment proof that the new route is live |
| Unauthenticated `POST /api/staff/orders/<uuid>/resend-payment` (live control) | `401` — unchanged |
| Payment Follow-Up cron on `a18e7352` (run 34628640195) | success after deploy — the chase path that mints balance links still runs |

New automated coverage added by this release: the cents-precise `remainingBalanceCents()` helper including voided/refunded exclusion and IEEE-754 lossy amounts; the invariant that a minted token equals what the gateway accepts, including Postgres string-typed amounts; the copy endpoint's guards (auth, missing order, not payable, voided, no email, ledger unreadable, nothing left to owe); a source contract that stops the raw-total comparison and raw-total mints from returning; and a digest test proving a partially-paid order is emailed a balance link.

## What is not proven

- **No staff session was used.** The new panel has not been clicked in production by a person. Its correctness is supported by types, the production build, the route's live `401` gate, and the endpoint's tests — not by a human walkthrough of the UI. A first real order should be opened and the link pasted into a browser tab (stopping at the Clover page) to close this.
- No customer payment was exercised end-to-end through a copied link, and no partial-payment order was observed live through the corrected gateway. The partial path is covered by unit and route tests only, because reproducing it would require a real partial capture.
- The self-contained `/pay` token still mints a Clover session once and `reserve_order_checkout` may resume a session created up to 16 minutes earlier without re-checking the amount. That pre-existing window is unchanged by this release and remains open.

## Rollback

Revert `a18e7352` and push, or roll Railway back to the prior successful deployment `cb68815e-8c3c-4e7f-92b8-58e0ea463b8f`. Reverting restores the raw-total comparison and re-opens the double-charge path for partially-paid orders, so a revert should be paired with pausing staff re-sends to partially-paid orders rather than treated as a neutral state.
