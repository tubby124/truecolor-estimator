# Social approval pilot — implementation and release gate

September 5, 2026. G1 of the private AISA master automation roadmap. Public-safe implementation record; no account tokens, private recordings or customer material.

## Intended behavior

Upload photos and generate captions, save drafts, then use `/staff/social/review?ids=<post UUIDs>` from any signed-in device. Review canonical captions, actual validated JPEG, exact Instagram target IDs and America/Regina schedule. Confirm rights and exact batch. Approvals persist per post; partial approval success is visible. Edits invalidate approval. Refresh/reconnect retains the review URL. New batches default to one post weekly on Instagram; additional platforms can be drafted but are blocked from pilot approval.

The server HMAC binds resolved content, target, schedule and image-byte digest to the post. Approval and dispatch use compare-and-set. The pilot handles one JPEG per Instagram post, with bounded storage-only image validation. It does not automatically retry or reconcile uncertain deliveries. Legacy authenticated n8n social callbacks return 410 without writes; the n8n server/workflows are not changed by this code.

`SOCIAL_PUBLISHING_ENABLED` defaults off. Both manual and scheduled dispatch obey it. Absent approval excludes historical ready rows. Posts more than one hour late are held for a fresh review; no catch-up burst. Missing schema/account/media prevents approval. Creating drafts does not publish. A post marked posted reflects the provider result; independent public readback still completes the operational gate.

## Verified baseline

Read-only production inspection: 12 draft posts with dates, zero social_accounts, zero gbp_connections. OpenRouter configured; no Meta/Blotato publisher credentials. Railway source matched 1c2d14f at inspection. Browser without a staff session redirected correctly to login. No old draft changed. Current catalog rights cover website/Merchant, not social; [content candidates](PILOT-CONTENT.md) remain held.

Read-only operator check: `railway run node scripts/social/readiness.mjs` from the verified linked application checkout. It emits counts/configuration booleans only and never calls publishing, scheduler or account-sync routes. Schema presence does not verify policies or triggers.

## Exact database package — approval required

Prepared migration: `migrations/20260906_social_explicit_approval.sql`, for the True Color production project only. Adds nullable approval hash/time/owner/target/rights/media-digest fields, monotonic updated_at trigger and server-only write protections. No old row is approved, deleted, or scheduled. Existing server-side service-role routes remain writers; direct browser writes are removed. The existing private schema's policies must be inspected before application. Supabase MCP and available management credentials denied read-only database introspection for this project. CLI can list the healthy project but that does not establish database-query privileges. No protected direct-database credential was available. This is an access gap, not a migration result.

Do not apply this migration based on another project's standing Supabase authorization. Obtain the owner's exact approval after diff/test review. Apply transactionally through the authorized project tool/CLI, read back columns/trigger/privileges, and verify row counts/statuses remain unchanged. Keep publishing disabled throughout.

## Release order

1. Focused code/security review, synthetic SQL regression, UI tests, full project CI.
2. Approve and apply the exact additive migration; preserve existing data. If schema gate remains pending, keep implementation in PR rather than breaking old-schema draft edits.
3. Merge/deploy through normal CI. Verify signed-out auth plus signed-in draft/review operations; publishing remains disabled.
4. Connect the owner's intended professional Instagram account via the current supported Meta setup. Verify exact identity/permissions using provider reads; no token printed or committed. Owner must complete login/consent when required.
5. Upload socially cleared owner photos, review current image/caption/account/date, and capture exact approval. Account configuration is not content approval.
6. Configure one hosted scheduler only, with proper secret and a cadence fitting the one-hour delivery window. Inspect every other trigger first. Enable publishing only for the approved pilot package. Verify public output independently.
7. Test phone-origin request and reply bridge, and publication with the Mac asleep. Then expand destinations; [real estate remains staged](REAL-ESTATE-ADAPTATION.md).

## Failure / rollback

Pause publishing first. Do not reset attempted `posting` rows to ready: inspect provider and stored result before any manual decision. A failed/uncertain batch save requires checking the queue before creating again; v1 does not offer blind retry. Reverting code must not reactivate old ungated publishing; leave publishing credentials/scheduler disabled and preserve approval data. The additive columns need not be dropped for rollback. No blanket data cleanup.

## Verification receipt

- Local production build passed with non-production placeholders.
- Focused approval/media tests passed (20 at backend handoff); weekly timezone tests passed.
- Three mocked-provider local browser tests passed, including mobile durable review/refresh, blocked approval and edit-to-draft without timezone drift. No real account or public post used.
- Full local suite: 124 files / 1131 tests passed; ESLint zero errors (30 existing warnings).
- Disposable local PostgreSQL regression passed: migration applied twice, legacy approvals remain null, monotonic version/CAS verified, direct browser table/column writes denied, service-role permissions retained; rolled back and test server stopped.
- Independent code/security review resolved four initial findings; no remaining high/critical finding.
- CI, production schema application and deployed pilot readback remain pending.

## Owner coordination — September 5

Exact migration approval requested through the verified owner True Color topic using the registered relay adapter. Provider accepted the question; owner acknowledgment is pending. No public-post approval was requested or inferred. The current implementation is in PR #32 and remains unmerged pending schema access and approval. Readiness readback at 22:47 UTC still showed 12 drafts, zero ready/attempted rows, no approval schema and publishing disabled.
