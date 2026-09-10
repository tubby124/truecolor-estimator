# Product-gallery rollout tracker

Updated September 10, 2026. This is the durable sanitized state for the isolated `/products/*` display-gallery rollout. These routes are source `noindex,follow`, but their component and image delivery are shared-site concerns. Every released row preserves its original first hero; no row grants Merchant, feed, image-sitemap, social, Ads, GBP or email use to a new display illustration.

## Released bindings

| Product | Asset receipt / exact display paths | Review, test and release state | Facts and rights state | Rollback source |
|---|---|---|---|---|
| Coroplast Signs | `COROPLAST-PILOT-ASSETS-20260909.json`; `/images/products/gallery/coroplast-signs/coroplast-signs-{overview,application,alternate-design}-v1-1200w.webp` | Approved/reviewed in receipt and hash/dimension/right tests; PR 79 merged, deployed and live verified | Original Merchant hero retained; material-detail held | Original `heroImage` plus `galleryImages` in `products-content.ts` |
| Postcards | `GALLERY-BATCH-TWO-ASSETS-20260909.json`; `/images/products/gallery/postcards/postcards-{material-detail,application,alternate-design}-v1-1200w.webp` | Approved/reviewed in receipt and hash/dimension/right tests; PR 80 merged, deployed and live verified | Original Merchant hero retained; inconsistent overview held | Original hero and three retained legacy gallery paths |
| Retractable Banners | `GALLERY-BATCH-TWO-ASSETS-20260909.json`; `/images/products/gallery/retractable-banners/retractable-banners-{overview,application,alternate-design}-v1-1200w.webp` | Approved/reviewed in receipt and hash/dimension/right tests; PR 80 merged, deployed and live verified | Original Merchant hero retained; hardware-tier detail held | Original hero and ten retained legacy gallery paths |
| Window Decals | `GALLERY-BATCH-THREE-ASSETS-20260910.json`; `/images/products/gallery/window-decals/window-decals-{overview,material-detail,application,alternate-design}-v1-1200w.webp` | Approved/reviewed in receipt and hash/dimension/right tests; PR 82 merged; fresh production page, alt and overview-byte readback verified | Opaque-cut-vinyl framing only; original Merchant hero retained | Original hero and six retained legacy gallery paths |
| Brochures | `GALLERY-BATCH-THREE-ASSETS-20260910.json`; `/images/products/gallery/brochures/brochures-{overview,material-detail,application,alternate-design}-v1-1200w.webp` | Approved/reviewed in receipt and hash/dimension/right tests; PR 82 merged; production page, alt, overview-byte and gallery-control readback verified | Tri-fold/half-fold framing only; original Merchant hero retained | Original hero and three retained legacy gallery paths |

All receipt files bind source/delivery hashes, dimensions, bytes, alt text, provenance limitation and channel boundary. Tests in `product-display-galleries.test.ts` enforce the original-first sequence, explicit alt, decoded dimensions, delivery hashes, Merchant-hero preservation and sitemap denial. The registry is the only changed consumer; `products-content.ts`, `productImages.ts`, Merchant/feed routes, sitemaps, homepage, indexed pages and customer galleries retain their prior data.

## Not eligible for the next wave yet

| Product group | State | Blocking next action |
|---|---|---|
| Vinyl banners, ACP signs, flyers, business cards, photo posters | No cleared new display set recorded | Review candidate bytes visually; bind provenance, product truth, website-display rights, descriptive alt and original-hero hash before selection. |
| Foamboard displays, stickers | Product/material facts remain unresolved in current records | Obtain product-fact clearance before any illustrative selection. |
| Vehicle magnets, window perf, magnet calendars | Demand/availability or exact physical-image hold | Reconfirm operational truth and source clearance; a gallery cannot make an offer eligible. |
| Vinyl lettering, boat registration numbers, rack cards, door hangers, coil-bound booklets | Product identity, installation boundary, demand or supplier/image proof unresolved | Establish the exact printed object and rights before creating a public product example. |
| Product/cosmetic/freezer/candle/roll labels, custom-shape signs | Alias, quote-only or named-client/privacy/factual holds | Do not duplicate an offer family or reuse a customer/named-client image; resolve each hold separately. |
| Logo vectorization, image upscale, custom logo design, artwork setup | Service rather than a physical display-gallery candidate | Excluded from this product-image rollout. |

## Separate indexed-image distribution receipt

The seven previously promoted leads are not a new product-gallery asset wave. Owner later authorized a separate, narrow image-search distribution release: the already-approved ACP signs, business cards, flyers, foamboard, vehicle magnets, vinyl banners and vinyl lettering images appear on their matching indexable service page and each page/image pair is present in the image sitemap. [PR 87](https://github.com/tubby124/truecolor-estimator/pull/87) is live; the [harness receipt](PROMOTED-IMAGE-SEO-HARNESS-20260910.md) owns hashes, delivery evidence, channel boundaries and observation limits. This does not clear other images or change the factual holds above.

## Next safe wave

No 8–12-product implementation wave is currently eligible: only the five released products have a recorded, visually reviewed, hash-bound website-display asset set. The next safe action is a source-review tranche for the first five unblocked physical families (vinyl banners, ACP signs, flyers, business cards and photo posters). It may become an 8–12-product PR only when at least eight products pass the same asset, factual and rights gates; otherwise the tracker remains a hold rather than widening a weaker set.

For each future row, record product/route/slot, old and new paths, original and delivery SHA-256, width/height/format/bytes, truthful alt, provenance/channel/expiry, approval reference, consumer map, rollback source, local/CI/deploy/live status and next action. Run the release gates in `GALLERY-ASSURANCE.md`; do not infer SEO, ranking or conversion impact from those checks.
