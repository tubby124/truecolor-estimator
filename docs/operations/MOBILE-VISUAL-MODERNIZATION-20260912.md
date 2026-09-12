# Mobile visual modernization — private work log

## Outcome and present milestone

Owner requested an improved version of the working store: clearer explanatory images, cleaner layout and easy one-hand use while preserving search, commerce, measurement and asset provenance. On September 12 the owner explicitly reaffirmed the current direction and asked to keep the work modest. The later waves below are a backlog, not a commitment to rebuild the whole site. This is the audit and first private pilot. It is **not a release and not completion of the whole site**. No push, merge, deployment, provider configuration or publication is authorized by this record.

Working branch: `codex/mobile-visual-wave1-20260912`. Source baseline: `38642b5e01a83af1ba8a085426434bc7b6735804` (remote main verified September 12). Prior candidate `codex/private-homepage-products-preview` at `3283cbfc` is preserved independently. Its runtime base `20dca429` differs from current main only in the finalized-GSC report fix, not customer UI.

## Audit findings before implementation

- The old candidate is not presentation-only. It changes homepage H2/body content, removes the picker Design services heading, description and two priced searchable service cards, and adds five thumbnail bindings consumed by cart and related cards. Its string-based tests do not establish rendered semantic parity.
- Source inventory finds 142 non-staff page files, including 108 using `IndustryPage`. A shared navigation/footer/theme change therefore reaches many indexed pages. The original pilot avoided those shared surfaces. The owner then authorized the exact website-logo update; the only shared presentation extension is header/drawer/footer logo placement plus the narrow header spacing/breakpoint correction needed to keep it usable.
- The current hero has 36px arrows and 8px dots, auto-rotation without an explicit pause button, and absolutely positioned content. The longest first slide must be tested separately from short subsequent slides and the tall retractable display image.
- `BackToTop` sits at bottom 24px above the viewport, overlapping the homepage call bar and product add-to-cart region after scrolling. This is an existing cross-template issue; it needs a separate shared-control fix with product and checkout regression evidence.
- On desktop, essential `.reveal-section` content starts invisible until an observer runs. Fail-open display is part of the homepage accessibility pilot.
- Checkout email blur calls `/api/checkout-sessions`. A private browser must block writes before loading customer journeys; merely avoiding the final payment button is insufficient.
- Existing art and customer images have different provenance. Asset identity, rights and placement are not inferred from folder names or previous social approval. The five new candidate picker images remain held.

## Visual direction

Use the existing cyan, warm ink and paper palette, existing local fonts and real product imagery. Emphasize legible prices, quiet borders, deliberate spacing and visible controls. Mobile product cards should allow quick scanning with room for long product names. Preserve current content, link destinations and search behavior. No new packages, fonts, decorative effects or generated assets are required. Prioritize existing imagery and specific customer friction; do not adopt a cinematic scroll engine or replace the design system. Execution can use Terra Medium/High, Luna Max or Sol Medium; Astra Ultra is not the default for every implementation task.

## Phased delivery and acceptance

| Wave | Scope and customer job | Acceptance before advancing |
| --- | --- | --- |
| 0 | Live/source audit, protected semantics and source/placement map | Record current source, live readback, finalized GSC limitations, route families, baselines and separate holds. |
| 1 | Private homepage + product picker: choose the correct product | Retain title/meta/canonical/robots/H1/H2, copy and href multiset; preserved service search; 44px controls; no clipping/overflow; keyboard, motion and no-JS review; price/image/feed invariants. |
| 1 release | One approved thin slice | Finalized experiment reconciliation, independent review, exact candidate full CI, five cold + one warm controlled samples per required viewport, explicit release decision, exact deployment/live readback. A local preview does not unlock release. |
| 2 | Product-detail templates, including quantity print, area sign, tall display, service and coming-soon | Only after pilot gates and observation. Configure quantity/dimensions/finishing, select images and lightbox, retain exact offer and cart payload, negative unavailable/invalid cases. |
| 3 | Indexed landing families: shared IndustryPage, standalone vehicle/service pages, price guide/paid entry pages | One bounded route/template experiment, retained indexed copy/schema/links, query intent and controls, GSC/AI/order evidence. No global template rewrite. |
| 4 | Shared navigation/footer and informational/portfolio/resources pages | All shared consumers audited; mobile menu focus/escape, footer reachability, truthful work/illustration labels, 320/375/641–767/768/1440 layout checks. |
| 5 | Cart, checkout, quote/contact, payment/receipt, account/auth and brokerage customer portal | Only measured friction fixes. Verify estimate→cart→checkout totals, tax/exempt state, upload errors, validation, consent/attribution and keyboard; use local mocks for writes. Genuine payment/provider proof is separate. |

## Materially different acceptance examples

1. Homepage longest first slide and tall final slide → unchanged indexed landing → product picker; pause, next/previous, keyboard focus and vertical scrolling all work.
2. Picker search for `logo` and `upscale` retains both orderable items and the established priced SEO service cards; an unmatched search retains honest empty state; Door Hangers remains coming-soon and image-free.
3. Quantity-priced business cards and custom-size coroplast produce the same estimate/cart configuration and tax totals as baseline; invalid dimensions cannot submit.
4. Retractable banner tall gallery preserves the whole display and keyboard lightbox behavior; Merchant-linked offer keeps its original hero and configuration.
5. Quote-only/coming-soon flow never becomes a fake purchasable offer. Checkout input/blur cannot write remotely in the harness.

## Evidence protocol

Private raw evidence is archived outside Git at `/Users/owner/Downloads/TRUE COLOR PRICING /mobile-visual-evidence-20260912` (directory mode 700). Temporary working logs also remain at `/private/tmp/tc-modernization-evidence`. Sanitized results and continuation steps live in this record. Browser screenshots were inspected inline; no persistent screenshot files are claimed. Use actual measured CSS viewport dimensions; browser tooling display size is not proof of CSS width.

Baseline and candidate production builds use explicit non-production Supabase placeholders and no `.env` copy. A loopback proxy blocks external collectors and every API except the pure estimate POST. Local browser behavior is not live analytics/provider proof. Direct HTTP baseline capture records public HTML/XML only.

Compare status/redirect, canonical, robots/header robots, title/description, H1/H2, body, links with duplicates, OG/Twitter and parsed JSON-LD. Compare both feed and sitemap contracts. New accessibility-control labels must be explicitly accounted for; do not hide unexpected semantic changes by normalizing arbitrary text away.

Performance: fixed browser/DPR/network/CPU/consent, five cold runs and one warm per route/viewport (375×812, 768×1024, 1440×900); retain all samples, medians, LCP element/resource, CLS and initial image bytes/count. Local measurements are lab evidence, not field Core Web Vitals or conversion lift. Existing breaches remain failures with a non-worsening comparison.

## Release holds carried forward

1. Wall Graphics and promoted-image observations require finalized GSC interpretation; elapsed calendar time is insufficient.
2. Five extra picker assets lack picker/cart/related placement clearance. Keep their shared map unchanged.
3. The owner explicitly requested the current truecolorprinting.ca logo used on Instagram on September 12. This supersedes the prior website-logo hold for this private preview. Resolve the exact source asset and verify its rendering before substitution; this does not authorize changing live social profiles or publishing.
4. Any indexed body/provenance-label change is recorded separately from pure styling and requires the active SEO release gate.
5. Required CI/deployment/field/real commerce evidence does not exist for this private candidate.

## Continuation log

- September 12: read routing, both worktrees, shared instructions, current state, SEO/gallery rules and prior candidate; verified remote main and created isolated worktree. No prior work discarded.
- Independent SEO/asset and mobile-source audits started; direct finalized Google read runs privately. Live homepage and picker inspected; actual viewport calibration is being checked.
- First private implementation: scoped homepage and picker styles, normal-flow hero with 44px controls/pause, native gallery pause, focus visibility, mobile sticky-bar spacing, readable horizontal mobile cards and preserved Design services search. All 42 hero data fields, original indexed copy and product image bindings remain intact.
- Exact-source provenance review supports illustration labels on six hero images and ten existing picker images only. The remaining picker images are not blanket-classified. Five new candidate thumbnails remain held. The existing homepage "Roland UV" wording was preserved for semantic parity; that factual correction is a separate content decision.
- Source tests: 170 files / 1,644 unit tests passed; pricing validation passed with two existing warnings; 133 Ads contracts passed with ten deterministic exports; scoped ESLint and diff checks passed. Independent code review found no remaining critical/high/medium issue after the explicit Play control and local optimizer-alias fixes.
- Local preview harness: loopback only; strips credentials and reporting headers; blocks external collectors and API writes except the pure estimate POST. Nine harness tests pass. Default CSP forbids eval; opt-in `--dev-eval` is only for webpack development UI, not production/performance evidence.
- Direct baseline/candidate development capture returned 200 for all 32 responses. Sitemap, image sitemap, both feeds and robots.txt match. Image sitemap has seven entries. Eleven HTML contracts fail closed on streamed pending/replacement React boundaries; this is not HTML semantic parity proof.
- Production build gates remain open. Turbopack cannot bind a worker socket in this environment. The unchanged baseline with webpack compiles but fails existing generated Next route/page type checks. No typecheck/CI bypass was added. Five-cold/one-warm performance samples are not available.
- Development hydration is resolved. Next 16.3.4 waits for its React debug WebSocket; the proxy intentionally blocks upgrades. `TRUECOLOR_PRIVATE_PREVIEW=1` disables only `experimental.reactDebugChannel` when `NODE_ENV=development`. Normal dev and production configuration retain their defaults. Both baseline and candidate use this same local setting for browser comparison. Independent Terra Medium review checked all three env combinations and the local logo optimizer path.
- Actual browser checks: all six offers at 320/375/768/1440px load and select correctly, with 44px minimum controls and zero page overflow. Responsive price typography removes the observed wrapping/height jump: all six hero heights are identical within each tested width. Gallery pause and mobile drawer open/close pass. Hero pause remains on the selected first offer across subsequent checks; explicit Play resumes rotation (later readback reached the sixth offer). Native GET searches preserve `logo` (11 results, $40 SEO service card), `upscale` (2 results, $20 SEO service card), and the honest unmatched state. Clean 343×114px picker cards were inspected at 375px.
- The original header overflowed to 374px at a 320px viewport on both baseline and initial candidate. New logo sizing and spacing fix it; account/cart/menu retain 44px targets. The existing duplicate header Order Now link is hidden below 420px but remains in the DOM. Full navigation starts at 1280px so landscape tablet width also fits. Header checks at 320/375/420/767/1024/1280/1440 show no horizontal page overflow; the new logo loads at every width.
- Rendered homepage comparison, after matching the same selected offer and completed hydration, passes title, description, canonical, H1/H2, complete href multiset and parsed structured data. The picker comparison passes the same fields. Initial transient differences came from baseline carousel exit animation and comparing pre-hydration with post-hydration state; neither is accepted as a content change. New illustration/control labels remain explicit body deltas.
- No-JS development capture exposes only the existing streamed Loading shell; hidden final segments require the React replacement script. This cannot establish a production no-JS pass. Production no-JS, broad HTML contract coverage, checkout journey, full CI and controlled performance samples remain open. No production-readiness claim is made.

## Exact website logo

The owner-authorized website wordmark is the unchanged transparent light variant from the accepted September 6 brand-v3 package: `truecolor-printing-ca-light.png`, 684×162 RGBA, 28,626 bytes, SHA-256 `89466c7213829908ae4c682064e9132626dd35b06920592e9ea60602112b52f3`. It is copied byte-for-byte to `public/images/brand/truecolor-printing-ca-light-v3.png` and used by the header, mobile drawer and footer. The original artwork is preserved. Existing schema/email/staff assets are outside this visual substitution. This source package documents the selected social wordmark; no current Instagram profile or post mutation is claimed. Independent Terra Medium review confirmed exact bytes and all three usages.

## Resume and release boundaries

The reviewable browser is `http://127.0.0.1:4231/` (homepage) and `/products` (picker), proxied from local development port 4121. Start the candidate with `TRUECOLOR_PRIVATE_PREVIEW=1 NEXT_TELEMETRY_DISABLED=1`, the documented dummy Supabase settings, and `next dev --webpack --hostname 127.0.0.1 --port 4121`; run `node scripts/visual-preview-proxy.mjs --upstream http://127.0.0.1:4121 --port 4231 --dev-eval`. Do not load live credentials or open the upstream directly for these tests. The candidate dev server and 4231 proxy remain available for review. Baseline, strict/no-JS duplicate proxies and the JavaScript canary were stopped after verification. These are not scheduled work or a deployment.

Next release work is bounded: get an exact-candidate production build through the existing Next route/page type failures, run production no-JS and controlled performance/commerce checks, reconcile finalized experiment observations, and make an explicit release decision. Preserve the previous candidate and five held image bindings. Do not silently expand into later waves while those gates are open.

## Finalized search observations

A direct Google read on September 12 at 21:30 UTC reported first incomplete date September 11 for both web and image search; final data ends September 10. The current 28-day window is August 14–September 10 against July 17–August 13. Homepage evidence is mixed with no basis to attribute gains or losses to this unpublished work. Wall Graphics comparisons are inconclusive; its full post-release 14-day window is not yet finalized. The September 10 image promotion has zero finalized complete post-release days, so it has not passed its observation gate. Day-seven/day-fourteen windows end September 17/24 and must be checked only once finalized. Raw measurements remain private in the evidence directory; they are not copied into this public repository.

## GitHub workflow research and scope decision

- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md): best fit for this modest pass. Borrow semantic controls, focus, image dimensions/loading, mobile safe areas and overlay-collision checks.
- [Nate Herk Scroll Craft](https://github.com/nateherkai/scroll-craft): borrow existing assets, deliberate mobile composition and screenshot review. Its immersive scroll/motion workflow is larger than the owner needs; no installation or implementation copied.
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md): borrow legibility, touch spacing and fixes tied to observable friction. Preserve the current brand and component system.

## Sources

Current [SEO standard](SEO-STANDARD.md), [gallery assurance](GALLERY-ASSURANCE.md), prior [private preview contract](PRIVATE-HOMEPAGE-PICKER-PREVIEW-20260912.md) in the preserved prior worktree, and [Google mobile-first guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing). Google recommends equivalent primary content and metadata across mobile/desktop; this plan retains them. [Web Vitals](https://web.dev/articles/vitals) defines field measurements separately from these lab checks.
