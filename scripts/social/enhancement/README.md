# Private photo enhancement worker

Prepared code, not installed or activated. This worker has no timer and never publishes,
contacts Telegram, uploads media, or retries a failed image edit. EDA code and queues are untouched.

The existing intake controller invokes:

```sh
python3 scripts/social/enhancement/worker.py --job /private/job.json --config /etc/truecolor-social/enhancement.json --dry-run
```

Remove `--dry-run` only after runtime installation and an authorized canary. Job fields:
`intakeId` (UUID), `fingerprint` (lowercase SHA256 of the intake revision),
`inputPath`, `inputSha256`, `treatment` (`cleanup` or `remove_background`), `outputDir`.
Input and new output directory must be canonical absolute paths below the configured
private workspace root. The controller must authenticate/revalidate the revision before
submitting and again before accepting the result; this worker treats fingerprint as a
correlation value, not proof of approval.

Configuration is a private root-owned JSON file with `workspaceRoot`, `user`,
`codexBinary`, `codexHome`, `readinessFile`. No credentials belong in this file or job JSON.
Runtime needs Linux systemd, Python Pillow and the existing managed ChatGPT Codex CLI.
Do not copy or inspect its credentials. The configured nonroot account must already
have authorized access to the configured managed Codex home. Serialize use with any
other worker sharing that home during the initial canary; the TC lock serializes TC jobs only.

Installation must provision the workspace root root-owned, no world permissions,
with traversal for the creative account and no ability to list neighboring jobs;
each job directory is mode 0700. Keep controller API credentials in
`/etc/truecolor-social` (explicitly inaccessible to creative execution). Do not place
any controller credentials in world-readable paths. The outer systemd sandbox permits
writes only to the job and managed Codex home, masks the workspace root with a temporary
filesystem and binds back only the current job (hiding neighboring jobs and logs), hides root homes and EDA execution/posting
data, and adds no EDA media binds. Codex uses `danger-full-access` only inside this
mandatory outer sandbox, matching the verified VPS user-namespace restriction.

The root controller stages the verified original and uses a fixed bounded image editing
prompt. There is no image API fallback. Maximum execution is 10 minutes, 1 GiB RAM,
100% CPU and 96 tasks; disk must have 4 GiB free initially and retains a 2 GiB reserve.
Failure leaves evidence in place and emits a bounded stderr message. A repeated
request to the same output directory fails rather than generating twice. Private
Codex event logs remain in the workspace root and must never be sent to users.

Success stdout is exactly `{ "outputPath": ".../final.png", "sha256": "...", "treatment": "..." }`.
The file must be a decoded PNG, regular and unlinked, at most 20 MiB and 40 million
pixels. A structured completed `image_generation_call` receipt in the exact managed
session must contain base64 image bytes whose SHA256 matches the final PNG. This proves
file integrity and a completed creative turn, not faithful visual
preservation: the owner reviews the original/prepared comparison before approval.
The controller uploads to private storage, binds the exact bytes to the intake revision,
and requests a fresh preview. Worker completion does not authorize publication.

Before activation: run tests, verify runtime paths/Pillow and account permissions,
prove denial of credential/neighbor reads in the same sandbox, run one explicitly
authorized photo edit, inspect artwork preservation and hashes, verify private upload
and review link, and test failure without fallback or automatic retry. No live canary
or approval-to-post claim is established by these source tests.

## Observed image tool evidence and activation gate

The historical successful EDA canary was inspected read-only on September 7. CLI
`--json` output omits the image tool, but the matching managed session JSONL contains
`response_item` with payload `type: image_generation_call`, `status: completed`, and
`result` containing base64 PNG bytes. It also records `image_generation_end` with a
generated-image path. The verifier uses the first receipt's actual bytes, matched to
the exact CLI `thread.started` UUID and session metadata ID. It does not read auth
files or return prompts/media/session records to the caller. A plain original copy
or renderer output cannot pass unless it matches this turn's image-tool bytes.
Keep enhancement disabled until the TC sandbox canary validates this observed
receipt contract and photo-edit fidelity under the same runtime.

Live execution additionally requires a root-owned mode-600 readiness JSON whose
`workerSha256` matches the installed worker.py and whose `enabled`, `sandboxVerified`,
`imageEventVerified` are all true. Do not create that receipt from unit tests. Dry-run
does not require readiness, does not invoke Codex and does not create job outputs.
Root-owned durable manifests outside the sandbox record attempts before execution;
an interrupted attempt is held. Only a completed manifest with unchanged input/job
identity and unchanged output hash can be returned again without rerendering.

Run the harmless isolation probe before any generation:

```sh
python3 scripts/social/enhancement/probe.py --config /etc/truecolor-social/enhancement.json
```

It writes only synthetic probe files, tests hidden neighboring jobs and forbidden
paths, confirms managed-home access without opening credentials, and never runs
Codex or contacts the network. It preserves its successful workspace evidence.
The Telegram caller needs at least 660 seconds to allow the 600-second worker limit
plus sandbox setup/cleanup. The application upload cap is 12 MiB, so the controller
must reject or explicitly prepare larger worker results before upload.

```sh
python3 -m unittest discover -s scripts/social/enhancement -p 'test_*.py'
```

## September 7 True Color canary result

The private synthetic isolation probe passed on the existing VPS runtime. Two
distinct synthetic treatments (cleanup and background removal) completed creative
turns but rejected the generated artwork as unfaithful. Neither produced an
accepted final PNG. The original source copies remained unchanged. Runtime
readiness was disabled after the tests. Do not enable Telegram enhancement
controls from these results; basic original-photo intake is independent.
The root controller uses the existing Hermes virtualenv Python with Pillow;
the system Python does not have Pillow installed.
