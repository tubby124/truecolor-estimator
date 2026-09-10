# Gallery batch two — postcards and retractable banners

Owner requested additional noindex product galleries after the coroplast pilot. Approval reference: `owner-gallery-batch-two-20260909`. Source baseline and successful prior release: `0346691e244380cf6d500c8e57a291804debb4c0` ([PR 79](https://github.com/tubby124/truecolor-estimator/pull/79)). Fresh live coroplast recheck found zero differences across nine HTML contracts and both feeds/sitemaps. This is strong evidence against a technical SEO regression, not proof of future rank stability or conversion improvement.

## Acceptance examples and scope

Two materially different examples are fixed before implementation: (1) postcards: small double-sided printed pieces with a legible front/address reverse; (2) retractable banner: a tall 1024×1536 original and full-height stand illustrations, with top rail, face, cassette and feet kept visible. Both must select every image, retain its reserved box and support keyboard/lightbox controls at 375, 768 and 1440 px. This tests the existing display binding/component beyond four variations of one sign.

Only `getProductDisplayGallery` data for `postcards` and `retractable-banners` is added. `ProductPageClient` and `ProductDisplayGallery` remain unchanged. All new assets use versioned filenames; no original is overwritten. The existing coroplast sequence remains identical.

| Product | Final sequence | Excluded |
|---|---|---|
| Postcards | Original cyan/magenta hero; coastal front/reverse detail; gallery-counter rack; Harbor Point alternate | Overview illustration has inconsistent artwork between supposed copies. |
| Retractable banners | Original cyan/magenta hero; After Hours illustration; mountain/lake foyer; yoga-studio alternate | Hardware close-up cannot establish the exact Economy/Deluxe/Premium tier. |

All new images are illustrative artwork, not customer installations or proof of a specific hardware tier. Alt describes the visible image without adding dimensions, material certification, regulatory, price or durability claims. The existing fourteen customer/reference entries (four postcards, ten retractable) remain in original data/files and their other placements; only their product-detail display placement is replaced.

## Search and consumer controls

The two `/products/{slug}` routes and canonical/legacy/unknown Merchant query variants retain existing noindex/follow. `noindex` controls search indexing; it is not a blanket exemption from shared-site regressions. See [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing) and [image guidance](https://developers.google.com/search/docs/appearance/google-images).

Preserve title, description, H1/H2, canonical, robots, internal anchors, OG/Twitter, JSON-LD, all product facts/prices and order behavior. No global loading, cache or image format configuration changes. No indexed content or sitemap date changes.

Complete source consumer classes preserved: `products-content.ts` hero/gallery data; `productImages.ts` catalogue/cart/related thumbnails; `IndustryPage` product card map and route galleries; `/why-true-color`; Merchant catalog and rights; primary/local inventory XML; both sitemap routes; homepage `HeroSlider` (retractable hero); `/gallery` and customer records; indexed `/postcard-printing-saskatoon` and `/retractable-banners-saskatoon`; other product detail pages including coroplast. These consumers continue reading their original files/data and do not read the display registry. The image sitemap retains its existing empty emitted set despite historical source entries.

Exact unchanged Merchant heroes:

- Postcards: `/images/products/product/postcards-800x600.webp`, offer `tc-postcards-5f8ac3be2a8e`, SHA `5260515024468e08356da4947d3d559f783a55714e5fd634e50506347f9d3ebd`.
- Retractable: `/images/products/product/retractable-stand-600x900.webp`, offer `tc-retractable-banners-85e2542c9a34`, SHA `c1c12c72fca9ae4bd7ab408a2062375af76ffa22c18571e0f458368e7b22eda3`. Actual dimensions are 1024×1536, not the historical filename dimensions.

## Image SEO and provenance

Current GitHub [SEO standard](SEO-STANDARD.md), protected-page rules and [gallery assurance](GALLERY-ASSURANCE.md) were reviewed. The `seo-images` skill applies to this and future image work. [Asset receipt](GALLERY-BATCH-TWO-ASSETS-20260909.json) binds every slot, source/delivery hash, real dimensions/format/bytes, alt, owner website authority, channel boundary and expiry limitation.

All six selected source PNGs are byte-identical to retained local generated outputs. Structured provider result receipts are unavailable. Only retractable overview has a saved exact-version prompt; prompt linkage for the other five remains unproven. These limitations are explicit and private paths stay outside GitHub. There is no new Merchant, sitemap, social or ad-creative distribution clearance.

Six delivery files are 1200×900 WebP, 80,446–143,492 bytes; zero exceed the skill's 200 KB content warning. The two postcard lifestyle sources exceed the aspirational 100 KB content target; actual responsive delivery and legibility are checked. Existing heroes remain first, eager/preloaded/high priority. Thumbnails/hidden zoom images remain lazy/async; main and thumb boxes reserve space. `object-contain` preserves full tall artwork. No material interpretation is inferred from filenames.

## Verification and release state

Required before release: exact image/hash/alt/consumer unit contracts; production-build browser tests for all three galleries and screen sizes; before/after semantic sweeps for each product including its indexed counterpart, homepage and older banner Merchant URL, both feeds and both sitemaps; source/optimized MIME/decode/cache/DPR and visual readback; five cold plus one warm production-build runs per mobile/desktop/product with the existing fixed protocol and tolerances. Preserve the original coroplast performance evidence; this batch gets separate raw evidence.

Source changes are data/asset/test/docs only. Existing Ayotte customer-gallery dimension mismatch and three untracked warnings remain unchanged and out of scope; this record does not relabel that validator passing. Keep source price/postal claims outside this image change rather than broadening it into copy correction.

Exact-head GitHub checks, Railway success for the merged revision and public image/SEO/feed readback establish deployment. Candidate-stage notes do not claim live completion. The merged PR's dated release receipt and private task package record final IDs and outcomes. Lab data is not field p75 or evidence that imagery caused a ranking/sales change. Finalized organic observation remains required before indexed-route expansion; the noindex gallery request does not unlock that wave.

## Scoped rollback

From current main, remove only the two new cases and their arrays from `product-display-galleries.ts`; keep the coroplast case/component untouched. The unchanged legacy gallery immediately resumes from the complete retained hero/gallery data. Reconcile later dependencies before reverting batch tests/receipt; retain public new image URLs to avoid breaking later references. Run required CI and compare the same live contracts after deployment. Do not reset the whole site to the baseline or revert unrelated later commits.


## Local verification receipt

Full local gates passed: 164 unit-test files / 1,558 tests, TypeScript, lint (29 existing warnings), pricing (two existing warnings), Ads contracts and production build. All nine browser contracts passed for coroplast/postcards/retractable at three widths, using real optimizer requests. Independent source/asset review approved the bounded diff. The homepage semantic verifier uses bounded DOM-ready/H1 detection because a rotating homepage does not settle at network-idle; product checks retain their prior network-idle policy. Same policy applies before and after.

Postcards: 14 semantic records (10 HTML + four XML), zero differences/errors. Retractable: 15 records (11 HTML + four XML including the original long Merchant alias), zero differences/errors. Production robots.txt allows the product routes to be crawled; all tested product pages retain noindex/follow. No URL Inspection or future ranking verdict is inferred.

| Product / viewport | LCP before → after | CLS before → after | Initial image bytes before → after |
|---|---|---|---|
| Postcards / 375 | 292 → 324 ms | 0.05486 → 0.05041 | 35,140 → 33,670 (−4.2%) |
| Postcards / 1440 | 352 → 308 ms | 0.01427 → 0.01313 | 115,748 → 90,528 (−21.8%) |
| Retractable / 375 | 292 → 344 ms | 0.05191 → 0.05745 | 47,186 → 36,696 (−22.2%) |
| Retractable / 1440 | 388 → 320 ms | 0.00993 → 0.01084 | 110,700 → 88,872 (−19.7%) |

Five cold and one warm production-build runs per product/width; Chromium 145.0.7632.6, DPR1, 40 ms latency, 10 Mbps, 4× CPU slowdown and consistent request isolation. All release tolerances pass; zero image-attributable shift entries. All four views per product pass keyboard/zoom, dimensions and overflow checks at all three widths. These medians are controlled lab evidence, not field p75 or commercial lift.

DPR2 verification covered all four views × three widths × two products: 24 successful optimized WebP decodes, warm optimizer HIT for every view, largest measured delivered image 59,224 bytes. Source hashes remain separate from optimized response bytes.
