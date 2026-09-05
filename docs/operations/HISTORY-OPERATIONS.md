# Operations history: decisions worth retaining

Reconciled 2026-09-05 from April–August operational notes and repository paths. This is a navigator for future investigation, not a list of currently broken features. Historical completion claims establish what a note reported on its date; they do not establish today's deployment, hardware state, provider settings or delivery. [Current state](CURRENT-STATE.md) owns priorities; [business context](BUSINESS-CONTEXT.md) covers the customer journey and review system.

## Press console belongs to a separate project

The May 7–25 press-console sequence describes a separate hardware application. Historical notes describe a repository visibility change; current visibility was not verified in this migration. Its implementation and operator installation were **not migrated into this website repository or its Cloud environment**. Retrieve the authorized press-console project before changing printing behavior. Cloud can retain this context but cannot reach or operate the shop press by inheriting these notes.

Early May 7 notes proposed a Mac-only tool and dry mode. Later notes explicitly changed the operator target to a Windows executable, with Mac used for development. May 11 reports progressed to live job submission and individual finishing investigations; May 25 described a booklet geometry repair and executable boot gate. Do not replay an early pre-service checklist as today's state, or describe submitted spool data as proof of correct physical output.

Useful enduring design lessons:

- Keep operator labels separate from technical stock/preset identifiers. Give preflight findings a concrete next action and expose one customization at a time.
- Normalize input before preflight, verify page count and orientation after imposition, and preserve actual bleed geometry at full scale. Enlarging a page box cannot invent missing artwork.
- Validate each finishing workflow on the actual installed equipment. An online status or software preview does not establish mechanical capability or safe recovery after a power fault.
- A packaged executable existing is insufficient release evidence: boot it and wait for its health endpoint. The May packaging notes distinguished development success from frozen-app startup.
- An in-app updater depends on a working application and, in that historical implementation, an operator action. A broken installation may require direct recovery; a Git push is not proof that the shop installed it.

Before resuming: verify the separate repository, installed version, current technician clearance, stock configuration and supervised output. Private machine addresses, access details, print files and cost evidence remain outside this public repository.

## Staff workflow: preserve intent, inspect implementation

May staff work favored a short structured quote flow, consistent product descriptions and shared pricing logic. Start with the [existing staff tutorial](../staff-tutorial/README.md), then inspect `src/app/staff/orders/StaffOrdersActions.tsx` and the relevant staff API. Tutorial screenshots and old labels may lag current UI.

The May 25 flyer incident was a staff input path bypassing the shared engine, not evidence that the business needed a second engine. Preserve option mapping, quantity and tax parity across staff, customer and emailed quotes. Use current CSVs and pricing helpers; historical minimums and sample prices are not configuration.

A May follow-up explicitly rejected a browser-local saved-template implementation because it would not carry across devices. If staff later request templates, establish that need and persistence/access requirements before reviving it. Do not revive an old “open” email-format task without checking today's component.

April discount and receipt notes are useful regression scenarios: a changed order amount must agree across the order, payment link, bookkeeping record and customer-facing document; receipt access must work for the intended authenticated or guest recipient without exposing another customer's record. Current anchors include `src/app/api/staff/customers/[id]/assign-discount/route.ts`, `src/app/api/receipt/[oid]/pdf/route.ts` and `src/lib/receipt/ReceiptPdf.tsx`. Their presence is not proof every historical limitation remains or has been fixed. Drive organization remains a private, separately scoped workflow.

## Payment incidents: evidence before repair

The May bookkeeping sequence documented two distinct failures: an unexecuted thenable database update lost linkage, and an invoice-approval exception prevented later payment recording. Preserve explicit awaited writes and error inspection; verify persisted results. Keep approval and payment recording conceptually separate, with retry and idempotency behavior defined for each effect.

The later May correction rejected treating a generic accounting transaction as proof an invoice was paid. Current `src/lib/wave/invoice.ts` uses `invoicePaymentCreateManual`; inspect its verification and the shared payment-effects/outbox implementation before changing callers. Do not rebuild earlier ad hoc sequencing from an incident note.

June's webhook outage exposed the difference between “no error events” and “healthy”: requests rejected before event logging, or a missing subscription, can leave no event rows. Compare actual order activity with expected webhook traffic, and distinguish checkout opened, captured payment, staff confirmation and bookkeeping reconciliation. A pending order does not prove no charge; an approved invoice does not prove payment.

June's declined-card fallback and August's unreleased payment-evidence audit disagree about restricting confirmation by the originally selected payment method. Treat that as a historical policy conflict, not an instruction to restore either guard. Inspect current staff confirmation, authorization, payment evidence and transition tests before proposing a change. Preserve the distinction between the original checkout choice and evidence of the eventual payment.

Never run `reconcile-payments` as a harmless health read: its implementation includes recovery writes. Backfill, zombie-cleanup, customer-journey and test-payment helpers can create or modify external records. Inspect effects and bound the authorized batch first; duplicate bookkeeping and repeat charges cannot be ruled out from local status alone.

## Lifecycle visibility and email lessons

The [lifecycle rollup contract](../../.claude/rules/lifecycle-rollup-contract.md) already preserves May's dashboard/alert design. Add signals through the shared `buildRollup`, with stable keys and dashboard anchors; do not copy early inline-alert examples into new routes. Current code and scheduler readback determine active cadence and coverage. Historical plans for complete button tracking or generalized configurators are investigation pointers, not completed coverage guarantees.

The March [email architecture](../email-architecture.md) is historical: its Brevo transactional instructions predate the May provider change. Current `src/lib/email/smtp.ts` sends through Resend. May incident notes distinguish staff BCC failure from customer delivery and provider acceptance from inbox arrival. Preserve transactional/marketing separation, inspect actual sender/reply-to/BCC configuration, and verify delivery events or a recipient receipt before declaring success. Do not copy historical provider limits, DNS prescriptions or generalized anti-abuse claims as current facts.

July order-email tracking adds a second useful distinction: recorded outbound acceptance, provider delivery and an attributed inbound reply are separate evidence. Start with `src/lib/email/orderReplySync.ts` and `src/app/api/webhooks/resend/route.ts`; verify current flags, permissions and idempotency in an authorized operational session. The August sender-identity handoff also requires verifying the actual customer-facing From and Reply-To before an authorized reply; a provider fallback is not an acceptable substitute for the requested identity. Old local alert jobs and remote-runner notes do not prove Cloud has credentials or scheduled monitoring. This migration itself enabled no sends, recovery cron, hardware access or customer follow-up.
