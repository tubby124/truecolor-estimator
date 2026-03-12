# True Color Full Site Audit — 2026-03-12

## Executive Summary

Multi-stream audit covering code quality, SEO/schema, visual UX, and live site Playwright testing.
- **100/100 tests pass**, TypeScript clean
- **6 bugs found and fixed** (2 pricing, 1 schema, 1 metadata, 1 review count, 1 review count architecture)
- **Rankings confirmed**: business cards #1, banner #2, flyer #3, sign company #4, coroplast #5

---

## Stream 1: Code Quality (Tests + TypeScript)

**Status:** COMPLETE — 100/100 tests pass, 0 TypeScript errors

### P0 Fix: Rush Fee Double-Counting in Orders API

**File:** `src/app/api/orders/route.ts`
**Bug:** `revalidateItemPrices()` passed `is_rush` to `estimate()`, which added $40 to each item's `sell_price`. Then the order-level rush logic added another $40 flat fee. Result: rush orders overcharged by $40 per item beyond the first.
**Fix:** `is_rush: false` hardcoded in `revalidateItemPrices()`. Rush remains a flat $40 per-order fee applied at the order level only.
**Regression test added:** "rush fee not double-counted" test case in engine.test.ts.

### P1 Fix: is_lot_price Default Logic in Loader

**File:** `src/lib/data/loader.ts`
**Bug:** `is_lot_price` parsed as `r[16]?.toUpperCase() === "FALSE" ? false : true` — any empty/missing value defaulted to `true` (lot priced). Most pricing rules are NOT lot-priced, so empty values were silently treated as lot-priced.
**Fix:** `is_lot_price: r[16]?.toUpperCase() === "TRUE"` — explicit opt-in. Empty/missing = `false`.
**Regression test added:** "is_lot_price defaults to false when empty" test case.

### Flyer Half-Size Test Expectations

**File:** `src/lib/engine/__tests__/engine.test.ts`
**Fix:** Test expectations updated to match actual CSV data (flyer sizes and pricing).

---

## Stream 2: SEO Technical + Schema Audit

**Status:** COMPLETE

### P3 Fix: Missing openGraph on 3 Non-Ranking Pages

**Files:**
- `src/app/foamboard-printing-saskatoon/page.tsx`
- `src/app/school-signs-saskatoon/page.tsx`
- `src/app/trade-contractor-signs-saskatoon/page.tsx`

**Bug:** These 3 pages had `canonical` but no `openGraph` metadata. Social shares and AI previews showed generic fallbacks.
**Fix:** Added `openGraph: { title, description, url, type: "website" }` to each. Also normalized canonical to relative path format (consistent with other pages).

### Fix: Product Schema Relative Image URL

**File:** `src/app/products/[slug]/page.tsx`
**Bug:** Product schema `image` field was `product.heroImage` (relative path like `/images/products/...`). Schema.org requires absolute URLs. Google Rich Results Test flagged this.
**Fix:** `image: \`https://truecolorprinting.ca${product.heroImage}\``

### Schema Status (Confirmed Good)
- LocalBusiness + AggregateRating (5.0, 29 reviews) in layout.tsx
- Entity `@id` linking across LocalBusiness, WebSite, Organization
- Service + FAQPage + BreadcrumbList on all 50+ IndustryPage pages
- Product schema on all 16 product pages (now with absolute image URLs)
- WebSite schema with SearchAction
- Twitter Card metadata
- 8 AI crawlers explicitly allowed in robots.ts

---

## Stream 3: Playwright Live Site Audit

**Status:** COMPLETE — 22 screenshots captured (Mar 5)

### Screenshots Captured
| # | Page/Section | File |
|---|-------------|------|
| 00 | Homepage hero + CTA | `00-homepage.png` |
| 01 | Homepage reviews widget | `01-homepage-reviews.png` |
| 02 | Local shop section | `02-local-shop-section.png` |
| 03 | Products + How It Works | `03-products-howitworks.png` |
| 04 | Footer | `04-footer.png` |
| 05 | Footer bottom | `05-footer-bottom.png` |
| 06 | Nav products dropdown | `06-nav-products-dropdown.png` |
| 07 | Nav industries dropdown | `07-nav-industries-dropdown.png` |
| 08 | Product estimator | `08-product-estimator.png` |
| 09 | Estimator scroll | `09-estimator-scroll.png` |
| 10 | Add to cart | `10-add-to-cart.png` |
| 11 | Cart page | `11-cart.png` |
| 12 | Checkout page | `12-checkout.png` |
| 13 | Industry landing page | `13-industry-page.png` |
| 14 | Industry FAQ section | `14-industry-faq.png` |
| 15 | FAQ accordion open | `15-industry-faq-accordion.png` |
| 16 | Mobile homepage | `16-mobile-homepage.png` |
| 17 | Mobile local shop | `17-mobile-localshop.png` |
| 18 | Mobile local shop full | `18-mobile-localshop-full.png` |
| 19 | Mobile CTA check | `19-mobile-localshop-ctacheck.png` |
| 20 | Quote page | `20-quote-page.png` |
| 21 | About page | `21-about-page.png` |

### Live Site Observations
- Homepage renders correctly with Instagram feed widget
- Trustindex reviews widget loading
- Product estimator functional (price calculator, add to cart flow)
- Industry pages render with photo cards, FAQ accordions
- Mobile responsive — CTAs visible above fold
- Footer NAP consistent (216 33rd St W, Saskatoon SK S7L 0V5)

---

## Stream 4: Review Count — Centralized to Single Source of Truth

### Problem
Review count was hardcoded as a raw number ("27" or "29") in 8 separate files. Every time a new Google review came in, all 8 had to be updated manually. One file (`order-confirmed/page.tsx`) was still showing "27" — missed in the prior update.

The homepage `ReviewsSection.tsx` already fetches the live count from Trustindex CDN and parses it dynamically. But none of the trust badges, schema, or other pages used that.

### Fix: `src/lib/reviews.ts` — Single Source of Truth

Created `src/lib/reviews.ts` exporting `REVIEW_COUNT` and `RATING_VALUE`. All 8 files now import from this one location:

| File | Type | Before | After |
|------|------|--------|-------|
| `layout.tsx` | server (schema) | `reviewCount: "29"` | `reviewCount: String(REVIEW_COUNT)` |
| `page.tsx` (homepage) | server | `"5.0 stars · 29 reviews"` | `{REVIEW_COUNT}` interpolation |
| `contact/page.tsx` | server | `"on Google · 29 reviews"` | `{REVIEW_COUNT}` interpolation |
| `order-confirmed/page.tsx` | server | **"27 Saskatoon businesses"** (stale!) | `{REVIEW_COUNT}` interpolation |
| `SiteFooter.tsx` | server | `"5.0 ★ on Google · 29 reviews"` | `{REVIEW_COUNT}` interpolation |
| `checkout/page.tsx` | client | `"5.0 stars · 29 reviews"` | `{REVIEW_COUNT}` interpolation |
| `quote-request/page.tsx` | client | `"· 29 reviews"` | `{REVIEW_COUNT}` interpolation |
| `PriceSummary.tsx` | client | `"5.0 · 29 local Google reviews"` | `{REVIEW_COUNT}` interpolation |

**How it works now:**
- Homepage `ReviewsSection` still fetches the live count from Trustindex (dynamic, revalidates every hour)
- All trust badges + schema import from `src/lib/reviews.ts` — update ONE file when the count changes
- No more missed files, no more stale counts

---

## Current Rankings (GSC Confirmed 2026-03-12)

| Keyword | Position | Page |
|---------|----------|------|
| business cards saskatoon | **#1** | /business-cards-saskatoon |
| print banner saskatoon | **#2** | /banner-printing-saskatoon |
| flyer printing saskatoon | **#3** | /flyer-printing-saskatoon |
| print store sign saskatoon | **#4** | /sign-company-saskatoon |
| coroplast signs saskatoon | **#5** | /coroplast-signs-saskatoon |

---

## Risk Assessment

All fixes are LOW RISK per the wave system:
- **P0 (rush fee):** Backend-only, no SEO page changes
- **P1 (lot_price):** Data loader logic, affects engine accuracy, no page changes
- **P3 (openGraph):** Metadata-only on non-ranking pages
- **P4 (review count):** Text-only, not in H1/title/schema
- **Product image URL:** Schema fix, no visible content change

No ranking pages had H1, title, or content changes. Safe to deploy.

---

## Deferred Items (Future Waves)

Per wave schedule in `truecolor-seo-safety.md`:
- **Wave 4 (~Mar 24):** Service schema `url` + `startingPrice` on ranking pages
- **Wave 5:** Hero height (CLS risk), performance
- **Wave 6:** Sticky mobile CTA, font sizes, tap targets
- UI/UX Tier 1 items #2 (apple-icon), #3 (og-image) — owner actions (Canva)
- UI/UX Tier 2 items — cart loading state, order confirmed fallback, file upload validation
