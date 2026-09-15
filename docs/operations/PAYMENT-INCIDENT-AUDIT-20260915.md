# Payment integration incident audit — September 15, 2026

## State

Production investigation confirmed independent defects in Wave invoice provisioning, Clover callback identity matching, payment reconciliation, and staff receipt visibility. The verified baseline is `a22876b4b019058f5efb8d379f7530411ef1c0cd`, Railway deployment `0c984057-a521-44d9-8621-233ac082881d` (SUCCESS). [GitHub incident #98](https://github.com/tubby124/truecolor-estimator/issues/98) tracks repair acceptance. Incorrect follow-ups have been paused on the two reported affected orders with guarded writes and audit records. Clover identity, request preflight, provider display, receipt visibility and Wave reconciliation fixes are integrated locally. Independent review accepted the integrated runtime at `821b9b17`; required release CI and live readback are tracked in [PR #99](https://github.com/tubby124/truecolor-estimator/pull/99) and the incident issue. The reported orphan draft has been recovered in production using exact customer/item/tax matching, approval/readback of the existing invoice, and guarded linkage. A real browser reached the correct merchant Clover checkout with the exact order total; no charge was submitted. No customer messages or test charges have been sent during recovery. Customer evidence stays outside this public repository.

## Confirmed findings

1. **Wave money formatting blocks larger invoices.** `getWaveInvoiceFinancials` parses formatted `Money.value` with an unformatted-decimal regex. Live values containing thousands separators fail. Provider creation has already succeeded, but invoice identity is not persisted until later; the order is left ambiguous with an orphan draft. Use documented exact `minorUnitValue`, safe integer validation and existing tax reconciliation. Retain provisional provider identity before approval. Reconcile existing drafts instead of creating duplicates.
2. **Initial Clover checkout cannot be resolved by session-only callbacks.** `/api/orders` durably stores the session on `orders.quote_checkout_session_id`, but creates no checkout_opened attempt. The callback searches attempts instead of the order session. Two live successful captures were recorded without order linkage and acknowledged HTTP200. Resolve the unique durable session, cross-check references and reject conflicts. Use non-null historical attempts only as fallback. Apply matching to captures and declines; add attempt logging separately.
3. **Wave collection does not reliably become a paid website order.** A customer-origin Wave Payments capture was confirmed against an order still labelled Clover/pending. Polling backfilled only the Wave timestamp, leaving status, payment ledger and receipt effects unchanged. No corresponding Wave callback was recorded in the inspected event period; the latest stored Wave callback returned by a provider-filtered query was an unmatched event on May 29. Provider delivery/configuration still needs direct verification. The acceptance RPC also explicitly skips non-wave-labelled orders. Reconcile actual provider identity/origin/state once, distinguishing customer Wave collections from manual accounting copies of other processors' payments. Confirm provider webhook delivery and add verified recovery.
4. **Payment source and bookkeeping status are conflated.** W Paid is an accounting timestamp, while Card/Invoice reflects intended payment method. Show actual counted payment provider separately from Wave synchronization. Wave effects lack a dedicated staff-paid notification; Clover Telegram payment text omits the provider.
5. **Unusable or already-paid links remain sendable.** Staff copy/resend and reminders can issue links despite blocked readiness or verified external payment. Failed gateway visits are often console-only. Register blocked readiness, unmatched captures and paid-state conflicts in the shared lifecycle rollup.
6. **Receipt state does not guide staff accurately.** After a status change automatically sends a receipt, the UI still offers Send receipt. A separate receipt POST sends again without request deduplication. Two recovered orders each received two delivered receipts. There is no automatic second request in the status handler: the second came through the separate staff receipt endpoint. Show durable delivery history and label intentional resends accurately.

Additional code-confirmed defects, not established as the specific triggers above: copied order-scoped links for quote-linked orders are rejected by reservation guards; ambiguous reservations remain blocked without provider-verified recovery. Historical manually paid orders are skipped by capture processing, so a new matcher alone cannot repair missing historical ledger entries.

## Prioritized repair and acceptance

1. Contain payable links/reminders for confirmed-paid or blocked orders and reconcile verified customer payments without adding money twice.
2. Patch exact monetary units and durable Clover identity matching; verify grouped large totals, bad/fractional cents, tax mismatch, session-only capture with empty attempts, conflicting identities, and duplicate callbacks.
3. Recover already-created invoice drafts through matched customer/order/tax evidence and guarded approval/linkage; verify the real checkout without making a test charge.
4. Reconcile historical provider captures into missing ledger entries, preserving existing Wave accounting payments and receipt history. Add processor-specific staff notification and clear receipt/resend states.
5. Test customer-origin Wave payments on initially Clover orders, manual Wave accounting copies, partial balances, stale links, duplicate/reordered callbacks and monitor escalation.

## Evidence and limitations

Verified production configuration and deployment, application logs, active pending-order inventory, targeted order/attempt/ledger/audit/email/webhook records, recent Wave invoice and payment histories, recent Clover transactions, and current source. Existing related tests passed 27/27 but omit these incident payloads. Clover payment amount lookup returned 404 at callback time and the same read succeeds now; do not misdiagnose the current credentials as invalid. Recipient delivery events do not prove inbox placement or reading. Production runtime repair remains pending; local checks are not live acceptance.

Wave's current API exposes invoice payment origin/provider/state plus `Money.minorUnitValue`; historical comments saying individual invoice payments are unavailable are outdated. References: [Wave API](https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference), [Clover hosted-checkout webhooks](https://docs.clover.com/dev/docs/ecomm-hosted-checkout-webhook).

## Recovery and release contract

- Re-read each payment from the correct provider immediately before repair. Match durable session/reference or exact invoice/customer identity; never infer identity from equal totals.
- Recover an existing orphan draft only after matching customer, item, quantity, subtotal and both taxes. Approve and re-read that exact draft, then attach it with guarded local state. Do not create a replacement invoice.
- Ingest confirmed Wave customer captures through the reviewed atomic procedure. A manual Wave bookkeeping payment must not be counted as a second collection. Historical recovery disables customer receipt effects.
- Append missing Clover ledger rows using unique provider payment references, attach captured attempts, and retain already-recorded Wave accounting entries. Preserve staff production progress and receipt history.
- Review the older unmatched-capture backlog separately. Unresolved identity stays visible rather than being guessed or silently cleared.
- Complete focused provider/database regressions, independent review, required PR CI, exact-commit deployment and live checkout/readback. A checkout landing page is evidence of checkout availability; no real card charge is used as a test.

Release-candidate verification: 185 test files / 1,753 tests passed, TypeScript and ESLint passed (zero errors; existing warnings), project-record checks passed, and production dependency audit reported zero vulnerabilities. Independent money-path, current Wave protocol, checkout-description and final polling review accepted `821b9b17`. PostgreSQL regression uses the exact production order-status enum and passed required PR CI. Final merge/deployment/live-readback receipts are appended to the incident issue; this file records the reviewed release candidate.

Historical scope: all 21 unmatched Clover captures were read back at the provider, and identity was resolved through exact durable sessions or app-generated order numbers in authenticated provider line items. Seventeen eligible Clover captures were recovered: two recent and fifteen older already-paid orders. Four archived records remain held; two show refund evidence. No additional active, unarchived pending order was provider-paid. The held records require a separate historical refund/order-state decision and were not modified.

## Production recovery checkpoint

The reviewed additive migration `20260915141000_wave_provider_payment_recovery.sql` was applied with migration history and schema-cache reload. The service role can execute the ingestion procedure; anonymous access is denied. The reported customer-origin Wave payment now has exactly one Wave ledger entry and a paid website order. Two recent Clover captures have exactly one Clover entry each, linked to their existing manual Wave bookkeeping entries; existing production status and receipt history were preserved. Recovery created zero Wave effect-outbox rows and sent no customer messages.

The fifteen older recoveries were applied only after independent SQL review and fresh provider/database preflight. Each transaction block bound the exact order number, total, Wave invoice and prior Wave marker, Clover payment and captured attempt. Readback verified one Clover ledger entry per order and unchanged status, paid timestamp, Wave links, customer email counts and effect counts. The reviewed private SQL SHA-256 is `431410a1a6b410d91af2032683b09548c71648a087d4a1d52451c00882423cab`. Archived/refund-risk records remain excluded.

Receipt reliability limit: the UI/history guard prevents routine duplicate sends and intentional resend requests expire after five minutes. If the mail provider accepts an automatic receipt but writing its email log fails, the application reports uncertainty. Exactly-once email is not guaranteed beyond the provider's 24-hour idempotency retention; verify provider delivery before manually resending an uncertain older message.

## Current provider protocol and checkout clarity

The current [Wave webhook setup guide](https://developer.waveapps.com/hc/en-us/articles/51070420388628-Webhooks-Setup-Guide) exposed a second protocol defect: the handler expected a legacy raw-body signature and nested resource envelope. The repair implements timestamped raw-body HMAC verification, a five-minute replay window, configured-business matching, raw invoice-ID encoding, and documented paid/partial/overpaid events. Provider readback remains the only source of payment truth. Actual Wave subscription/account delivery still requires provider-side confirmation; authenticated synthetic tests do not prove Wave delivery. Official documentation provides only the signed-in Tools → Webhooks → Logs & deliveries UI for that inspection. The initial browser check reached a login screen; the subsequent signed-in inspection below establishes the current account/configuration state.

The existing database-scheduled `wave-poll` job was verified active at six-hour intervals. Release changes its interval to 15 minutes and lifecycle's stale threshold to 30 minutes. Archived/voided orders are excluded. The existing effect worker was verified scheduled every five minutes in Railway.

Clover now uses saved item names and quantities in both initial and order-retry checkouts. Persisted dimensions/add-ons appear when space permits, and balance payments are labelled explicitly. Clover's existing 126-character name cap can require a `+N more` summary; no prices or tax calculations are changed. Existing hosted sessions are resumed until their provider expiry, then replaced through the normal reservation.


## Provider decision and follow-up protection

The signed-in portal inspection subsequently verified Starter, an active correctly configured webhook and no retained deliveries. The first repair merged through PR #99 at `d304ca7fe6fb7b4ce113a308e1fb8e8f98b12cdd`, passed PR/main CI and deployed successfully as Railway `6cd92352-9b32-4666-b01e-520ba9d1cdb6`. Live health/staff auth and signed/unsigned nonpayment protocol probes passed. The existing poll schedule is now 15 minutes; an authenticated run scanned 5 orders with 0 errors and a healthy heartbeat. A real Clover checkout showed the saved item name/quantity and exact unchanged total, without a charge.

The [provider decision proposal](PAYMENT-PROVIDER-DECISION-20260915.md) separates a possible Wave-online/Clover-in-person migration from today's repair. The owner subsequently selected Wave online/Clover in person with Pro later, but prioritized completing this repair before implementing that migration. No provider switch, subscription purchase or invoice payment-button change has been performed. Click-time authenticated Wave reconciliation is being added to existing-order Clover routes so a customer who paid Wave between polls cannot reopen a stale full-balance checkout. Simultaneously active provider channels can still collect after the last provider read, including an already-open hosted checkout that remains valid until its expiry; a future single online provider per order addresses that policy boundary. Final follow-up acceptance is recorded in issue #98.


## Email reconciliation follow-up — PR #100

The owner required a complete review of outgoing order emails before closing the incident. Review found four content defects despite existing tests passing: a new Clover checkout notice implied a captured payment; receipts could use the originally selected provider instead of recorded payments; the first reminder did not explain a partial balance; and the manual quote UI incorrectly promised no payment link. Final review also caught the downloadable receipt PDF using the original provider choice; its display must use the same recorded sources as the email.

| Email/workflow | Required accepted behavior |
|---|---|
| Staff new-order notice | New checkout is payment pending; never claim captured or safe to begin production before confirmation |
| Automatic and staff/customer-requested receipts, including the linked PDF | Use positive recorded ledger payments, identify all actual providers for mixed payments, and use a neutral recorded-payment label when provider evidence is unavailable; preserve receipt history and idempotency |
| Partial-payment reminders | Distinguish order total, paid amount and remaining balance; unfinished checkout wording must not deny an earlier recorded partial payment |
| Structured quotes and payment requests | Preserve stored items, GST/PST, totals, quote revisions and correct remaining-balance link |
| Manual quote modal | State that its existing payable email includes Pay Now; match actual server behavior |
| Nonpayable estimates / free-text replies | Remain nonpayable; no invented payment instruction |
| Customer confirmation and pickup | Preserve item/pickup information and durable link behavior without false provider or production claims |
| New Wave captures discovered by poll/click | Queue normal effects only for authenticated captures within 24 hours (up to five minutes future clock skew); atomic transition/outbox guards prevent duplicate historical replay |
| Historical recovery | Explicit effects disabled; old recovered captures do not generate customer receipts |

A read-only seven-day email-log check found 120 logged messages with recorded delivery events, zero recorded bounces/complaints, zero unresolved delays and no missing provider message IDs. This is delivery-event evidence, not proof of inbox placement or reading. No customer test mail or manual resend was used for this audit. The configured mail-provider key returned `restricted_api_key` for a read-only message lookup; fresh direct provider API readback is not claimed.

The 24-hour receipt window is an operational boundary for Starter polling, not a payment-validity rule. Older verified payments still update the ledger and staff state; customer effects stay suppressed. Signed webhook behavior is unchanged. The existing five-minute Wave effect worker processes queued receipts/staff notices. A later Pro upgrade still needs actual webhook authorization and delivery proof.

Final integrated local test run: 192 files / 1,793 tests passed. TypeScript, ESLint (zero errors; existing warnings), records and diff checks passed; production dependency audit reported zero vulnerabilities. Independent review accepted code `168aa9ad` after 16 focused files / 94 tests. The final release receipt in issue #98 records required CI, exact-commit deployment and live checkout/PDF/reconciliation readback; those are separate from this local acceptance. [PR #100](https://github.com/tubby124/truecolor-estimator/pull/100) holds the change; [issue #98](https://github.com/tubby124/truecolor-estimator/issues/98) holds the final release receipt and remaining historical holds.


### Receipt and invoice document check

The owner explicitly asked to preserve a proper payment receipt/invoice. Keep Wave as the accounting invoice and the website email as the payment confirmation. Existing automatic Clover/e-Transfer/status flows offer Wave's invoice PDF only after confirmed Wave-paid bookkeeping; other flows retain the authenticated True Color PDF. Fix the fallback PDF's provider label rather than introducing an unverified invoice redirect or sending a second invoice.

The email and PDF retain the supplier's legal name, address/contact, configured GST registration number, buyer name, order/date reference, identifiable items/quantities, GST/PST and total in CAD. Paid status is conditional on the saved paid order state; unpaid PDFs remain order summaries. The review uses the [current federal supporting-document requirements](https://laws-lois.justice.gc.ca/eng/regulations/SOR-91-45/section-3.html) as a field checklist, not a blanket certification of every historical invoice or the customer's tax-credit eligibility. Wave remains the accounting source; the receipt confirms the recorded payment sources for the same job.


## Owner-controlled send test exposed manual tax rounding — September 15

An actual staff Send Quote attempt with two synthetic $0.50 taxable lines was blocked before any customer email or checkout session. The website saved subtotal $1.00, GST $0.05, PST $0.06 and total $1.11. The retained Wave draft read back GST $0.06, PST $0.06 and total $1.12: Wave rounded GST on each invoice line. The exact financial guard correctly stopped delivery and retained one invoice identity. This is a new acceptance failure after PR #100, not a completed end-to-end payment test.

The bounded repair aligns the shared manual preview/API calculation with the actual emitted invoice lines. Keep exact subtotal/GST/PST/total verification; a matching grand total alone is insufficient. Tests must cover half-cent tax, equal-total/different-tax splits, standalone services, bundled printing services, resale exemption and total overrides. Existing issued invoices are not repriced. The unsent owner-controlled draft can be reconciled explicitly against its exact retained identity with zero payments/emails and an audit record, then sent through the staff resend action.

[Wave's API reference](https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference) defines taxes on invoice items and deprecates caller-supplied tax amounts. The live draft readback is the evidence for cent rounding. Normal storefront and structured quote producers are being checked independently for the same aggregate-versus-line mismatch. Their acceptance and the actual new payment/automatic inbox receipt remain open until separately verified.


### Normal customer-flow check

The same defect is confirmed in a realistic normal cart: two separately added active $337.50 banner rows yield aggregate GST $33.75, while Wave line GST is $16.88 + $16.88 = $33.76. Expected subtotal $675.00, PST $40.50 and correct Wave total $749.26. A single quantity-two invoice line is a distinct acceptance case. Card and e-Transfer both encounter the Wave prerequisite, so switching payment methods does not bypass this failure. The prior 503 handler cleared the submission identity and suggested e-Transfer, risking additional held drafts on retry. The repair must preserve identity on uncertain accounting outcomes and give accurate recovery instructions. No provider charge is reached on the financial mismatch.

Structured quote revisions have the same aggregate-versus-line risk; their immutable SQL snapshot/capability contract requires a separate compatible change, never repricing already-issued revisions. A current-day production read found only the owner-controlled internal test in the ambiguous accounting state; this is a dated observation, not proof that all future cart combinations work.


### First actual inbox acceptance

The exact owner-only, unpaid and unsent retained draft was independently reviewed, reconciled from $1.11 to $1.12 before first send, approved by its existing provider identity, and linked through the guarded completion RPC with an audit record. No new invoice was created; test reminders were paused. The real staff **Resend payment link** action then delivered one $1.12 itemized request to the owner's Gmail inbox. Direct Gmail readback verified the INBOX label, recipient, both items/quantities, subtotal $1.00, GST $0.06, PST $0.06, total $1.12, Clover wording, and SPF/DKIM/DMARC pass. This confirms actual staff resend and inbox delivery, not a new successful manual create after deployment or a completed payment/receipt. The owner must complete the test payment; the normal storefront fix and live test remain in progress.
