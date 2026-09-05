# True Color Cloud playbook

## Environment

Repository: `tubby124/truecolor-estimator`; name: **True Color — App & Growth**. The old `true-color` environment targets a different repository. Keep it for historical tasks; do not use it for current development.

- Universal Linux container; Node 20.19+ or compatible 22 LTS, matching package engine needs and CI.
- Setup: `bash scripts/codex/setup.sh` (locked npm dependencies).
- Maintenance: `bash scripts/codex/maintenance.sh`.
- Agent internet: off by default; setup has dependency-download access. Research uses a separately authorized browsing session and adds cited findings.
- No production secrets or privileged service integrations. Application checks use explicit non-production placeholders already used by CI.
- Start from main or the named task branch. Read root AGENTS.md and docs/TRUE-COLOR-INDEX.md.

## First smoke task

Read AGENTS.md and docs/TRUE-COLOR-INDEX.md. Run `bash scripts/codex/check.sh` and `npm run validate:pricing`. Report checkout SHA, current Merchant and backlink gates, and confirm no private-system access was needed. Do not edit application code, send mail, make purchases or mutate live systems. A successful task execution proves configured Cloud operation; a merely saved environment does not.

## Application verification

`bash scripts/codex/check.sh --full` runs local app checks without production credentials. Required PR CI additionally includes PostgreSQL regressions and Playwright contracts. A passing local test does not replace these or verify live payments. Use only the relevant checks for docs changes, and preserve required PR gates.

## Completion and handoff

Every task updates its corresponding shared state/runbook as part of completion. Commit changes on a named task branch, review, push/PR and merge within Hasan's standing authorization. Read live results for actual runtime changes. The owner need not ask to update Vault to preserve completed work. Vault/private system records are linked evidence and a front door to this repo, not another live backlog.

Do not automatically send follow-ups or alter settings because a queue row is pending. Preserve lane ownership. Status values must distinguish proposed/prepared, submitted/sent, published/serving, and independently verified outcomes.
