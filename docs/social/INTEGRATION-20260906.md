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
| Provider setup | Google credentials/access, actual listing/history and live connection health | Google task saved the owner-authorized secret; config deployment097e6db1 SUCCESS. Last verified API quota0; support application submitted, approval/OAuth/history pending. [Connection receipt](GBP-CONNECTION-20260906.md). |
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


## Browser isolation followup and Google handoff

Integration run34055149545 reproduced three coroplast ordering/navigation failures while37other contracts passed. Retained traces showed the first five optimized thumbnails completed, then gallery-image, estimate and document requests stayed unfinished; no server image error was logged. This supports a same-origin request-stall hypothesis, not a proven production optimizer defect. The later unchanged-app/docs-only run34055488230 passed all40, confirming intermittency. Local synthetic ordering tests now serve actual repository image bytes directly, retaining real pricing/cart/auth paths and deadlines; a separate direct HTTP check exercises a real previously-stalled coroplast thumbnail through Next image optimization. The three affected contracts passed locally in7seconds. The test suite does not certify production image fan-out performance.

Google task `01a0783e-13aa-7a01-a41c-ec9f52d99e9d` now exclusively owns browser connection, credentials, owner consent and actual history. Its19:45UTC Comet readback confirms Account Management Requests per minute quota0, the other two required APIs absent, and staff history disabled pending business-schema activation. It prepared the existing-project API access form for the owner, without submission/API enablement/secret or consent changes. Integration retains production SQL/shared-record ownership. The exact migration package is still unapproved/unapplied, with business scopingfalse. No new public post is authorized.


GBP coordination update: owner reports the API support application submitted and authorized secret storage in Google task01a0783e-13aa-7a01-a41c-ec9f52d99e9d. That task owns protected GOOGLE_GBP_CLIENT_SECRET configuration and its deployment. It may deploy current main5351b32f; root has no concurrent environment writes. Root finalPR46 merge will carry the saved configuration forward after checks. Database package remains NOT applied and business scopingfalse; root owns requesting missing DB approval and activation. API application submission is not approval/quota restoration. No posts authorized.


Final local browser verification:29 ordering/image-availability contracts passed with direct real-image fixtures;12 social contracts then passed on the required localhost fixture origin. An initial local social invocation used127.0.0.1 and was correctly rejected by the explicit localhost guard; rerun changed only the local invocation origin. Strict TypeScript and whitespace checks pass. Final independent review approves the test-only isolation, including exact baseURL origin and public/images path checks. Required CI will run all41 together.

Google task reports authorized client-secret storage succeeded with protected configuration readback, callback equality and64-hex encryption-key validation. Its config deployment `097e6db1-3a0a-4b32-a4ec-a535c7f62db6` was WAITING when reported; this does not prove runtime activation or OAuth. API support application is submitted; approval/quota restoration and owner OAuth remain outstanding. Root has made no further environment writes and preserves Wait for CI.


Google task committed its [connection receipt](GBP-CONNECTION-20260906.md) as `c23983bf` on this shared integration branch. Root readback subsequently confirms config deployment `097e6db1-3a0a-4b32-a4ec-a535c7f62db6` SUCCESS at app5351b32f. This proves configuration deployment, not Google API approval or an OAuth connection. Final integration changes after app5351b32f remain prepared SQL, CI/tests and records.


## Completed release and September preparation boundary

PR46 merged at `f3ead193121ed9b9b6977d4be10f597f1b9c13d8`. Exact [PR CI34056243594](https://github.com/tubby124/truecolor-estimator/actions/runs/34056243594) and [main CI34056475514](https://github.com/tubby124/truecolor-estimator/actions/runs/34056475514) passed:1,425 unit tests,41 browser checks and all eight PostgreSQL16 SQL steps. Railway deployment `e3f758ca-5c31-408d-8b52-f389dd28c450` succeeded at that main commit after Wait for CI. At20:04UTC live health and canonical public tax rates passed, while anonymous posts, GBP status and monthly routes returned401. The final receipt is retained in PR46. This supersedes earlier statements that integration CI or the code merge is still pending.

Subsequent content-task releases through PR53 are on main `92ad027aec03f3fb1e39b39aacd316699824756f`, confirmed by fresh GitHub fetch. That task reports Railway `6c304df9-66b8-42ea-a440-0589b8084bfb` SUCCESS at22:21:52UTC with health200, anonymous monthly401 and required CI passed (1,462 unit tests/44 browser contracts). Those are task-owned deployment observations; they do not activate the database or scheduler.

At22:30:20UTC integration independently reread all six original Sunday destinations, database receipts and92 Facebook/99 Instagram provider entries. Four completed destinations each retained exactly one published receipt and one exact-caption provider match. The final pair remained approved and ready for September7 01:00UTC / September6 19:00Regina with zero receipts or provider matches. The separate earlier two-destination practice does not count toward these six. VPS timer remained active, state waiting and held=false. No dispatch, replay, queue change or provider write occurred during this reconciliation.

The latest owner clarification is to retain the direction and continue preparing the month for approval. It supersedes an earlier inferred blanket launch go-ahead. Integration has not applied SQL, changed runtime flags, installed/replaced a VPS runner, sent Telegram updates or approved/uploaded new month content during this preparation. The exact five-source migration package still matches current main byte-for-byte; its executable hash remains `070205267447f30f53707bf37313be89d8c0c78ae20dd869f8c28afd202fb9c5`. The configured Supabase connector denies project access. An existing authenticated dashboard was visually confirmed, but no query was entered or executed in this preparation.

Independent scheduler inspection found that the existing ongoing implementation lacks per-destination Telegram notification wiring and that generic service-exit monitoring cannot detect a successfully paused runner or a dead posting timer. Local preparation is adding a separate read-only monitoring path, durable notification acknowledgments and explicit scope checks; these are not installed or active. Exact new-month media/copy/account/date approval, applicable SQL approval, schema readback, all-six pilot reconciliation, verified notification receipts and one canonical posting trigger remain rollout requirements. October is outside the September preparation scope.


## Final September approval and production schema application

The launch task subsequently relayed the owner's explicit approval of the final24 September7–30creatives and48Meta destinations after thev3review. This supersedes the earlier preparation-only checkpoint above. Integration accepted the final-calendar/combined-package approval context and retained sole SQL/config/VPS ownership; the launch task owns new month uploads, draft saves and approvals. October remains outside the scope.

Authenticated dashboard preflight confirmed exact project `dczbgraekmzirxknjvwe`, PostgreSQL17.6, the privately verified owner, tax configuration row, eight existing approved rows, no existing social_businesses table and zero orphan campaign/receipt references. Source hashes matched current main92ad027a. The complete editor document was copied back and byte-compared to the reviewed35,661-character executable before execution, retaining SHA256 `070205267447f30f53707bf37313be89d8c0c78ae20dd869f8c28afd202fb9c5`.

At approximately22:53UTC the exact transaction succeeded. Its final guard verified equality of every original field of all eight approved posts before commit. Fresh SQL readback confirmed the True Color business, verified operator membership, `pst20_20260906`, all14newtables with RLS enabled and zero SELECT grants to anon/authenticated roles. Independent REST probes now return200 for the business, member, batch and generation tables. This is schema application evidence, not new-month publication or scheduler activation. An earlier read-only editor replacement produced a syntax error; no mutation was involved, and full-document clipboard equality was used for the successful preflight and exact migration.

Business feature configuration deployment is the next step. The exact-scoped ongoing runner and separate Telegram monitor remain uninstalled;41Python and21APItests, strictTypeScript/scopedESLint and independent review pass. See [monitor preparation](ONGOING-MONITOR-PREPARATION-20260906.md). Preserve the current posting trigger until all six Sunday destinations are independently reconciled and the final approved September IDs are saved/read back.

At22:59UTC configuration deployment `a95cfba7-35d9-48a3-8d9f-0c71d2e58797` succeeded at92ad027a with business scoping enabled. The authenticated monthly workspace rendered its import/save/resume controls without activation error. Integration handed `BUSINESS_READY` and the verified business ID privately to the launch task, which retains sole new-month upload/save/approval ownership. At23:00UTC health200 and canonical GST5%/PST6%/rush40 readback passed using the application's documented product User-Agent. The default Python User-Agent was rejected by the existing edge rule; this was not an application failure.

At22:54:48UTC the first four original Sunday deliveries still had one receipt and exact provider match each; the final pair remained ready, approved and unmatched. VPS journal ticks at22:57–22:58UTC continued successfully after configuration deployment. New scripts/units were staged under a separate temporary release directory only. All41Python tests passed on Linux; `systemd-analyze verify` accepted the new units, with one unrelated pre-existing Hermes unit escape warning. No installed posting service, timer, script, config or Telegram journal changed. Actual service directory/capability access, real notification receipt and final pilot cutover remain rollout checks.

PR55's initial exact75bbbcea CI passed before the separate branding/documents PR54 merged. Integration incorporated PR54/mainbc143104 without conflict, preserving its content row and scripts. Final PR55 checks must pass on the refreshed combined head before merge/deployment.


## Fresh-chat handoff — September 6, 23:22 UTC

The owner explicitly confirmed all September launch approvals and requested completion in a fresh chat: preserve tonight's 7 p.m. Regina pair, continue the approved September schedule from the next day, update Git, and retain reusable AISA collaboration learnings. This supersedes earlier preparation-only or missing-approval statements. The approved scope is 24 creatives / 48 Facebook and Instagram destinations for September 7–30. October remains unscheduled.

PR [55](https://github.com/tubby124/truecolor-estimator/pull/55) merged as `03c222bed13f1d8379992f7a0408a6629c577f68`. Required PR CI and main CI passed (1,467 unit tests, 44 browser contracts and all eight SQL checks). Railway deployment `30d4cd70-4fb4-4b12-8fef-adfc496523f8` succeeded at that commit; 23:14 UTC health, public tax and anonymous-authentication checks passed. The production database and business feature are already active. Do not reapply the migration package or request the same approval again.

Independent 23:22 UTC readback found four original Sunday destinations posted, each with exactly one published receipt and exact provider match. The final Facebook/Instagram pair remains approved and ready for September 7 at 01:00 UTC (September 6 at 7 p.m. Regina), with no receipts or provider matches yet. The existing VPS posting timer is active. Preserve its installed pilot configuration and journal until all six destinations are independently reconciled; the earlier practice pair is separate.

The launch task owns the 24 uploaded images, 48 saved destination drafts and their in-app approvals. A pricing-source fingerprint mismatch was traced to a different local public build flag: all 46 bound rows have unchanged factual claims, but the global fingerprint includes the sticker-pricing flag even for these non-sticker products. Five source files and six CSV tables matched production byte-for-byte, and the deployed compiled flag was verified. A private, exact-row fingerprint-only refresh map is ready for the launch task. Refresh through the normal authenticated update endpoint, preserve approved content/media/times, then reload the normal approval checks. Never clear the fact binding or bypass the guard. User approval and persisted application approval are separate evidence.

The scoped ongoing runner and independent Telegram monitor are merged and tested, but their VPS installation and activation remain outstanding. Forty-one Python tests passed on Linux; unit validation and a hardened service-access probe passed. One clearly labeled Telegram setup diagnostic received an acknowledged message ID. That diagnostic proves the secured notification path, not installation or social publication. Candidate files remain staged separately; the current pilot service is unchanged.

The local operational successor must read the current private launch continuation and activation receipt, coordinate with the launch task before writing any drafts, finish the 48 normal app approvals, and reread the exact approved scope. After tonight's pair is reconciled, follow the [ongoing rollout runbook](ONGOING-MONITOR-PREPARATION-20260906.md): install matching app/VPS scope, preserve all journals, retain one posting timer, initialize the independent monitor once, and verify the first new delivery with actual provider links and duplicate checks. Cloud tasks do not automatically have the private files or authenticated sessions. This handoff does not itself schedule a Codex wakeup or create a new chat.
