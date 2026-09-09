# Creative OS proposed data contracts

Design version 0.1, September 9, 2026. These are implementation specifications, not installed schemas. All records below reject unknown fields and cross-brand references. Public examples use synthetic or sanitized data only; populated evidence and media manifests remain private.

## Shared envelope and identity

Every record: `schemaVersion: 1`, `kind`, stable `id`, `brandKey: "true-color"`, integer `revision >= 1`, `status`, `createdAt` (UTC ISO instant), and `sourceRefs[]`. IDs use lowercase ASCII `[a-z0-9][a-z0-9._-]{0,95}`. Campaign references preserve the existing `tc_stickers_small_run_pilot` identity. IDs do not change on edits; revision increments. Materially changed variants get their own IDs. References specify `{id, revision, digest}`. No last-write-wins lookup of an unpinned “latest” record in a frozen brief.

`SourceRef = {id, kind: repository|owner_decision|private_receipt|public_page, observedAt, revisionOrDigest, evidenceScope, limitation}`. Public Git stores opaque private source labels plus sanitized limitations, never a private path, raw receipt, customer identifier or access URL. Resolution is capability-dependent. A Cloud agent can use an accepted sanitized fact within scope but cannot claim to have re-read its private evidence.

Maintain separate fields for evidence status, creative review and learning acceptance. Never reuse runtime `approved`/`posted` as OS states. Draft-package statuses: `draft|blocked|reviewable`; reviewable means structurally ready for human review only.

Digests: SHA-256 over UTF-8 canonical JSON with recursively sorted object keys, preserved ordered arrays, sorted/deduplicated declared set fields, finite numbers, no undefined values and explicit nulls. Exclude only the record's own digest from its digest calculation. Store currency as integer minor units; dimensions as positive finite decimal inches matching the engine request. Do not hash raw JavaScript source text as a substitute for semantic record canonicalization. Existing product source fingerprints retain their current algorithm.

For learning acceptance, the signed object is a separate immutable `DecisionPayload`, not the mutable lifecycle record. It contains decision ID/revision, brand/campaign scope, learning kind, evidence references, observation, competing explanation, exact proposed change, limitations, applicability/expiry, supersession target and the proposed sanitized public text. `AcceptanceReceipt = {id, payloadDigest, reviewerRole, acceptedAt, privateOwnerEvidenceRef, receiptDigest}` is stored separately. State and promotion/pointer receipts are also separate events. Their addition never changes the payload digest. Changing the payload requires a new revision and fresh owner review; no circular digest includes the acceptance that references it.

## BrandKit

Required fields beyond envelope:

| Field | Contract |
|---|---|
| `identity` | Display name, public website, canonical public address and phone; each has sourceRef |
| `voice` | Tone, preferred examples, prohibited unsupported claims; distinction between permanent brand and campaign copy |
| `tokens` | Identity colours/fonts with provenance; campaign overrides marked proposed/accepted; font asset/rights reference where relevant |
| `visualLanes[]` | ID, narrative job, palette roles, subject/scene guidance, allowed proof types, layout constraints |
| `contactPanels[]` | ID, required identity fields, action hierarchy, safe-area/readability constraints; values referenced from identity, not duplicated |
| `logoPolicy` | Default optional; lane overrides, exact asset ref if used, no redraw, no cover of product artwork; illustrative hero overlay disabled |
| `semanticRequirements` | Required product/service naming by intent and amount/qualifier association rules |
| `qualityPolicy` | Hard factual gates plus separate visual-review rubric |
| `precedence` | Scoped owner decision refs and explicit superseded historical guidance |

Initial kit remains proposed until owner accepts its revision. Accepted taste evidence may be used to construct that proposal without declaring the whole kit accepted.

## OfferRecord

Required: `productSlug`, `mode`, `capabilityClaims[]`, `quote`, `ctaRoute`, `validity`, `claimAllowlist[]`, `claimDenylist[]`. `quote` is null for nonnumeric modes. Capabilities need source evidence independently from whether the engine happens to return a number.

For exact mode:

```json
{
  "productSlug": "stickers",
  "mode": "exact_configuration",
  "configuration": {
    "category": "STICKER",
    "material_code": "PLACEHOLDER_STICKER_2X2",
    "width_in": 2,
    "height_in": 2,
    "sides": 1,
    "qty": 25,
    "shape": "square",
    "addons": [],
    "design_status": "PRINT_READY",
    "is_rush": false
  },
  "quote": {
    "currency": "CAD",
    "basis": "standalone_configured_order_before_tax",
    "amountMinor": 2500,
    "costMinor": null,
    "margin": null,
    "verificationScope": "historical_local_receipt",
    "checkedAt": "2026-09-09T14:33:12.050Z",
    "factFingerprint": "062505af90467b22f23f344588de0cdd312704f15e170f4db67e3b4f32e4399a",
    "sourceRevision": "791dcce6b0976efad70bbc34cc8c93dd094da079",
    "runtimeFlags": {"NEXT_PUBLIC_USE_STICKER_PRICING_V2": true}
  },
  "ctaRoute": {
    "url": "https://truecolorprinting.ca/products/stickers",
    "preselectionVerified": false,
    "instruction": "Select the shown size, shape, quantity and artwork options."
  }
}
```

This is a **partial historical example**, not a complete executable record or current production quote. A real record also stores raw line subtotal, standalone minimum adjustment/disclosure, current configuration label, resolver rule IDs, allowed claims and evidence refs. Tax-inclusive copy is excluded from the first slice; later tax display must consume the shared tax calculation, never hardcoded rates or assumed exemption status. Do not represent order minimum top-up as a universal per-item price.

`validity = {checkedAt, reviewBy, sourceRevision, verificationScope, requiredRecheck: [brief_compile, final_media_review, existing_approval_handoff]}`. Proposed review window is at most seven days for cached numeric briefs, shortened by any fact/flag/configuration/source change. Timestamp freshness alone never establishes validity: re-resolve numeric facts on each compilation, compare fingerprint and complete configuration, and fail closed on unavailable sources. Production consistency is checked later by the existing authenticated approval flow; this local compiler does not acquire credentials.

The adapter produces `resolved|needs_configuration|unsupported|stale|source_unavailable`. Only resolved exact offers permit amounts. A stale exact offer blocks that brief; it must not silently turn into a nonnumeric post. The author may explicitly choose a new configurator brief and revise its binding. Custom request is not a claim that the shop supports any shape/material. Design service evidence is distinct from `design_status` accepted by the current monthly product parser.

## ProofRef and Recipe

`ProofRef` has `proofKind: actual_work|illustration|diagram|interface_capture`, `usageScope: fixture_only|production_candidate`, `assetId`, `assetVersion`, `sha256`, `nearDuplicateGroup`, `rightsStatus: cleared|pending|withdrawn`, allowed brand/use, source type, private provenance ref, disclosure text, restrictions and optional expiry. Source originals and metadata live in private storage. A generated mockup can be cleared as an illustration but never converted into actual_work. Real-source content transformations need original/derivative provenance and fidelity review. Fixture clearance applies only to tests. A production_candidate label alone does not establish clearance or acceptance.

Recipe required fields:

- `purpose: offer|education|design_help|proof|ordering|local_context`, `purchaseQuestion`, `productFamily`, `allowedOfferModes`, `requiredCapabilities`.
- `mustCommunicate[]`: semantic facts/action the viewer must understand without reading the caption. For exact offers include the binding qualifiers. For shape/size/design include those nouns explicitly.
- `proofRequirements`: permitted kinds, required clearance, disclosure placement; optional proof is explicit.
- `visualLaneOptions[]`, `contactPanelOptions[]`, `logoOverride`, `compositionJobs[]`, `avoid[]`.
- `cta`: intent and verified route ref, no destination/account mutations.
- `diversityTags`: layout family, hero object, scene, scale, tonal family, panel treatment, question category. These support review; arbitrary new labels cannot excuse perceptual duplication.
- `claimRefs[]`, `qualityChecks[]`, `lessonRefs[]` pinned to accepted scope and revision.

Brief compilation rejects missing required capabilities, contradictory visible claims, orphan references or rights that do not cover this brand/use. OCR and semantic models may assist future review but cannot prove rights, price accuracy or factual correspondence of an image.

## EditorialPlan and compiled brief

`EditorialPlan = envelope + {monthLabel, mode: mixed_month|focused_campaign, slotCount, seed, policyRef, inputBundleDigest, historySnapshotRef, slots[], diagnostics}`.

`slot = {ordinal, weekGroup, recipeRef|null, productRef|null, offerRef|null, proofRef|null, status: proposed|needs_source|blocked, rationale, missingRequirements[]}`. No date/time, channel destinations, approval fields or scheduler flags. Counts 1–62 are an offline design capacity limit, not existing importer/publisher capacity. Never split a large plan to evade the existing importer cap. Caller supplies the count; a sample never changes cadence.

`CompiledBrief = envelope + {campaignKey|null, recipeRef, kitRef, offerRefs[], proofRefs[], headlineDirection, requiredVisibleText[], captionGuidance, altTextGuidance, layoutInstructions, forbiddenClaims[], diversitySignature, lessonRefs[], inputBundleDigest, verificationReport}`. All strings bounded (headline direction 200 chars; instruction blocks 4000; total JSON package 1 MiB excluding media). Limits are proposed local safeguards; no new platform limits asserted.

Both compiled briefs and editorial plans additionally require `usageScope: fixture_only|production_candidate`. Any fixture-only input forces fixture-only output, including mixed-input packages. Mark it visibly in the HTML report; a future production handoff must reject it. Neither scope value is an approval state, and the initial compiler has no production handoff adapter.

Compiler API, proposed TypeScript signatures:

```ts
validateBundle(input: unknown): ValidationResult;
resolveOffer(input: OfferInput, facts: LocalFactsAdapter): OfferResolution;
compileBrief(input: BriefInput, bundle: ValidatedBundle): BriefResult;
composeEditorialPlan(input: ComposeInput, bundle: ValidatedBundle): EditorialResult;
```

These are pure/local functions. No HTTP endpoint, provider SDK or shell execution. No importing publisher/schedule/store/service credentials. Output text marked draft; generated HTML escapes all input, loads no external resources and refuses path traversal for local references. Writes create a new output version or require an explicit local overwrite flag, never overwrite source assets. No media generation in the first slice.

Validation result: `{status, inputDigest, errors[], warnings[], unsatisfiedConstraints[], sourceChecks[]}`. Each diagnostic identifies record/field, reason and concrete remedy. Unknown schema version fails; older versions migrate only through explicit offline adapters that preserve originals. A partially valid package cannot be labelled fully reviewable.

## Accepted learning and pointer promotion

Preserve the existing campaign-scorecard v1 input and CLI. Add a separate proposed `LearningDecision` envelope later rather than redefining the scorecard's current classification values or breaking old private reviews.

`LearningDecision` contains:

| Field | Meaning |
|---|---|
| `campaignKey`, `creativeVersionRefs[]` | Exact source scope, no inferred universal rule |
| `learningKind` | `owner_taste|operational|commercial`; commercial needs outcomes, taste needs actual owner direction |
| `evidenceRefs[]`, `window`, `coverage`, `limitations[]` | Private evidence and missingness; operational failure separate from poor creative performance |
| `observation`, `competingExplanation`, `proposedChange` | Claim and alternative, not a model-written conclusion masquerading as fact |
| `state` | `proposed|accepted|rejected|superseded|revoked` |
| `acceptanceRef` | Null until recorded owner review; references the separate AcceptanceReceipt bound to the immutable DecisionPayload digest |
| `scope`, `expiresOn`, `supersedes` | Brand/campaign/recipe applicability and review horizon; history retained |
| `sanitizedLesson` | Public allowlisted projection: lesson ID, kind, scoped rule, limitation, date, sanitized decision ref and supersession link |

Acceptance is not established by a JSON boolean, model confidence score or Git merge alone. Initially a human reviews the exact proposed public text against the original owner decision. Later automation may verify an authenticated review action bound to the digest, but may never invent one. An edited decision or broader sanitization invalidates that binding and returns to review.

Promotion stages: evidence saved privately → decision proposed → owner accepts exact change → public projection reviewed → Git lesson merged → pointers updated. Track Git status and pointer status separately. A decision accepted privately but unmerged is not a Git lesson. A merged lesson with a failed pointer update stays `pointer_pending`; retry only that pointer, never duplicate the lesson or replay execution.

Idempotency key: `brandKey/decisionId/revision/acceptedDecisionDigest`. Public projection uses an allowlist and a privacy review, not regex redaction alone. Exclude customer names/artwork, order/contact IDs, raw URLs with tokens, private report paths, internal commercial totals and raw transcripts. Aggregate conclusions can still reveal sensitive business information and require review. Private and public projection hashes are distinct and reconciled in the private promotion receipt.

Future `PointerUpdate = {lessonId, canonicalRepo, path, mergedCommit, publicLessonDigest, acceptedAt, scope, supersedes, pointerStatus}`. Map, AISA and Vault contain references and short status only. Writer is limited to the existing relevant context/index paths, uses compare-and-swap against the read revision, and reports conflicts for review. No append to personal memory, full graph import, unrelated note rewrite or private-to-public reverse sync.

A later graph is a derived index with `Brand`, `Campaign`, `CreativeVersion`, `Evidence`, `Decision`, `Lesson` nodes and typed `supports`, `accepted_as`, `supersedes`, `applies_to`, `points_to` edges. Private evidence nodes never leave private scope. Edges always retain source/revision; graph confidence cannot promote a decision. Retrieval checks current accepted state, supersession, expiry and scope at the canonical source, or returns `unverified`; it must not silently use a stale pointer. Revoke/supersede through a new audited record, then refresh pointers; retain history and never edit delivery evidence.

## Future collector contract

A collector consumes read-only delivery/report sources and emits private `EvidenceSnapshot` records. Required: source/version, retrievedAt, campaign/creative mapping, inclusive reporting window and timezone, filters/limits, metric definition, attribution class, coverage, raw artifact digest, and adapter outcome `complete|partial|unavailable`. A metric is `{value: number|null, unit, sourceRef, missingReason|null}`; no-source is null, not zero.

Do not sum platform reach into unique people; do not blend GA4 all-host purchases with production sessions. Distinguish deterministic campaign association, customer-reported attribution and unknown; deduplicate privately before aggregation. Paid order means completed payment evidence. Attributed revenue is not incremental revenue or margin. Existing attribution limitations remain until independently resolved. No arbitrary sample-size threshold converts a correlation into a proven sales effect.

Snapshots are immutable and deduplicated by source/query/window/content digest; a later changed provider result is a new revision linked to the earlier snapshot. Bounded read retries preserve partial errors and never synthesize missing metrics. A failed source does not erase a successful source. Manual files remain a supported adapter so collection failure cannot block owner review. Retention and operational identities are decisions for the later collector phase, not new settings now.
