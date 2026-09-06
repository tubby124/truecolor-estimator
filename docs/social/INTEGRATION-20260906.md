# Pricing and social integration — September 6, 2026

The [migration release package](MIGRATION-RELEASE-20260906.md) records the five-file order and production approval boundary.

Coordinator task: `01a077f8-3952-7a32-976f-e79bb7844a28`. The [approved handoff](IMPLEMENTATION-HANDOFF-20260906.md) defines scope; this record tracks integration and release evidence. Implementation authorization does not approve new public content, customer communications or production database migrations.

## Shared work and dependencies

| Lane | Task | Contract and release dependency | Evidence |
|---|---|---|---|
| Pricing / P | `01a077f7-0c52-7db1-a85d-0c7323e90b7c` | Server-only `resolveProductFacts` owns configuration, engine totals, order minimum, allowed claims and source fingerprint. Preserve negotiated and issued snapshots. | Reviewed PR [49](https://github.com/tubby124/truecolor-estimator/pull/49), exact-lock source tests/build passed; CI pending. Merge first. Tax SQL requires production approval. |
| Google, business isolation and monthly publishing / G | `01a077f7-4219-7c22-ae5e-22eea830acec` | `requireSocialBusiness(req?)` supplies authorized business context. `SOCIAL_BUSINESS_SCOPING_ENABLED` defaults off, preserving legacy schema and already-approved Meta deliveries. Shared platform name is `gbp`; approval field is `fact_fingerprint`. | Reviewed PR [48](https://github.com/tubby124/truecolor-estimator/pull/48); 1,340 source tests and 40 built browser contracts passed locally. Live-schema followup `3b425be4`; final CI pending. |
| Catalogue-backed generation / C | `01a077f7-7ba0-7fe1-89cd-d4953bee2f03` | Uses P facts and G business context. New durable jobs require business migration followed by generation migration. Legacy on-demand compatibility stays explicit during rollout. | Reviewed PR [47](https://github.com/tubby124/truecolor-estimator/pull/47), exact head `ff664963` CI passed. Selected channels, deterministic source-backed price text and editable usage ceiling. |
| Integration | This task | Owns shared CI workflow, this record, current-state board/index and merge sequence. | Documentation PR [45](https://github.com/tubby124/truecolor-estimator/pull/45) merged at `d081d062` after exact-head CI passed. Isolated integration branch starts there. |

Shared-file changes must be coordinated. Lane owners supply reviewed PRs, exact test commands and their own runbooks. Integration adds SQL/browser commands to required CI and reviews the combined result. No lane independently activates production features or repeats successful posts.

## Acceptance and release checklist

| Area | Required evidence | Current status |
|---|---|---|
| Pricing | Cross-surface cents, tax classes, order minimum, manual provenance, revision and Wave amount parity; immutable issued history | Independent lane review approved; 1,287 exact-lock source tests and build passed. Final CI/integration pending. |
| Facts and generation | Single source fingerprint; unchanged rerun without provider call; item-local invalidation; partial resume; bounded retries/usage; ambiguity held | Pending lane tests/review |
| Two-business isolation | Authorized routes, assets, jobs, credentials, approval targets and receipts; two synthetic businesses | Combined disposable SQL passes for generation/business FKs and post/job references; full lane route/assets tests pending. No real second client. |
| Monthly approval and delivery | Exact media/copy/account/time/facts binding; stable creative IDs; paginated review; missed-schedule hold; per-platform receipts | Pending lane tests/browser contracts |
| Migration package | Ordered SQL, review, disposable regression, backfill impact, rollback and activation instructions | Prepare before requesting missing production approval |
| Git and CI | Reviewed intended files, required exact-head checks, P before dependent lanes | PR45 complete; lane PRs pending |
| Deployment | Main CI, actual Railway deployment/commit and read-only runtime behavior | Baseline `40868735` deployment reported SUCCESS at takeover; no new runtime release verified |
| Provider setup | Google credentials/access, actual listing/history and live connection health | 18:40 UTC protected config confirms only client ID; secret, redirect URI and encryption key absent. OpenRouter key present; no paid test call. |
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

`tests` are synthetic: `scripts/social/sql/integration-regression.sql` assembles the actual approval, business, monthly, generation and integration migrations in one disposable PostgreSQL transaction. PostgreSQL18.4 execution passed, including repeat integration migration, preserved approved legacy snapshot, same-business generation-to-monthly-draft handoff, stable chunk replay without another generation charge, nonexistent/cross-business rejection and denied browser reads. Independent database review found no migration correctness issue; its missing-row preservation-test finding was fixed with a left join and the test reran successfully. GitHub PostgreSQL16 execution remains pending. No production schema was changed.

At 18:40:54 UTC, protected configuration showed `SOCIAL_BUSINESS_SCOPING_ENABLED=false`; REST limit-zero probes for `social_businesses`, `social_batches`, `social_generation_jobs` and `social_generation_settings` returned 404/PGRST205. This proves unavailability in the current REST schema cache, not direct SQL absence.


## Second Sunday pair and production schema preflight

At **19:00:40 UTC**, the 13:00 Regina pair was independently confirmed: [Instagram](https://www.instagram.com/p/Dc9PLsrmPCW/) at19:00:17UTC and [Facebook](https://www.facebook.com/122234777786295517/posts/122234849312295517) at19:00:20UTC. Each has one exact-caption provider match and one published receipt. The first pair still has exactly one matching delivery each. Only the September7 01:00UTC pair remains ready with no receipt or matching provider post. No dispatch endpoint was called by integration.

Read-only SQL in the existing authenticated Supabase dashboard resolved the connector access limitation. Production is PostgreSQL17.6 (`170006`). No platform check constraints restrict `gbp`; OpenAPI confirms text[]/text platform fields. Current checks constrain status, post_type and post_number only. Required insert columns without defaults are accounts.platform, campaigns.slug/name and results.platform. Both orphan-count checks returned zero. Existing campaign slug uniqueness was global; G followup scopes it by business. The replacement campaign and receipt foreign keys preserve existing SET NULL and CASCADE behavior. One verified configured owner account was found through the protected auth admin read; its UUID is retained only in the private release package. No production schema was altered.

The combined disposable fixture now includes these actual legacy constraints plus a deliberately broad storage read policy. Restrictive social-storage policy blocks browser access to both social buckets while retaining access to an unrelated bucket; the full combined test passes.
