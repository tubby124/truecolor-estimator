# Pricing and social integration — September 6, 2026

The [migration release package](MIGRATION-RELEASE-20260906.md) records the five-file order and production approval boundary.

Coordinator task: `01a077f8-3952-7a32-976f-e79bb7844a28`. The [approved handoff](IMPLEMENTATION-HANDOFF-20260906.md) defines scope; this record tracks integration and release evidence. Implementation authorization does not approve new public content, customer communications or production database migrations.

## Shared work and dependencies

| Lane | Task | Contract and release dependency | Evidence |
|---|---|---|---|
| Pricing / P | `01a077f7-0c52-7db1-a85d-0c7323e90b7c` | Server-only `resolveProductFacts` owns configuration, engine totals, order minimum, allowed claims and source fingerprint. Preserve negotiated and issued snapshots. | Reviewed PR [49](https://github.com/tubby124/truecolor-estimator/pull/49), merged at `84a409e2` after exact-head CI; main CI and public runtime passed. Tax SQL requires production approval. |
| Google, business isolation and monthly publishing / G | `01a077f7-4219-7c22-ae5e-22eea830acec` | `requireSocialBusiness(req?)` supplies authorized business context. `SOCIAL_BUSINESS_SCOPING_ENABLED` defaults off, preserving legacy schema and already-approved Meta deliveries. Shared platform name is `gbp`; approval field is `fact_fingerprint`. | Reviewed PR [48](https://github.com/tubby124/truecolor-estimator/pull/48); final combined head `d7ae7136` passed required CI (1,425 unit tests/40 browser contracts); merged at `5351b32f`. |
| Catalogue-backed generation / C | `01a077f7-7ba0-7fe1-89cd-d4953bee2f03` | Uses P facts and G business context. New durable jobs require business migration followed by generation migration. Legacy on-demand compatibility stays explicit during rollout. | Reviewed PR [47](https://github.com/tubby124/truecolor-estimator/pull/47), exact combined head `3427f091` CI passed and merged at `df586144`. Selected channels, deterministic source-backed price text and editable usage ceiling. |
| Integration | This task | Owns shared CI workflow, this record, current-state board/index and merge sequence. | Documentation PR [45](https://github.com/tubby124/truecolor-estimator/pull/45) merged at `d081d062` after exact-head CI passed. Isolated integration branch starts there. |

Shared-file changes must be coordinated. Lane owners supply reviewed PRs, exact test commands and their own runbooks. Integration adds SQL/browser commands to required CI and reviews the combined result. No lane independently activates production features or repeats successful posts.

## Acceptance and release checklist

| Area | Required evidence | Current status |
|---|---|---|
| Pricing | Cross-surface cents, tax classes, order minimum, manual provenance, revision and Wave amount parity; immutable issued history | PR49 merged; main CI and exact Railway deployment passed. Public rates and three source prices verified; full integration still in progress. |
| Facts and generation | Single source fingerprint; unchanged rerun without provider call; item-local invalidation; partial resume; bounded retries/usage; ambiguity held | C reviewed and merged after required CI; all final app contracts passed in the combined G run. No paid provider call. |
| Two-business isolation | Authorized routes, assets, jobs, credentials, approval targets and receipts; two synthetic businesses | Combined SQL and lane route/assets tests passed with two synthetic businesses. No real second client. |
| Monthly approval and delivery | Exact media/copy/account/time/facts binding; stable creative IDs; paginated review; missed-schedule hold; per-platform receipts | Monthly/approval/provider tests and all40 built browser contracts passed; real three-channel content still requires approval. |
| Migration package | Ordered SQL, review, disposable regression, backfill impact, rollback and activation instructions | Exact five-source package and private executable prepared, reviewed and tested; production approval required. |
| Git and CI | Reviewed intended files, required exact-head checks, P before dependent lanes | PR45, PR49, PR47, PR50 and PR48 merged; root PR46 owns final combined SQL/CI and records. |
| Deployment | Main CI, actual Railway deployment/commit and read-only runtime behavior | Combined P/C/G `5351b32f` deployment SUCCESS; public prices/rates and anonymous social authorization checks passed at19:29UTC. |
| Provider setup | Google credentials/access, actual listing/history and live connection health | 19:18UTC: existing client/callback verified; Railway redirect and encryption key configured. Client secret missing, quota/access and actual Google history unverified. No paid test call. |
| Ongoing scheduler | Reconcile existing six approved deliveries; replace the bounded trigger with one ongoing runner; preserve uncertain holds | Existing runner active and waiting; no replacement activated |

## Read-only Sunday batch reconciliation

At **2026-09-06 18:28:22 UTC**, independent Supabase and Meta reads confirmed the 09:00 Regina pair:

- [Facebook](https://www.facebook.com/122234777786295517/posts/122234818304295517), provider time 15:00:21 UTC: one exact-caption match and one published receipt.
- [Instagram](https://www.instagram.com/p/Dc8zt3Dm_ZH/), provider time 15:00:17 UTC: one exact-caption match and one published receipt.

The remaining four deliveries at September 6 19:00 UTC and September 7 01:00 UTC remained ready and approved, with zero receipts and no exact-caption matches in the provider lists inspected. Facebook returned two September 6 posts; Instagram returned 98 recent media records. Facebook's provider permalink uses a different URL form from the app's stored permalink; exact text matched and no duplicate was found in that read.

Hosted readiness at 18:27:21 UTC showed publishing enabled, 12 legacy drafts, four ready, four posted including the original pilot, and no posting or failed rows. VPS timer was active; read-only state showed `waiting`, `held=false`, two completed batch deliveries and four future deliveries. Automatic journal ticks at 18:25–18:27 UTC succeeded. These observations do not prove the later slots or that the owner's Mac was off. No publish, cron-dispatch or resubmission endpoint was called during reconciliation.

## Release boundaries

The current approved Meta batch must continue to work with feature gates off. Do not invalidate its approval hashes during unrelated integration. Production migration authorization is explicitly excluded by repository AGENTS.md; prepare the exact reviewed package before asking the owner. Google account connection also needs its concrete credentials/API access steps. These gates do not block independent code and documentation work.

GitHub main has no branch-protection record in the September 6 API read. Explicitly check completion before merge; do not treat `--auto` or a label as enforcement. Preserve Railway Wait for CI and inspect the actual deployment separately. Existing [Sunday evidence](SUNDAY-BATCH-20260906.md) documents a prior release that started before main CI completed.


## Combined migration test — September 6, 2026

Integration owns `supabase/migrations/20260906150000_social_generation_business_links.sql`, applied after G business/monthly migrations and C generation migration. It adds real-business references to all six generation tables and a composite business/job foreign key for social posts. Unexpected orphan references abort the package for review; it rewrites no rows.

`tests` are synthetic: `scripts/social/sql/integration-regression.sql` assembles the actual approval, business, monthly, generation and integration migrations in one disposable PostgreSQL transaction. PostgreSQL18.4 execution passed, including repeat integration migration, preserved approved legacy snapshot, same-business generation-to-monthly-draft handoff, stable chunk replay without another generation charge, nonexistent/cross-business rejection and denied browser reads. Independent database review found no migration correctness issue; its missing-row preservation-test finding was fixed with a left join and the test reran successfully. GitHub PostgreSQL16 subsequently passed all eight required steps in integration run34055149545. No production schema was changed.

At 18:40:54 UTC, protected configuration showed `SOCIAL_BUSINESS_SCOPING_ENABLED=false`; REST limit-zero probes for `social_businesses`, `social_batches`, `social_generation_jobs` and `social_generation_settings` returned 404/PGRST205. This proves unavailability in the current REST schema cache, not direct SQL absence.


## Second Sunday pair and production schema preflight

At **19:00:40 UTC**, the 13:00 Regina pair was independently confirmed: [Instagram](https://www.instagram.com/p/Dc9PLsrmPCW/) at19:00:17UTC and [Facebook](https://www.facebook.com/122234777786295517/posts/122234849312295517) at19:00:20UTC. Each has one exact-caption provider match and one published receipt. The first pair still has exactly one matching delivery each. Only the September7 01:00UTC pair remains ready with no receipt or matching provider post. No dispatch endpoint was called by integration.

Read-only SQL in the existing authenticated Supabase dashboard resolved the connector access limitation. Production is PostgreSQL17.6 (`170006`). No platform check constraints restrict `gbp`; OpenAPI confirms text[]/text platform fields. Current checks constrain status, post_type and post_number only. Required insert columns without defaults are accounts.platform, campaigns.slug/name and results.platform. Both orphan-count checks returned zero. Existing campaign slug uniqueness was global; G followup scopes it by business. The replacement campaign and receipt foreign keys preserve existing SET NULL and CASCADE behavior. One verified configured owner account was found through the protected auth admin read; its UUID is retained only in the private release package. No production schema was altered.

The combined disposable fixture now includes these actual legacy constraints plus a deliberately broad storage read policy. Restrictive social-storage policy blocks browser access to both social buckets while retaining access to an unrelated bucket; the full combined test passes.


## Pricing/caption merges and deployment gate

Pricing PR49 merged at `84a409e2c31d30347012f6fa33a8245274793795`; required PR CI and main [run34053757527](https://github.com/tubby124/truecolor-estimator/actions/runs/34053757527) passed. Railway deployment `38d1b0b7-7d39-4720-8db5-e3f0b5277dd6` succeeded at that exact commit. At19:08:36UTC public tax rates and three pure estimate requests returned the committed $219 retractable, $78 ACP24×36 and $15 raw photo-poster prices, GST5%/PST6%. No order or provider mutation occurred; this does not verify a paid checkout or new finance delivery. P runbook retains the full bounded receipt.

Caption PR47 merged at `df586144` after refreshing with final P and passing exact combined head `3427f091` [CI34053876903](https://github.com/tubby124/truecolor-estimator/actions/runs/34053876903). G subsequently integrated both merged lanes; see the combined release receipt below.

At19:12UTC the authenticated Railway service settings contradicted the dated release notes: Wait for CI was OFF. Integration reviewed the sole staged change, Check Suites false→true, and applied it under the approved release scope. Readback showed the setting on with no staged changes, and the next C deployment explicitly waiting for CI. No repository permission expansion or other service setting was performed.


## Combined release and exact migration preparation

G PR48 passed exact head `d7ae71362828c592bca2e5d7ab18ce6e6b806c82` [CI34054236038](https://github.com/tubby124/truecolor-estimator/actions/runs/34054236038), including1,425 unit tests/149 files and40 built browser contracts. The preceding run had three storefront load timeouts; all social tests passed, combined local reproduction and the final exact CI passed, and no speculative application/timeout change was introduced. Root now retains failed synthetic browser traces/screenshots for seven days. G merged at `5351b32fa666270620f2ba9cf07ac88e4989807b`. P runtime documentation PR50 also merged at `d93b7090`.

Main [CI34054535897](https://github.com/tubby124/truecolor-estimator/actions/runs/34054535897) passed on5351b32f. Railway deployment `50cd74b2-39d5-400c-b0ac-2006239577f9` reported SUCCESS at that exact commit. At19:29:11UTC health and canonical rates passed; raw pre-tax retractable219/ACP78/poster15 still matched source. Anonymous posts, GBP status and monthly routes each returned401. This confirms deployed compatibility/auth boundaries, not authenticated Google connectivity, migration activation or finance delivery.

All eight SQL regression steps passed in CI order on disposable PostgreSQL18.4. The exact private five-source package passed synthetic-owner execution and an injected post-migration failure proved whole-package rollback. Independent SQL wrapper and final CI reviews approve with zero remaining high/critical findings. The [migration release package](MIGRATION-RELEASE-20260906.md) contains source/executable hashes and approval scope. Production schema and business feature gate remain unchanged.

Read-only Google Cloud inspection found the existing GooglemybusinessTrueColor project and matching True Color GBP Publisher client. Its authorized callback already equals the application callback. Only My Business Account Management API appeared among22 enabled APIs; Business Information and Google My Business localPosts APIs were absent from that enabled list. Account Management quota/access approval remains unverified. Google masks the existing secret and does not allow viewing/downloading it again. No client secret was created or rotated, API enabled, listing created or Google consent granted. Integration configured the missing Railway callback and a fresh64-hex token encryption key through protected stdin with immediate deployment skipped;19:18:29UTC protected readback confirms both present, client secret absent and business scoping false. Later final app deployment uses the saved configuration. Remaining Google steps: securely supply the existing secret or explicitly authorize a replacement, verify/complete required API access/quota and consent, then connect the exact listing and import actual history after schema activation.


At19:34:17UTC a fresh read after the combined deployment again found all six original approvals intact. The four completed deliveries each have exactly one published receipt and one exact-caption provider match; the final01:00UTC pair has zero receipts and zero provider matches. The inspection covered92 Facebook posts and99 Instagram media records. VPS timer readback remained active, waiting and held=false. No dispatch was called. A local ongoing-runner candidate and disabled config are prepared outside Git, with pilotReconciled=false; no VPS runner/config/timer replacement occurred.

Required integration PostgreSQL16 [run34055149545](https://github.com/tubby124/truecolor-estimator/actions/runs/34055149545) passed all eight migration regressions. [PR46](https://github.com/tubby124/truecolor-estimator/pull/46) is the authoritative exact-head application/browser/merge check record for the final shared integration and documentation. The remaining operational steps are production migration approval/application, feature activation readback, Google credentials/API access and exact listing/history, approved new creative, and reconciliation of the final Sunday pair before ongoing-runner activation.
