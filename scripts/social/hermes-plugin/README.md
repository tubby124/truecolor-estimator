# Hermes Telegram social intake

This is a native Hermes plugin, not another Telegram bot process. It installs topic-scoped handlers through `ctx.register_telegram_handler` before Hermes core handlers. It never calls `getUpdates`, sets a webhook, or registers an LLM approval tool.

## Owner workflow

Send a JPEG, PNG or WebP photo directly in the configured True Color topic, optionally with a caption describing the work. Forwarded messages and other users/topics are ignored. The app proposes a free schedule date and returns an HTML review with Instagram/Facebook previews. The Telegram message links to that review and offers exact approval, date, caption and status controls.

Approval confirms the image rights plus the exact photo/captions/date fingerprint. It queues future publication through the normal scheduler; it never publishes immediately. Generic chat, “yes”, and replies to unrelated messages do not approve anything. Each button is bound to a stored preview message, topic, owner, revision and fingerprint, expires after 48 hours, and is checked against current server state. Following a transient approval error, a new explicit owner click can retry only after readback confirms the identical version remains in review. The app approval operation is atomic and idempotent; it does not dispatch to providers. Redelivery of the same Telegram callback never retries, and already-approved readback prevents another approval call. There are no automatic retries or repeating failure alerts. Schedule dates display in Regina time.

Use `/social status` to fetch the last saved preview. Use `/social retry` after a transient intake failure to retry the same deterministic photo request ID, without generating another request identity. No unbounded retries run. A held/preparing server request remains held by the app.

Reply **directly to a preview message** with:

* `date 2026-09-15 10:00` — Regina time, UTC−06:00; ISO timestamps with an explicit offset also work.
* `caption Your revised caption` — applies the text to both platforms and creates a fresh review.
* `status` — rereads that particular submission.

Conflicting dates return available alternatives. Date changes, caption changes and optional photo editing always require reviewing a new approval package.

## Installation (not performed by these source files)

Keep the canonical source in the application repo or copy the exact reviewed package into the ops repo. Install `plugin.yaml`, `__init__.py`, and `intake.py` together in `/root/.hermes/plugins/truecolor-social/`. The verified live runtime uses the default gateway for the configured True Color topic; do not start a competing truecolor profile gateway.

Write a private configuration file (mode 600), default `/root/.config/truecolor-social/telegram.json`, or set `TRUECOLOR_SOCIAL_CONFIG` to its path:

```json
{
  "api_url": "https://truecolorprinting.ca",
  "allowed_api_hosts": ["truecolorprinting.ca"],
  "bot_id": 123456789,
  "owner_id": 123456789,
  "chat_id": 123456789,
  "topic_id": 12345,
  "draft_secret_file": "/run/credentials/truecolor-social-draft",
  "approval_secret_file": "/run/credentials/truecolor-social-approval",
  "journal_path": "/var/lib/truecolor-social-telegram/state.db"
}
```

Replace the example `bot_id` with the existing default bot's public numeric ID, verified using its authenticated `getMe`. Every incoming message/callback is checked against this ID after Hermes initializes its bot; the plugin does not consume messages on other adapters. Use two different server-issued secrets in separate mode-600 files. Do not copy the Telegram bot token: downloads and messages use the existing adapter's authenticated bot. Do not put credentials into Hermes prompts, skill instructions, LLM tools, or committed config. The gateway process must be able to read these files; plugin-level separation is not an OS sandbox from a privileged shell tool.

The journal's parent directory must be mode 700. Original photographs are retained beneath it in a private `originals/` directory, and approval actions are persisted in SQLite before Telegram sending or API approval. Configure OS backups/retention for this private data separately. No public bucket or static HTML export is created by the plugin.

Add `truecolor-social` to `plugins.enabled` in the default Hermes configuration. Preserve all existing entries and other profile changes. A gateway restart is needed because handlers wire at connection time. First check for ongoing agents, then restart the existing `hermes-gateway.service` once; verify plugin wiring and gateway health without sending unsolicited notifications. Do not activate until the app endpoints, migration, both scoped secrets and scheduler intake support are ready.

## Optional photo enhancement

Without `enhancement_command`, only the original image is presented and the plugin explicitly says no cleanup occurred. To enable the independently reviewed image worker, configure an argv list such as:

```json
"enhancement_command": ["python3", "/opt/truecolor-social/enhancement/worker.py", "--config", "/etc/truecolor-social/enhancement.json"]
```

Then preview controls offer cleanup and background removal. The plugin saves the original, writes a private job JSON, and runs the worker asynchronously (ten-minute worker limit plus one minute for controller cleanup). It adds `--job PATH` to the configured argv, never uses a shell, and does not pass API credentials in the worker environment. A valid output must lie under the expected output directory, match its returned SHA256, and pass the 12 MiB image size/signature checks. An attempt is durably reserved before worker execution and its result is checkpointed before upload. Uncertain or repeated attempts are held for operator reconciliation instead of regenerating. It is uploaded via the draft-secret `/image` endpoint, generating a fresh preview. Editing a photo does not approve it. Configure the worker workspace root to contain the plugin journal parent and its `originals/` and `enhancements/` children.

## API contract

All endpoints use HTTPS and reject redirects. Draft calls use the draft bearer secret; only `/approve` uses the approval bearer secret.

* `POST /api/integrations/social/intake`: multipart `image`, deterministic UUID `requestId`, optional `context`.
* `GET /api/integrations/social/intake/:id`: current full package.
* `POST /api/integrations/social/intake/:id/revise`: JSON `fingerprint`, `captionInstagram`, `captionFacebook` and/or `scheduleTime`.
* `POST /api/integrations/social/intake/:id/approve`: JSON `fingerprint`, `rightsConfirmed: true`.
* `POST /api/integrations/social/intake/:id/image`: multipart `image`, `fingerprint`, `mediaTreatment` (`cleaned` or `background_removed`).

Review packages include `intakeId`, `fingerprint`, `revision`, `status`, `previewUrl`, `scheduleTime`, and optional `captions: {instagram, facebook}`, `mediaTreatment`, `postIds`, `imageUrl`. Conflict errors can include `alternatives: [ISO_TIMESTAMP]`; raw remote errors are never echoed to Telegram.

## Verification

```sh
python3 -m unittest discover -s scripts/social/hermes-plugin -p 'test_*.py'
```

Tests cover owner/topic/forward filtering, no implicit approvals, callback identity/replay/staleness, revision binding, local dates, file limits/signatures, stable retry identities and error redaction. Tests mock all Telegram/API calls; they do not send live notifications or prove deployment.
