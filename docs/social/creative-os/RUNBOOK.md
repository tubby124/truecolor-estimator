# Creative foundation — offline brief preview

September 9, 2026. Owner authorized the first build and subsequent audit repair. This is an offline text-brief tool. The repair separates shared checks, brand constraints, recipe execution and adapter-owned facts; [acceptance examples](BUILD-PLAN.md#current-milestone--repair-the-shared-foundation) test that separation across synthetic products and brands.

## What it does

Read a saved True Color kit and recipe, resolve current local product facts, and produce a private comparison page plus JSON briefs. The examples cover one exact small-batch sticker offer, custom shape/size guidance without a price, and design help without a bundled product quote. Five recipe definitions are supplied, with three selected requests. The real-work recipe has no eligible real proof in this fixture set and must remain blocked until actual clearance exists.

No information is needed from the owner to run the fixture checks. The next creative step is a discussion with the owner using their samples or links, identifying which style choices belong to which recipe. The owner will co-design each substantial monthly-planner decision before implementation. These fixtures do not accept a brand style, choose the monthly mix or authorize media production.

## Run

From the verified application checkout, use the existing lockfile dependency setup if needed:

```sh
bash scripts/codex/setup.sh
node scripts/social/creative-os-preview.mjs --help
node scripts/social/creative-os-preview.mjs \
  --output /absolute/private/existing-parent/new-review \
  --sticker-v2 true
```

The output parent must exist outside Git. The CLI exclusively creates a new directory with private filesystem permissions; reusing its name fails and preserves the previous review. No overwrite option exists. It rejects output inside detected Git repositories, including symlink aliases. Input files are limited to a combined one MiB. No `.env` file is loaded. The explicit pricing flag changes this local process only; it does not verify or alter the deployed flag. The tool can be launched from another working directory and establishes its own repository root.

Optional `--input-dir /absolute/input-folder` reads exactly these four files:

- `truecolor-kit.json`: brand identity, voice, lasting visual constraints, logo/action policies and source references.
- `sticker-recipes.json`: recipe array owning scene/contact presentation and selected claim IDs; no stored evergreen offer amounts.
- `fixture-proofs.json`: proof records owning their provenance; examples are explicitly synthetic, with no real image or customer rights assertion.
- `offer-inputs.json`: requested recipes and exact configuration where appropriate; no schedule or destination fields.

All requests compile before any files are written. One invalid request holds the whole package. Stable IDs prevent duplicates and filename traversal. Fixed filenames `index`, `report` and `briefs` are reserved.

The CLI uses the already-installed direct TypeScript dependency to load a fixed graph of trusted local source modules. Input JSON never chooses a module or code path. There is no new dependency, service, API endpoint or production route. The source-loader helper is not a sandbox for untrusted code; only this repository's trusted implementation is executed.

## Outputs and honest states

`index.html` is a standalone text comparison page with no external requests. It shows the purchase question, content requirements, art direction, contact information, and expandable source checks. The colour blocks are text presentation only, not final creative designs.

`briefs.json` and one JSON file per brief preserve the exact request/bundle digests, kit/recipe/proof revisions, fresh local fact fingerprint, source revision label, actual local fact-source digest, explicit flag, timestamp, quote assumptions and limitations. `report.json` summarizes the run. File contents never contain credentials or populated analytics, and generated output remains private.

Every brief remains `draft`. A fixture anywhere in the bundle conservatively makes the output `fixture_only`; neither declared rights fields nor a `review_candidate` label establish authentic rights or owner approval. Compiled proofs retain asset ID/hash and their own source references; factual claims retain IDs and source bindings. Existing monthly and weekly importers do not accept these distinct schemas. The tool cannot approve or publish a brief.

The source revision is a Git HEAD label, not a claim the checkout is clean. The separate source digest covers the local fact dependency manifest and tables. Numeric requests can pin `expectedFingerprint`, `expectedSourceRevision` and `expectedSourceDigest` from a prior output; any mismatch blocks instead of silently updating the offer. Null expectations mean a deliberate initial fresh binding. Existing resolver/table caches require a fresh process after source edits; the adapter detects source drift and refuses mixed snapshots. This is local verification, never deployed-price or customer-order proof.

## Implemented subset of the design

The broader [contracts](CONTRACTS.md) remain the target architecture. This first slice intentionally implements smaller, strict records:

| Area | Implemented now | Still later |
|---|---|---|
| Brand kit | Versioned identity, voice, lasting visual constraints, source refs and configurable logo/action rules | Owner style-reference review, full colour/font asset registry, authenticated kit acceptance |
| Offers | Adapter-owned exact configuration; real local sticker resolver; nonnumeric education/configurator/design-help modes | Verified live adapters for other products, `custom_request`, price ranges, tax-inclusive copy, design-inclusive product quote |
| Recipes | Scene and contact presentation owned by each recipe; selected sourced claims; five sticker examples and three CLI briefs | Owner-led monthly-planner design, automatic selection and usage reservations |
| Proof | Proof-owned sources, compiled asset ID/hash, declared rights/kind/brand checks and synthetic scope propagation | Original/derivative media ingestion, real rights verification, rendering and visual QC |
| Validation | Strict fields, referenced records, source bindings, supported claim-pattern checks, importer isolation | Complete semantic proof; regex checks do not establish every statement's truth |
| Learning | No new learning implementation | Collector, acceptance receipts, sanitized lesson promotion and map/Vault/AISA writeback |

Current offline schema version is **2**, with kinds `creative_os_bundle`, `creative_brief_request`, `creative_brief` and `creative_os_brief_collection`. Version 1 requests/bundles are rejected; old private previews are preserved, not silently migrated. The CLI uses the updated example files to create a new review directory. The envelope/revision system is scoped to `src/lib/creative-os/contracts.ts`; do not feed the broader design's illustrative partial JSON directly to this parser. Synthetic acceptance does not certify other application pathways or real business integrations.

The core accepts an injected fact adapter that validates its own domain configuration. The True Color sticker adapter is the only real catalogue adapter supplied by this CLI. Synthetic acceptance adapters exercise business cards, banners and another brand without asserting actual prices, inventory or onboarding. A different real business needs its own verified kit, fact adapter and proof. Existing application caption/monthly flows remain True Color-specific; passing compiler tests does not make those flows portable.

## Checks

```sh
npx vitest run src/lib/creative-os scripts/social/creative-os-preview.test.mjs
npx tsc --noEmit
npx eslint src/lib/creative-os scripts/social/creative-os-preview*.mjs
npm run validate:pricing
bash scripts/codex/check.sh
```

Tests cover exact offer qualifiers, stale/missing sources, changed options, cross-brand mixing, declared rights, unsupported numeric/blanket claims, fixture propagation, monthly-import rejection, atomic package validation, overwrite/traversal/Git-output rejection and HTML escaping. Broader repository CI remains required before merging code. No production helper is used to test this tool.

Local verification on September 9: 32 focused tests passed after independent review fixes; strict TypeScript and scoped ESLint passed. The pricing validator returned zero errors and two existing-source warnings; pricing code/tables were not changed. The full unit suite passed before the final eight regression cases were added (1,541 tests); required PR CI will check the final revision. A private browser check verified three cards, no page errors, no external requests and no overflow at 390px, including expanded diagnostics. No final-image quality or production-delivery claim follows from these checks.

## Audit repair verification — September 9, 2026

Local validation passed: 1,584 unit tests across 164 files, including 67 focused compiler/preview cases and 32 independent portability cases; strict TypeScript and scoped ESLint; pricing validator with zero errors and two existing warnings; project-record and whitespace checks. The private v3 preview has three fixture-only drafts with the exact local sticker amount preserved. Browser checks at 1440px and 390px found three cards, no overflow with diagnostics expanded, no page errors and no external requests.

Independent review found an in-place adapter mutation that could change a requested quantity before comparison. Defensive copies and independent validator/resolver regression cases now reject it while preserving the original request. Quote components must reconcile, and unsupported preselected-link claims are blocked. Final review found no remaining high/critical issues in this offline scope. Required remote build/browser/database checks are tracked on draft PR #72; this local receipt does not claim those checks or a deployment.

These results prove the tested source bindings and synthetic portability. They do not establish final visual quality, real asset rights, non-sticker catalogue coverage or a working monthly planner. Existing offer/caption interface hardening, multi-business application handoffs and automated learning remain separate work.

## Next step

Owner supplies examples or links and discusses the intended styles and planner behavior in depth, one substantial part at a time. Record accepted reference traits at their brand/campaign/recipe scope, then agree the first visual proof. Do not automatically start a hero, monthly planner, collector or learning writer because the compiler tests pass. Later real-work references need their own provenance and permitted-use evidence.

Merging to main remains held because main triggers Railway. The draft branch/PR preserves this repair for review. Existing scheduling, approvals, publishing, spend, database, credentials and private map/Vault state remain untouched. Remaining audit follow-ups in the existing offer/caption paths are separate from this offline repair.
