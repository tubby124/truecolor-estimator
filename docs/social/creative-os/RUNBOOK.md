# First working creative kit — offline brief preview

September 9, 2026. Owner authorized the first build after reviewing the design. This is an offline text-brief tool, not an image worker, scheduler or learning loop.

## What it does

Read a saved True Color kit and recipe, resolve current local product facts, and produce a private comparison page plus JSON briefs. The examples cover one exact small-batch sticker offer, custom shape/size guidance without a price, and design help without a bundled product quote. Five recipe definitions are supplied, with three selected requests. The real-work recipe has no eligible real proof in this fixture set and must remain blocked until actual clearance exists.

No information is needed from the owner to run this fixture preview. The next human input is feedback on the three directions and wording. Real artwork rights and exact rendered-media review belong to the following production step.

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

- `truecolor-kit.json`: brand identity, voice, visual lanes, contact-panel instructions and source references.
- `sticker-recipes.json`: recipe array; no stored evergreen offer amounts.
- `fixture-proofs.json`: proof records; examples are explicitly synthetic, with no real image or customer rights assertion.
- `offer-inputs.json`: requested recipes and exact configuration where appropriate; no schedule or destination fields.

All requests compile before any files are written. One invalid request holds the whole package. Stable IDs prevent duplicates and filename traversal. Fixed filenames `index`, `report` and `briefs` are reserved.

The CLI uses the already-installed direct TypeScript dependency to load a fixed graph of trusted local source modules. Input JSON never chooses a module or code path. There is no new dependency, service, API endpoint or production route. The source-loader helper is not a sandbox for untrusted code; only this repository's trusted implementation is executed.

## Outputs and honest states

`index.html` is a standalone text comparison page with no external requests. It shows the purchase question, content requirements, art direction, contact information, and expandable source checks. The colour blocks are text presentation only, not final creative designs.

`briefs.json` and one JSON file per brief preserve the exact request/bundle digests, kit/recipe/proof revisions, fresh local fact fingerprint, source revision label, actual local fact-source digest, explicit flag, timestamp, quote assumptions and limitations. `report.json` summarizes the run. File contents never contain credentials or populated analytics, and generated output remains private.

Every brief remains `draft`. A fixture anywhere in the bundle conservatively makes the output `fixture_only`; neither rights fields nor a `production_candidate` label establish authentic rights or owner approval. Existing monthly and weekly importers do not accept these distinct schemas. The tool cannot approve or publish a brief.

The source revision is a Git HEAD label, not a claim the checkout is clean. The separate source digest covers the local fact dependency manifest and tables. Numeric requests can pin `expectedFingerprint`, `expectedSourceRevision` and `expectedSourceDigest` from a prior output; any mismatch blocks instead of silently updating the offer. Null expectations mean a deliberate initial fresh binding. Existing resolver/table caches require a fresh process after source edits; the adapter detects source drift and refuses mixed snapshots. This is local verification, never deployed-price or customer-order proof.

## Implemented subset of the design

The broader [contracts](CONTRACTS.md) remain the target architecture. This first slice intentionally implements smaller, strict records:

| Area | Implemented now | Still later |
|---|---|---|
| Brand kit | Versioned identity, voice, lanes, contact instructions, source refs and optional illustrative-hero logo rule | Full colour/font asset registry, authenticated kit acceptance |
| Offers | Exact sticker configuration resolved locally; nonnumeric configurator and design-help modes | More product adapters, `custom_request`, price ranges, tax-inclusive copy, design-inclusive product quote |
| Recipes | Five explicit product/purpose recipes and three selected briefs | Automatic selection/calendar composition and usage reservations |
| Proof | Declared rights/kind/brand checks, synthetic scope propagation, honest truth labels | Original/derivative media ingestion, real rights verification, rendering and visual QC |
| Validation | Strict fields, referenced records, source bindings, supported claim-pattern checks, importer isolation | Complete semantic proof; regex checks do not establish every statement's truth |
| Learning | No new learning implementation | Collector, acceptance receipts, sanitized lesson promotion and map/Vault/AISA writeback |

Actual phase-one schema kinds are `creative_os_bundle`, `creative_brief_request`, `creative_brief` and `creative_os_brief_collection`. The envelope/revision reference system is scoped to the implemented fields in `src/lib/creative-os/contracts.ts`; do not feed the broader design's illustrative partial JSON directly to this parser. No full schema migration or portability certification is claimed.

The core accepts an injected brand-specific fact adapter. Only the True Color sticker adapter exists. A different business needs its own verified kit, fact adapter and proof; it must not inherit True Color's identity or sell claims. No website editing adapter exists in this slice.

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

## Next step

Owner reviews the three text directions. Then the separate production lane consumes one pinned brief to produce and visually review a hero, followed by contrasting pieces. The current tool is usable locally; merging to main is held because this task excludes production runtime changes and main triggers Railway. A draft branch/PR preserves the work for review without changing the live application. Existing scheduling, approvals, publishing, spend, database, credentials and private map/Vault state remain untouched.
