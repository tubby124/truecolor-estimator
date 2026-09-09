# Creative OS build plan and acceptance

September 9, 2026. **Design followed by owner-authorized first build.** The [runbook](RUNBOOK.md) describes the implemented offline subset. The remaining phases below are proposals. Nothing here activates a collector, writeback process, image worker or publishing integration.

## Current milestone — repair the shared foundation

Owner authorized the audit repair on September 9. This milestone supersedes the original sticker-only slice's portability acceptance below. The original slice is retained as history: three sticker examples proved price/semantic handling but missed product-specific fields and creative choices in the shared layer.

Repair ownership: the shared compiler validates bindings and evidence; each facts adapter validates its own configuration; the brand kit holds lasting identity/voice constraints; recipes choose scenes, layouts and campaign treatments; proof records carry their own provenance. Compiled output must preserve that separation. Old schema inputs must fail clearly rather than silently acquire changed meaning.

Acceptance examples must differ materially:

| Example | Required evidence |
|---|---|
| Existing sticker offer | Exact configuration still resolves to its local price; no copied blanket offer or logo overlay |
| Business-card education | Same compiler, no price, no borrowed sticker instructions |
| Banner/sign education | Same compiler, its own facts and composition, no invented material or turnaround |
| Exact non-sticker fixture | Adapter validates its own fields; no fake `shape` needed; stale/mismatched facts still fail |
| Second synthetic brand | Its own logo/action rules; no inherited True Color identity, pickup or phone requirement |
| Authentic work without eligible proof | Blocks; an illustration cannot become a real job |

Tests establish synthetic portability, not a verified live business-card/banner catalogue or a second-business integration. Independent review must assess these requirements as well as test results. Existing fact freshness, fixture propagation, input/output isolation and price safety remain acceptance gates.

The offer renderer's duplicated fields/title and caption subtotal disclosure are recorded separate follow-ups in existing application code. This offline repair does not change those runtime paths.

## Owner-led next phases

The owner will co-design the monthly planner and supply examples, downloaded references or links showing desired post styles. Do not implement the planner, decide its detailed mix or start final media from this repair alone. Discuss each substantial part with the owner before building it, using a short concrete proposal and their examples.

For each reference, distinguish what the owner likes (such as hierarchy, spacing, photography or typography), which product/campaign it suits, and the scope of the accepted direction. A reference is inspiration until its permitted use is established; it is not evidence of a True Color job. Record accepted direction in the project at the appropriate recipe/campaign scope. Do not turn a sample layout into a permanent brand rule. No references have been supplied in this repair milestone.

The sequence after repair is owner style discussion, a separately agreed visual proof, then owner-led mixed-product planner design and implementation. Collector, accepted learning and other-business integration remain later scoped phases. Each milestone reports its capability, evidence and remaining gap; passing one does not complete the broader roadmap.

## Original first implementation slice — historical scope

Build an offline True Color brief compiler, after owner acceptance of this design. Aim for one reviewable input/output proof, not a platform launch.

Proposed files:

```text
docs/social/creative-os/README.md                         # this design
docs/social/creative-os/CONTRACTS.md                      # contract specification
docs/social/creative-os/BUILD-PLAN.md                     # this build plan
src/lib/creative-os/contracts.ts                        # strict record types/validators
src/lib/creative-os/compile.ts                          # pure one-brief compilation
src/lib/creative-os/truecolor-facts.ts                   # existing local resolver adapter
src/lib/creative-os/__tests__/compile.test.ts            # material contract failures
scripts/social/creative-os-preview.ts                   # local CLI, no network
docs/social/creative-os/examples/truecolor-kit.json       # proposed sanitized kit
docs/social/creative-os/examples/sticker-recipes.json     # five semantic recipes
docs/social/creative-os/examples/offer-inputs.json        # inputs, never evergreen prices
```

Use the repository's existing TypeScript test tools and validation conventions; no package additions. Before choosing a CLI launcher, verify the current package scripts and available TS runner rather than introducing one by assumption. Output populated briefs/reports into a caller-supplied private folder outside the public repository. A public test fixture may be fully synthetic; private proof files are never checked into tests.

Required input: one proposed True Color kit; five sticker recipes; three offer input cases (exact historical configuration, different size/custom options without price, design help without bundled product quote); synthetic proof references with explicit illustration labels; latest local fact resolver. The exact offer is recalculated on each compile, not copied out of the example receipt. Pin loaded source/flag/configuration provenance and produce a truthful local verification status.

Required output: three **text-only briefs** and a static HTML review/report showing required visible wording, product/configuration, offer limitations, proof status, CTA/contact fields and diversity signatures. No image generation, rendition production, image export, upload or approval action. Synthetic proof can demonstrate formatting but is explicitly `fixture_only` and cannot produce production-ready status. Real proof references remain pending until their original rights evidence is reviewed.

The three review cases are:

1. Exact small batch: keeps “Small run. Big presence.” direction, explicit custom-sticker subject, complete configured offer disclosure, illustrative label and True Color contact panel; no logo overlay.
2. Custom fit: explicitly about sticker shape/size choices, verifies supported choices, uses a configurator action and **no reused $25 amount**. Unsupported material/type remains a question, not a product claim.
3. Design help: explicitly about sticker artwork/custom design, uses maintained service facts and separates any service fee from product pricing. The initial nonnumeric variant avoids forcing design-inclusive facts through the print-ready monthly parser.

Boundary proof: OS output has a unique `kind: creative-os-brief` and cannot satisfy `truecolor-month-plan` or weekly import. No schedule/destination/approval fields. Do not add an adapter to the existing importer in this first slice. Implementation updates only its relevant design/runbook pointers; leave global brand rules, live social profile, offers renderer and current approval code unchanged.

Definition of done: Phase 1 checks F01–F06, S01–S02, P01, B01–B03 pass on the three text briefs; owner can compare them, package source bindings are visible, and no new runtime/API dependency exists. S01 is a text-only semantic review here, repeated on rendered assets in Phase 2. P01 includes fixture-scope propagation and rejection from any future handoff. This proves schema and semantic clarity only. It does not prove visual quality or outcomes.

## Phased delivery

| Phase | Deliverable | Entry / exit evidence |
|---|---|---|
| 0 — this task | Architecture, contracts, source map, first slice | Local design review; no claimed acceptance |
| 1 — offline compiler | Files and three briefs above | Design accepted; deterministic contract checks and owner semantic review pass |
| 2 — creative proof | Separate lower-cost production lane consumes frozen briefs; one hero, then two contrasting pieces | Owner accepts one hero before batch. Three distinct visuals pass factual/phone/contact-sheet review; source and rendition provenance retained. Image entitlements/cost are handled in that production task |
| 3 — calendar composer | Pure local composition plus private usage snapshot; 20-slot mixed-month rehearsal and five-slot focused sequence | At least four verified product families and sufficient proof, or explicit gaps. Reproducible output/diversity report; owner accepts mix. No timing/cadence activation |
| 4 — collector | Read-only private adapters extending the manual scorecard workflow | Schema and creative proof passed; actual authorized campaign evidence exists or a clearly marked rehearsal is used. Two human reviews reproduce source windows/missingness. Partial failures and dedupe verified; collector cannot accept lessons |
| 5 — accepted writeback | Human-bound decision projection, sanitized Git lesson and narrow private pointers | Manual acceptance/promotion cycle proven. Replay, conflict, supersession and privacy checks pass. Separate authorized implementation for map/Vault/AISA paths; no background writeback now |
| 6 — retrieval portability | Scoped bundle export; derived graph only if useful | Fresh consumer reads accepted lesson at exact revision; stale pointer/access failure holds. Future brand onboarding separately supplies skin, facts, proof and conversion rules |

Manual acceptance can be exercised before an automated collector exists. Do not delay capturing an explicit owner preference until enough sales arrive. Conversely, taste approval cannot stand in for a performance result. Calendar composition can be developed after phase 1, but collector/writeback work must wait until the schema and visual proof gates are met.

The first later publishing handoff, if separately authorized, reuses the existing exact-media/copy/facts approval pathway. Resolve current importer capabilities and limits then. Do not add a scheduler, widen a static allowlist or treat prepared brief review as publication authorization.

## Acceptance checks

Phase ownership: Phase 1 owns F01–F06, S01–S02, P01 and B01–B03; Phase 2 owns V01–V03 and repeats factual/semantic/proof checks on actual renders; Phase 3 owns C01–C03; Phase 4 owns L06; Phase 5 owns L01–L05. Later phases retain earlier gates relevant to their outputs. These are planned acceptance tests, not checks already passed by the design documents.

| ID | Check | Pass condition |
|---|---|---|
| F01 | Exact configuration | Complete square 2×2/25/white-vinyl/one-side/print-ready/no-addons/no-rush binding resolves locally; price and before-tax qualifier match current facts |
| F02 | Changed options | Change each price-bearing field independently; old exact-offer binding is rejected/re-resolved. Circle, die-cut, clear vinyl and custom design never inherit the square offer |
| F03 | Invalid input | Missing shape/size/quantity where required, nonpositive dimensions, fractional count, NaN, unknown fields/schema and guessed material alias fail with field-level errors |
| F04 | Missing/stale price source | Source unavailable, flag drift or fingerprint mismatch blocks numeric output; no silent fallback price or evergreen receipt |
| F05 | Minimum/cost | Correct standalone minimum treatment; null cost/margin stays null; tax-inclusive copy absent in slice 1 |
| F06 | Existing adapter limits | Design-help brief cannot be serialized as a design-inclusive print-ready monthly product. No parser widening |
| S01 | Product semantics | Viewer can identify custom stickers versus design help, size/shape options or online configurator without caption rescue |
| S02 | Destination meaning | Non-prefilled URL includes selection guidance. Instagram visible URL never treated as verified click attribution |
| P01 | Proof truth | Pending/withdrawn rights block real use; illustration never passes actual-work recipe; cross-brand proof rejected |
| V01 | Readability | At phone preview all required product, amount/qualifiers, website/address/phone text remains legible; no clipping or covered product artwork |
| V02 | Creative quality | Owner reviews hierarchy, tactile plausibility, restraint, distinct idea and brand recognition; factual correctness is a separate hard gate |
| V03 | Diversity | Three-piece contact sheet visibly changes composition/question/scale, not only colour or wording; no mandatory hero logo |
| C01 | Mixed month | At least four eligible families, proposed family cap and purpose balance; count/time assumptions visible; focused sequence uses its explicit campaign mode |
| C02 | Sparse inventory | Insufficient proof/alternatives gives gaps and unsatisfied constraints, never invented real work or repeated hero filler |
| C03 | Repeatability/history | Same pinned inputs/seed yield same choices. Hash groups, near-duplicates and existing reservations count; incomplete history limits stated |
| L01 | Owner acceptance | Proposed/rejected/model-written acceptance cannot enter reusable accepted lessons; private owner decision evidence and exact digest required |
| L02 | Learning type | Overlay preference is taste evidence. Engagement or one attributed sale cannot become a universal profit claim |
| L03 | Privacy | Public projection contains only allowed sanitized fields; seeded private paths, customer identifiers, token URLs and internal totals fail review |
| L04 | Promotion replay | Repeated same promotion creates one lesson/pointer; Git success + pointer failure retries pointer only |
| L05 | Conflict/revocation | Stale map revision fails compare-and-swap; revoked/superseded/expired lesson excluded from new drafts; earlier history retained |
| L06 | Collector integrity | Unlaunched/unavailable values null; source/query/window definitions retained; overlapping attribution deduped; partial failures visible |
| B01 | Authority isolation | No imports or calls to scheduler, publisher, approvals, credentials, production DB or notification tools; populated outputs stay private |
| B02 | Format isolation | Brief/editorial kinds rejected by existing monthly importer; no valid scheduleTime/destination settings emitted |
| B03 | Scope portability | Core carries IDs/contracts; True Color skin carries business identity/CTAs/proof. A future brand with no kit fails rather than inheriting True Color facts |

For later visual proof use a separate 1–5 rubric for hierarchy, material plausibility, restraint, brand recognition and originality. Proposed pass: no dimension below 4 plus explicit owner acceptance of the exact rendered version. This score is a review aid, not a model certificate. Missing factual clarity, rights or readable qualifiers blocks regardless of aesthetic average. No automated test can establish “best creative” or guaranteed sales.

## Verification for this design-only task

Run repository record checks, relative-link checks, `git diff --check`, and a scope diff limited to these design documents plus index/current-state pointers. Read the final draft for contradictory price/logo/approval rules. No app build or production helper is required for Markdown-only work. Design stays local and proposed; a future design acceptance/release should use the normal Git review process without treating merge as system implementation.

Completed design verification, September 9: repository record check passed (11 entry documents / 17 pipeline rows); all design relative links resolve; the embedded JSON example parses; whitespace/diff checks pass. Independent review identified and rechecked fixes for acceptance-payload hashing, phase-specific completion gates and fixture-only proof propagation. Final file scope is three design documents plus the existing index/current-state pointers, in an isolated local branch based on `0675d93d`. No code tests or rendered-asset quality checks are claimed. The design is not pushed, merged or owner-accepted; production and private-map/Vault state were not changed.

## Decisions intentionally left for later phases

Exact font assets/campaign colour tokens and visual recipe acceptance belong to creative proof. Real-work rights are per-asset. Calendar slot count/cadence remain owner inputs. Collector operational identity, access, retention and triggering await its own implementation scope. Graph storage choice awaits evidence that an index of Git lessons is insufficient. No future brand assets, services or destination policies are inferred from True Color.
