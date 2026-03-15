# SEO Remaining Waves — truecolorprinting.ca

**Last updated:** 2026-03-14
**Full audit:** `FULL-AUDIT-REPORT.md`
**GSC baseline:** banner #2 | flyer #3 | sign #4 | coroplast #5 | BC #1

---

## Wave 1 — Technical Quick Fixes (Target: 2026-03-14)

Status: **READY TO SHIP**
Risk: Very Low — metadata + static HTML only, no schema changes, no content rewrites

| # | Item | File | Lines | Status |
|---|------|------|-------|--------|
| 1.1 | Add `sr-only` H1 to homepage | `src/app/page.tsx` | After SiteNav | PENDING |
| 1.2 | Remove conditional H1 from HeroSlider | `src/components/home/HeroSlider.tsx` | 177–180 | PENDING |
| 1.3 | Trim homepage meta desc 174→145 chars | `src/app/page.tsx` | ~line 18 | PENDING |
| 1.4 | Trim banner-printing meta desc 157→≤155 | `src/app/banner-printing-saskatoon/page.tsx` | ~line 8 | PENDING |
| 1.5 | Trim coroplast meta desc 159→≤155 | `src/app/coroplast-signs-saskatoon/page.tsx` | ~line 8 | PENDING |
| 1.6 | Strengthen first H2 | `src/app/page.tsx` | ~line 302 | PENDING |
| 1.7 | Create manifest.webmanifest | `public/manifest.webmanifest` | NEW FILE | PENDING |
| 1.8 | Update sitemap lastmod for touched pages | `src/app/sitemap.ts` | — | PENDING |

**Post-Wave 1:**
- Run `npm run build` — zero errors
- Verify `<h1` in `curl -s https://truecolorprinting.ca | grep -i h1`
- Deploy to Railway
- Check GSC after 5 days before Wave 2

---

## Wave 2 — Content Quality (Target: 2026-03-21)

Wait for Wave 1 GSC check before shipping.
Risk: Low — content additions only, no schema or redirect changes

| # | Item | File | Status |
|---|------|------|--------|
| 2.1 | Add DesignDirectionGrid to business-cards-saskatoon | `src/app/business-cards-saskatoon/page.tsx` | PLANNED |
| 2.2 | Add descriptionNode to business-cards-saskatoon | `src/app/business-cards-saskatoon/page.tsx` | PLANNED |
| 2.3 | Add DesignDirectionGrid to banner-printing-saskatoon | `src/app/banner-printing-saskatoon/page.tsx` | PLANNED |
| 2.4 | Add DesignDirectionGrid to coroplast-signs-saskatoon | `src/app/coroplast-signs-saskatoon/page.tsx` | PLANNED |
| 2.5 | Verify "Roland UV" mentioned in all 5 ranking pages | All ranking pages | PLANNED |
| 2.6 | Update sitemap lastmod for all pages touched in Wave 2 | `src/app/sitemap.ts` | PLANNED |

**Pre-Wave 2 gate:** GSC must show stable or improving positions after Wave 1.

---

## Wave 3 — Schema Expansion (Target: 2026-03-28)

| # | Item | File | Status |
|---|------|------|--------|
| 3.1 | Verify/add Service schema url field in IndustryPage | `src/components/site/IndustryPage.tsx` | PLANNED |
| 3.2 | Create image-sitemap.xml route | `src/app/image-sitemap.xml/route.ts` | PLANNED |
| 3.3 | Add image sitemap URL to robots.txt | `public/robots.txt` | PLANNED |

---

## Wave 4 — Product Schema (Target: 2026-04-04)

**Pre-Wave 4 gate:** Verify no price inconsistencies exist before adding Product schema.
Run `/pricing-health` before this wave.

| # | Item | File | Status |
|---|------|------|--------|
| 4.1 | Add Product schema to coroplast-signs-saskatoon | landing page + IndustryPage | PLANNED |
| 4.2 | Add Product schema to banner-printing-saskatoon | landing page + IndustryPage | PLANNED |
| 4.3 | Add Product schema to business-cards-saskatoon | landing page + IndustryPage | PLANNED |
| 4.4 | Add Product schema to flyer-printing-saskatoon | landing page + IndustryPage | PLANNED |

---

## Wave 5 — Core Web Vitals (Target: 2026-04-11)

| # | Item | Status |
|---|------|--------|
| 5.1 | Audit HeroSlider bundle size (motion/react + AnimatePresence) | PLANNED |
| 5.2 | Evaluate dynamic import for QuoteModal if present | PLANNED |
| 5.3 | Run CrUX data check (28-day window) | PLANNED |

---

## Wave 6 — Mobile / UX (Target: 2026-04-18)

| # | Item | Status |
|---|------|--------|
| 6.1 | Font size audit (≥16px body, ≥14px labels) | PLANNED |
| 6.2 | Tap target size check (≥48×48px on CTAs) | PLANNED |
| 6.3 | Layout shift check on hero/image load | PLANNED |

---

## Backlog (No Wave Assigned)

| Item | Notes |
|------|-------|
| true-color.ca 3-hop redirect chain | Hostinger fix pending — http → https still 3 hops |
| Blog / Resources content | Neither True Color nor Minuteman has one — first mover wins local print authority |
| "Free local delivery" mention | Only add if True Color actually offers this |
| GBP REPLACE_WITH_GOOGLE_PLACE_ID | Hardcoded placeholder in reviewRequest.ts:32 |
| DECAL bug: RMVN006 can't be selected | OptionsPanel issue |

---

## Completed (Before This Audit)

| Item | Completed |
|------|-----------|
| www. → apex 301 Cloudflare Redirect Rule | 2026-03-12 |
| Cloudflare email obfuscation → OFF | 2026-03-12 |
| /vinyl-banners-saskatoon → 301 → /banner-printing-saskatoon | 2026-03-12 |
| Sitemap lastmod: per-page hardcoded dates | 2026-03-12 |
| /products/* removed from sitemap | 2026-03-12 |
| Title tag: 54 chars ✅ | 2026-03-12 |
| Meta desc: 141 chars ✅ | 2026-03-12 |
| reviewCount: 29 ✅ | 2026-03-12 |
| llms.txt: comprehensive entity file | Prior session |
| robots.txt: AI bots allowed, SEO bots blocked | Prior session |
| icon.png + apple-icon.png added to public/ | Prior session |
