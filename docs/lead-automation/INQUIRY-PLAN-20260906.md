# True Color inquiry automation scope — September 6, 2026

## Owner correction

True Color printing is a separate project from realtor Lofty CRM and cold-lead reactivation. The earlier combined audit is superseded as an implementation plan. Its history remains in Git; do not build realtor nurture here.

Realtor direction belongs in `tubby124/dripemtilltheydie`, decision `docs/decisions/2026-09-06-owned-reactivation-plans.md`. That project concerns existing cold Lofty leads, owner-controlled email/SMS Smart Plans and potential Brevo/Resend delivery. No shared customer lists, sender identities, campaign approvals or business templates are implied.

## Printing evidence retained

- ContactForm uses `/api/quote-request`; that route persists `quote_requests`, handles duplicate submissions and captures attribution. The legacy `/api/quote` 501 stub is not its backend.
- Existing staff quote workflow is the appropriate printing inquiry home. Production reply delivery was not exercised by this audit.
- `customerSync.ts` contains Brevo customer synchronization and explicit opt-in list addition. Live workflows, enrollment and suppression were not verified.
- At the September 6 audit, VPS social runner receipts showed four posted deliveries and two ready evening deliveries. This is a dated saved receipt, not current independent Meta readback. Social task/runbooks own posting status.

No printing runtime change, customer message or new campaign was requested or implemented here. Existing social work continues under its own scope. Do not expand printing work from realtor reactivation instructions.
