# Pricing and social migration release package — September 6, 2026

**Applied after final owner approval on September6 at approximately22:53UTC.** The historical preparation/checklist below is retained for custody; the [current integration receipt](INTEGRATION-20260906.md#final-september-approval-and-production-schema-application) records exact execution and readback. Integration owns this package. Repository `AGENTS.md` states: “True Color production database migration approval is not inferred from permissions for other Supabase projects.” Git pushes, merges and Railway deployment authorization do not authorize this SQL application.

Target: True Color Supabase project `dczbgraekmzirxknjvwe`. Apply no fixture/regression script to production. The exact source and executable hashes are recorded below. Required integration CI is attached to PR46 and must pass before application approval is requested.

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

Prefer a forward correction with new generation/publication disabled. Once any additional business exists, retain business scoping and authorization; switching back to legacy single-business mode is not a safe rollback. Retain issued quote snapshots, provider receipts, generation usage reservations and stored drafts. Do not drop tables, rewrite financial history, clear holds, or restore retired unsafe financial handlers as a rollback shortcut. The pricing runbook governs its versioned SQL recovery; do not guess that removing a capability marker is safe after new revisions exist.

A schema readback does not prove Google OAuth, provider account access, delivered financial messages or publication. Google still needs its concrete credential/API setup. New real three-channel content needs its own exact owner review and approval. Existing Meta delivery approvals are preserved independently.

## Current evidence

- Combined actual-migration fixture passes on disposable PostgreSQL18.4, including preserved legacy approval snapshot, stable monthly replay, no repeat generation charge, and cross-business rejection.
- Independent review found no integration-migration correctness issue. One missing-row assertion in the fixture was corrected and rerun.
- Business isolation and versioned tax regressions also pass sequentially on the disposable database used by integration.
- All eight required SQL regressions pass in CI order on disposable PostgreSQL18.4 at integrated source `b60099bf`. Required GitHub PostgreSQL16 execution passed all eight steps in run34055149545. P/C/G combined app CI passed (1,425 unit tests and40 browser contracts).
- 18:40:54 UTC production read showed the social feature gate false and the four probed new tables unavailable in the REST schema cache. No production migrations or feature activation were performed.


Read-only production preflight now confirms PostgreSQL17.6, no platform enum/check blocking GBP, and zero orphan post/campaign or receipt/post references. Exact existing uniqueness and FK lifecycle definitions informed G followup3b425be4. A reusable read-only preflight lives in `scripts/social/sql/production-preflight.sql`. Authenticated dashboard access is available even though the configured Supabase MCP token cannot access this project; no schema application has been performed.


## Exact executable package

Prepared from integration source `b60099bf6cd6637a3539ebe8a923c57bf0919ea7`. Each source file was byte-compared to that Git commit before assembly. The private executable is `/Users/owner/Downloads/TRUE COLOR PRICING /release-private-20260906/pricing-social-release.sql`; its adjacent `manifest.json` records the same hashes. Directory permissions are0700 and both files0600. The owner UUID is excluded from Git and public documentation.

| Source file | SHA-256 |
|---|---|
| `supabase/migrations/20260906110000_structured_quote_pst20_policy.sql` | `abacbf43d9f182237afec7251273034fc0d390bc0af939718354d58f511bd176` |
| `supabase/migrations/20260906120000_social_business_channels.sql` | `8afb1d3e1cb785ccce3c8930c71a89167183670992ef61caa6a87c8e7808e265` |
| `supabase/migrations/20260906130000_social_monthly_batches.sql` | `7acd4ccb0013bee36508840df2c88f004184706dbea97b5a3a7b58637082f61c` |
| `migrations/20260906_social_generation.sql` | `62dd82d8b84c6273d46a692dd2ceaa412fa1dd5d56d5071a3f62eb15d9603e23` |
| `supabase/migrations/20260906150000_social_generation_business_links.sql` | `0d59d937f33f0d53d56b7b0522883cb70828aea9971d3dae2d094c279b85ead5` |

Executable SHA-256: `070205267447f30f53707bf37313be89d8c0c78ae20dd869f8c28afd202fb9c5`.

Assembly removes exactly the pricing migration’s top-level BEGIN/COMMIT and retains all other migration source bytes. One outer transaction supplies the verified owner setting,5-second lock timeout and30-second statement timeout. It verifies the owner and tax row, locks social_posts, snapshots existing approved rows, executes all five migrations, then verifies owner membership, the tax marker and equality of every original approved-post field before committing. New migration columns are permitted; changes to original arrays/nested approval fields or deletion abort the transaction.

Independent wrapper review approved after replacing JSON containment with exact per-field equality. Guard tests reject appended/reordered platforms and changed nested approval data. The assembled package, with only a synthetic owner UUID substituted, committed successfully on a fresh disposable fixture. A second test injected failure after all five migrations and proved both new social schema and tax capability rolled back while the legacy approved post remained. No fixture or failure injection exists in the owner package.

Compatible combined app is deployed at `5351b32fa666270620f2ba9cf07ac88e4989807b`, Railway deployment `50cd74b2-39d5-400c-b0ac-2006239577f9`, SUCCESS. Main CI34054535897 passed. At19:29:11UTC health/public pricing passed and unauthenticated posts, GBP status and monthly routes returned401. Root integration changes add migration references, CI and records; production application remains unapproved. See PR46 for final integration checks before approval/application.
