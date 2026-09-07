# Efficient social launch operations

Use the [current-state board](../operations/CURRENT-STATE.md) and latest private launch receipt before acting. This is the repeatable operating procedure; dated launch outcomes remain in the [integration record](INTEGRATION-20260906.md). It does not authorize a new calendar or publish an unapproved batch.

## Prefer authenticated APIs for bulk operations

The September 6 continuation verified that the existing staff sign-in and normal application endpoints can complete bulk draft updates and approvals without browser automation. The successful operator used the existing secured staff credential with Supabase SSR, held session cookies only in process memory, and sent them only to the canonical application. No service-role database write substituted for staff approval.

Use the browser for visual review, a required interactive login, or a provider-only interface. Do not spend a launch session repeatedly opening developer tools, injecting bookmarklets, or clicking dozens of equivalent approval controls when the authenticated application API is available. An unavailable browser connector is not evidence that the app API is unavailable.

The current endpoint sequence is:

| Operation | Normal authenticated endpoint | Required check |
| --- | --- | --- |
| Read the saved draft | `GET /api/staff/social/posts/<id>` | Exact batch, business, ID, content, media, configuration and current state match the approved package. |
| Correct an approved field | `PATCH /api/staff/social/posts/<id>` | Send only the intended changed field; compare preserved fields afterward. Edits invalidate approval. |
| Obtain current review | `GET /api/staff/social/posts/<id>/approval` | Zero blockers, verified media hash, correct destination and schedule. |
| Persist owner-authorized approval | `POST /api/staff/social/posts/<id>/approval` | Send the returned review fingerprint and `rightsConfirmed: true`; read back `ready`, approval hash, media hash, target and timestamp. |

Read the current route implementation before using this contract. Keep credentials, cookies, raw private content and exact operational account IDs out of Git and console output. Do not invent staff credentials, mint a privileged replacement session, clear fact bindings, or write approval columns directly to bypass validation. Existing private continuation scripts demonstrate this authenticated path; locate them through the current private handoff rather than copying credentials into a new tool.

## Finish the calendar before approving it

1. Settle the final media, captions, destination accounts and civil dates/times once. Carry existing explicit owner approval through the task; do not ask again for unchanged approved content.
2. Interpret a calendar date in `America/Regina` first, then convert the final local time to UTC. An evening local post may have the following UTC date. Slicing a stored UTC timestamp to choose a new morning date can create duplicate days and gaps.
3. Check the calendar as a whole: exactly the intended local dates, one creative per intended date, and one destination per intended platform. Compare uploaded media bytes, captions and configuration with the final package.
4. Save all intended changes, check normal reviews, then approve. If the owner changes times afterward, update only those times and reapprove affected rows. Preserve the original calendar and mark old previews superseded.

In the September continuation, the owner changed the calendar after the first approval pass. The final readback verified 24 consecutive Regina dates and 48 ready, approved destinations with unchanged media and captions. A UTC-date rollover error during the intermediate edit was caught and corrected before any affected delivery was due. Validate this invariant before writing next time.

## Resume receipts instead of replaying work

- Establish one writer for draft, approval and runner changes. Read current state and compare exact IDs before doing anything; an old handoff is a pointer, not current truth.
- Write a private receipt after each confirmed mutation. If a request times out, read the affected row before deciding whether anything remains to do. Never replay an uncertain provider dispatch to obtain a success message.
- A preflight should classify rows as unchanged, already complete, needing the exact authorized update, or requiring investigation. Skip completed rows; do not regenerate or reupload an existing approved package.
- Match deployed source files, pricing tables **and compiled public feature flags** before generating fact fingerprints. A runtime environment value alone does not prove the compiled flag. A fingerprint-only repair needs evidence that the full relevant facts are unchanged.
- Keep approval, configured app scope, installed VPS runner, active timer, Telegram acknowledgment and independently verified public delivery as separate receipt fields.

## Treat future steps and Git checks explicitly

Preserve the existing pilot until its required reconciliation is complete. Prepare the exact new scope in advance, and schedule the necessary follow-up on the existing task when the publication slot is still future. A local Codex follow-up requires the local app to run; it is not a VPS service or a cloud wakeup. After a verified cutover, the installed VPS runner owns ordinary timed posting. Do not create a second broad publishing timer.

Before merging, inspect required checks for the exact head and wait for success. `gh pr merge --auto` does not guarantee a wait when repository protection does not enforce the pending checks. The September documentation merge demonstrated this behavior; do not rely on the flag as a substitute for checking CI. Keep runtime verification separate when a merged commit triggers deployment.

At completion, update the existing operational handoff and sanitized Git record with the verified state, remaining future check and durable receipt locations. Capture a new reusable lesson in place; do not duplicate a project, regenerate its assets, or repeat an already-merged learning merely because a new task took over.

## Scheduler connection recovery and quiet delivery notices — September 7

The VPS runner checks the exact approved queue each minute. A failed read-only check is retried on the next tick without claiming or blocking publication. An empty queue never invokes the publishing endpoint. A real dispatch still writes its durable claim before transmission and holds an uncertain outcome; do not reset that claim without receipt/queue reconciliation. Error logs distinguish check failures from uncertain dispatch and retain the exception class and HTTP status without credentials.

The owner requested Telegram only when publication succeeds. The optional monitor setting `notificationMode: "posted_only"` sends one short platform/link confirmation per saved successful delivery. Existing receipt identities and notification acknowledgments are preserved so switching mode does not resend old posts. Operational problems remain recorded in the local monitor journal and service exit status; alerts and recovery chatter are not sent in this mode. The default remains `all` for other installations.

The September 7 incident exposed a broad exception handler and unnecessary publishing calls when no post was due. The old handler did not retain the underlying network error, so its precise cause is unknown. Live read-only reconciliation found today's two destinations posted, no pending/failed destinations, and no due or stale work before recovery. Regression coverage includes transient read failure then success, idle non-dispatch, remote holds, crash/uncertain dispatch protection and receipt-notification deduplication. Installation readback is recorded in the current-state board.
