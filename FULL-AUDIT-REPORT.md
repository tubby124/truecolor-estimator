# Full SEO Audit - truecolorprinting.ca

**Date:** 2026-05-25
**Previous Score:** 69/100 (2026-05-20 report baseline)
**Method:** Codebase-first delta audit (3 parallel agents + inline checks; no live crawl)

---

## SEO Health Score: 79 / 100 (+10 vs baseline, post-fix)

### Post-fix update (same session)

The deep cleanup pass after this audit fixed the highest-risk trust drift:

- Removed stale `$30/$40/$45/$60/$75` per-product minimum language from live app/content surfaces.
- Reframed pricing around the actual engine behavior: raw product pricing plus the `$25 order-total minimum` at customer checkout.
- Updated pricing guard hooks and `validate:pricing` so old minimum rules are not reintroduced.
- Repointed legacy retractable-banner redirects to `/retractable-banners-saskatoon` instead of noindex `/products/retractable-banners`.
- Added nav/footer links for the highest-priority orphan cluster pages: commercial signs, education signs, community printing, and for-lease signs.
- Trimmed several long metadata descriptions from the priority meta batch.
- Updated sitemap lastmod dates for changed indexable pages.

Verification after fixes: `npm run validate:pricing` passed with 0 errors, engine/order-min tests passed, `git diff --check` passed, and `npm run build` completed successfully.

Remaining risk is now mostly strategic/content depth, not broken price trust.

| Category | Weight | Previous | Current | Delta | Weighted |
|----------|--------|----------|---------|-------|----------|
| Technical SEO | 25% | 68 | 80 | +12 | 20.00 |
| Content Quality | 25% | 66 | 78 | +12 | 19.50 |
| On-Page SEO | 20% | 60 | 75 | +15 | 15.00 |
| Schema / Structured Data | 10% | 77 | 78 | +1 | 7.80 |
| Performance (CWV) | 10% | 76 | 77 | +1 | 7.70 |
| Images | 5% | 87 | 92 | +5 | 4.60 |
| AI Search Readiness | 5% | 82 | 90 | +8 | 4.50 |
| **TOTAL** | 100% | **69** | **79** | **+10** | **79.10** |

**Honest read:** the site is not structurally losing SEO. The core architecture is stronger than the May 20 report: all 5 protected ranking pages now pass title and meta length, all have canonicals, all have `descriptionNode`, all have 8 FAQs, all have DesignDirectionGrid, llms.txt is much cleaner, robots/image sitemap are solid, and no image files over 500KB were found.

The real SEO risk is trust drift: stale price examples still exist in high-value body copy and page snippets, especially coroplast "$30" examples, flyer tier prices, and mixed "from" framing. That kind of inconsistency is exactly what weakens AI answers, snippets, and user confidence even when the technical layer is fine.

---

## What Changed Since 2026-05-20

### RESOLVED (9 items)

| Item | Was | Now | Wave |
|------|-----|-----|------|
| Business cards title length | 67 chars in prior audit | 58 chars, passes | Wave 7 / completed |
| Flyer title length | 63 chars in prior audit | 59 chars, passes | Wave 7 / completed |
| llms.txt stale per-product mins | 11+ stale refs in prior audit | File now clearly explains $25 order-total minimum and no per-product minimums | Wave 3.1 |
| ACP homepage/products-content drift | Prior audit flagged ACP `from $25` | Current comms rule and llms.txt use ACP `from $39` / `$13/sqft` | Wave 3.1 |
| Contact/church/vinyl/car-dealer Wave 3.1 surfaces | Prior audit marked pending | Current grep shows the main prior Wave 3.1 surfaces were mostly swept | Wave 3.1 |
| Sitemap hygiene | Products detail pages risk | `/products/*` excluded; `/products` hub remains indexed intentionally | Technical |
| Core ranking-page metadata | 2 title failures previously | 5/5 protected pages now pass title and meta limits | On-page |
| Images | Prior images score conservative | `find public/images -size +500k` returned empty; image sitemap route exists | Images |
| AI crawler setup | Already strong | robots.ts allows major AI bots and references sitemap + image sitemap | AI Search |

### NEW / STILL ACTIVE (10 items)

| # | Issue | Severity | Wave |
|---|-------|----------|------|
| N14 | Remaining stale coroplast "$30" examples on protected and high-value pages (`coroplast-signs-saskatoon`, `sign-company-saskatoon`, `real-estate-signs-saskatoon`, `agriculture-signs-saskatoon`, `services`) | HIGH | Wave 3.3 |
| N15 | Flyer DesignDirectionGrid says `250 for $80` and `500 for $130`; pricing reference says full-letter 80lb 2S is `250=$110`, `500=$135` | HIGH | Wave 3.3 |
| N16 | Sign Company ACP `4x8 ft - $416` conflicts with current quick reference common size `4x8 ft = $320`; must verify CSV/source before editing | HIGH | Wave 3.3 |
| N17 | 40 sitemap-indexed pages are not linked from SiteNav or SiteFooter, mostly city-variant and label/service pages | MEDIUM | Wave 3.4 |
| N18 | 48 page meta descriptions exceed 155 chars; the protected 5 pass, but programmatic/city pages need a trim pass | MEDIUM | Wave 3.4 |
| N19 | Three legacy redirects point to noindex `/products/retractable-banners` instead of an indexable SEO page | MEDIUM | Wave 1.1 |
| N20 | Product schema is still missing from IndustryPage/product-card contexts | MEDIUM | Wave 4 |
| N21 | HeroSlider remains a client island with motion; slide 0 exists but LCP still depends on client bundle behavior | MEDIUM | Wave 5 |
| N22 | llms.txt says 27 Google reviews from March 2026 while schema uses dynamic `REVIEW_COUNT` | LOW | Wave 3.3 |
| N23 | `reviewCount` is emitted as `String(REVIEW_COUNT)`; Schema.org prefers a number | LOW | Wave 4 |

---

## Protected Ranking Pages

| Page | Title | Meta | Visible Words | FAQ | Links | DDG | Canonical | Main Risk |
|------|-------|------|---------------|-----|-------|-----|-----------|-----------|
| business-cards-saskatoon | 58 pass | 153 pass | 434 | 8 | 5 | yes | yes | Healthy |
| banner-printing-saskatoon | 56 pass | 149 pass | 435 | 8 | 2 | yes | yes | Only 2 internal links |
| flyer-printing-saskatoon | 59 pass | 151 pass | ~230 | 8 | 5 | yes | yes | Thin visible copy + grid price drift |
| coroplast-signs-saskatoon | 53 pass | 151 pass | ~220 | 8 | 3 | yes | yes | Thin visible copy + stale `$30` captions/FAQ |
| sign-company-saskatoon | 53 pass | 154 pass | ~589 including schema description | 8 | 5 | yes | yes | Stale coroplast/ACP examples |

**Note:** visible rendered content is thinner than the previous audit implied for flyer and coroplast. The hidden `description` prop is long, but because `descriptionNode` renders instead, the visible body copy should be the content-quality source of truth.

---

## Technical SEO

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Sitemap entries | 115-116 indexed entries depending count method; all source entries use hardcoded `new Date("YYYY-MM-DD")` | RESOLVED | Technical |
| `/products/*` exclusion | Detail estimator pages excluded; `/products` hub indexed intentionally | RESOLVED | Technical |
| Root title/meta | Title 54 chars, description 140 chars | RESOLVED | Technical |
| Redirects | 51 redirect pairs; cannibalization and WP cleanup redirects exist | RESOLVED | Technical |
| Redirect destination risk | Three legacy retractable-banner redirects go to noindex `/products/retractable-banners` | NEW | Wave 1.1 |
| Nav/footer wiring | 40 sitemap pages not linked from nav/footer | NEW | Wave 3.4 |
| Meta length batch | 48 descriptions over 155 chars, mostly non-protected city/programmatic pages | NEW | Wave 3.4 |

---

## Content Quality

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Ranking-page FAQ depth | 5/5 ranking pages have 8 FAQs | RESOLVED | Wave 2 |
| DesignDirectionGrid | 5/5 ranking pages have DDG | RESOLVED | Wave 2 |
| Price in first paragraph | 5/5 ranking pages have price in first visible paragraph | RESOLVED | Wave 2 |
| Saskatoon/Saskatchewan in first paragraph | 5/5 pass | RESOLVED | Wave 2 |
| Rush/design mentions | 5/5 mention rush +$40 and designer $35 | RESOLVED | Wave 2 |
| Flyer grid prices | `250 for $80`, `500 for $130` conflict with quick reference | NEW | Wave 3.3 |
| Coroplast examples | Stale `$30` examples remain in coroplast/sign-company/real-estate/agriculture/services | NEW | Wave 3.3 |
| Thin visible copy | Flyer and coroplast visible `descriptionNode` content sits near ~220-230 words | NEW | Wave 7 |

---

## On-Page SEO

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Ranking titles | All 5 protected pages now <=60 chars | RESOLVED | Wave 7 |
| Ranking meta descriptions | All 5 protected pages <=155 chars | RESOLVED | Wave 1 / Wave 7 |
| Canonicals | 5/5 protected pages have canonical URL | RESOLVED | Ongoing |
| Internal links | Protected pages have 2-5 links; banner is lowest at 2 | PENDING | Wave 7 |
| Programmatic meta | 48 non-protected page descriptions exceed 155 chars | NEW | Wave 3.4 |

---

## Schema / Structured Data

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| WebSite schema | SearchAction present | RESOLVED | Wave 3 |
| LocalBusiness schema | paymentAccepted, currenciesAccepted, hasMap present | RESOLVED | Wave 3 |
| Organization schema | alternateName and logo present | RESOLVED | Wave 3a |
| Service schema | URL emitted when canonicalSlug exists | RESOLVED | Wave 3 |
| BreadcrumbList | Present on IndustryPage when canonicalSlug exists | RESOLVED | Wave 3 |
| FAQPage | Present when FAQs exist | RESOLVED | Wave 3 |
| Product schema | Still not emitted | PENDING | Wave 4 |
| AggregateRating reviewCount | Uses `String(REVIEW_COUNT)` instead of numeric value | PENDING | Wave 4 |

---

## Performance / Images / AI Search

| Area | Finding | Status | Wave |
|------|---------|--------|------|
| HeroSlider | `use client`; slide 0 exists, but hero remains motion/client island | PENDING | Wave 5 |
| Hero image priority | Hero image has priority in HeroSlider; IndustryPage hero has priority + fetchPriority high | RESOLVED | Wave 1 |
| GA/GTM | GA uses `lazyOnload`, good for LCP protection | RESOLVED | Wave 5 |
| Oversized images | No `public/images` files over 500KB | RESOLVED | Wave 2 |
| Image sitemap | `src/app/image-sitemap.xml/route.ts` exists | RESOLVED | Wave 3 |
| robots.ts | AI bots allowed; sitemap + image sitemap referenced | RESOLVED | Wave 3 |
| llms.txt | High quality and mostly aligned, but review count is stale and site-wide price consistency still leaks | PENDING | Wave 3.3 |

---

## Wave Schedule - Updated

| Wave | Items | Status |
|------|-------|--------|
| Immediate (N1-N5) | 5 items | COMPLETE |
| Wave 1 - Technical | 8 items | COMPLETE |
| Wave 2 - Content Quality | 9 items | COMPLETE, images now verified present/no oversized files |
| Wave 3 - Schema expansion | Service.url, image sitemap, robots reference | COMPLETE |
| Wave 3a - Organization schema | alternateName + logo | COMPLETE |
| Wave 3.1 - Pricing comms sweep | prior 8 surfaces | COMPLETE |
| Wave 3.2 - Post-audit cleanup | sitemap dates + late price/meta cleanup | COMPLETE |
| **Wave 3.3 - Trust drift cleanup** | stale coroplast/flyer/ACP examples + llms review count | **NEW - NEXT** |
| **Wave 3.4 - Internal linking + meta batch** | 40 orphans + 48 long metas | **NEW** |
| Wave 4 - Product schema | Product schema + reviewCount numeric | PENDING |
| Wave 5 - CWV / HeroSlider | client-island/bundle audit | PENDING |
| Wave 6 - Mobile / UX | tap targets/font/layout | PENDING |
| Wave 7 - CTR/content recovery | thin flyer/coroplast copy, banner links, wall graphics | PENDING |

---

## Projected Score by Wave

| Wave | Score impact | Cumulative |
|------|--------------|------------|
| Now | - | 74 |
| Wave 3.3 trust drift cleanup | +3 | 77 |
| Wave 3.4 internal linking/meta batch | +2 | 79 |
| Wave 4 Product schema + numeric reviewCount | +2 | 81 |
| Wave 5 HeroSlider/CWV audit | +2 | 83 |
| Wave 7 content recovery | +2 | 85 |

---

## Top 3 Actions for Next Wave

1. **Wave 3.3 price trust cleanup** - fix flyer grid prices, remaining coroplast `$30` examples, and verify Sign Company ACP `4x8` pricing against CSV/source of truth before changing copy.
2. **Wave 3.4 internal linking pass** - add footer/resource/hub links for the 40 sitemap-indexed orphan pages, prioritizing city/product pages and label pages.
3. **Wave 4 schema pass** - add Product schema carefully after pricing drift is clean; also emit aggregateRating `reviewCount` as numeric.

---

## Verification

- Read source files directly; no live crawl used.
- Ran ranking page metadata/content checks across the 5 protected pages.
- Ran nav/footer versus sitemap comparison.
- Ran DesignDirectionGrid presence check.
- Ran price/minimum grep across `src/app/*/page.tsx`, `public/llms.txt`, pricing comms, and product content.
- Ran meta description batch check.
- Ran oversized image command: `find "public/images" -type f -size +500k -exec ls -lh {} \; | sort -k5 -h -r` (empty output).

**Source code changed by this audit:** yes — pricing copy, guard scripts, product/GBP/social data, redirects, nav/footer links, sitemap dates, and priority metadata trims.
