# Connected preparation before publication

The owner identified a real integration failure: recording a logo preference did not make the renderer enforce it. A consulted learning sidecar and a successful isolated renderer test were insufficient. New preparation must start from raw assets and consume the exact typed policy before producing the files presented for review.

## One bounded path

Private source ledger → current scoped accepted context → explicit reviewed mapping to typed settings → preparation policy → deterministic renderer → actual rendered file verification → uploader preparation → exact review package → existing approval/queue dry run.

The small-batch bridge/renderer and app review integration are owned in PR77. This lane owns the learning-to-policy compiler and connected command. They share versioned artifacts, not duplicate rendering or queue logic. The approved September batch remains untouched. Annual content is cancelled.

## Typed policy

`scripts/social/preparation_policy.py` compiles `social-preparation-policy-v1` from a valid `social-draft-learning-context-v1` plus an explicit `social-preparation-binding-v1`. A binding links the exact selected lesson text and evidence reference to a digest of typed renderer/caption settings. Plain lesson prose is never executed or treated as tool authority.

The renderer settings bind the exact logo file SHA256, backing, corner, width ratio and inset. For the current True Color correction: white backing, top-right, 0.20 width ratio and 0.035 inset. Caption mode is `provided_draft`; this milestone does not pretend existing draft text was automatically generated from learned facts. Facts/pricing validity and final copy approval remain in the existing review flow.

The policy binds business, source recipe/version/scope, target draft package, applied lesson IDs, source context digest and binding digest. This is trusted-local preparation authority, not authenticated owner publication approval. Consumers reject mismatched or missing policies; hashing arbitrary JSON is not proof that its prose was owner-approved.

## Current lesson retrieval

The connected runner regenerates the scoped context from the ledger on each invocation. It can refresh the context reference/digest in a previously reviewed binding, but cannot rewrite selected decision IDs, accepted-text digests, renderer settings, settings digests or evidence references merely to make a stale binding pass. Superseded/expired/missing lessons require a new deliberate reviewed mapping. Unchanged owner-approved settings do not require repetitive approval.

## File-level evidence

Each `social-render-receipt-v1` binds business/package, policy digest, exact renderer settings, raw source hash and generated output hash. The connected runner reads the actual raw and final files and supplies their hashes to verification; a well-formed receipt alone is insufficient. It separately verifies the final uploader-preview hash against lineage and the emitted monthly plan against generated files.

Raw-source/framing decisions are explicit per creative. An already branded rendition cannot masquerade as an unbranded original or receive a second badge silently. New outputs remain versioned; existing approved images are not overwritten.

Only after all checks pass may the command write its connection receipt with `prepared_not_approved`. The exact resulting package must be the input to the existing importer/review/queue rehearsal. Mocked queue success proves compatibility, not real hosted approval, scope enrollment, public delivery or a complete unattended monthly system.

## Verification requirements

- Different source types/framing exercise the same pipeline; raw bytes are preserved.
- Missing policy, wrong business/package/recipe, changed lesson/settings/logo bytes, stale transparency and mismatched final/upload hashes fail before a success receipt.
- Two business fixtures establish policy isolation; they do not establish deployed multi-client onboarding.
- The real three-creative batch starts from raw files, renders through the required policy, produces final uploader previews and passes the existing importer/review rehearsal.
- Final phone/desktop image readback accompanies machine checks. A renderer option alone is not visual acceptance.
- No live upload or publication until the connected result is reviewed and exact action authorized.

## Operator command

Run `python3 scripts/social/prepare_connected.py --request PRIVATE_REQUEST.json --output NEW_PRIVATE_DIRECTORY --bridge-checkout TRUSTED_CHECKOUT`. Node 22.18+ is required by the existing TypeScript-importing bridge. Optional `--node` selects an installed executable; no dependency is downloaded.

The request schema is `social-connected-preparation-v1` with `business_id`, `target_package_id`, `recipe_id`, `recipe_version`, `scope_kind`, `scope_id`, private `ledger`, `binding_file` and `batch_input_file`. The input batch remains the bridge's existing schema. The runner supplies freshly generated `learningContext` and `preparationPolicy` rather than trusting stale embedded copies. Explicit source framing and source/logo files remain with the batch input.

A trusted bridge checkout containing `scripts/social/harness-batch.mjs` is required; it is delivered by the companion PR77. This compiler/runner does not provide a second renderer. Run the combined path only after both implementations are available.

## September 9 integration evidence

One-command run generated three creatives from their raw files and produced `connection-receipt.json` with `prepared_not_approved`. The runner verified current feedback/policy, exact logo, raw/rendered/uploader hashes, caption receipt hashes, creative sets and unchanged scheduled instants. Desktop/390px preview images loaded without overflow; all three final previews showed the white-backed top-right logo.

The first integration attempt exposed a Node import/CLI argument collision and stopped without publishing an output. The second rendered but failed a strict schedule-text comparison because the existing importer normalizes equivalent offset times to UTC; it had no success receipt. The fix compares aware timestamp instants and has both equivalence and changed-time regression tests. Failed artifacts remain private historical attempts. Forty combined Python tests pass, including the new compiler/runner contracts; independent code/security review passed. The companion bridge task then replayed this exact plan and its files through the real importer with mocked upload/save/approval endpoints: three creatives, six simulated exact approvals and six ready destinations, with no unexpected writes or live enrollment/publication. Parent readback verified identical plan SHA across both receipts and wrote a private connected proof. This establishes local end-to-end dry-run compatibility only.
