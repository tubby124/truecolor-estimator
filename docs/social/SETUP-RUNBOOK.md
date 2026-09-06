# Social setup: repeatable operator runbook

Updated September 5, 2026 (Regina). This is an operational record, not a claim of completed Instagram delivery. Pair with [approval pilot](APPROVAL-PILOT.md), [shop voice](SHOP-VOICE-RECIPE.md), and [real-estate adaptation](REAL-ESTATE-ADAPTATION.md).

## Current checkpoint

PR #32 merged at `4b39430125faa0bee10c85bc8eeff6a1e6267224`. The preceding task reports successful Railway deployment and authenticated staff review. Its exact approved production migration was applied with dashboard SQL readback. Fresh read-only Railway receipt at 2026-09-06 00:58:40 UTC confirms approval schema present, 12 drafts, zero ready/attempted/posted rows, zero active social accounts, publishing disabled, and all three Meta publisher variables absent. This is not a provider connection.

The owner-linked Instagram/Page and existing new publisher app were identified in the preceding task. Reuse that app; do not create another. The authenticated Business Suite system-user view loaded in this continuation. A dedicated employee user setup is being prepared; the owner reports accepting the required Meta policy certification. Creation was submitted once and remained loading; independent list readback is pending. No publisher credential has been created or installed in this continuation.

Local [interactive dry-run preview](DRY-RUN-PREVIEW.html) is versioned here for rebuilding. Open the file locally; it has no provider connection or production writes. Agent-reported browser checks passed for approval reset on caption edit, simulated success/failure, no JavaScript errors and mobile overflow.

## Fast setup order

1. Resolve the actual repository and task worktree; read AGENTS and the current-state lane. Check branch, HEAD, dirty paths and origin/main before changes.
2. Inventory the business portfolio, Page, Instagram identity, existing app use cases, existing system users and installed publisher variables. Keep account identifiers and credential custody in authorized operator state, not screenshots committed to this public repo.
3. Confirm app compatibility before following a login wizard. A Facebook Login-only legacy app did not expose the required Instagram use case in this session. A suitable publisher app already exists; return to it.
4. Verify Page/Instagram link and minimal content permissions. Keep the existing Conversions API identity isolated. Prepare a dedicated employee system user with only required app/Page/Instagram assets; obtain any mandatory provider certification/access confirmation at its exact final step.
5. Transfer any resulting credential directly to protected server configuration without chat, logs, clipboard dumps, Git or access-bearing URLs. Verify identity, granted scopes and asset assignment with provider reads. A token's presence alone is insufficient.
6. Run the read-only readiness script in the Railway-linked checkout, using an absolute script path if the script lives only in the task worktree. Do not call sync/publish/cron routes merely to test configuration.
7. Prepare one socially cleared JPEG and current caption, account and Regina schedule. Use the voice recipe. A synthetic preview demonstrates the experience but does not prove rights, database approval, scheduled delivery or a sent owner notification.
8. Capture exact content approval separately. Keep publishing paused until the approved pilot and hosted scheduler are verified. No old draft catch-up, blind retry or broad queue mutation.
9. Verify the public result independently, then prove phone-origin operation and Mac-asleep delivery. Only then extract common components for another business.

## Mistakes and recovery learned here

| Observed friction | Better next run | Evidence limit |
|---|---|---|
| Long browser work remained at a blank page | One reload, then a fresh tab using the known exact app/business URL; inspect screenshot and accessibility state | Fresh system-user tab loaded; blank does not mean permission denied |
| Browser actions sometimes returned unchanged state or noWindowsAvailable | Reacquire the app and use the exposed window Raise action; inspect current UI before retrying | Raising the existing window exposed the actual pending dialog |
| Escape dismissed the entire creation dialog | Do not use Escape to commit a custom role selector; click a neutral form label, reread role, then act | Employee role survived, but user creation was not completed |
| Task worktree was not Railway-linked | Run from the already linked canonical checkout with an absolute path to the task script | No need to relink services or copy credentials |
| Linked canonical checkout lacked the newly added readiness script | Verify revision and script location separately from Railway linkage | Absolute script path returned safe counts/booleans |
| Historical runbook still said migration/merge pending | Append a dated superseding receipt and link it prominently | Old evidence remains historical; local docs must not masquerade as current provider state |
| Infrastructure setup crowded out content review | Build the independent visual/voice dry run alongside provider work | Preview must stay explicitly simulated |
| Cross-business setup risks generic copy and mixed accounts | Separate shared workflow from identity, rights, facts, voice, credentials and destination | Real estate remains a separate implementation |

## Evidence handoff

After each meaningful checkpoint, update this file/current-state lane and the private AISA roadmap through named-file diffs and Git. Record exact result, revision, checks, remaining gate and recovery action. Do not turn undocumented trial-and-error into a claimed best practice. AISA owns the teaching sequence and original member-question source mapping; this public repository owns sanitized implementation instructions.


## September 5 continuation — provider setup and future scope

Owner reports creating the employee system user and assigning the intended Page, app and Instagram assets, then generating a token. Browser-control timeouts prevent independent asset readback. Do not create another user: inspect the existing identity first. Production readiness at September 6 01:34:39 UTC verifies Page ID configured, Instagram ID/token still absent, publishing explicitly false, all 12 posts still draft and zero active social-account rows. No publication attempted. Token handoff must go directly into protected Railway configuration; no credential belongs in Git or receipts.

[Future channels](FUTURE-CHANNELS.md) preserves paid Meta ads, replies and Google Business Profile posting as separate future builds. This plan does not enable those permissions, spend or outbound communication.
