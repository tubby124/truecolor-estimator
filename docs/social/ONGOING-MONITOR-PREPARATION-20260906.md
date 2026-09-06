# Exact-scope scheduler and Telegram monitor preparation — September 6, 2026

Implementation package; this document does not itself authorize or record activation. Root retains the latest owner authorization and exact September review in the private handoff. No destination allowlist is populated by this file, and no production mutation was performed by this implementation worker. The existing Sunday pilot and its notification journal remain unchanged. Root owns installation, SQL, configuration, provider reconciliation and activation.

## What the package does

The existing ongoing scheduler now requires 1–100 explicit destination UUIDs, in addition to the business and feature flags. The app reads every allowlisted row within that business and fails closed if any row is missing. Dispatch selection and stale-approval resets stay within the exact allowlist. This accommodates the proposed 48 Meta destinations without including another month, another batch, historical failures or unrelated business posts. New approvals outside the configured IDs cannot silently expand dispatch. Replacing the allowlist requires a new reviewed scope and deliberate journal reconciliation.

The sole posting runner writes `ongoing-heartbeat.json` with start/completion timestamps and its exit status, separately from the durable `ongoing-state.json` dispatch journal. Check mode never writes either journal. Existing pilot configuration, `state.json`, `notifications.json`, provider calls and Telegram behavior are preserved.

The separate monitor makes only authenticated `mode=check` and `mode=receipts` HTTP requests. It never dispatches, clears a hold, resets a post, or writes the runner's state. Each cycle rereads the allowlisted delivery states so an earlier `posting` row can later produce its `posted` update even after an HTTP acknowledgment was lost. The endpoint emits only destination ID, platform, saved status, canonical UTC schedule and a validated stored public URL; no captions, credentials or arbitrary provider responses.

Telegram wording identifies saved delivery state. Only saved `posted` rows can include a validated corresponding platform URL. An accepted HTTP dispatch or a Telegram acknowledgment is not independent provider/public-link verification; the release coordinator retains that reconciliation responsibility.

## Files and interfaces

- `src/app/api/cron/social-scheduler/route.ts`: scoped dispatch, read-only oldest-due status and delivery-state endpoint.
- `scripts/social/vps-scheduler.py`: unchanged pilot path; exact-scope ongoing path plus durable tick evidence.
- `scripts/social/vps-monitor.py`: independent read-only monitor and sole **ongoing** Telegram sender.
- `scripts/social/systemd/truecolor-social-ongoing.conf`: future drop-in for the existing posting service. It does not add a second posting timer.
- `scripts/social/systemd/truecolor-social-monitor.{service,timer}`: separate two-minute read-only monitoring service and timer.

App activation requires all of:

```text
SOCIAL_BUSINESS_SCOPING_ENABLED=true
SOCIAL_ONGOING_SCHEDULER_ENABLED=true
SOCIAL_ONGOING_BUSINESS_ID=<verified business UUID>
SOCIAL_ONGOING_POST_IDS=<comma-separated exact approved lowercase destination UUIDs>
```

`SOCIAL_PUBLISHING_ENABLED` remains the independent publication pause. Empty/missing/duplicate/malformed destination lists fail closed. Configuring a business without an exact list no longer enables the ongoing runner. Provider/service-role credentials stay in the app, never on the VPS.

Future `/etc/truecolor-social/ongoing.json` has exactly these keys; placeholders below are deliberately **not an executable configuration**:

```json
{"runner":"ongoing","businessId":"<verified UUID>","postIds":["<exact approved destination UUID>"],"enabled":false,"pilotReconciled":true}
```

`pilotReconciled=true` must be backed by the release coordinator's actual six-destination reconciliation. `postIds` and the app allowlist must agree. The request scope is SHA-256 of the sorted, comma-joined lowercase IDs; ordering alone does not change scope. Every request sends `runner=ongoing&businessId=...&scope=...`.

Future `/etc/truecolor-social/monitor.json` has exactly:

```json
{"businessId":"<same verified UUID>","enabled":false,"expectPublishing":false,"receiptSince":"2026-09-07T06:00:00.000Z"}
```

The illustrated receipt boundary is midnight September 7 in Regina, not approval of that date. Set it from the eventual reviewed launch. Leave monitoring disabled during preparation. Disabled monitoring sends nothing, including historical receipts. Enable it only when rollout actually expects the runner; future posts alone do not trigger a due alert. For a deliberate publishing pause, `expectPublishing=false` suppresses the unexpected-pause alert, but approved work becoming due still alerts.

Read-only HTTP interfaces:

```text
/api/cron/social-scheduler?runner=ongoing&businessId=<UUID>&scope=<digest>&mode=check
/api/cron/social-scheduler?runner=ongoing&businessId=<UUID>&scope=<digest>&mode=receipts&since=<canonical UTC>&after=<optional last UUID>
```

The same cron credential authenticates these requests. Unknown/duplicate parameters, scope mismatch, inactive business configuration and DB read failures fail closed. Receipt reads are bounded and repeat each cycle; they do not permanently advance past unfinished deliveries.

## Notification and monitoring guarantees

- `monitor-state.json` is business/scope-bound and protected by `monitor.lock` in a separate directory. `--initialize` creates its permanent `initialized.json` marker and initial journal without network calls. Reinitialization, missing existing state, corrupt state or changed scope fails closed. Never delete the marker to bypass reconciliation.
- Every new notification event is committed as pending. Its state becomes `in_flight` **before** Telegram is called. A positive integer Telegram message ID is stored with `acknowledged` only after the confirmed response. Timeout, malformed response, process death or lost acknowledgment leaves `uncertain`/`in_flight`; that event is never automatically resent. Confirm delivery with the secured channel before any manual disposition. Do not mark an uncertain event pending to force retry.
- Up to four previously unattempted events are sent per cycle. An uncertain event does not prevent distinct subsequent delivery/health updates. Nonzero monitor status exposes remaining pending/uncertain work. Messages include the original observation timestamp; delayed messages are not presented as fresh observations.
- Alerts cover inactive posting timer, runner configuration unexpectedly disabled, held dispatch journal, failed runner completion, missing/stale heartbeat beyond ten minutes, unexpected publishing pause, due work during a pause, ready work over fifteen minutes late, stale approvals and failed/unresolved deliveries. Read failures alert without inventing recovery of previously observed problems.
- Unchanged conditions are quiet; changed conditions and confirmed recovery create new events. A publishing pause and a stopped timer are distinct conditions. The runner's existing one-hour late hold/reapproval policy is unchanged.
- The independent monitor detects a dead **posting timer on this VPS**. It cannot report loss of the entire VPS, its own timer, or its Telegram/network path. Whole-host outage detection still requires an independently hosted monitor; none is installed by this package. App cron heartbeat storage is best effort and is not the monitor's only clock.

## Future rollout — root only, after final exact approval

1. Complete the approved schema package and exact destination saves/approvals. Read back the reviewed ID list, saved media/caption/time bindings, intended Meta accounts and all-six pilot reconciliation. Leave October unscheduled.
2. Review the app allowlist and matching disabled ongoing config. Preserve the old pilot script/config/state and notification history. Install the new script files and configuration with protected permissions; reuse only the three existing systemd credentials.
3. Install the ongoing drop-in under `truecolor-social.service.d/ongoing.conf`. Keep the existing `truecolor-social.timer` as the only posting timer. The new monitor service has no dependency on the posting timer and no mutation command. Do not reenable an old broad trigger.
4. Create `/var/lib/truecolor-social-monitor` mode 0700 and, under umask 0077, run the monitor with `--initialize` once. Initialization is local only. Existing journals must be reconciled/archived deliberately; initialization must not be used to replay historical notices.
5. Install and inspect the hardened monitor unit/timer. The monitor runs with read-search capability to read the existing DynamicUser-owned runner journal, with runner paths explicitly read-only and only its own state directory writable. Linux `systemd-analyze verify` and actual state-directory access are required before activation; they were not proved on macOS.
6. Verify exact-scope read-only API responses, script hashes, configured publication pause, one posting timer, independent monitor timer and both durable directories. Enable the monitor's expectations and posting configuration only when the root has final launch authority. Verify a separately authorized safe Telegram diagnostic acknowledgment and timer/paused recovery evidence before relying on alerts.
7. Retain actual provider/DB/permalink/no-duplicate reconciliation of the first new delivery. Installed timers, saved approvals and successful tests are not delivery proof.

Recovery: pause publication/ongoing activation while preserving exact business scoping and all receipts. The monitor never clears `in_flight`, `blocked` or uncertain notification events. After independent reconciliation, archive evidence before deliberate replacement of configuration/journals. Do not reset posting states or replay provider calls to obtain a green check.

## Local checks

CI's existing Python discovery command includes both pilot and new monitor tests in `test_vps_scheduler.py`. Focused Vitest covers exact ID/business scope, missing rows, stale update bounds, read-only receipt output and timestamp normalization. Local checks also include strict TypeScript, scoped ESLint and diff validation. Verified locally: 41 Python tests and 21 focused API tests pass; full strict TypeScript, scoped ESLint and diff whitespace checks pass. No network/provider/Telegram sends are used by these tests. `systemd-analyze` is unavailable on this macOS host; Linux unit verification and service access remain rollout checks.

Root Linux follow-up:41Python tests passed against staged candidate files on the existing VPS, and `systemd-analyze verify` accepted the monitor service/timer (an unrelated existing Hermes unit produced an escape warning). This closes static Linux syntax/test verification only. The candidate is staged outside installed service paths; actual hardened service access, initialization, Telegram acknowledgment and activation remain unverified.
