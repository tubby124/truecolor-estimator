# Payment provider decision — September 15, 2026

## Decision state

**Wave online migration is now the active, explicitly authorized repair.** The owner rejected the Clover-directed internal test and clarified that finishing the task includes Wave online now, with Clover retained for in-person payments and Pro deferred. The earlier decision to defer migration was the assistant's interpretation and is superseded. Do not send another Clover online test as acceptance of this request.

The $1.12 staff resend reached the owner's inbox and correctly opened Clover under the prior deployed routing. That proves only the old channel, not the selected Wave setup. The owner was told not to pay that link. The new release must route the real customer website flow, both staff payment-link actions and payable quotes to Wave, preserve payment evidence and balances, and verify an actual Wave page before another owner test send. Current implementation/deployment evidence belongs in the incident audit and issue #98.

Wave Starter uses authenticated polling and on-demand reconciliation. No Pro purchase is required for this phase. Immediate webhook delivery remains a later Pro acceptance check.

## Verified current facts

- True Color's correct Wave business shows **Starter**. Its website webhook is Active, selects all seven invoice events, and points to the correct HTTPS endpoint. Its retained 30-day delivery log has no events.
- Wave's [current webhook guide](https://developer.waveapps.com/hc/en-us/articles/51070420388628-Webhooks-Setup-Guide) requires Pro authorization for webhook delivery. An active configuration does not establish delivery.
- [Published Wave pricing](https://www.waveapps.com/pricing): Pro CA$25/month or CA$250/year. Standard card processing is 2.9% + CA$0.60, Amex 3.4% + CA$0.60. The Pro fixed-fee waiver applies only to the first ten monthly transactions, a maximum CA$6/month saving. [Fee details](https://support.waveapps.com/hc/en-us/articles/218323823-Online-payments-processing-fees-and-timelines). Pro would be chosen for automation, not assumed fee savings.
- [Clover Canadian pricing](https://www.clover.com/ca/pricing) varies by merchant agreement; published examples do not establish this business's rate.
- Five active, unpaid linked website orders currently specify Clover while their Wave invoices also permit online card/bank payment. The owner selected Wave online, but postponed the provider migration until the current repair is finished; these flags remain unchanged in this repair.
- The deployed repair reconciles actual providers and polls Wave every fifteen minutes. A follow-up provider check on customer payment-link entry closes the stale local state interval before opening Clover. Independently active payment channels still have a race after the last provider read.

## Proposed operating model

| Workflow | Proposed route | Required order record |
|---|---|---|
| Online invoice or manually copied/texted/emailed payment link | Wave | Existing True Color order and its Wave invoice; remaining balance |
| Customer pays at the shop | Clover terminal | Same True Color order; verified Clover reference; one accounting copy |
| Staff tracks the job | True Color portal | Actual payment provider, balance, receipt state, production status |

Manual payment links remain available. The portal should produce a single durable link for the order, verify its current balance, and direct the customer to that order's selected online processor. Staff should not need to decide between unrelated processor dashboards for every payment.

## Non-disruptive migration gates

1. Finish current incident protection and exact live verification. Preserve outstanding links and existing invoices.
2. Verify actual Clover online rates for the cost comparison. Prepare the selected Wave online route on Starter using authenticated polling and on-demand reconciliation. When the owner later upgrades to Pro, confirm app authorization and prove real webhook delivery; retain polling as recovery.
3. Implement a per-order online-provider selection and a single copy-link workflow. New orders can use the chosen default; existing orders retain their original route unless individually migrated with balance and session checks.
4. Pilot one owner-approved new order and verify real provider payment, one ledger entry, staff notification, customer receipt state and bookkeeping. A local mock or signed synthetic event is not that proof.
5. Switch the default for new online orders only after the pilot succeeds. Keep rollback available per order; avoid a bulk conversion of already-issued invoices.

Acceptance cases before claiming the workflow is reusable: a manual custom invoice; a multi-item website order; a deposit followed by a balance payment; an in-person Clover payment against an online-issued invoice; a repeated link after payment; a refund with provider/accounting/website reconciliation. Preserve quoted items, taxes, discounts and total in every case. The owner separately authorized controlled test emails to their specified Gmail address; no assistant-initiated charge is authorized.

The [incident audit](PAYMENT-INCIDENT-AUDIT-20260915.md) and [issue #98](https://github.com/tubby124/truecolor-estimator/issues/98) retain the deployed repair evidence and historical holds.


## Staff entrypoints required in the Wave migration

The owner explicitly requires both order-card payment-link actions and quote sending to remain consistent. The migration must cover this complete map:

| Staff action | Current implementation | Migration requirement |
|---|---|---|
| Incoming quote → Send Price Quote → Send Branded Quote | `QuoteCard.tsx`, `QuoteBuilderModal.tsx`, `/api/staff/quotes/[id]/send-quote` | Preserve quoted revision/items/taxes and update payable link and provider wording |
| Order card → Resend payment link | `StaffOrderCard.tsx`, `OrdersTable.tsx`, `/api/staff/orders/[id]/resend-payment` | Email the same durable order link and current remaining balance |
| Order card → Get payment link → Copy link / Copy message | `StaffOrderCard.tsx`, `/api/staff/orders/[id]/payment-link` | Copy the same provider-aware order link; this action sends no email |
| Orders → New Quote → Send Quote / Send Invoice | `StaffOrdersActions.tsx`, `/api/staff/manual-order` | Preserve existing payable behavior and make modal preview, saved amount and email agree |
| Estimator / multi-quote cart → Email quote / Email Customer | `QuotePanel.tsx`, `MultiQuoteCart.tsx`, `EmailModal.tsx`, `/api/email/send` | Preserve explicitly nonpayable estimate emails; do not silently create an invoice |
| Lifecycle orphan → Email customer | `OrphanPanel.tsx`, `staff/lifecycle/data.ts` | Update prefilled processor wording and resolve the same durable order link |
| Quote → Reply by Email / Send Reply | `/api/staff/quotes/[id]/send-reply` | Preserve free-text reply restrictions; this is not a payment-link route |

One server-side resolver should validate order state, invoice identity and remaining balance before routing a payable link. Keep the True Color order link durable; do not make staff choose between unconnected provider links. Test both actual staff payment-link buttons, payable quote sending, nonpayable estimates, customer email HTML/plain text and copied messages before claiming the migration complete. The current repair corrects misleading manual-quote copy but retains the current provider routing.
