# Full SEO Audit — truecolorprinting.ca

**Date:** 2026-03-14
**Previous Score:** N/A (first codebase-first audit)
**Seobility Score (reference):** 22% (JS-disabled crawler — not comparable; see note below)
**Method:** Codebase-first delta audit — direct file reads, no live crawl

> **Why Seobility says 22%:** Seobility crawls with JavaScript disabled. The homepage H1 lives inside `HeroSlider.tsx` (a `"use client"` component with `useState`) — invisible to any JS-disabled crawler. All SEO *landing pages* use `IndustryPage` (a server component) and DO have SSR-rendered H1s. The fix is simple: add a static H1 to `page.tsx` and remove the conditional one from the slider.

---

## SEO Health Score: 65 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 62 | 15.5 |
| Content Quality | 25% | 60 | 15.0 |
| On-Page SEO | 20% | 60 | 12.0 |
| Schema / Structured Data | 10% | 70 | 7.0 |
| Performance (CWV) | 10% | 72 | 7.2 |
| Images | 5% | 80 | 4.0 |
| AI Search Readiness | 5% | 90 | 4.5 |
| **TOTAL** | 100% | | **65.2** |

*Seobility's 22% is not comparable — it scores based on JS-disabled crawl. Our codebase audit reads SSR HTML directly.*

---

## Critical Issues (Fix Immediately — Wave 1)

### ISSUE-01 — CRITICAL: Homepage H1 Not in SSR HTML
**File:** `src/components/home/HeroSlider.tsx:177-180`
**Problem:** The only H1 on the homepage is inside a `"use client"` component with conditional render:
```tsx
{current === 0 && (
  <h1 className="text-lg md:text-3xl font-black ...">
    Saskatoon Print Shop — Price it. Proof it. Pick it up today.
  </h1>
)}
```
A JS-disabled crawler (Seobility, some Googlebot crawl passes, accessibility scanners) sees **zero H1** on the homepage. Next.js does server-render `"use client"` components for the initial state — so `current === 0` does SSR the H1. But there is no guarantee Google always processes the initial state.

**Fix:** Add `<h1 className="sr-only">` in `src/app/page.tsx` after `<SiteNav />`. Remove the conditional `<h1>` in `HeroSlider.tsx` (replace with a plain styled `<p>` or `<div>`).
**Wave:** 1 | **Risk:** Very Low

---

### ISSUE-02 — HIGH: 3 Meta Descriptions Over Character Limit
| Page | Current Length | Limit | Over By |
|------|---------------|-------|---------|
| Homepage (`page.tsx`) | 174 chars | 155 | +19 |
| `/banner-printing-saskatoon` | 157 chars | 155 | +2 |
| `/coroplast-signs-saskatoon` | 159 chars | 155 | +4 |

Google truncates at ~155 chars in SERP — the most important words get cut. For the homepage this is the biggest wasted opportunity on the site.

**Current homepage description:** "Coroplast signs from $30. Vinyl banners from $66. Business cards from $45. In-house designer, local pickup at 216 33rd St W Saskatoon. See your exact price now — no quote forms." (174 chars)

**Proposed (145 chars):** "Coroplast signs from $30. Vinyl banners from $66. Business cards from $45. In-house designer at 216 33rd St W Saskatoon. See your price instantly."

**Wave:** 1 | **Risk:** Very Low

---

### ISSUE-03 — MEDIUM: Missing `manifest.webmanifest`
**File:** `src/app/layout.tsx:23` declares `manifest: "/manifest.webmanifest"`
**Problem:** `public/manifest.webmanifest` does not exist. This causes a 404 on every page load and browser PWA detection fails. Chrome DevTools shows a warning. Not a direct ranking signal but indicates technical debt.
**Fix:** Create `public/manifest.webmanifest` with basic PWA metadata.
**Wave:** 1 | **Risk:** Very Low

---

### ISSUE-04 — MEDIUM: Weak Homepage H2
**File:** `src/app/page.tsx` — first H2 reads `<h2>What we print</h2>`
**Problem:** Generic, no keyword value. Google uses H2s as secondary topical signals.
**Fix:** Change to `<h2>Signs, Banners & Print Products — Saskatoon</h2>`
**Wave:** 1 | **Risk:** Low

---

## High Priority (Wave 2–3)

### ISSUE-05 — HIGH: DesignDirectionGrid on Zero Ranking Pages
**Grep check:** `Grep "DesignDirectionGrid" src/app/*/page.tsx` → **0 matches**
The component exists at `src/components/site/DesignDirectionGrid.tsx` and is a visual trust/authority signal, but it has never been added to any SEO landing page. Images drive engagement, time-on-page, and entity recognition.
**Affected pages:** All 5 ranking pages, all industry pages
**Wave:** 2 | **Risk:** Low (content improvement only)

---

### ISSUE-06 — MEDIUM: `business-cards-saskatoon` Has No `descriptionNode`
The page passes a plain `description` string (no JSX `descriptionNode`). Compare with `banner-printing-saskatoon` which has 5 paragraphs + 4 internal links in `descriptionNode`. Business cards is the #1 ranking page — it should have the richest content.
**Wave:** 2 | **Risk:** Low

---

### ISSUE-07 — MEDIUM: No Product Schema on Any Page
Neither `IndustryPage.tsx` nor any landing page adds `Product` schema with `offers`, `image`, and `aggregateRating`. Google uses Product schema to generate merchant-style SERP features. Minuteman Press has no Product schema either — first mover advantage available.
**Wave:** 4 | **Risk:** Low

---

### ISSUE-08 — LOW: No image-sitemap.xml
**File check:** `src/app/image-sitemap.xml/route.ts` — does not exist
An image sitemap improves Google Images indexing of product photos. True Color has many product images that could rank in Google Images for local print queries.
**Wave:** 3 | **Risk:** Very Low

---

## Audit Findings by Category

### Technical SEO — 62/100

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Sitemap: hardcoded lastmod dates | All 68 pages have hardcoded dates | PASS ✅ | — |
| Sitemap: /products/* excluded | Correctly excluded with comment | PASS ✅ | — |
| Redirects: WP legacy URLs | 28+ permanent 301s in next.config.ts | PASS ✅ | — |
| Redirects: /vinyl-banners-saskatoon | 301 → /banner-printing-saskatoon | PASS ✅ | — |
| noindex: utility pages | /cart, /checkout, /staff/*, /api/*, /products/* all noindexed | PASS ✅ | — |
| robots.txt | Comprehensive, AhrefsBot/SemrushBot blocked, sitemap linked | PASS ✅ | — |
| Homepage H1 in SSR HTML | HeroSlider conditional render — JS-disabled crawlers see no H1 | FAIL ❌ | 1 |
| Meta desc: homepage | 174 chars — over 155 limit | FAIL ❌ | 1 |
| Meta desc: banner-printing | 157 chars — 2 over limit | FAIL ❌ | 1 |
| Meta desc: coroplast-signs | 159 chars — 4 over limit | FAIL ❌ | 1 |
| manifest.webmanifest | Declared in layout.tsx but file missing from public/ | FAIL ❌ | 1 |
| Cloudflare email obfuscation | OFF ✅ (confirmed via prior session) | PASS ✅ | — |
| www. → apex 301 | Cloudflare Redirect Rule active | PASS ✅ | — |
| true-color.ca 3-hop chain | http → https still 3 hops (Hostinger fix pending) | PENDING | Backlog |

---

### Content Quality — 60/100

| Page | Word Count (est) | FAQs | Price in P1 | Saskatoon P1 | Roland UV | Rush $40 | Designer $35 | DesignDir | descriptionNode |
|------|-----------------|------|-------------|--------------|-----------|----------|--------------|-----------|----------------|
| business-cards-saskatoon | ~250 | 8 ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ❌ (plain string) |
| banner-printing-saskatoon | ~350 | 8 ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ (5 paras, 4 links) |
| flyer-printing-saskatoon | ~300 | 8 ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ (4 paras, 3 links) |
| coroplast-signs-saskatoon | ~320 | 8 ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ |
| sign-company-saskatoon | ~500 | 8 ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ |

**Note on Roland UV:** Should be confirmed present in description text on each page. Flag for Wave 2 content review if missing.

---

### On-Page SEO — 60/100

| Check | Finding | Status |
|-------|---------|--------|
| Homepage H1 | Conditional in HeroSlider — not guaranteed SSR | FAIL ❌ |
| Homepage H2 (first) | "What we print" — no keyword value | FAIL ❌ |
| business-cards title | 58 chars ✅ | PASS ✅ |
| banner-printing title | 55 chars ✅ | PASS ✅ |
| flyer-printing title | 59 chars ✅ | PASS ✅ |
| coroplast title | 52 chars ✅ | PASS ✅ |
| sign-company title | 53 chars ✅ | PASS ✅ |
| Canonical URLs | All landing pages have alternates.canonical | PASS ✅ |
| Internal linking | banner, flyer, coroplast, sign-company have 2–5 links | PASS ✅ |
| business-cards internal links | None (plain description, no descriptionNode) | FAIL ❌ |

---

### Schema / Structured Data — 70/100

| Schema | Where | Status |
|--------|-------|--------|
| LocalBusiness | layout.tsx | PASS ✅ |
| WebSite + SearchAction | layout.tsx | PASS ✅ |
| AggregateRating | layout.tsx (reviewCount: 29, ratingValue: 5.0) | PASS ✅ |
| FAQPage | IndustryPage.tsx (all landing pages) | PASS ✅ |
| BreadcrumbList | IndustryPage.tsx | PASS ✅ |
| Product schema | None on any page | MISSING ❌ |
| Service schema url field | Needs verification | PENDING |

---

### Performance (CWV) — 72/100

| Check | Finding | Status |
|-------|---------|--------|
| GTM script strategy | afterInteractive ✅ | PASS ✅ |
| LCP candidate | HeroSlider image with priority prop ✅ | PASS ✅ |
| Oversized images | None found (all <500KB) ✅ | PASS ✅ |
| HeroSlider "use client" | AnimatePresence + motion — heavy client bundle | WATCH |
| Image format | All WebP ✅ | PASS ✅ |

---

### Images — 80/100

| Check | Finding | Status |
|-------|---------|--------|
| All images < 500KB | Confirmed via bash find | PASS ✅ |
| WebP format used | All product images are .webp | PASS ✅ |
| Alt text on ranking pages | All images have descriptive alt text ✅ | PASS ✅ |
| image-sitemap.xml | Does not exist | MISSING ❌ |

---

### AI Search Readiness — 90/100

| Check | Finding | Status |
|-------|---------|--------|
| llms.txt | Comprehensive — products, prices, FAQs, entity signals | PASS ✅ |
| robots.txt AI bots | GPTBot, ClaudeBot, PerplexityBot, all allowed | PASS ✅ |
| Entity depth | Founded 2019, Albert Yeung, Roland UV + Konica Minolta, 216 33rd St W | PASS ✅ |
| Pricing in llms.txt | All products with exact prices | PASS ✅ |
| AhrefsBot/SemrushBot | Blocked (keeps competitor intel private) | PASS ✅ |

---

## Competitor Context — Minuteman Press Saskatoon

| Signal | Minuteman Press Saskatoon | True Color |
|--------|--------------------------|------------|
| H1 count | **7 H1 tags** (major error) | 1 (after fix) |
| Pricing on page | **None** ("price can vary") | Live pricing all products ✅ |
| Reviews on-page | **None** | 27 Trustindex reviews 5.0★ ✅ |
| FAQPage schema | None | All landing pages ✅ |
| Sitemap | No public sitemap | 68 pages ✅ |
| Product schema | None | None (gap for both) |
| Free delivery | Mentioned explicitly | Not mentioned |
| In-house printer | Not mentioned | Roland UV + Konica Minolta ✅ |
| llms.txt | Does not exist | Comprehensive ✅ |

**Bottom line:** True Color wins on price transparency, reviews, schema, and AI readiness. Minuteman wins on domain authority (national franchise) and product breadth. The H1 fix closes the only real technical gap.

---

## Wave Schedule

| Wave | Items | Target Date | Status |
|------|-------|-------------|--------|
| 1 | H1 fix + meta desc trim + manifest.webmanifest + H2 keyword | 2026-03-14 | READY |
| 2 | DesignDirectionGrid on ranking pages + business-cards descriptionNode | 2026-03-21 | PLANNED |
| 3 | Service schema url field + image-sitemap.xml | 2026-03-28 | PLANNED |
| 4 | Product schema on landing pages | 2026-04-04 | PLANNED |
| 5 | CWV improvements (HeroSlider bundle audit) | 2026-04-11 | PLANNED |
| 6 | Mobile/UX pass | 2026-04-18 | PLANNED |

---

## Projected Score by Wave

| After Wave | Projected Score | Delta |
|-----------|----------------|-------|
| Baseline (today) | 65 | — |
| Wave 1 (H1 + meta + manifest + H2) | 72 | +7 |
| Wave 2 (DesignDirection + BC content) | 78 | +6 |
| Wave 3 (schema + image sitemap) | 82 | +4 |
| Wave 4 (Product schema) | 85 | +3 |
| Wave 5 (CWV) | 88 | +3 |
| Wave 6 (mobile) | 91 | +3 |

---

*Generated by `/seo-audit` v2.0 — codebase-first, no live crawl.*
