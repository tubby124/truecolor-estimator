# Product gallery assurance and measured learning

Owner direction and source review: September 9, 2026. **Preparation contract, not an implemented replacement engine or release approval.** No product page, image, feed, search setting or publishing queue changes in this documentation slice. [SEO-STANDARD](SEO-STANDARD.md) remains the authority for organic experiments; [current state](CURRENT-STATE.md) records the active work.

## Outcome and owner preference

Lead product galleries with clear, professional catalogue imagery that helps customers choose and order. Authentic customer work may live in its separate portfolio context. Preserving original assets and rights does not mean customer photographs must permanently occupy product-gallery slots. An approved, individually mapped gallery change can remove a photograph from that placement without deleting its original file or portfolio record.

The hypothesis is improved product understanding and purchase progression. It is not established that new imagery improves rankings or orders. Do not rewrite SEO text to accompany a visual refresh. Preserve title, description, H1, URL, canonical, robots, internal links, schema entities and commercial facts unless a separately scoped change explicitly addresses them. Old image alt text is reusable only if it truthfully describes the new image. Never retain a customer name, completed-installation claim or material description that the replacement does not support. No universal requirement to append “not a customer installation” to every sales caption; use honest product framing and keep provenance in internal records unless public context needs clarification.

## Source-confirmed findings

Reviewed source at `999ff16c992521c44353ecb269e6a9db6330ca93`; the following six files are identical to main baseline `0675d93d40b39e5afdc1b5e1f6e57c0004bd4e2e`:

- `src/lib/data/products-content.ts`: 30 records, 170 hero-first effective gallery slots, 154 unique paths. Coroplast has 15 slots, not four interchangeable concepts. `ProductPageClient` prepends `heroImage`; Merchant `merchant-catalog.ts` derives `imageLink` from it, and `/why-true-color` also consumes heroes. A hero edit is not isolated to the gallery.
- `src/lib/data/productImages.ts`: 24 thumbnail keys for catalogue/cart/related contexts. Six product/service keys use current icon/omission fallbacks; missing keys are not automatically broken files.
- `src/components/site/IndustryPage.tsx`: separate 27-key image map, route-specific heroes/galleries, and optional Product schema image defaulting to hero. Static placement inventory resolves 108 industry routes and 586 card slots; these are source relationships, not a count of rendered downloads. Editing the shared map can mutate many indexed pages.
- `src/components/product/ProductGallery.tsx`: string-only image list; main/thumbnail alt derived from filename; lightbox alt is generic. Main is 4:3/object-contain, thumbnails square/object-cover, lightbox object-contain. The planned descriptive-alt contract needs explicit data/component support. A 4:5 social approval does not approve these other crops.
- `src/lib/data/image-rights.ts`: 18 exact-offer records bind 16 public paths; all 18 hashes matched local bytes. None opts into image sitemap distribution. Offer helper checks URL/hash/channel/offer/status; sitemap helper checks URL/site/status/opt-in but not actual hash. Neither currently enforces optional expiry. Future clearance must validate bytes and expiry explicitly; do not claim it already does.
- `src/app/image-sitemap.xml/route.ts`: canonical-page allowlist plus rights filter; currently zero emitted pages/images, confirmed by test. Keep the empty result for this scope. Cache is 86400 seconds; source changes do not prove edge freshness.

Other verified consumers: `/products/[slug]` is intentionally noindex/follow and uses the shared OG graphic. Product-gallery work there is mainly a shopper/paid-landing change, not an organic indexation project. `/vehicle-decals-saskatoon` is a standalone page that is indexable in source (live indexing unverified), with its own real imagery, OG/Twitter and Service/FAQ/Breadcrumb schema; it is not one of the 30 catalogue records. Do not create new product orderability or imply certified full-wrap installation.

Private inventories differ by snapshot/definition (81 effective sources versus 87 available slots of 124 planned). Zero approved replacements were recorded in the inspected manifest. Reconcile exact source IDs/hashes before coverage claims; do not add source-reference and asset counts together.

## Required replacement record

Keep raw analytics, customer evidence and approval receipts privately; GitHub receives sanitized conclusions, reproducible checks and non-sensitive evidence labels only.

Each proposed placement needs: product/route/slot, old and new public path, original and final derivative SHA-256, width/height/format/bytes, truthful alt, provenance/channel/expiry, approval reference, complete consumer list, preserved versus removed placements, rollback references, and before/after evidence. Use new filenames for new assets; keep old bytes available. Website, Merchant, sitemap and social permissions are distinct.

A gallery-specific display binding may eventually allow a new primary gallery image while retaining Merchant imagery. That separation is a proposed implementation, not existing behavior. Until it is reviewed/tested, preserve Merchant-bound `heroImage` and prepare gallery-only changes or private comparisons.

## Before/after gate for every release

1. **Scope:** record exact branch/HEAD/deployed revision and every affected route, including transitive consumers, query-specific Merchant pages, homepage/industry/customer portfolio uses. Preserve DEFEND/HOLD/RECOVERING protections and location freeze. Existing useful landing pages remain protected until evidence supports intervention.
2. **HTML:** capture status/redirects, canonical, meta and header robots, title/description, H1/H2, anchor/href multiset, OG/Twitter and parsed JSON-LD. Compare semantic values, not a noisy whole-document hash. Unexpected changes block release.
3. **Delivery:** zero missing/corrupt images; check original public URL SHA-256, MIME and intrinsic dimensions, plus actual browser `currentSrc`, `srcset`, `sizes`, loading/decoding/fetch priority and rendered box. Optimized bytes may differ from original bytes. Confirm Merchant mapping/rights and both feed contracts unchanged; sitemap pair set remains empty for this scope.
4. **Visual:** inspect 375×812, 768×1024 and 1440×900; select every image and open/close lightbox; check crops, mobile overflow, readable detail and image-switch stability. Industry gallery uses two columns until 768px but `sizes` switches at 640px: inspect 641–767px before assuming correct resolution. Do not turn this existing discrepancy into an unscoped template rewrite.
5. **Performance:** five comparable cold production-build runs plus one warm run, fixed browser/DPR/network/CPU/consent; record all runs and median LCP, CLS, LCP resource, initial image bytes/count. Stable aspect/height containers are valid layout reservation for `fill` images. Do not lazy-load LCP; do not prioritize every gallery image.
6. **Release:** exact-candidate CI, confirmed deployment, actual browser/HTTP readback and observation date. Account for cached XML/images. Build success is not live parity, indexing or conversion proof.

Proposed local release tolerances: no image-attributable shift; total CLS ≤0.1 with no median increase >0.02; median LCP ≤2.5s with no repeatable increase exceeding both 10% and 200ms; initial image bytes increase ≤10% unless explicitly reviewed. A pre-existing failure must be recorded and not worsened, not relabelled passing. These are project tolerances; Google’s field thresholds apply to p75 visits, not five lab runs. See [Web Vitals](https://web.dev/articles/vitals) and [Google image guidance](https://developers.google.com/search/docs/appearance/google-images).

## Measurement and learning contract

Before an indexed-route mutation, take finalized 28-day current/prior GSC windows ending D: current D−27 through D, prior D−55 through D−28. Fully paginate and retain filters/freshness. Compare page clicks/impressions/CTR and impression-weighted position plus stable query/page pairs and cannibalization; do not sum query rows and pretend they equal unfiltered property totals. Missing or privacy-suppressed data is not zero.

GA4 measures behavior after arrival: available product views, add-to-cart, checkout starts, purchases and qualified quote evidence, segmented by landing page, source/medium and device. Use consistent denominators and period definitions. GSC clicks and GA4 sessions are different measurements and need not match one-for-one. Consent, timezone, attribution and reporting lag can explain differences. Validate event coverage before declaring a weak funnel; first-party paid orders/quotes are commercial evidence distinct from GA4 credit. Never join a GSC query to an individual customer or invent historical attribution.

Record each hypothesis, exact image/version/placement, release time, traffic source, denominator, outcome, confounders, and decision as **positive / negative / inconclusive**. Maintain organic guardrails separately from conversion and social engagement. Low traffic does not prove improvement; likes do not prove orders. A before/after association is not proof imagery caused it. Preserve evidence labels and superseded decisions; no automatic permanent rule from one attractive or high-engagement post.

Observe at finalized day 7 and day 14 after actual release, honoring the current experiment's stricter gate. September 9 alone does not close Wall Graphics observation. As investigation triggers, flag ≥20% click loss with at least five lost clicks or ≥2-position worsening on stable high-impression query/page pairs; these proposed triggers are not automatic causality/rollback rules. Compare controls, query mix, seasonality and intervening releases. Missing/inconclusive evidence holds the next indexed wave.

## Vault lessons retained, with limits

Sources reviewed: private May 29 regression-prevention record, SEO recovery log and August 28 logo-image release receipt; public context is in [HISTORY-GROWTH](HISTORY-GROWTH.md).

- The May archive reports bundled title/content/schema changes and invisible structured-data loss. Preserve isolation and inspect rendered schema; the narrative alone does not prove one cause for rank changes.
- Older local hooks and five-day recipes are not current cross-environment enforcement. Run checks explicitly; SEO-STANDARD's 7–14 completed-day/finalized-data gate takes precedence.
- Historical orders despite modest rankings show why search position is not the only outcome. Keep unknown attribution visible and do not discard useful commercial pages from GSC alone.
- August 28 records a bounded image-only release with page text/metadata preserved. It verifies that dated deployment, not a conversion lift or present image-sitemap permission. The newer rights filter supersedes old “add every gallery image to sitemap” instructions.
- Preserve keyword intent and meaningful sitemap dates. No bulk lastmod bump, city expansion, schema cleanup or title experiment hidden in a gallery update. Do not restore old ratings or unsupported claims because an old guard once expected them.

## Social harness handoff

Use existing [approval](../social/APPROVAL-PILOT.md) and [portable-system](../social/PORTABLE-SOCIAL-SYSTEM.md) contracts; do not build a duplicate queue. For orderable sales posts, bind product, exact configuration/quantity/current price/tax treatment and matching order URL. Quote-only and coming-soon products need different CTAs. Ordinary contour-cut decals use their actual overall artwork width and height when the verified pricing configuration supports them; exceptional complexity receives individual staff review. Never attach a price from a mismatched quantity, dimensions, material, sides, cut/finish, extras, or tax treatment. Preserve owner-approved photo treatment; a price-bearing caption does not automatically require a new poster-style image.

Recheck facts/availability/rights before dispatch; changed bound facts/content invalidate the applicable approval. Deduplicate dispatch and reconcile uncertain provider results before retry. Keep requested, drafted, approved, scheduled and independently verified published states separate. Catalogue visual approval is not automatic channel permission. These recommendations do not enable hands-off publishing or expand the existing authorized schedule.

Acceptance examples before claiming reusable behavior: ordinary orderable sign, custom-cut quote/configuration mismatch, coming-soon item, service comparison, tall display crop, and already-posted retry. Include stale price, revoked rights, duplicate dispatch and unavailable destination negative cases. Social task owns sample/caption implementation; this document owns website/measurement constraints.

## Rollout and rollback

First prepare private before/after views. Then one noindex product's explicitly bounded gallery change, preserving Merchant mapping; test a materially different product before wider reuse. Next one thumbnail key and all its consumers. Indexed homepage or industry work is a separately gated organic experiment; vehicle decals belongs there. No global IndustryPage find/replace. Original customer-work assets remain preserved while placements are individually decided.

Stop/rollback for wrong-product/customer implications, privacy exposure, asset failure, unintended metadata/schema/robots/link/feed change, broken controls or repeatable performance breach. Prepare an inverse patch for only this wave, retain exact old files, reconcile later commits, and verify live recovery after authorized release. Do not hard-reset shared history or redeploy an old whole site over unrelated changes. No reactive rewrite from one noisy rank reading.

## Checks and completion state

```sh
git status --short --branch
git rev-parse HEAD
git diff --check
bash scripts/codex/check.sh
npx vitest run src/app/image-sitemap.xml/__tests__/route.test.ts src/lib/data/__tests__/image-rights.test.ts
npx vitest run src/lib/merchant/merchant-catalog.test.ts src/app/api/feed/products.xml/route.test.ts src/app/api/feed/local-inventory.xml/route.test.ts src/lib/commerce/__tests__/product-schema.test.ts
npx vitest run src/app/vehicle-decals-saskatoon/__tests__/schema-contract.test.ts
```

An actual app release additionally requires `bash scripts/codex/check.sh --full` and exact-head required CI from `.github/workflows/lint-test.yml`, followed by browser/live checks above. Do not create production orders or send mail for an image audit. Initial independent review passed seven existing files / 14 tests; no browser/performance/indexing proof was claimed. This runbook is durable preparation; automated image checks and the complete replacement engine remain to be implemented.

## Fresh read-only analytics receipt — September 9, 2026

Direct GSC and GA4 reads succeeded at 20:59:39 UTC; no ingestion, backfill or provider settings were changed. GSC reported first incomplete date September 7, establishing finalized comparison windows **August 10–September 6 versus July 13–August 9**. Property-level web clicks declined while impressions increased; GA4 Organic Search sessions increased. These different metrics do not establish image regression, causal improvement or an experiment unlock. No `/products/*` rows appeared in either GSC page report, consistent with source noindex behavior but not a URL Inspection verdict.

The current GA4 organic helper excludes `/products/*`, so it is unsuitable for product-gallery measurement. Use explicitly scoped product-landing/event reports instead, with their limitations recorded. The direct read classified all recorded purchases in both comparison windows as Unassigned; revenue cannot currently be attributed to a product-gallery version or acquisition channel from this report. Do not turn missing attribution into “zero product sales,” compare session growth with unattributed revenue as a conversion lift, or replay old transactions to fill the gap.

Private aggregate evidence stays outside this public repository. Required next measurement work: validate consent-aware product-view/cart/checkout coverage and purchase-to-source continuity using genuine future activity; use the existing analytics repair contract rather than a second tracker. No new order, payment or customer communication is required by this documentation check. Fresh data alone does not close the active Wall Graphics observation or prove new gallery images improve orders.
