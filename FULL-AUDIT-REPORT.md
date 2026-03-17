# Full SEO Audit — truecolorprinting.ca

**Date:** 2026-03-16
**Previous Score:** 65/100 (2026-03-14)
**Method:** Codebase-first delta audit — direct file reads, no live crawl

---

## SEO Health Score: 67 / 100 (+2 from baseline)

| Category | Weight | Prev | Current | Delta | Weighted |
|----------|--------|------|---------|-------|----------|
| Technical SEO | 25% | 62 | 66 | +4 | 16.5 |
| Content Quality | 25% | 60 | 60 | 0 | 15.0 |
| On-Page SEO | 20% | 60 | 63 | +3 | 12.6 |
| Schema / Structured Data | 10% | 70 | 71 | +1 | 7.1 |
| Performance (CWV) | 10% | 72 | 72 | 0 | 7.2 |
| Images | 5% | 80 | 85 | +5 | 4.25 |
| AI Search Readiness | 5% | 90 | 90 | 0 | 4.5 |
| **TOTAL** | 100% | **65** | **67** | **+2** | **67.15** |

---

## What Changed Since 2026-03-14

### RESOLVED (8 items)

| Item | Was | Now | Wave |
|------|-----|-----|------|
| Homepage sr-only H1 | Missing — zero static H1 | `<h1 className="sr-only">` at page.tsx:208 | 1.1 |
| Homepage meta desc length | 174 chars (truncated in SERP) | 146 chars ✅ | 1.3 |
| Banner meta desc length | 157 chars | 150 chars ✅ | 1.4 |
| Coroplast meta desc length | 159 chars | 152 chars ✅ | 1.5 |
| Homepage H2 | "What we print" (generic, no keyword) | "Signs, Banners & Print Products — Saskatoon" | 1.6 |
| manifest.webmanifest | 404 on every page load | Exists at `/public/manifest.webmanifest` | 1.7 |
| image-sitemap.xml route | Missing — robots.ts referenced a 404 | `src/app/image-sitemap.xml/route.ts` created | 3.2 |
| Image sitemap in robots.ts | Not referenced | Listed in `sitemap[]` array ✅ | 3.3 |

### Still NEW since last audit baseline
*(none — all prior items still pending or resolved)*

---

## Category Breakdown

---

### Technical SEO — 66 / 100 (+4)

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Sitemap total pages | 71 pages | — | — |
| Sitemap no `new Date()` global | All dates hardcoded strings ✅ | PASS | — |
| Sitemap /products/* excluded | Explicitly excluded with comment ✅ | PASS | — |
| Sitemap no future dates | All dates ≤ 2026-03-16 ✅ | PASS | — |
| Layout title default | "True Color Printing \| Signs, Banners & Cards Saskatoon" (54 chars) ✅ | PASS | — |
| Layout meta desc default | 140 chars ✅ | PASS | — |
| WebSite SearchAction | Present — urlTemplate pointing to /quote?q= ✅ | PASS | — |
| LocalBusiness paymentAccepted | Missing | MINOR GAP | Backlog |
| LocalBusiness currenciesAccepted | Missing | MINOR GAP | Backlog |
| LocalBusiness hasMap | Missing | MINOR GAP | Backlog |
| aggregateRating.reviewCount | `String(REVIEW_COUNT)` from lib/reviews ✅ | PASS | — |
| Homepage static H1 | `sr-only` H1 in page.tsx:208 ✅ | RESOLVED | 1.1 |
| HeroSlider conditional H1 | Still at HeroSlider.tsx:177 — `{current === 0 && <h1>` | PENDING | 1.2 |
| manifest.webmanifest | Exists ✅ | RESOLVED | 1.7 |
| 38 redirects in next.config.ts | WordPress → Next.js 301s, /vinyl-banners-saskatoon, /quote-request | PASS | — |
| Nav orphan pages | None found — all 71 sitemap pages in nav or footer | PASS | — |

**PENDING issues contributing to -34 deficit:**
- Conditional H1 still in HeroSlider (should be removed — Wave 1.2)
- LocalBusiness missing 3 optional properties (paymentAccepted, currenciesAccepted, hasMap) — Backlog

---

### Content Quality — 60 / 100 (unchanged)

#### 5 Ranking Pages

| Page | Title (chars) | Meta (chars) | FAQs | Price in P1 | SK in P1 | Roland UV | Rush | Designer | descNode | Links | DDG | Canonical |
|------|--------------|-------------|------|-------------|----------|-----------|------|----------|----------|-------|-----|-----------|
| business-cards-saskatoon | 57 ✅ | 155 ✅ | 8 ✅ | $45 ✅ | YES ✅ | ❌ MISSING | ✅ | ✅ | ❌ | 0 | ❌ | ✅ |
| banner-printing-saskatoon | 56 ✅ | 150 ✅ | 8 ✅ | $8.25/sqft ✅ | YES ✅ | ✅ | ✅ | ✅ | ✅ | 4 | ❌ | ✅ |
| flyer-printing-saskatoon | 56 ✅ | 152 ✅ | 8 ✅ | $45/100 ✅ | YES ✅ | ❌ (Konica Minolta) | ✅ | ✅ | ✅ | 3 | ❌ | ✅ |
| coroplast-signs-saskatoon | 54 ✅ | 152 ✅ | 8 ✅ | $8/sqft ✅ | YES ✅ | ✅ | ✅ | ✅ | ✅ | 3 | ❌ | ✅ |
| sign-company-saskatoon | 54 ✅ | 155 ✅ | 8 ✅ | $8/sqft ✅ | YES ✅ | ✅ | ✅ | ✅ | ❌ | 0 | ❌ | ✅ |

#### Price Drift Check

| Page | Claim | Expected | Status |
|------|-------|----------|--------|
| business-cards | "from $45" (250 2S) | "from $45" ✅ | PASS |
| banner-printing | "from $8.25/sqft" | "$8.25/sqft" ✅ | PASS |
| flyer-printing | "$45 for 100" | "from $45" ✅ | PASS |
| coroplast-signs | "$8/sqft" | "$8/sqft" ✅ | PASS |
| sign-company | "$8/sqft coro, $13/sqft ACP, $8.25/sqft banners" | All correct ✅ | PASS |

**No price drift detected.**

#### Content Issues

- **business-cards-saskatoon**: No `descriptionNode` — all content in plain string, zero internal links in content area. Wave 2.2 PENDING.
- **business-cards-saskatoon**: No "Roland UV" mention. BCs are printed on Konica Minolta (flatbed), not Roland UV — mentioning "in-house printer" is still relevant but technically Roland UV is wide-format only. Recommend mentioning "in-house Konica Minolta digital press" to maintain E-E-A-T. Wave 2.5.
- **flyer-printing-saskatoon**: Says "Konica Minolta press" — this is accurate. Acceptable. No Roland UV since Roland is wide-format.
- **All 5 ranking pages**: No `DesignDirectionGrid` — Wave 2.1, 2.3, 2.4 PENDING (banner, BC, coroplast). Flag flyer and sign-company as additional targets.
- **sign-company-saskatoon**: Large description string with `\n\n` but no `descriptionNode`. Zero internal links in content. Consider Wave 2 addition.

---

### On-Page SEO — 63 / 100 (+3)

| Check | Finding | Status |
|-------|---------|--------|
| All 5 ranking pages have ≤60 char titles | All pass (54–57 chars) ✅ | PASS |
| All 5 ranking pages have ≤155 char meta | All pass (150–155 chars) ✅ | RESOLVED |
| Canonical URLs on all ranking pages | All 5 present ✅ | PASS |
| Internal links in content | Banner: 4, Flyer: 3, Coroplast: 3, BC: 0, Sign-co: 0 | PARTIAL |
| H1 on all ranking pages | IndustryPage renders `<h1>{title}</h1>` inside hero section ✅ | PASS |

**Remaining gap:** BC and sign-company pages have zero content-area internal links. Wave 2.2.

---

### Schema / Structured Data — 71 / 100 (+1)

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| LocalBusiness schema | Present in layout.tsx ✅ | PASS | — |
| WebSite schema with SearchAction | Present ✅ | PASS | — |
| Service schema on IndustryPage | Present — name, serviceType, provider, areaServed, description ✅ | PASS | — |
| Service schema `url` field | Missing — no `url` property in serviceSchema | PENDING | 3.1 |
| Product schema | Not present | PLANNED | 4 |
| BreadcrumbList schema | Present when canonicalSlug provided ✅ | PASS | — |
| FAQPage schema | Present when faqs.length > 0 ✅ | PASS | — |
| AggregateRating reviewCount | Dynamic from REVIEW_COUNT constant ✅ | PASS | — |
| Image sitemap route | Created ✅ | RESOLVED | 3.2 |
| Image sitemap in robots.ts | Referenced ✅ | RESOLVED | 3.3 |

**Note:** Image sitemap route exists but content unverified (can't test live). Verify returns valid XML image sitemap after next deploy.

---

### Performance (CWV) — 72 / 100 (unchanged)

| Check | Finding | Status |
|-------|---------|--------|
| HeroSlider "use client" | Yes — required for state | — |
| QuoteModal import | Not present in HeroSlider (no dynamic import needed) | — |
| IndustryPage hero `priority` | `priority` prop on Image = fetchpriority="high" ✅ | PASS |
| GTM script strategy | `afterInteractive` ✅ | PASS |
| HeroSlider conditional H1 | Still present — minor extra JS execution | PENDING 1.2 |

---

### Images — 85 / 100 (+5)

| Check | Finding | Status |
|-------|---------|--------|
| Oversized images (>500KB) | None found in public/ ✅ | PASS |
| image-sitemap.xml route | Created ✅ | RESOLVED |
| Image format | All product images .webp ✅ | PASS |
| Hero images on IndustryPage | `priority` set, `fill` + `sizes="100vw"` ✅ | PASS |

---

### AI Search Readiness — 90 / 100 (unchanged)

| Check | Finding | Status |
|-------|---------|--------|
| llms.txt | Exists at `/public/llms.txt` ✅ | PASS |
| robots.ts AI bots | GPTBot, ClaudeBot, PerplexityBot etc. all allowed ✅ | PASS |
| Image sitemap in robots.ts | Present ✅ | PASS |

---

## Wave Schedule — Updated

| Wave | Items | Due | Status |
|------|-------|-----|--------|
| Wave 1 | 8 items | 2026-03-14 | 7/8 DONE — only 1.2 remaining |
| Wave 2 | 6 items | ~2026-03-21 | 0/6 done — START NOW (GSC stable after Wave 1) |
| Wave 3 | 3 items | ~2026-03-28 | 2/3 done ahead of schedule |
| Wave 4 | 4 items | ~2026-04-04 | 0/4 — gate on pricing-health check |
| Wave 5 | 3 items | ~2026-04-11 | 0/3 — CWV audit |
| Wave 6 | 3 items | ~2026-04-18 | 0/3 — mobile/UX |

---

## Top 3 Actions for Wave 2

1. **Add `DesignDirectionGrid` to business-cards, banner, coroplast, flyer, sign-company ranking pages** — files: all 5 ranking page.tsx files — Wave 2.1/2.3/2.4/new
2. **Add `descriptionNode` with internal links to business-cards-saskatoon and sign-company-saskatoon** — files: `src/app/business-cards-saskatoon/page.tsx`, `src/app/sign-company-saskatoon/page.tsx` — Wave 2.2/new
3. **Remove conditional H1 from HeroSlider** (replace with plain `<p>` or `<div>`) — file: `src/components/home/HeroSlider.tsx:177` — Wave 1.2 (still pending)

---

## Projected Score by Wave

| After Wave | Projected Score | Key Gain |
|------------|----------------|----------|
| Wave 1 complete (now) | 67 | Meta descs, H1, H2, manifest |
| Wave 2 complete | 71 | DDG, descriptionNodes, content depth |
| Wave 3 complete | 73 | Service schema url, image sitemap verified |
| Wave 4 complete | 76 | Product schema |
| Wave 5 complete | 78 | CWV improvements |
| Wave 6 complete | 80 | Mobile/UX polish |

---

## GSC Rankings — Last Checked 2026-03-12

| Keyword | Position | Page |
|---------|----------|------|
| print banner saskatoon | #2 | /banner-printing-saskatoon |
| flyer printing saskatoon | #3 | /flyer-printing-saskatoon |
| print store sign saskatoon | #4 | /sign-company-saskatoon |
| coroplast signs saskatoon | #5 | /coroplast-signs-saskatoon |
| business cards saskatoon | #1 | /business-cards-saskatoon |

**Next GSC check due: 2026-03-19** (5 days after Wave 1 changes landed ~2026-03-14)
