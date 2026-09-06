# Monthly review and ongoing scheduler implementation — September 6, 2026

Implementation package, not a record of activation or provider delivery. No production migrations, live timer replacement, publication, or customer communication was performed by this implementation worker. Parent release runbook: `GOOGLE-THREE-CHANNEL-20260906.md`.

## Preparation and exact review

`/staff/social/monthly` prepares up to 31 logical creatives. Instagram/Facebook are selected per creative by default; Google must be selected deliberately for individual appropriate offers. Dates are explicit Regina wall time, editable per creative. Monthly grouping uses Regina month, including UTC dates around midnight. Legacy `/staff/social/batch` remains available for the approved pilot workflow.

Uploaded preparation and stable generation request IDs are retained in browser storage keyed by the server-authorized business ID. Private saved preparation is not displayed until business authorization succeeds. Only uploaded derivatives and draft fields are retained, never raw files or credentials. Before leaving the browser, save drafts to obtain durable server chunks. Generation uses the lane C helper, selected channels, compressed JPEG observations and stable request IDs. Schedule edits do not regenerate copy. Publication routes never import the generation helper.

Save writes at most ten logical creatives / thirty destination rows per atomic request. Request ID and exact payload are retained before network dispatch. `save_social_batch_chunk` serializes the business/request pair with a transaction advisory lock; it saves draft rows and the request receipt together. Identical retries return the same destination IDs. Changed payload under the same request returns conflict; distinct requests cannot duplicate a creative/destination in the same batch. No upsert can overwrite an approved or attempted row. Every new monthly draft sets approval_version 2 and retains product/fact/generation provenance.

After partial save, **Resume chunk save** sends only unsaved chunks with the original exact request IDs. If the response was lost, the server returns existing rows. Once a chunk has been attempted, preparation is locked to preserve request identity; edit the saved drafts from exact review. A conflict cannot silently replace saved content. Saved monthly batches are listed twenty per page, destination reviews nine per page, with no 200-item queue cutoff. Page confirmations reset when moving between pages, reloading, or changing times. Only destinations displayed on the current page are approved. Previously saved approvals survive refresh and later page failures.

`/staff/social/review?batchId=<uuid>` is the durable resume URL. Time edits use the existing guarded PATCH API, revoke approval and reload the exact preview. Already posted/in-flight deliveries have no time edit control. Missed-date error messages are visible in review. Saving or approving drafts is never described as proof of publication.

## Migration and isolation

Install the parent business migration before `supabase/migrations/20260906130000_social_monthly_batches.sql`. The monthly migration creates batches, chunk receipts, business/batch FK and destination uniqueness; tables have RLS and no browser grants. Only service-role execution is granted to the chunk RPC. The staff API resolves membership server-side and ignores body business IDs. Both API and UI require `SOCIAL_BUSINESS_SCOPING_ENABLED=true`; they fail closed before activation. Existing non-monthly posts and legacy approval fingerprints are not rewritten.

Prepared SQL regression: `scripts/social/sql/monthly-regression.sql`. Use a brand-new local empty disposable PostgreSQL database only. It creates synthetic tenant fixtures, applies the migration twice, verifies unchanged retry, changed-request conflict, no cross-business batch reuse, separate same-request IDs across tenants, draft-only insertion, denied browser execution and atomic rollback on uniqueness failure. All fixtures and test role changes roll back.

Rollback: disable monthly UI access with the business feature flag only if parent runbook allows reverting the whole business feature. Prefer leaving deployed schema in place. Never drop tables containing saved drafts/receipts or remove provider receipts. Disabling ongoing scheduling does not revoke approvals; overdue items still need fresh dates and approval before any future activation.

## Ongoing trigger and activation gate

The deployed legacy six-ID runner still defaults to `/etc/truecolor-social/pilot.json` and `state.json`. Its explicit IDs, deadline, receipt handling and Telegram outbox remain unchanged. New application code does not activate a new timer. Unscoped legacy cron requests now return skipped; ongoing dispatch requires an explicit scoped request. Scoped pilot checks/mutations continue unchanged.

After the coordinator reads back all current pilot provider receipts, public links, pending states and duplicate counts, stop/disable the old timer and reconcile its durable state. Prepare one canonical replacement config:

```json
{"runner":"ongoing","businessId":"00000000-0000-4000-8000-000000000001","enabled":false,"pilotReconciled":true}
```

`pilotReconciled` must reflect an actual verified reconciliation; this sample does not assert one. Configure the server with `SOCIAL_ONGOING_SCHEDULER_ENABLED=true`, `SOCIAL_ONGOING_BUSINESS_ID` equal to the chosen business UUID, and the activated business schema. `SOCIAL_PUBLISHING_ENABLED` remains the independent publication pause. Reuse the existing secured `cron-secret` systemd credential and dedicated runner lock; never place provider or service-role credentials on the VPS. The coordinator must verify only one active canonical trigger before setting the reviewed ongoing config enabled. No live switch is authorized by this sample alone.

A read-only check requests `/api/cron/social-scheduler?runner=ongoing&businessId=<uuid>&mode=check`. Mutation uses the same scope without `mode=check`. Unknown/duplicate parameters, inactive configuration or mismatched business fail closed. Every ongoing queue query and stale hold filters the configured business ID.

Due rows are ordered by schedule and ID, bounded to 25 dispatch attempts per cycle, and report backlog for subsequent cycles. Existing atomic approved-post claims prevent duplicate providers calls across concurrent requests. Successful Meta rows are never retried. More-than-one-hour late ready rows return to draft with revoked approval and a visible missed-schedule explanation. Failed/uncertain provider rows remain held; nothing attempts automatic reconciliation or publication retries. No AI call occurs in a scheduler request.

The VPS runner writes `ongoing-state.json` as in_flight before a dispatch HTTP request. Success returns it to waiting. Lost ACK, crashed dispatch or held provider outcome leaves the runner blocked. Subsequent cycles only read state; they do not clear uncertainty or replay dispatch. Inspect remote statuses, provider objects and receipts first. After resolving every uncertain/failed item and reviewing stale drafts, an operator may archive the old ongoing state journal and start a new waiting cycle using the same approved config. Preserve the archived evidence; never delete provider receipts or reset posting rows merely to obtain a green check.

Ongoing runs print sanitized status and exit nonzero on holds; the existing cron heartbeat records dispatch/hold counts. Use the canonical timer's existing failure monitoring for alerts. The bounded pilot Telegram notifications are intentionally not repurposed into unapproved new message traffic. Verify monitoring destination and failure delivery with the release coordinator before activation.

## Local verification

Focused initial checks: monthly/legacy batch and scheduler Vitest 33 tests passed; Python legacy plus ongoing runner 21 tests passed. Monthly SQL regression passed in fresh local PostgreSQL18 with fixtures rolled back and local server stopped. These checks do not certify deployed schema, provider authorization, live history, publication, or devices-off scheduling. All 12 local Chromium social contracts (8 approval/monthly, 2 library, 2 generation) passed across focused final runs after fixture and locator repairs. Monthly browser coverage includes page confirmation reset, exact offer terms and dates, editable invalid-date recovery, and partial-generation resume with a new durable attempt. Strict TypeScript and scoped ESLint passed. Parent records full integration/build results separately.


## Browser fixture without an auth bypass

The social layout now verifies the session at the auth service. A browser cookie alone must not authenticate server-rendered pages. `scripts/social/e2e-auth-fixture.mjs` runs a synthetic auth service on 127.0.0.1:3198, accepts only the exact public test token at GET /auth/v1/user, rejects other requests, and never contacts any external service or database. Test cookie names derive from the configured Supabase hostname. This is test infrastructure; the application has no fixture bypass.

For local runs start the fixture with Node, start Next on localhost:3197 using NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3198, the CI placeholder publishable key and SOCIAL_BUSINESS_SCOPING_ENABLED=false, then run Playwright with the same public Supabase URL and PLAYWRIGHT_BASE_URL=http://localhost:3197. All staff API operations in these fixtures are intercepted; server session verification calls only the loopback stub. The integration-owned Playwright config can start the auth stub when SOCIAL_E2E_AUTH_FIXTURE=true. Stop both processes before the production build. Remove only Next's generated AGENTS block if next dev added it; preserve the repository's working agreements.
