# True Color — shared instructions for local and Cloud Codex

Start with [docs/TRUE-COLOR-INDEX.md](docs/TRUE-COLOR-INDEX.md), then [current state](docs/operations/CURRENT-STATE.md). This repository, `tubby124/truecolor-estimator`, is the canonical implementation and sanitized operational work home. The legacy `tubby12555/true-color` Cloud environment is a different project; do not use it for this application.

## Start and finish every task

1. Verify branch, HEAD, working tree and latest relevant source. Preserve unrelated work; use a task branch/worktree. Read the lane's dated evidence and open gates. A dated status note is not live evidence.
2. Bound the task and use existing scripts/patterns. Resolve ordinary reversible decisions autonomously. For independent substantial work, parallel agents may have distinct file ownership.
3. Run the smallest meaningful checks. `bash scripts/codex/check.sh` validates project records. App changes additionally run the appropriate tests and the CI gates; see the Cloud playbook. Do not invoke production helpers just to test setup.
4. Before finishing, update the affected current-state lane, growth row or repo runbook with what changed, evidence/date, remaining limitation and next action. Update the migration/source registry only if sources move. Do this as part of completion: Hasan should not need to ask to update the Vault.
5. Keep accepted state on GitHub via a reviewed PR/merge when authorized. A local file, commit or passing test does not prove publication, deployment, email delivery or a live link. Report exact verification limits. Do not maintain a duplicate live queue in the Vault.

## Source order and privacy

- User instructions and explicit current authorization take precedence. Then these shared instructions, current lane policies, implementation/CSV truth and dated evidence. Historical reference material supplies context, not present truth.
- This repository is PUBLIC. Commit only public business facts, sanitized plans/status, source labels and non-sensitive code. Never copy raw mail, Gmail IDs, customer orders/artwork, finance/HR records, private account exports, credentials or access-bearing links. Private source retrieval happens in an authorized local/operational session; hand back a sanitized result.
- Cloud does not automatically share local files, logged-in browser sessions, Vault, Gmail or Hermes access. Use the [source registry](docs/operations/SOURCE-REGISTRY.md). No production secrets in the default Cloud environment.
- Do not rely on Claude `@` imports, local hooks or missing slash commands executing in Cloud. Open relevant repository rules explicitly. When a named skill is unavailable, apply its documented checks using available tools; report any verification that cannot be completed.

## Domain checks

- Identity: True Color Display Printing Ltd.; 216 33rd St W (upstairs), Saskatoon SK S7L 0V1; 306-954-8688; info@true-color.ca; https://truecolorprinting.ca/. Do not invent suite numbers, partnerships or equipment capabilities.
- Prices and business rules come from `data/tables/*.csv` and the current pricing implementation; never copy dated prices from this instruction or historical notes. Engine stays pure; no new packages without owner approval. Read `.claude/rules/truecolor-pricing-safety.md` and `.claude/rules/truecolor-pricing-comms.md` for pricing work; validate pricing and cart/order/tax parity.
- Payments/auth: read `.claude/rules/truecolor-security.md`, `payment-tax.md` and `lifecycle-rollup-contract.md`. Use server-side staff authorization on staff APIs; never expose service clients/secrets to browsers. UI session access is not server authorization. Verify GST/PST and exempt components against current implementation; preserve signature checks, idempotency and payment evidence.
- SEO: [SEO-STANDARD.md](docs/operations/SEO-STANDARD.md) controls current experiments and supersedes older broad wave recipes. Read `.claude/rules/seo-protected-pages.md` for affected routes, with live/date verification. Never infer rankings from historical assertions. Log SEO work in the repo's `memory/seo-sprints.md` or the affected experiment runbook, not an inaccessible home-directory file.
- Ads: read `.claude/rules/google-ads-copy.md`, `docs/paid-search/approved-claims.mjs` and campaign config before copy/keyword work. Never resume campaigns or widen spend from a stale plan.
- Brand/content: read `.claude/rules/brand-voice.md`, `content-pipeline.md` and `content-formats.md` when relevant. Customer communication and public publishing require explicit authorization; research alone is not consent to send.

## Owner authorization and release

Hasan owns `tubby124/truecolor-estimator`. Pushes, PR merges/squashes and Railway redeploys within the requested task are pre-authorized. Preserve hooks/history, stage named files, and satisfy CI. Deletion, force-pushing, spending and outbound customer communications are not implicit in a code task. True Color production database migration approval is not inferred from permissions for other Supabase projects.

Main triggers Railway deployment. Use PR checks, preserve Wait for CI, then verify deployment if runtime changed. Documentation/setup-only work needs records/script checks plus required PR CI; do not create customer orders or send test mail to satisfy a generic historical e2e instruction.

## Useful commands

- Setup: `bash scripts/codex/setup.sh`
- Records/status: `bash scripts/codex/check.sh`
- Application checks: `bash scripts/codex/check.sh --full`
- Full required CI: `.github/workflows/lint-test.yml`, including PostgreSQL and Playwright contracts.
- Stack/package versions: `package.json` and lockfile (not historical prose).

[Historical architecture reference](docs/operations/LEGACY-AGENT-REFERENCE.md) preserves previous instructions for lookup. It does not override this file.
