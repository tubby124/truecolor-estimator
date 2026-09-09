# Bounded harness batch to the existing review and queue

September 9, 2026. Annual content work is cancelled. This slice joins private prepared assets/captions to the existing monthly import contract; it is not a new scheduler, automatic planner or completed learning loop.

## Current operator flow

Use Node 22.18+ and installed repository dependencies:

```sh
node --experimental-strip-types scripts/social/harness-batch.mjs /private/batch.json /private/new-review-directory
```

The private input is `truecolor-harness-batch` schemaVersion 1, businessKey `truecolor`, a stable packageId, status `draft`, a `plan` accepted by the existing `truecolor-month-plan` v1 parser, and one lineage row for each creative. Lineage requires creativeId, sourceId, sourceType (`illustrative` or `customer-work`), recipeId, recipeVersion, purpose, rightsEvidence and factsEvidence. Customer work additionally requires customerClearance `confirmed`; this records a trusted operator assertion, not independently authenticated rights proof. Sources are image basenames beside the input. The bridge accepts at most seven creatives and holds duplicate channel/time slots. It does not inspect live history or reserve dates.

Required `learningContext` is the learning task's `social-draft-learning-context-v1` JSON. Required `preparationPolicy` is `social-preparation-policy-v1`, compiled from that exact context and an explicit typed binding. The bridge verifies both digests, exact business/target/source scope and selected decision IDs. It accepts only the bound official logo, solid white backing, top-right placement, .20 width ratio and .035 inset ratio. `logoFilename` is a local PNG basename and its bytes must match the policy hash. Missing policy, transparent backing or a changed logo holds preparation. This trusted local operator contract is preparation authority only, not authentication or permission to publish.

Every source row must declare `sourceStage: unbranded` and explicit framing `contain`, or `cover-4x5-centre` with its existing review evidence. The bridge freezes verified bytes in its own temporary directory, applies framing and invokes the existing branding renderer itself; declared prebranded inputs are rejected. Source-stage and framing evidence remain trusted operator assertions; the code does not visually detect an incorrectly labelled source. It then runs the same media preparation as the uploader and exports the resulting final images. Captions are provided price-free drafts, not newly generated learned copy. Offers remain with pricing integration. Temporary render files are removed; the final transformed plan is reparsed to reject duplicate renditions even if distinct raw inputs converge to identical image bytes.

All source hashes and media preparation pass before output is written. The output directory must be new and outside a Git checkout. This safeguards the operator's chosen location; it does not audit cloud-sync/privacy permissions. No network calls occur. Output includes:

- `month-plan.json` and matching final branded images in `images/`, directly accepted by the current monthly importer.
- `upload-preview/` produced with the same `prepareMonthlyMedia` function used by the uploader. Hosted output must still be read back and reviewed; future deployed source could differ.
- `lineage.json`, retaining source and expected upload hashes, recipe versions, stable creative IDs and consulted context.
- `index.html`, the private review desk with exact captions and proposed Regina times.

Do not put private images, captions, context or operational IDs in this public repository. Synthetic fixtures only are committed.

## App and scheduler connection

1. Review the concrete local package; dates remain proposals. Uploading through the current app creates public preparation image URLs.
2. Import month-plan.json plus files into `/staff/social/monthly`, verify final uploaded images and captions, then save drafts. Existing authenticated `/api/staff/social/batch/monthly` makes bounded, idempotent chunks and separate Facebook/Instagram destination rows.
3. Retain returned batch ID and destination IDs in the private receipt, joined through stable `creative_id`. Server approval binds media/copy/account/time; changing them invalidates approval. Consulted lessons cannot approve a post.
4. After exact owner approval, read each normal approval endpoint and save approval through the normal authenticated flow. Preserve the existing September posts.
5. New approved monthly destinations still require explicit enrollment: the app `SOCIAL_ONGOING_POST_IDS` and VPS `/etc/truecolor-social/ongoing.json` must agree. Scope is SHA-256 of sorted comma-joined lowercase destination IDs, limited to 100 base IDs. Three creatives on two channels add six IDs: 48 + 6 = 54, within that cap.
6. Prepare a receipt-reconciled scope change, retaining old IDs and all dispatch/notification history. Both runner and monitor journals are scope-bound. Merely changing the IDs will hold the runner; never delete journals or reset an uncertain dispatch to bypass that protection. See [scope procedure](ONGOING-MONITOR-PREPARATION-20260906.md) and [launch operations](LAUNCH-OPERATIONS.md).
7. Verify authenticated check/receipts with the new scope, then reconcile actual delivery/provider links and match results back to creative/recipe. Do not treat a saved draft or active timer as delivery proof.

The existing optional dynamic enrollment path is photo-intake-specific; it is not assumed to enroll generic monthly imports. Its live migration/activation were not verified in this slice.

## Read-only live configuration evidence

At September 9, 21:48:35 UTC the sole VPS posting timer and separate monitor were active/waiting, with latest service exits zero. Runner ongoing/enabled, pilot reconciled, 48 base destinations, intake disabled; monitor posted_only. Authenticated scheduler check reported publishing enabled, no hold, zero due, no backlog, no stale approval and no pending dispatch. No provider call, config mutation or dispatch was performed. This is a dated operational snapshot, not a guarantee of future delivery.

## Acceptance and limits

The tests exercise current parser/API contracts, immutable creative identity, exact copy/time transfer, image hash failure, lineage/clearance holds, same-day separate times, conflicting slots, private output and context/policy integrity and renderer enforcement. A Chromium rehearsal with local fixture authentication and mocked staff endpoints exercises file selection, preparation, save and reload/resume without duplicate save, followed by six simulated exact approvals and ready destinations; no live approval or dispatch. The same rehearsal can use `HARNESS_REHEARSAL_PLAN` pointing to the actual private month-plan; staff endpoints remain mocked and all real service access stays excluded.

Existing September scope is unchanged. No live upload, draft creation, approval, enrollment or publication has occurred. The first batch uses existing illustrative showcase/tip assets; genuine customer work remains a separate acceptance case requiring cleared source media. Pricing adapter work and engagement collection remain owned by their respective tasks. This True Color-only bridge does not prove another business or automated learning.

Verification: 33 scoped parser/bridge/API tests passed; full TypeScript and scoped ESLint passed; project records passed. Chromium synthetic and actual-private-batch rehearsals passed with mocked staff endpoints, including reload/resume without duplicate save. Desktop/mobile preview checked; no mobile overflow. Independent code reviewer approved after oversized-input and malformed-context fixes. GitHub release/CI status is separate.

## White-backed logo correction

Owner's September 9 review requires the True Color logo to have a white background. The existing preparation renderer now accepts explicit `backing: 'white'` (CLI final argument `white` after width ratio), with a padded rounded white badge and recorded badge/inner-logo bounds. Default transparent behavior remains unchanged for existing callers. Build fresh derivatives from originals, then regenerate package/image hashes; do not apply branding at dispatch or alter approved September media. This is True Color's reviewed direction, not a global preference for other businesses. Eight branding tests pass, including source preservation and unchanged pixels outside the badge; independent review approved. The private three-post package was rebuilt and visually checked after this correction.

## Connected acceptance

The learning task owns `scripts/social/preparation_policy.py` and `prepare_connected.py`; the bridge owns rendering and the unchanged month-plan consumer. The connected entry point reads the current private ledger, compiles the scoped context/policy, invokes `buildHarnessBatch`, and validates the actual generated files and per-creative `renderReceipt`. Receipts bind policy, raw source, framed source, final image, expected uploaded image and exact caption hashes. Run the actual emitted plan through `HARNESS_REHEARSAL_PLAN` and save `HARNESS_REHEARSAL_RECEIPT` for one linked local test of prepare/import/save/simulated-approval/ready destinations. Local staff endpoints are mocked; live scheduler enrollment and delivery remain excluded. A connected branding rule is not proof that arbitrary learned rules or automated captions are implemented.
