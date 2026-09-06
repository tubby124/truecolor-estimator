# Pricing and social migration release package — September 6, 2026

**Prepared, not approved or applied.** Integration owns this package. Repository `AGENTS.md` states: “True Color production database migration approval is not inferred from permissions for other Supabase projects.” Git pushes, merges and Railway deployment authorization do not authorize this SQL application.

Target: True Color Supabase project `dczbgraekmzirxknjvwe`. Apply no fixture/regression script to production. Final commit hashes, file checksums and CI evidence must be recorded here before owner approval is requested.

## Ordered package

| Order | Source file | Purpose |
|---|---|---|
| 1 | `supabase/migrations/20260906110000_structured_quote_pst20_policy.sql` | Versioned structured quote tax policy; preserve issued snapshots. See pricing lane runbook for capability activation and recovery. |
| 2 | `supabase/migrations/20260906120000_social_business_channels.sql` | Default True Color backfill, operator membership, business-scoped credentials/offers/history, ACLs and cross-business references. |
| 3 | `supabase/migrations/20260906130000_social_monthly_batches.sql` | Durable monthly batches and idempotent chunk save. |
| 4 | `migrations/20260906_social_generation.sql` | Business/request generation jobs, observations, cache and usage reservations. |
| 5 | `supabase/migrations/20260906150000_social_generation_business_links.sql` | Bind generation rows to actual businesses and each social post to a same-business generation job. |

The two migration directories are intentional existing lane locations. Do not rely on a directory-only runner to infer this order. Prepare an exact concatenated SQL package from reviewed Git sources, with an outer transaction and verified owner bootstrap, before application. Do not include test fixtures.

## Preflight and application

1. Confirm all intended code is merged, required CI is green, and the compatible Railway deployment is successful. Record exact main and deployment hashes. Read the final pricing, Google/monthly and generation runbooks.
2. Verify production target and operator identity privately. The social migration reads `app.social_owner_user_id`; use the verified authenticated owner's UUID, never a guessed identity. Keep the owner-specific executable package private.
3. Retain `SOCIAL_BUSINESS_SCOPING_ENABLED=false`. Reconcile current approved Meta deliveries and capture their status, approval fingerprint, updated timestamp and schedule before applying schema. Do not resend a successful delivery. No new real client is introduced by this package.
4. Capture schema/backfill preflight counts and potential orphan references read-only. Confirm migration lock/statement timeout and transaction behavior. An unexpected orphan is a stop for review, not authority to delete or repair records.
5. Present final source hashes, migration effects, test results and private executable package location for the owner's missing production-migration approval. No SQL application occurs before that approval.
6. After approval and with authorized database access, apply the exact package transactionally. Read back policy capability, tables, constraints, grants and the owner membership. Compare approved-delivery snapshots; leave unexpected changes held for review.
7. Feature activation is separate from schema application. Keep legacy compatibility until the whole package and operator membership are verified. Reconcile all six current approved batch deliveries before replacing the VPS bounded runner; retain exactly one canonical trigger and manual uncertainty holds.

## Recovery and verification limits

Prefer a forward correction with new features disabled. Retain issued quote snapshots, provider receipts, generation usage reservations and stored drafts. Do not drop tables, rewrite financial history, clear holds, or restore retired unsafe financial handlers as a rollback shortcut. The pricing runbook governs its versioned SQL recovery; do not guess that removing a capability marker is safe after new revisions exist.

A schema readback does not prove Google OAuth, provider account access, delivered financial messages or publication. Google still needs its concrete credential/API setup. New real three-channel content needs its own exact owner review and approval. Existing Meta delivery approvals are preserved independently.

## Current evidence

- Combined actual-migration fixture passes on disposable PostgreSQL18.4, including preserved legacy approval snapshot, stable monthly replay, no repeat generation charge, and cross-business rejection.
- Independent review found no integration-migration correctness issue. One missing-row assertion in the fixture was corrected and rerun.
- Business isolation and versioned tax regressions also pass sequentially on the disposable database used by integration.
- Required GitHub PostgreSQL16, complete integrated app/browser CI, final file hashes and final deployment readback remain pending lane integration.
- 18:40:54 UTC production read showed the social feature gate false and the four probed new tables unavailable in the REST schema cache. No production migrations or feature activation were performed.
