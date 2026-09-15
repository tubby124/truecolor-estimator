# Payment integration incident audit — September 15, 2026

## State

Production investigation confirmed independent defects in Wave invoice provisioning, Clover callback identity matching, payment reconciliation, and staff receipt visibility. The verified baseline is `a22876b4b019058f5efb8d379f7530411ef1c0cd`, Railway deployment `0c984057-a521-44d9-8621-233ac082881d` (SUCCESS). [GitHub incident #98](https://github.com/tubby124/truecolor-estimator/issues/98) tracks repair acceptance. Incorrect follow-ups have been paused on the two reported affected orders with guarded writes and audit records. Clover identity, request preflight, provider display, receipt visibility and Wave reconciliation fixes are integrated locally. Independent review is correcting remaining failure paths before release. The reported orphan draft has been recovered in production using exact customer/item/tax matching, approval/readback of the existing invoice, and guarded linkage. A real browser reached the correct merchant Clover checkout with the exact order total; no charge was submitted. No customer messages or test charges have been sent during recovery. Customer evidence stays outside this public repository.

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

Current verification: the first combined provider/UI revision passed 182 test files / 1,716 tests, TypeScript and ESLint (zero errors; existing warnings). Follow-up review fixes are undergoing final checks. The PostgreSQL regression now uses the exact production order-status enum. Final release evidence will replace this interim checkpoint.

Historical scope: 21 unmatched Clover capture events were read back at the provider. Sixteen have one safe identity; five remain identity gaps. No additional active, unarchived pending order was provider-paid. Archived/voided-side records are preserved. Historical captures need reconciliation even if staff already completed their orders.

## Production recovery checkpoint

The reviewed additive migration `20260915141000_wave_provider_payment_recovery.sql` was applied with migration history and schema-cache reload. The service role can execute the ingestion procedure; anonymous access is denied. The reported customer-origin Wave payment now has exactly one Wave ledger entry and a paid website order. Two recent Clover captures have exactly one Clover entry each, linked to their existing manual Wave bookkeeping entries; existing production status and receipt history were preserved. Recovery created zero Wave effect-outbox rows and sent no customer messages.

The five older identity gaps were subsequently resolved from exact app-generated order numbers inside the authenticated Clover order line items. Archived/voided records remain excluded; other historical repairs are still being prepared.

Receipt reliability limit: the UI/history guard prevents routine duplicate sends and intentional resend requests expire after five minutes. If the mail provider accepts an automatic receipt but writing its email log fails, the application reports uncertainty. Exactly-once email is not guaranteed beyond the provider's 24-hour idempotency retention; verify provider delivery before manually resending an uncertain older message.
