# Platform audit continuation — September 11, 2026

## Start here

Read `AGENTS.md`, `docs/TRUE-COLOR-INDEX.md`, `docs/operations/CURRENT-STATE.md` and [the email audit](ORDER-EMAIL-AUDIT-20260911.md). Use `tubby124/truecolor-estimator`, not the legacy similarly named project. Refresh main, worktree status and current production revision before acting. The owner is switching accounts after hitting usage limits; browser sessions, connectors and credentials may not transfer. Never put secrets or private customer evidence in this public repository.

## Finished versus unresolved

PR 90 is deployed and verified, with the exact release evidence in the email audit. It fixes order linkage in essential email logs, hidden status-notification failures, lifecycle warning visibility, contradictory payable-quote copy and subscription headers on essential notices. The separate manual payment-link feature remains unchanged.

Two reported messages were individually accepted by their recipients' Microsoft systems. This does not establish inbox placement. Their exact private evidence and prepared IT trace request are in the local Vault note `Projects/true-color/2026-09-11-payment-email-audit-handoff.md` and the private trace file it references. No customer resend, sender switch or DNS change was performed. The Resend API key is send-only: read-endpoint 401 responses are not sending-outage evidence. The correct True Color provider account must be selected.

## First audit priorities

1. Verify and address the remaining e-transfer receipt error-reporting path; it can hide a send failure. Inspect current code before changing it.
2. Audit Clover receipt recovery: not every receipt failure has a durable retry queue. Any retry design must prevent duplicate sends and distinguish uncertain acceptance from confirmed failure.
3. Resolve recipient inbox evidence through an authorized Microsoft message trace. Sender/link domain mismatch is a risk, not a proven cause. A dedicated verified transactional sender is a separate scoped change, not an automatic fix.
4. Audit checkout to payment to receipt to production to pickup, including partial payments, duplicate/retried webhooks, refunds, staff state transitions and scheduled jobs. Staff must mark physical readiness; payment is not readiness.
5. Extend to permissions, pricing/tax consistency, failed-job visibility and recovery. Use existing platform-hardening and payment runbooks; preserve SEO, campaigns and unrelated work.

For each finding record evidence, impact, severity, status (working/broken/unverified), smallest fix and verification. This is a proposed continuation scope, not completed testing or authorization for outbound messages, spending, destructive actions or unrelated changes. Start with read-only evidence, then fix within the owner's confirmed scope. Do not create real customer orders or send mail as generic smoke tests. Keep broad platform health separate from a successful narrow release.

## Suggested opening prompt

“Continue True Color's platform audit from docs/operations/PLATFORM-AUDIT-HANDOFF-20260911.md. Verify current main and production, preserve the shipped manual payment-link and email fixes, and start with the remaining receipt-failure/recovery gaps. Report working, broken and unverified separately. Read private customer evidence only from the authorized local Vault; do not send customer emails.”
