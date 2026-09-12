# Private homepage and picker preview — September 12, 2026

This is a **private, non-release candidate** on branch
`codex/private-homepage-products-preview`. It does not authorize a deployment,
Merchant/feed update, image-sitemap update, social use, or a new indexed-page
organic experiment.

## Candidate scope

- Preserve homepage title, meta description, canonical, H1, schema, existing
  product destinations, feeds, Merchant `heroImage` bindings, sitemap URLs and
  image-sitemap pairs.
- Make the existing `/products` picker photo-first for every orderable product.
  Door Hangers remains explicitly `comingSoon` and image-free.
- Preserve the two existing indexable service links:
  `/image-upscale-saskatoon` and `/logo-vectorization-saskatoon`.
- Improve local accessibility only: working homepage skip-link target, motion
  pause controls, reduced-motion behavior, and no JavaScript-hidden content.
- Correct the verified equipment wording from `Roland UV` to `Roland TrueVIS
  VG2 eco-solvent printer/cutter`.

## Mobile-first visual standard

This is a visual/usability upgrade, not a replatform or commerce rewrite. The
working product, price, artwork and checkout journeys are protected assets.

- Every changed customer-facing template must be useful at 375px, 768px and
  1440px: one clear next action, readable price and product context, 44px-or-
  larger touch targets where practical, no hidden or overlapped sticky control,
  and no horizontal overflow. Test actual one-hand flows, not a static mock.
- Preserve the same responsive HTML and primary content across devices. Do not
  substitute a thin mobile page, remove indexable copy or links, introduce an
  intrusive interstitial, or rely on JavaScript merely to reveal essential
  information.
- Generated images are labelled as illustrative/product concepts. Authentic
  customer work is visibly labelled as real work and may appear only after an
  asset-level rights, privacy, source and placement review. Never blur the two
  categories to make an offer look like a customer job.
- Keep the existing URL, title, meta description, canonical, H1, structured
  data, internal-link destinations, prices, configurator behavior, cart,
  checkout, Merchant/feed bindings and measurement contracts unchanged unless
  a separately approved, evidence-backed release explicitly changes one.
- Work template-by-template: homepage and `/products` picker are the private
  pilot; product detail, landing-page and checkout templates follow only after
  the pilot's semantic, mobile, performance and business-flow gates pass.

## Experience benchmark and delivery sequence

The benchmark is not a copied competitor layout. Strong print-commerce sites
make the product, proof and next step obvious; True Color should retain its
local, exact-price advantage while making that clarity work in one hand.

1. Capture current production baselines by template and device before visual
   changes: screenshots, semantic diff, Core Web Vitals/Lighthouse, keyboard,
   no-JavaScript, reduced-motion, cart/configurator/checkout and analytics
   collector behavior. Use a collector-blocked private harness for candidate
   browser review so private testing cannot contaminate production analytics.
2. Build a mobile visual QA matrix for homepage, picker, product detail,
   key local landing page, cart and checkout. It records the primary user job,
   thumb-reachable action, content/SEO contract, visual-stability risk, image
   payload budget and pass/fail evidence at 375/768/1440.
3. Finish the private homepage + picker pilot: clean hierarchy, accessible
   retained slider/offer controls, direct product selection, separate real
   work from illustrative offers, and photo-first cards only where placement
   evidence permits.
4. Run independent visual/SEO/accessibility/performance review, then release
   one thin presentation-only slice. Monitor the existing organic observations
   rather than bundling a second indexed-page experiment.
5. Only after the pilot survives its measurement window, repeat the same
   process for the product-detail template, then the remaining templates. Cart
   and checkout receive only verified mobile-friction fixes with full
   purchase-flow regression coverage; they are never casually restyled.

## Candidate-only image placements

| Product | Candidate picker image | Existing evidence | Release limitation |
| --- | --- | --- | --- |
| Rack Cards | `/images/products/gallery/rack-cards/rack-cards-overview-v1-1200w.webp` | `GALLERY-FULL-NOINDEX-ASSETS-20260910.json` | Ledger cleared it for `/products/*` display galleries, not this indexable picker or cart/related consumers. |
| Logo Vectorization | `/images/products/gallery/logo-vectorization/logo-vectorization-overview-v1-1200w.webp` | same ledger | Same limitation. |
| Image Upscale | `/images/products/gallery/image-upscale/image-upscale-application-v1-1200w.webp` | same ledger | Same limitation. |
| Logo Design & Print-Ready Artwork | `/images/products/gallery/custom-logo-design/custom-logo-design-overview-v1-1200w.webp` | same ledger | Same limitation. |
| Artwork Setup & File Fixes | `/images/products/gallery/artwork-setup/artwork-setup-application-v1-1200w.webp` | same ledger | Same limitation. |

Before release, create one explicit placement record per asset that binds its
role, public consumer map (picker, cart, related card), alt text, source and
delivery hash, dimensions, bytes, site-only permission, rollback path and
explicit denial for Merchant, feed, sitemap and social distribution. Do not
alter `PRODUCTS[slug].heroImage`.

## Remaining gates

1. Refresh/reconcile the active Wall Graphics and promoted-image observations
   with finalized GSC data; the calendar does not unlock another organic change.
2. Compare current deployed and candidate semantics: status/redirects,
   canonical, robots, title/description, H1/H2, links, JSON-LD, OG/Twitter,
   feeds and both sitemaps.
3. Run five comparable cold and one warm performance samples at 375, 768 and
   1440 widths; inspect keyboard, focus, reduced-motion, JavaScript-disabled
   and sticky-control behavior.
4. Obtain the exact approved social-logo derivative and its placement/hash
   receipt before any premium offer artwork uses it. The historical transparent
   and white-backed social directions conflict; do not infer one.
5. Obtain independent review, required CI, exact deployment evidence and live
   readback before any authorized release.
