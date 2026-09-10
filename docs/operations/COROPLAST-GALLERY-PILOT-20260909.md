# Coroplast display-gallery pilot — September 9, 2026

Owner decision `owner-coroplast-site-pilot-20260909`: use the reviewed catalogue direction, retain the existing cyan/magenta FOR SALE sign, and test/deploy a bounded pilot if checks pass. **Candidate record; deployment must be independently verified.** This supersedes the earlier private five-view proposal for this release only. The material-detail view is excluded because the depicted open flutes and stake orientation are questionable.

Read [SEO standard](SEO-STANDARD.md), [gallery assurance](GALLERY-ASSURANCE.md) and current GitHub main rules before subsequent image work. Apply the `seo-images` skill. Current source and successful production baseline: `06801b4dddfdd4c61caf6689084e672807d8b843`; Railway deployment `e3af7d8d-69cf-45c4-acfe-f764c1cc90be`. These are dated observations, not permanent pointers.

## Exact placement and consumer contract

Only `ProductPageClient` for slug `coroplast-signs` selects the new explicit display binding. Normal, canonical Merchant query, legacy Merchant query and unknown-query versions of `/products/coroplast-signs` retain `noindex, follow` and their existing query-specific commercial behavior. All other product slugs use the unchanged legacy gallery component and data.

| Final slot | Image | Old placement disposition |
|---|---|---|
| 1 | `/images/products/product/coroplast-yard-sign-800x600.webp` | Original FOR SALE remains first, unchanged bytes. Actual dimensions 1536×1024; filename is historical. |
| 2 | `/images/products/gallery/coroplast-signs/coroplast-signs-overview-v1-1200w.webp` | New illustrative community-garden view. |
| 3 | `/images/products/gallery/coroplast-signs/coroplast-signs-application-v1-1200w.webp` | New illustrative greenhouse/Plant Sale view. |
| 4 | `/images/products/gallery/coroplast-signs/coroplast-signs-alternate-design-v1-1200w.webp` | New illustrative blue/red real-estate view. |

The fourteen old customer-reference entries no longer appear in this product-detail placement, but their complete original list remains in `products-content.ts` and their files and customer portfolio records are retained. The old effective hero-plus-gallery list can be restored through the inverse binding patch below. The mixed-category final Best Donairs banner reference is not carried into this new coroplast placement.

Preserved transitive consumers: Merchant `heroImage`/rights and offer `tc-coroplast-signs-0ace18fa203c`; both primary/local inventory feeds; `/why-true-color`; catalogue/cart/related thumbnail bindings; indexed `/coroplast-signs-saskatoon`; the shared IndustryPage mapping (including 71 coroplast-card routes); homepage and `/gallery`; standalone `/vehicle-decals-saskatoon`; all other product-detail pages. No changes to the shared maps, customer data, title, descriptions, H1/H2, canonical, robots, links, OG/Twitter, JSON-LD, sitemap dates or empty image sitemap.

## Provenance, rights and delivery

[Asset receipt](COROPLAST-PILOT-ASSETS-20260909.json) binds original source hashes, exact derivative hashes/dimensions/format/bytes, approval identifier, scope, expiry limitation and retained Merchant record. Exact current alt values are held in `src/lib/data/product-display-galleries.ts` and tested. New assets are AI-generated illustrations; local source bytes match retained generated files and saved exact-version prompt references. A provider generation-result receipt is unavailable; none is invented. Public context uses illustrative alt descriptions and makes no customer-installation claim. Website placement authorization does not clear Merchant, image sitemap, social or ads reuse.

Images retain descriptive versioned filenames. Next Image serves real responsive optimizer requests; no test substitutes original files for optimizer URLs. The initial original image is preloaded/high fetch priority and not lazy; thumbnails and closed lightbox image are lazy with async decoding. The 4:3 main box, square thumbnails and bounded lightbox reserve layout space. No global format/cache configuration changed. Source overview/application WebPs exceed the skill's 200 KB content warning; they are 1200px zoom sources, not the initial download. Actual delivered responsive bytes and DPR coverage are release evidence; do not mistake source bytes for page transfer. The original filename is preserved for existing consumers.

## Verification and open measurement

- Full local project check passed: 164 unit-test files / 1,552 tests, TypeScript, lint, pricing/Ads contracts and production build. Lint retains 29 existing warnings; pricing retains two existing warnings.
- Focused asset/hash/consumer contracts and three browser viewport tests cover all four views, real optimized decode, explicit alt, stable boxes, keyboard open/Tab/Shift+Tab/Escape/focus return and overflow. The modal has one close control and explicitly wraps Tab to it.
- Nine HTML route/query contracts are compared semantically, including headers, metadata, headings, links and parsed structured data. Both feeds and both sitemaps compare byte-for-byte before/after; image sitemap remains empty.
- Gallery-wide validator has a pre-existing Ayotte dimensions mismatch (manifest 1200×900, actual 900×1200) plus three untracked warnings. Those unchanged customer-gallery records are outside this pilot; their failure is recorded, not relabelled passing. New pilot asset contracts independently pass.
- Private evidence includes before/after screenshots, actual originals and optimized responses, five cold and one warm production-build runs per mobile/desktop viewport, fixed Chromium/DPR/network/CPU and retained raw runs. An initial noisy mobile CLS difference exceeded tolerance and was retained for audit. The final sequential quiet comparison passed: mobile median LCP 272→276 ms, CLS 0.05380→0.05425, initial image bytes 52,560→35,404; desktop LCP 304→296 ms, CLS 0.01188→0.01406, bytes 134,828→108,776. No image-attributable shift. Same Chromium 145.0.7632.6, DPR 1, 40 ms latency, 10 Mbps and 4× CPU slowdown, five cold plus one warm run each. Lab performance is not field p75.
- Exact-head GitHub CI, successful deployment and live readback remain separate release gates. Do not infer deployment from this document. Private final receipts retain exact candidate/merge/deployment IDs and UTC readback.

This is the first website slice of the gallery assurance workflow. It does not deploy the full 124-image collection or enable the social publishing harness. Before broader reuse, test a materially different product and honor the active organic observation gate. Fresh product-specific analytics coverage and finalized day-7/day-14 observation remain needed; no conversion or ranking lift is claimed.

## Bounded rollback

Prepare a new branch from current main. Restore only `ProductPageClient.tsx` imports, display-gallery lookup and gallery expression to the baseline version shown by `git show 06801b4d:src/components/product/ProductPageClient.tsx`, reconciling any later unrelated edits. The legacy `ProductGallery` and complete original data/files are unchanged and immediately available. Remove the new binding/component/test/CI invocation together only if no later consumer depends on them; keeping unreferenced new image files avoids broken external URLs and is safe. Never roll back the whole site, reset shared history or replace current main with the dated baseline.

Run focused contracts, full required CI and the same HTML/feed/image/browser readback after rollback. Unexpected SEO/feed changes, broken image/control behavior, materially misleading imagery or repeatable performance breach trigger investigation and this scoped inverse patch. A noisy ranking sample does not establish cause.
