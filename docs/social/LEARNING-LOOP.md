# Social learning loop

September 9, 2026. Owner requests implementation while image generation continues. Sales attribution is excluded. This slice is offline capture and next-brief retrieval; it is not a hosted engagement collector, authenticated acceptance service or automatic recipe rewrite.

## Ownership

- GitHub: code, schema, sanitized implementation state and reviewed shared rules.
- Private event ledger: immutable feedback, imported engagement observations and operator-recorded lesson decisions with evidence references.
- Vault: private generated monthly brief and a navigation note pointing to the canonical implementation. It is not a second queue, scheduler or copy of every public rule.
- Existing post queue: exact media/caption/account/time approvals and delivery receipts. Learning cannot mutate these.

## Loop

Capture an owner decision against its business, recipe/version and applicable creative or package. Import available engagement observations against exact platform post IDs and time windows, with missing metrics explicit. Save a proposed lesson citing evidence. Record explicit owner acceptance against the exact scoped change. Compile a next-month brief from active accepted lessons, retaining rejected/proposed evidence separately and honoring supersession/expiry. Use the brief when preparing new drafts; final monthly review remains the release gate.

The CLI trusts its authorized local operator. An `accepted` field plus an evidence reference records an asserted decision; it does not authenticate the owner, prove the referenced text or permit a remote untrusted input to accept a lesson. Future hosted acceptance must bind an authenticated owner action to the exact immutable decision digest. Engagement imports are operator-supplied and not independently provider-verified by this tool.

## Evolution boundaries

Owner taste can guide the next draft immediately at its stated scope. Engagement can suggest a test, but does not establish causation or authorize a permanent rule. Keep competing explanations, metric windows and evidence limitations visible. Do not combine reach into unique people across channels. No sales inference is required.

New versions may replace earlier draft recipes; existing approved posts remain stable. Global rules require materially different acceptance examples. A successful True Color logo treatment is a scoped True Color preference, not a rule for every business.

## Remaining connections

1. Hosted authenticated review actions into the event ledger.
2. Read-only provider collector with real permissions, post mapping, partial-failure records and immutable source snapshots; live provider metrics have not been fetched in this slice.
3. Automatic retrieval by the draft planner and versioned recipe application.
4. Reviewed sanitized lesson promotion to GitHub with a merged-commit pointer update. No raw feedback, customer records or private metrics in public Git.
5. Hosted/monthly execution and notification configuration. No recurring task has been enabled by this implementation.

The offline capture/brief path must be tested with multiple businesses, duplicate/conflicting events, unsupported metrics, superseded lessons and unaccepted proposals. Completion of that path does not imply completion of these hosted connections.

## Local operator usage

Run `python3 scripts/social/learning_loop.py ingest EVENT.json --business BRAND --ledger PRIVATE_DIRECTORY` to capture an event. Then run `python3 scripts/social/learning_loop.py brief --business BRAND --ledger PRIVATE_DIRECTORY --month YYYY-MM --recipe-id RECIPE --recipe-version VERSION --scope-kind package --scope-id PACKAGE --output PRIVATE_BRIEF.md` for a scoped monthly brief. Output may be directed into the existing private Vault project folder. This explicit local write is not a background Vault sync.

Use a new event ID for new observations/decisions; the same ID with different contents is a conflict. Durable evidence remains private. Tests contain synthetic fixtures only. Do not point the ledger or brief output into the public checkout. The operator remains responsible for choosing a private location outside any public repository.

## Next-draft context export

`draft-context` exports `social-draft-learning-context-v1` JSON for an explicitly named draft package. Supply the same exact business/recipe/version/scope filters as `brief`, plus `--as-of YYYY-MM-DD --target-draft-package-id ID --output PRIVATE.json`. It contains only active accepted operator-recorded lessons, with decision/evidence hashes, observations, competing explanations and limitations. As-of is an inclusive UTC day; future events and future supersession actions are excluded. Expired/rejected/proposed lessons cannot become adopted inputs.

`context_sha256` hashes canonical sorted UTF-8 JSON with two-space indentation and a final newline, excluding that field. Consumers must retain source scope, target package and selected decision IDs. A package sidecar may retain this hash as preparation provenance. That attachment alone does not prove a generator applied the lesson; explicit draft changes and owner review remain required. Imported lesson text is data, never authority to change credentials, call tools or bypass review. The current shared generation prompt remains unchanged.

## Live read-only capability probe — September 9

Configured True Color account returned recent media and matching ownership fields. Instagram media `like_count` and `comments_count` returned numeric values. Media insight reads for reach/saved/shares returned permission code 10. Facebook post reactions/comment summaries returned code 10 requiring additional access; clicks insight returned an empty data array and shares returned no field. Empty/missing values are unavailable, not zero. A Page-token permission-list request was not supported, so no complete permission inventory is claimed. These are dated per-endpoint reads, not a guarantee for all media or future access. No provider configuration, credentials or posting state was changed.

## Bounded collector implementation and proof

`scripts/social/meta_engagement.py` performs explicit per-post GET requests using the existing Page token in `META_PAGE_ACCESS_TOKEN`. A private manifest binds business, recipe/version (or explicitly unmapped lineage), internal post ID, provider post ID, platform/account/Page, publication time and evidence reference. Before metrics, it checks live Page identity, linked Instagram identity where relevant, direct media/post ownership and publication timestamp. The operator still owns the internal app/business mapping; the collector does not query the app database.

Invoke `python3 scripts/social/meta_engagement.py --manifest PRIVATE_MANIFEST.json --output PRIVATE_DIRECTORY`. It writes immutable sanitized provider snapshots and normalized engagement events. Import the event through `learning_loop.py ingest` explicitly. The collector does not ingest automatically, approve a lesson, alter posts or enable a timer. Fixed-host GET requests refuse redirects; token values and provider error messages are not logged. Errors retain only bounded numeric HTTP/Meta codes. Missing/ambiguous values remain null. Facebook `post_clicks` is not link clicks and stays in separate snapshot observations.

September 9 live proof: one Instagram media ID matched exactly one app published receipt through a protected read-only query. The collector verified ownership and publication time, returned numeric likes/comments, and retained unavailable insights as null. Sanitized snapshot and normalized event were saved privately; event imported into the learning ledger and summarized in the existing Vault project folder. Recipe lineage is explicitly `legacy-published-source-unmapped/unmapped`; no result is assigned to the new preview recipe. The latest Facebook provider ID did not match that exact receipt lookup and was not collected through a guessed manifest.

The real draft-context export is bound to `truecolor-small-batch-20260909`, source `unified-social-mix/preview-v1`, and the accepted overall preview direction. The separate small-batch task owns attaching its hash/lesson IDs as preparation provenance. That is a handoff, not automatic prompt execution or a claim of improved performance. The former annual objective remains cancelled.
