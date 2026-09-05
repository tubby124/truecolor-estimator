# Business operations context

Reconciled 2026-09-05 from seven private operations notes and the current repository. This preserves business intent beyond the growth queue. Code observations below establish implementation presence, not deployment, enabled provider settings or actual customer outcomes. [Current work state](CURRENT-STATE.md) owns priorities; this document is background and a dated investigation backlog.

## Customer journey and quote-to-cash direction

The August 21 design proposes a shared structured intake and staff queue for standard products, custom web requests and a future after-hours phone pilot. Standard jobs should continue through product configuration, cart, checkout and payment without a mandatory chat or lead gate. Custom work needs product/specifications, dimensions, quantity, deadline, artwork state and preferred contact method; staff confirms the price and production promise.

Existing implementation anchors are `src/app/api/quote-request/route.ts`, `src/lib/quote-request-guard.ts`, `src/app/staff/quotes/QuotesTable.tsx`, `src/lib/payment/quote-order.ts`, `src/lib/payment/quote-wave.ts`, and `docs/paid-search/quote-lead-conversion-runbook.md`. Reuse these and the pricing engine rather than adding an independent price calculator or payment path.

The historical proposal's structured stages, response-time target, unified conversation record, contextual web assistant and after-hours receptionist are **design/backlog**, not verified live capabilities. Reconcile each against current code before implementation. Keep unknown acquisition sources unknown; raw inquiries and chat opens do not prove paid conversions. Never put customer free text, payment details or raw click identifiers into public reporting.

A voice pilot would require a dedicated True Color mapping and approved number/minute spending, internal end-to-end tests, consent-aware recording/SMS behavior and a verified staff handoff. Do not borrow another business's line or change the office line's routing merely because this historical design exists. Account-specific reorder portals are a later hypothesis requiring repeat-demand and margin evidence.

## Order history and repeat work

The August 22 handoff describes expandable prior jobs, artwork/proof links and staff recreation. Current code contains `CustomerHistoryWidget.tsx` dispatching `tc:recreate-order`, with a corresponding listener in `StaffOrdersActions.tsx`, under `src/app/staff/orders/`. The supporting endpoint is `src/app/api/staff/orders/[id]/customer-history/route.ts`; asset normalization lives in `src/lib/orders/order-assets.ts`.

`src/components/account/reorder.ts` carries prior configuration, add-ons and line-item detail. Historic price is display context, not a current price promise: checkout must revalidate today's pricing and taxes. Relevant test files are `src/components/account/__tests__/reorder.test.ts` and `src/lib/orders/__tests__/order-assets.test.ts`; these were located, not rerun for this documentation migration.

The old handoff left authenticated staff click-through as an evidence gap. This migration does not resolve it or assert it still fails. Before changing repeat-job behavior, use an authorized test record to verify expansion, access-controlled assets and recreation prefill; do not create payment requests or customer mail just to demonstrate the UI.

## Reviews, service email and retention

The August 21 review audit's proposed architecture has a repository implementation: `src/app/api/cron/review-requests/route.ts` uses customer-level review state and per-order cycles, a five-day initial delay, a seven-day reminder delay after the initial request, a 365-day customer cooldown, consent and suppression checks. Its default is dry-run, with the configured daily cap defaulting to zero. This is code evidence, **not proof the live sequence is enabled**.

Use `docs/review-request-system-plan.md`, `src/lib/email/reviewRequest.ts`, `src/app/api/webhooks/resend/route.ts` and their tests. Verify current provider configuration, internal delivery receipt, webhook processing and duplicate prevention before a separately authorized launch. API acceptance alone is not delivery evidence.

Keep operational payment/proof/pickup communication separate from proactive review solicitation and retention marketing. Preserve honest-feedback requests without incentives, requested star ratings or canned customer endorsements. Legacy Brevo review drafts are historical and must not be reused unchanged. Do not add a second review sender that bypasses customer suppression; reconcile replies, bounces, complaints and staff suppression with the actual implementation and provider state.

## Niche campaigns

The private June playbook explicitly delegates to `docs/campaigns/DRIP-CAMPAIGN-RUNBOOK.md`; preserve that existing runbook rather than creating another campaign procedure. Its channel distinction, reply suppression, fresh cohort selection, presend checks and avoidance of overlapping schedules remain useful operational context.

Its June performance, plan limits, historical prices and scheduled September dates are **dated observations**, not proof of current campaigns or today's provider allowance. Read current campaign/cohort/suppression and scheduled-send state before action. A fresh list alone cannot prove no duplicate recipients across waves; verify audience overlap and suppression. Validate claims from current pricing and policy sources. This migration authorizes no campaign launch, test send or customer follow-up.

## Historical issue register

The April 9 private ticket list is an investigation index, not a current open-bug list. Its categories cover refunds/payment reconciliation, account access, receipts, proof and pickup evidence, artwork validation, retention, delivery health, tax/business identity and external citations. Do not recreate its fixes or label all its old open rows unresolved.

Current repository anchors include `src/lib/lifecycle/rollup.ts`, `src/app/staff/lifecycle/`, `docs/payment-reconciliation-clover-plan.md`, `docs/email-architecture.md`, and the current payment/account routes. For each selected ticket, inspect code, migrations and authorized live readback, then record confirmed open/resolved/unknown status with evidence in the owning runbook. Provider identity, registration and historical invoice questions need private source verification; do not publish account identifiers or infer legal conclusions from the old note.

## Operator and historical SEO boundaries

The August 26 operator note describes a separate Hermes named-job runner and durable receipts. Preserve its useful distinction: queued/running/command-completed are not deployment or business-outcome proof. Cloud does not inherit that runner, private credentials, model routing or delivery destination. Root `AGENTS.md` and current user authorization govern this repository; the legacy runner's exact approval phrase and model assignments are not portable Cloud requirements.

The July SEO resume document contains superseded wave sequencing, dates, inventory counts and Merchant blockers. Current [SEO standard](SEO-STANDARD.md), [work state](CURRENT-STATE.md), protected-page rules and named experiment documents govern. Preserve narrow factual changes, rights-aware real-work assets and measured observation windows; do not execute the historical wave checklist as today's queue.
