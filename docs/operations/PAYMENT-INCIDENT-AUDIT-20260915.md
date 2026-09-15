# Payment integration incident audit — September 15, 2026

## State

Read-only production investigation confirmed independent defects in Wave invoice provisioning, Clover callback identity matching, payment reconciliation, and staff receipt visibility. Runtime was verified at `a22876b4b019058f5efb8d379f7530411ef1c0cd`, Railway deployment `0c984057-a521-44d9-8621-233ac082881d` (SUCCESS). No runtime fix, production mutation, invoice creation, customer message, or test payment was performed. Customer evidence stays outside this public repository.

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

Verified production configuration and deployment, application logs, active pending-order inventory, targeted order/attempt/ledger/audit/email/webhook records, recent Wave invoice and payment histories, recent Clover transactions, and current source. Existing related tests passed 27/27 but omit these incident payloads. Clover payment amount lookup returned 404 at callback time and the same read succeeds now; do not misdiagnose the current credentials as invalid. Recipient delivery events do not prove inbox placement or reading. The system remains unrepaired by this audit.

Wave's current API exposes invoice payment origin/provider/state plus `Money.minorUnitValue`; historical comments saying individual invoice payments are unavailable are outdated. References: [Wave API](https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference), [Clover hosted-checkout webhooks](https://docs.clover.com/dev/docs/ecomm-hosted-checkout-webhook).
