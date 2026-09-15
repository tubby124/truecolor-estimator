# Payment provider decision — September 15, 2026

## Decision state

**Direction selected; implementation deferred until the current repair is complete.** The owner selected Wave for online orders/invoices/payment links and Clover for in-person payments, with Wave Pro deferred until later. The latest instruction prioritizes finishing and verifying the current payment repair before starting that migration. No plan purchase, payment-button disabling, or provider-default change has been made.

Selected target: Wave online plus Clover in person for the invoice-led business, migrated gradually after a successful pilot. Wave Starter remains usable for online collection with authenticated polling; immediate webhook delivery waits for a later Pro upgrade. Keep the repaired current flow operational during that decision. Actual Clover online/card-not-present pricing must be verified from the merchant agreement or statement before any savings claim.

## Verified current facts

- True Color's correct Wave business shows **Starter**. Its website webhook is Active, selects all seven invoice events, and points to the correct HTTPS endpoint. Its retained 30-day delivery log has no events.
- Wave's [current webhook guide](https://developer.waveapps.com/hc/en-us/articles/51070420388628-Webhooks-Setup-Guide) requires Pro authorization for webhook delivery. An active configuration does not establish delivery.
- [Published Wave pricing](https://www.waveapps.com/pricing): Pro CA$25/month or CA$250/year. Standard card processing is 2.9% + CA$0.60, Amex 3.4% + CA$0.60. The Pro fixed-fee waiver applies only to the first ten monthly transactions, a maximum CA$6/month saving. [Fee details](https://support.waveapps.com/hc/en-us/articles/218323823-Online-payments-processing-fees-and-timelines). Pro would be chosen for automation, not assumed fee savings.
- [Clover Canadian pricing](https://www.clover.com/ca/pricing) varies by merchant agreement; published examples do not establish this business's rate.
- Five active, unpaid linked website orders currently specify Clover while their Wave invoices also permit online card/bank payment. No change to those flags is authorized by the discussion.
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

Acceptance cases before claiming the workflow is reusable: a manual custom invoice; a multi-item website order; a deposit followed by a balance payment; an in-person Clover payment against an online-issued invoice; a repeated link after payment; a refund with provider/accounting/website reconciliation. Preserve quoted items, taxes, discounts and total in every case. No test charge or customer communication is authorized by this proposal.

The [incident audit](PAYMENT-INCIDENT-AUDIT-20260915.md) and [issue #98](https://github.com/tubby124/truecolor-estimator/issues/98) retain the deployed repair evidence and historical holds.
