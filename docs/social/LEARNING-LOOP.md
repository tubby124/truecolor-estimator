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
