# Standalone Design Services — Orderable SKUs (started 2026-08-06)

## Goal
Make the four design/imaging services buyable on their own, without a print job
attached. Owner decision 2026-08-06 (this session).

| SKU | Service | Price | Landing pages it serves |
|---|---|---|---|
| SVC-DESIGN-LOGO | Logo Recreation / Vectorization | $40 | logo-vectorization-{saskatoon,regina,moose-jaw-sk,prince-albert-sk} |
| SVC-UPSCALE | Image Upscale and Enhancement | $20 | image-upscale-{saskatoon,regina,moose-jaw-sk,prince-albert-sk} |
| SVC-DESIGN-FULL | Full Custom Design ("logo creation") | $40 | graphic-design-saskatoon |
| SVC-DESIGN-BASIC | Basic Artwork Setup / minor edits | $40 | graphic-design-saskatoon |

Prices are NOT new — all four were owner-approved 2026-08-06 and already live in
`data/tables/services.v1.csv`. This work exposes approved prices; it does not set
new ones. That is why `/pricing-review` (competitor research + margin math) is not
re-run here — there is nothing to price. `/pricing-health` still runs before deploy.

## Owner decisions locked this session
1. **All four SKUs** become orderable.
2. **GST only, no PST** on a standalone service order (no printed goods). Matches
   `taxable_pst=FALSE` on all four rows in services.v1.csv.
3. The service order doubles as a **paid intake form** — customer describes the job
   and uploads source files, then pays. We contact them from there.

## Key findings (verified in code, do not re-derive)
- **Checkout already does the intake.** `src/app/checkout/page.tsx:138-141` has a
  1000-char notes field + multi-file artwork upload through `/api/upload`. Nothing
  new needs building for brief + file upload — the services just need to REACH
  checkout. Order notes cap enforced at `api/orders/route.ts:185`.
- **Engine already speaks service SKU.** `src/lib/engine/index.ts:543-546`
  (`buildWaveName`) resolves `SVC-` material codes to the real service name for Wave
  invoice lines. `categoryLabel` has `DESIGN` and `SERVICE` entries (lines 588-590).
- **Fixed-price match works with no dimensions.** `index.ts:70-78` only compares
  width/height when `req.width_in`/`req.height_in` are truthy. A products.v1.csv row
  with qty=1, sides=1 and matching category+material_code matches a dimensionless
  request. `minCharge` resolves to 0 (no DESIGN rule in pricing_rules.v1.csv).
- **PST is the one real code change.** `api/orders/route.ts:380` sets
  `pstBase = discountedSubtotal + rush` — PST on everything. `lib/pricing/tax.ts:32`
  does the same. Both must exempt DESIGN/SERVICE category lines or a $40
  vectorization wrongly collects $2.40 PST.
- Product pages are `noindex` (next.config header on `/products/:path+`), so new
  service product pages need **no sitemap entry and carry no ranking risk**.
- All 9 service landing pages currently set `primaryProductSlug="vinyl-banners"` —
  "Get My Price" sends a vectorization lead to the vinyl banner configurator. This
  is the headline bug being fixed.

## Waves
- [ ] **Wave 1 — make them buyable**: 4 entries in `src/lib/data/products-content.ts`;
      service mode in `ProductConfigurator.tsx` (no size/sides/qty UI, qty forced to 1).
      **NO CSV CHANGE NEEDED** — see below.

### Verified 2026-08-06: zero CSV work required
`PR-SVC-DESIGN-{BASIC,FULL,LOGO}` and `PR-SVC-UPSCALE` already exist in
`pricing_rules.v1.csv` with `price_per_unit` set (40/40/40/20), no sqft range and
no qty bounds — so the engine's STEP 4a unit-rule path (`index.ts:113-134`) already
prices them. Confirmed live against `POST /api/estimate`:

| Request | Result |
|---|---|
| `{category:DESIGN, material_code:SVC-DESIGN-LOGO, qty:1, sides:1}` | QUOTED $40 — "Design – Logo Recreation / Vectorization" |
| `{category:DESIGN, material_code:SVC-DESIGN-FULL, qty:1, sides:1}` | QUOTED $40 — "Design – Full Custom Design" |
| `{category:DESIGN, material_code:SVC-DESIGN-BASIC, qty:1, sides:1}` | QUOTED $40 — "Design – Basic Artwork Setup" |
| `{category:SERVICE, material_code:SVC-UPSCALE, qty:1, sides:1}` | QUOTED $20 — "Image Upscale and Enhancement" |

No rows added to `products.v1.csv`. `/pricing-review` therefore does not apply —
no price is being created or changed anywhere in the data layer.
- [ ] **Wave 2 — tax correctness**: exempt DESIGN/SERVICE lines from PST in
      `api/orders/route.ts` + `lib/pricing/tax.ts` + checkout total preview.
      Gate: `/ecommerce-ux` before this ships.
- [ ] **Wave 3 — wire the funnel**: repoint `primaryProductSlug` on all 9 landing
      pages, add the service to their `products` arrays, add
      `INDUSTRY_PRODUCT_IMAGES` entries.
- [ ] **Wave 4 — verify**: `npm run validate:pricing`, `npm test`, `/pricing-health`,
      `/e2e-test`, then push.

## Images
`logo-vectorization-product-800x600.webp` and `image-upscale-product-800x600.webp`
already exist in `public/images/products/product/`. There is no dedicated art for
the two generic design SKUs — reusing `logo-vectorization-formats-800x600.webp`
for now; generate proper art later via `/truecolor-images`.

## Known drift found along the way (not fixed — separate concern)
`products-content.ts` stickers entry says "In-house design from $35". Design is
$40 flat as of 2026-08-06 per `.claude/rules/truecolor-pricing-comms.md`. Grep the
whole file for `$35`/`$50`/`$75` design references before the next pricing deploy.
