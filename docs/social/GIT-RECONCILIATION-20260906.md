# Git reconciliation — September 6, 2026

## Verified scope

Read-only GitHub and local-branch audit of `tubby124/truecolor-estimator`, plus the related AISA roadmap PRs. This is not an audit of every repository on the owner's GitHub account. No old branch or worktree was deleted, and no old proposal was merged.

True Color origin/main was fetched and verified at `be0245a6d090b5112eb07c44e89cd04cc83e3cfa`. The canonical local main checkout was clean and five commits behind, with zero unique commits. It was safely fast-forwarded to that exact origin/main commit; no reset, stash or force operation was used.

## Recent social work is merged

| PR | Result |
| --- | --- |
| [32](https://github.com/tubby124/truecolor-estimator/pull/32) | Approval pilot merged |
| [33](https://github.com/tubby124/truecolor-estimator/pull/33) | Connection runbook merged |
| [34](https://github.com/tubby124/truecolor-estimator/pull/34) | Verified connection and roadmap merged |
| [35](https://github.com/tubby124/truecolor-estimator/pull/35) | Private library and automation plan merged |
| [36](https://github.com/tubby124/truecolor-estimator/pull/36) | Library deployment receipt merged |

PRs 35 and 36 independently showed passing lint-test, PostgreSQL regression and GitGuardian checks. Their production-smoke jobs were skipped, so CI itself does not prove authenticated production use. Runtime evidence remains in the asset-library receipt.

AISA roadmap PRs [12](https://github.com/tubby124/ai-survival-academy/pull/12) and [13](https://github.com/tubby124/ai-survival-academy/pull/13) are merged. A retried live open-PR query returned zero AISA open PRs. An earlier request timed out with HTTP 504; the successful retry supersedes that retrieval failure.

## Legacy True Color PR disposition

[PR 9](https://github.com/tubby124/truecolor-estimator/pull/9), the June 19 sticker FAQ/SearchAction proposal, was open and conflicting during the audit. It is now closed as superseded; its branch and history are retained. Its old passing checks were not current merge validation.

Its SearchAction proposal targets `/quote?q=`, while current main already has a SearchAction targeting `/products?q=`. Its sticker price copy also differs from current main, and its dated SEO release evidence does not establish a current release gate. Any future work requires a fresh narrowly scoped proposal supported by current pricing and SEO evidence. The stale branch was not merged.

## Local leftovers are not all missing work

At the initial snapshot there were 56 local branches and 19 worktrees. Sixteen branch tips were already ancestors of main. Many other branch tips have explicit merged squash PR receipts: Git can report them as ahead because squashing changes commit identities. Ahead counts alone do not prove missing work. This count predates creation of the new dual-social pilot worktree.

Two worktrees had visible uncommitted work:

- `codex/ppc-recovery-20260810`: roughly 80 status entries across ads, consent, analytics, orders/payment paths, SEO and migrations on a substantially old base. Preserve; compare against current implementations before any salvage.
- `codex/merchant-pickup-policy-20260902`: six status entries spanning terms, footer, business information, a plan, returns and shipping routes. Preserve; reconcile against the already merged Merchant implementation and current business policy.

Several worktrees under the older Documents work area timed out during bounded status reads: attribution, guard, printer-facts, wave1, cloud-home and history-context. Their cleanliness is unverified; no cleanup is safe on that evidence. Git commit objects remained readable from the current repository.

The following older local commit sets deserve a content-level follow-up audit. Their patches are not exact matches to main, but later changes may have superseded them; this audit does not label them ready to merge:

| Branch suffix | Unique commits | Area |
| --- | ---: | --- |
| search-safety-attribution-20260813 | 5 | Attribution and refund reporting, database migrations |
| search-safety-feed-20260813 | 3 | Merchant feed parity |
| search-safety-guard-20260813 | 3 | SEO validation and workflow rules |
| search-safety-printer-facts-20260813 | 2 | Equipment claims across many pages |
| ppc-followups-20260816 | 4 | Ads drift reporting, mobile call UI, tests |
| google-ads-outbox-null-guard | 1 | Additional local SEO control-plane commit after its earlier PR |

History-context and library-deployment-receipt local commits were also verified as patch-equivalent to main. Recent social-roadmap branches have explicit merged PR receipts even where individual patch matching does not identify a multi-commit squash.

## Remaining reconciliation

Keep social pilot delivery separate from recovery of old ads, payment and SEO work. Audit each candidate against current main, preserve any genuinely missing useful change on a fresh branch, run its current checks, then merge only that reviewed change. Do not delete dirty or unreadable worktrees. Branch deletion is housekeeping, not a prerequisite for a working social system.

## Follow-up: semantic comparison of older candidates

| Candidate | Current assessment | Disposition |
|---|---|---|
| Merchant feed | Superseded by canonical Merchant catalog, fixed-domain and verified local-offer implementation | Do not merge the older broad allowlist |
| Attribution | Current main captures landing paths and diagnostics; older SQL funnel additionally proposes priced/won/paid cohorts and refund-adjusted pretax reporting | Preserve reporting idea for fresh schema/business review, no old migration application |
| SEO safety guard | Search-surface registry, base-SHA and freshness validation concepts are not in main | Rebuild narrowly under current SEO standard; avoid competing old workflow/rules |
| Printer facts | Older branch changes VG2 to VG-640; current business record and September 2 audit say VG2 | Resolve factual source first; do not mass-change pages |
| PPC followups | Audience-observation and price-asset drift checks are not in current sync-plan diagnostics | Preserve diagnostics for isolated implementation; no campaign changes |
| Outbox branch extra SEO commit | Flyer experiment is stale relative to current title; manifest validation overlaps SEO guard proposal | Do not replay experiment; consolidate guard concepts in a fresh design |

These are targeted comparisons, not a certification of every old branch or dirty worktree. Useful ideas are preserved without importing unrelated production changes into the social pilot.

## Dual-platform extension receipt

[PR 37](https://github.com/tubby124/truecolor-estimator/pull/37) merged at `3ed6862b16cb18ddfeec6787bbfe47ee14cd955c` after full CI and security checks passed. Independent review reported no high or critical findings. Code deployment subsequently reported SUCCESS; the provider credential grants were verified separately. The credential-configuration deployment was still building. Exact receipts and remaining delivery gates are recorded in the practice receipt.
