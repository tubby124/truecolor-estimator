# Wave payment repair — September 15, 2026

## Prepared state

The Wave repair is implemented on `codex/payment-wave-repair-20260915` from baseline `71180684`. It has not been pushed, merged, deployed, applied to production, or used to change any Wave or customer record. Production recovery remains a separate controlled step.

The exact database proposal is `supabase/migrations/20260915141000_wave_provider_payment_recovery.sql`. Apply and review that migration before deploying the runtime which calls `accept_wave_provider_payment` and `record_quote_wave_provisional`. The old production RPC remains present during the transition, so applying the additive migration first does not break the current runtime.

## Resulting contract

- Wave `Money.minorUnitValue` supplies exact invoice cents. Formatted `Money.value` and deprecated `raw` are not used. Payment `amount` remains a separate strict major-unit string parser because Wave documents that field as `String`.
- Invoice creation persists the returned provider invoice ID and number before financial readback or approval. A failed readback retains an ambiguous hold. Recovery can verify and approve only that same invoice identity and cannot create another invoice.
- A signed Wave event triggers authenticated provider readback. Only an invoice payment with `origin=CUSTOMER`, `state=PAID`, `paymentProvider=WPP`, and `transactionType=SALE` can reach the database RPC. Business-origin/manual accounting copies are ignored.
- The order's intended `payment_method` stays unchanged. The ledger row records the actual Wave provider payment under its provider payment ID, and the RPC returns both facts separately.
- One locked transaction inserts the provider-keyed ledger row, sums all recorded positive payments, and derives partial, paid, or overpaid state. Partial payments leave `paid_at`, `wave_payment_recorded_at`, and full-payment effects unset. Duplicate and conflicting provider identities cannot add money twice.
- Live signed webhooks explicitly request the existing receipt, analytics and contact effects plus a provider-labelled staff notification. Scheduled/historical polling explicitly suppresses customer effects and requests only the staff notification. Every effect remains idempotent in the existing outbox.
- The poll includes every linked order still in `pending_payment`, even when an older `wave_payment_recorded_at` timestamp is already present, so the confirmed stale pending-order shape is not filtered out.

## Verification evidence

- `npm test`: 177 files, 1,685 tests passed.
- `npx tsc --noEmit`: passed.
- Focused Wave/payment suite: 10 files, 68 tests passed.
- `npm run validate:pricing`: passed with the two pre-existing warnings (one missing icon fallback and one 58.6% flyer margin warning).
- `bash scripts/codex/check.sh`: project records valid.
- `npm audit --audit-level=high --omit=dev`: zero production vulnerabilities reported.
- `supabase/tests/wave-provider-payment-recovery.sql`: passed on an isolated PostgreSQL 18.4 cluster. The same regression is registered in `.github/workflows/lint-test.yml` against PostgreSQL 16.

The SQL regression covers retained provisional identity, exact same-ID completion, a Clover-intended order paid through Wave, partial plus final payments, duplicate deliveries, null/unverified traits, manual bookkeeping rejection, overpayment, cross-order provider-ID conflicts, legacy synthetic-ledger conflicts, and suppressed customer effects during historical recovery.

## Release and recovery gates

1. Review and apply the proposed migration through the controlled production database path.
2. Deploy the runtime and confirm Railway is serving the reviewed revision.
3. Read back the linked invoice and its payment records from Wave. Do not create a replacement invoice or a test charge.
4. Run the historical recovery with customer effects suppressed, then verify the single provider-keyed ledger row, derived order state, Wave timestamp, outbox rows, and staff provider label.
5. Verify the signed Wave webhook configuration and delivery history separately. A local test or successful provider query is not delivery proof.

No customer communication is authorized by this prepared repair. Historic recovery keeps customer effects suppressed by default.
