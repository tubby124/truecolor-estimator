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

---

## SEO Audit — 2026-04-12 (Delta Audit)
**Score: 67/100 (flat vs 2026-03-16 baseline)**
**Method:** Codebase-first delta audit — 3 parallel agents + manual inline checks

### RESOLVED since 2026-03-16 (5 items)
- Wave 1.2: HeroSlider conditional H1 → `<p>` tag at `HeroSlider.tsx:178` ✅
- Wave 3.1: Service schema `url` field added at `IndustryPage.tsx:74` ✅
- Backlog: LocalBusiness `paymentAccepted` "Cash, Credit Card, Debit, E-Transfer" ✅
- Backlog: LocalBusiness `currenciesAccepted` "CAD" ✅
- Backlog: LocalBusiness `hasMap` Google Maps CID link ✅

**Wave 1: 8/8 COMPLETE. Wave 3: 3/3 COMPLETE.**

### NEW REGRESSIONS (5 items — net score unchanged)
- N1: `public/llms.txt:22` sticker price "From $95" — should be "From $25"
- N2: `public/images/industries/poster-printing/poster-concert-music.jpg` >500KB
- N3: `/booklet-printing-saskatoon` in sitemap (priority 0.9) — zero nav/footer links (orphan)
- N4: `/window-perf-saskatoon` in sitemap (priority 0.85) — zero nav/footer links (orphan)
- N5: `SiteFooter.tsx:47` Maps href uses `S7L+0V5` — should be `S7L+0V1`

### Sitemap growth
96 pages (was 71 — +25 new pages since last audit). Sprint pages + industry niches + SK city pages.

### Content gap (biggest lever)
DesignDirectionGrid live on 6 secondary pages but MISSING on all 5 ranking pages. Wave 2 is 3 weeks overdue.

### Category scores
- Technical SEO: 65 (−1)
- Content Quality: 60 (flat — Wave 2 still 0/8)
- On-Page SEO: 63 (flat)
- Schema: 75 (+4)
- Performance: 73 (+1)
- Images: 84 (−1)
- AI Search: 89 (−1)

### Immediate fix sprint (N1–N5) — before Wave 2
1. `public/llms.txt:22` — "From $95" → "From $25"
2. `SiteFooter.tsx:47` — `S7L+0V5` → `S7L+0V1`
3. `SiteFooter.tsx` Products grid — add booklet-printing + window-perf-saskatoon links
4. Compress `poster-concert-music.jpg` to <300KB via `gs`

### Projected roadmap
- After immediate fixes: 69
- After Wave 2: 72–73
- After Wave 4 (Product Schema): 75–76
- After Wave 5 (CWV): 77–78
- After Wave 6 (Mobile/UX): 79–80

## SEO Investigation + Long-Term Plan — 2026-05-12

- 2026-05-12 — Long-term SEO + attribution plan (Waves A-E) — [SEO-LONG-TERM-PLAN-2026-05-12.md](../SEO-LONG-TERM-PLAN-2026-05-12.md)
- Day-0 baseline frozen at [memory/seo-baseline-2026-05-12.json](seo-baseline-2026-05-12.json) — 56 clicks / 6,799 imp / pos 22.15 / 0.82% CTR (90d)
- Phase 0-2 finding: GA4 client-side wired (G-6HMQT7MNLL) but NO server-side Measurement Protocol; `trackPurchase` missing `items[]`; UTM columns exist on `orders` but no inbound link tags them. Owner suspicion of broken attribution confirmed.
- Phase 1 patch spec covers: dual-track GA4 (Wave A in plan), backfill script for last 30d, UTM tagging across Brevo + GBP + social, consent decision documented (CA B2B, no banner).
- Phase 2 finding: only ONE non-branded query has healthy CTR (sticker printing saskatoon, 5.77%, FROZEN). `/for-lease-signs-saskatoon` ranks pos 2-3 for 237 monthly impressions at 0% CTR = highest-value single-page fix in Wave B.
- No code changes shipped this session — read-only investigation.

## SEO Phase 26 — Full Codebase SEO Audit (2026-05-25)

### Files changed
- `FULL-AUDIT-REPORT.md` — rewritten with 2026-05-25 score and findings
- `SEO-REMAINING-WAVES.md` — Wave 3.1 marked complete, Wave 3.2 documented, Wave 3.3/3.4 added
- `memory/seo-sprints.md` — appended this audit entry

### What was checked
- Codebase-first audit only; no live crawl.
- 3 parallel audit lanes: technical/schema, content/on-page, performance/images/AI.
- Inline checks: sitemap vs nav/footer, DesignDirectionGrid presence, ranking-page metadata, stale price/minimum grep, meta length batch, oversized image scan.

### Current score
- Previous report baseline: 69/100 (2026-05-20)
- Current audit estimate: **74/100**
- Main gains: all 5 protected ranking pages now pass title/meta length, llms.txt is cleaned up, image sitemap exists, no `public/images` files over 500KB, robots.ts is AI-friendly.

### What was deferred / flagged
- Wave 3.3: stale price trust drift still exists — coroplast `$30` examples, flyer grid prices (`250=$80`, `500=$130`), Sign Company ACP `4x8 ft` price conflict, llms.txt review count date.
- Wave 3.4: 40 sitemap-indexed pages lack nav/footer links; 48 non-protected meta descriptions exceed 155 chars; 3 legacy redirects land on noindex `/products/retractable-banners`.
- Wave 4: Product schema still missing and `reviewCount` emits as a string.
- Wave 5: HeroSlider remains a client island; slide 0 exists but LCP still deserves a bundle/CWV audit.

### Next steps
- Ship Wave 3.3 first as body-copy trust cleanup only; verify ACP price against CSV/source before editing.
- Then Wave 3.4 internal linking + meta batch.
- Do not combine protected-page title/H1/schema changes with the pricing cleanup commit.

## SEO Phase 27 — Deep Pricing Trust + SEO Plumbing Fixes (2026-05-25)

### What shipped
- Removed stale per-product minimum language from live pages, product content, GBP data, social schedule, email/staff UI, and guard scripts.
- Reframed customer-facing copy around the real model: raw product pricing plus the `$25 order-total minimum` at checkout.
- Updated pricing docs and hooks so old `$30/$40/$45/$60/$75 minimum` rules do not get reintroduced.
- Repointed retractable-banner WordPress redirects to `/retractable-banners-saskatoon`.
- Added nav/footer links for high-priority orphan pages: commercial signs, education signs, community printing, and for-lease signs.
- Trimmed priority long metadata descriptions and updated sitemap lastmod for changed indexable pages.

### Verification
- `npm run validate:pricing` ✅ 0 errors, 2 existing warnings.
- `npm test -- src/lib/pricing/__tests__/order-min.test.ts src/lib/engine/__tests__/engine.test.ts` ✅ 113 tests passed.
- `git diff --check` ✅ clean.
- `npm run build` ✅ production build passed.

## SEO Phase 28 — GSC CTR Rescue + Attribution Capture Patch (2026-05-25)

### Source
- `scripts/seo-opportunities.mjs --days=28` and `--days=90`
- 28d GSC: 21 clicks, 2,579 impressions, 0.81% CTR, avg position 18.50
- Top actionable bleed: `/for-lease-signs-saskatoon` at 244 impressions, avg position 3.03, 0 clicks
- Attribution audit: 79 orders / $15,942.61 over 90d, but 0 UTM-tagged orders and only 2 referrer-tagged orders

### What shipped
- Added server-readable first-touch UTM cookie fallback while preserving localStorage capture.
- Order and quote APIs now fall back to the UTM cookie and use UTM source/medium for attribution fields when present.
- `/for-lease-signs-saskatoon`: title/meta/H1/subtitle tightened around "For Lease Signs Saskatchewan" and "lease signage Saskatchewan"; added reusable/used lease signage FAQ.
- `/property-management-signs-saskatoon`: de-cannibalized toward broader property-management intent, linked exact lease-signage traffic to `/for-lease-signs-saskatoon`, fixed stale vehicle magnet price copy.
- `/sticker-printing-saskatoon`: frozen-safe body/FAQ expansion for die-cut stickers/labels and corrected internal links to indexed SEO pages.
- Updated sticker sitemap lastmod to 2026-05-25.

### Expected outcome
- Lease-sign CTR should move from 0% toward 3%+ after re-crawl.
- Future GBP/social/email traffic with UTMs should populate order/quote attribution instead of disappearing after internal navigation.
- Sticker die-cut query cluster should gain relevance without touching protected title/H1 metadata.

### Re-check date
- 2026-06-01 for GSC CTR/ranking movement.
- Immediately after deploy for UTM capture by placing one test quote/order with `?utm_source=test&utm_medium=qa&utm_campaign=phase28`.

## SEO Phase 29 — Local Print + Flyer/Poster/Wall Intent Cleanup (2026-05-25)

### Source
- Same 28d/90d GSC pull as Phase 28.
- Homepage queries showed broad "Saskatoon print shop / local printing" impressions with low CTR.
- `/flyer-printing-saskatoon` had stale body-card prices despite ranking pressure.
- `/products` was catching poster-printing intent without a strong route to `/poster-printing-saskatoon`.
- `/wall-graphics-saskatoon` had decay and lacked explicit "wall covering" / "large wall graphics Saskatoon" wording.

### What shipped
- Homepage metadata and product-grid intro now say "Saskatoon print shop" and route poster intent to `/poster-printing-saskatoon`.
- Homepage stale coroplast example changed from `$30` to `$25`.
- `/flyer-printing-saskatoon`: corrected visible 250/500 flyer card prices to `$110` and `$135`, and added frozen-safe local flyer intent copy without touching title/H1/slug.
- `/products`: added a prominent poster-printing callout linking to `/poster-printing-saskatoon`.
- `/wall-graphics-saskatoon`: updated title/meta/H1 language around wall graphics and removable wall coverings; added "large wall graphics in Saskatoon" and wall-covering FAQ.

### Expected outcome
- Better homepage relevance for local print-shop queries.
- Fewer stale-price trust leaks on the flyer page.
- Stronger internal routing for poster searchers landing on the generic product picker.
- Wall graphics page should regain relevance for wall-covering and large-wall-graphic query variants.
