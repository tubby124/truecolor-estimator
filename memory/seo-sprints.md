# SEO Sprint History — truecolorprinting.ca

---

## SEO Phase 1 — Infrastructure (Pre-2026-03-12)
- WP legacy 301 redirects (28+) in next.config.ts
- /vinyl-banners-saskatoon → 301 → /banner-printing-saskatoon
- llms.txt created with full product/price entity data
- robots.txt: AI crawlers allowed, AhrefsBot/SemrushBot blocked
- icon.png + apple-icon.png added to public/

---

## SEO Phase 2 — Wave 1 Technical (2026-03-12)
- www. → apex 301 via Cloudflare Redirect Rule ✅
- Cloudflare email obfuscation → OFF ✅
- Sitemap: per-page hardcoded lastmod dates (was dynamic/missing) ✅
- /products/* removed from sitemap (utility pages excluded) ✅
- Homepage title trimmed to 54 chars ✅
- Homepage meta desc trimmed to 141 chars ✅
- LocalBusiness reviewCount updated to 29 ✅
- GSC baseline recorded: banner #2 | flyer #3 | sign #4 | coroplast #5 | BC #1
- Maps (Trustindex) recorded: banner #2 | flyer #2 | sign #4 | coroplast #6 | BC #3

---

## SEO Phase 3 — Full Codebase Audit (2026-03-14)
**Audit score: 65/100 (first codebase-first audit baseline)**
**Seobility reference score: 22% (JS-disabled crawl — not comparable)**

### Key findings:
- CRITICAL: Homepage H1 inside "use client" HeroSlider — conditional render invisible to JS-disabled crawlers. Fix: sr-only H1 in page.tsx + remove conditional H1 from HeroSlider.
- HIGH: 3 meta descriptions over 155 chars (homepage 174, banner 157, coroplast 159)
- MEDIUM: manifest.webmanifest declared in layout.tsx but file missing from public/
- MEDIUM: First H2 "What we print" — no keyword value
- HIGH: DesignDirectionGrid on ZERO ranking pages (component exists, never used on SEO pages)
- MEDIUM: business-cards-saskatoon has no descriptionNode (plain string only)
- LOW: No Product schema on any page (Minuteman also missing this — first mover gap)
- LOW: No image-sitemap.xml

### Confirmed passing:
- All 5 ranking pages have SSR H1 via IndustryPage server component ✅
- All title tags under 60 chars ✅
- flyer + sign-company meta descs within limit ✅
- 8 FAQs on all 5 ranking pages ✅
- All images WebP, no oversized files ✅
- GTM afterInteractive ✅
- llms.txt comprehensive ✅
- robots.txt AI-friendly ✅
- LocalBusiness + WebSite + FAQPage + BreadcrumbList schema all present ✅

### Competitor analysis (Minuteman Press Saskatoon):
- 7 H1 tags (catastrophic error vs True Color's clean single H1 post-fix)
- No pricing on any page — True Color wins hard on purchase-intent queries
- No reviews on-page — True Color has 27 Trustindex, 5.0★
- No llms.txt — True Color wins AI search readiness completely
- Minuteman advantage: national DA, free delivery mention, product breadth (450+ vs 16)

### Wave 1 fixes queued (2026-03-14):
1. sr-only H1 in page.tsx
2. Remove conditional H1 from HeroSlider.tsx
3. Homepage meta desc 174→145
4. Banner meta desc 157→≤155
5. Coroplast meta desc 159→≤155
6. H2 "What we print" → "Signs, Banners & Print Products — Saskatoon"
7. Create public/manifest.webmanifest
8. Update sitemap lastmod for affected pages

### Projected score after Wave 1: 72/100 (+7)

---

## SEO Phase 5 — New Page Sprint (2026-03-14)

### Pages Added
- `/mothers-day-printing-saskatoon` — NEW (priority 0.85, seasonal)
  - Zero local competitors for this keyword
  - Products: vinyl banners, photo prints/posters, flyers, window decals, foamboard, retractable banners, postcards
  - Photo prints of Mom added as key differentiator (18×24" = $45, 24×36" = $65)
  - 8 FAQs, GEO pass applied, spec table in description
  - DesignDirectionGrid: 3 sections (banners, photo prints, flyers/decals)
  - 5 internal links in descriptionNode

### Files Modified
- `src/app/mothers-day-printing-saskatoon/page.tsx` — NEW
- `src/app/sitemap.ts` — added entry (lastmod: 2026-03-14)
- `src/components/site/SiteNav.tsx` — Mother's Day link added to INDUSTRY_LINKS
- `src/components/site/SiteFooter.tsx` — seasonal link added
- `src/lib/data/gbp-products.json` — post schedule + service entry added
- `src/lib/data/niche-image-prompts.json` — 9 design direction prompts added
- `GBP_UPLOAD/niches/mothers-day-printing-saskatoon/image-prompts.md` — 15 ChatGPT prompts

### Pending (after deploy)
- [ ] Submit /mothers-day-printing-saskatoon to GSC for indexing
- [ ] Generate 9 design direction images via ChatGPT
- [ ] Run /truecolor-images mothers-day after images generated (Pass 2)
- [ ] Pages 2-4 still to build: poster-printing-saskatoon, canada-day-printing-saskatoon, back-to-school-signs-saskatoon

### GEO Status: PASS (all 5 criteria met)
### SEO Agent D: PASS (title 53 chars, meta 148 chars, canonical set, OG present, 5 internal links)

---

## SEO Phase 18 — New Page: /poster-printing-saskatoon (2026-03-14)

### Summary
New product SEO landing page targeting generic "poster printing Saskatoon" intent (events, concerts, indoor displays, trade shows). Distinct from existing /photo-poster-printing-saskatoon which targets personal photo prints.

### Page Details
- **URL:** /poster-printing-saskatoon
- **Title:** "Poster Printing Saskatoon | From $15 | True Color" (49 chars)
- **Meta desc:** ~148 chars with price + Roland Photobase Matte 220gsm + location
- **Primary product slug:** photo-posters
- **Priority in sitemap:** 0.9
- **lastmod:** 2026-03-14

### Content Metrics
- Word count: 400+ (description) + rich descriptionNode
- FAQs: 8 (all price-anchored)
- Products array: 5 entries
- Internal links in descriptionNode: 5
- DesignDirectionGrid: 3 sections — Event Posters (3:4, 3 items), Indoor Display/Foamboard (4:3, 3 items), Retractable Stands (3:8, 2 items)
- GEO pass: PASS (spec table, named entities, standalone FAQ answers, address+phone, Roland UV E-E-A-T)

### Files Modified
- `src/app/poster-printing-saskatoon/page.tsx` — NEW
- `src/app/sitemap.ts` — added entry (lastmod: 2026-03-14)
- `src/components/site/SiteNav.tsx` — Poster Printing link added
- `src/components/site/SiteFooter.tsx` — Poster Printing link added
- `src/lib/data/gbp-products.json` — product + service + post schedule added
- `src/lib/data/niche-image-prompts.json` — 8 design direction prompts added
- `GBP_UPLOAD/niches/poster-printing-saskatoon/image-prompts.md` — 14 ChatGPT prompts (8 design + 6 hero/GBP)

### Pending (after deploy)
- [ ] Submit /poster-printing-saskatoon to GSC for indexing
- [ ] Generate 8 design direction images via ChatGPT from image-prompts.md
- [ ] Run /truecolor-images poster-printing after images generated (Pass 2)
- [ ] Pages still to build: canada-day-printing-saskatoon, back-to-school-signs-saskatoon
