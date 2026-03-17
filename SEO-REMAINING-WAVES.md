# SEO Remaining Waves — truecolorprinting.ca

**Last updated:** 2026-03-16
**Full audit:** `FULL-AUDIT-REPORT.md`
**GSC baseline:** banner #2 | flyer #3 | sign #4 | coroplast #5 | BC #1
**Next GSC check:** 2026-03-19 (5 days after Wave 1 landed ~2026-03-14)

---

## Wave 1 — Technical Quick Fixes

Status: **MOSTLY COMPLETE** (7/8 done)
Risk: Very Low

| # | Item | File | Status |
|---|------|------|--------|
| 1.1 | Add `sr-only` H1 to homepage | `src/app/page.tsx:208` | ✅ RESOLVED |
| 1.2 | Remove conditional H1 from HeroSlider | `src/components/home/HeroSlider.tsx:177` | ⬜ PENDING |
| 1.3 | Trim homepage meta desc 174→145 chars | `src/app/page.tsx` | ✅ RESOLVED (now 146) |
| 1.4 | Trim banner-printing meta desc 157→≤155 | `src/app/banner-printing-saskatoon/page.tsx` | ✅ RESOLVED (now 150) |
| 1.5 | Trim coroplast meta desc 159→≤155 | `src/app/coroplast-signs-saskatoon/page.tsx` | ✅ RESOLVED (now 152) |
| 1.6 | Strengthen first H2 | `src/app/page.tsx:303` | ✅ RESOLVED ("Signs, Banners & Print Products — Saskatoon") |
| 1.7 | Create manifest.webmanifest | `public/manifest.webmanifest` | ✅ RESOLVED |
| 1.8 | Update sitemap lastmod for touched pages | `src/app/sitemap.ts` | ✅ RESOLVED (dates look current) |

**Remaining:** Remove conditional H1 from HeroSlider.tsx:177 (replace with `<p>` or `<div>`). Low risk.

---

## Wave 2 — Content Quality (Target: 2026-03-21)

Status: **READY TO START** — GSC gate: check rankings on 2026-03-19 first.
Risk: Low — content additions only, no schema or redirect changes

| # | Item | File | Priority | Status |
|---|------|------|----------|--------|
| 2.1 | Add DesignDirectionGrid to business-cards-saskatoon | `src/app/business-cards-saskatoon/page.tsx` | HIGH | PENDING |
| 2.2 | Add descriptionNode with internal links to business-cards-saskatoon | `src/app/business-cards-saskatoon/page.tsx` | HIGH | PENDING |
| 2.3 | Add DesignDirectionGrid to banner-printing-saskatoon | `src/app/banner-printing-saskatoon/page.tsx` | HIGH | PENDING |
| 2.4 | Add DesignDirectionGrid to coroplast-signs-saskatoon | `src/app/coroplast-signs-saskatoon/page.tsx` | HIGH | PENDING |
| 2.5 | Add DesignDirectionGrid to flyer-printing-saskatoon | `src/app/flyer-printing-saskatoon/page.tsx` | MEDIUM | PENDING |
| 2.6 | Add descriptionNode with internal links to sign-company-saskatoon | `src/app/sign-company-saskatoon/page.tsx` | MEDIUM | PENDING |
| 2.7 | Add in-house press mention to business-cards description | `src/app/business-cards-saskatoon/page.tsx` | MEDIUM | PENDING |
| 2.8 | Update sitemap lastmod for all pages touched in Wave 2 | `src/app/sitemap.ts` | LOW | PENDING |

**Notes:**
- Flyers use Konica Minolta (digital flatbed), not Roland UV — that's accurate. Don't add Roland UV to flyer page.
- Business cards use Konica Minolta — mention "in-house Konica Minolta digital press" for E-E-A-T signal.
- DesignDirectionGrid needs niche-specific prompts in `src/lib/data/niche-image-prompts.json` for each ranking page.

**Pre-Wave 2 gate:** Check GSC on 2026-03-19 — confirm banner #2, flyer #3, BC #1 are stable before touching content.

---

## Wave 3 — Schema Expansion (Target: 2026-03-28)

Status: **PARTIALLY DONE** (2/3 ahead of schedule)

| # | Item | File | Status |
|---|------|------|--------|
| 3.1 | Add `url` field to Service schema in IndustryPage | `src/components/site/IndustryPage.tsx` (~line 65) | ⬜ PENDING |
| 3.2 | Create image-sitemap.xml route | `src/app/image-sitemap.xml/route.ts` | ✅ RESOLVED (ahead of schedule) |
| 3.3 | Add image sitemap URL to robots.ts | `src/app/robots.ts` | ✅ RESOLVED (ahead of schedule) |

**Note for 3.1:** Add `url: \`\${BASE_URL}/\${canonicalSlug ?? ""}\`` to serviceSchema object. Only populate when `canonicalSlug` is provided.
**Note for 3.2/3.3:** Image sitemap route exists but content should be verified to return valid XML after next deploy. Check https://truecolorprinting.ca/image-sitemap.xml is accessible.

---

## Wave 4 — Product Schema (Target: 2026-04-04)

**Pre-Wave 4 gate:** Run `/pricing-health` before this wave. No price inconsistencies allowed.

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
| LocalBusiness paymentAccepted/currenciesAccepted/hasMap | Minor schema enrichment |

---

## Completed

| Item | Completed |
|------|-----------|
| www. → apex 301 Cloudflare Redirect Rule | 2026-03-12 |
| Cloudflare email obfuscation → OFF | 2026-03-12 |
| /vinyl-banners-saskatoon → 301 → /banner-printing-saskatoon | 2026-03-12 |
| Sitemap lastmod: per-page hardcoded dates | 2026-03-12 |
| /products/* removed from sitemap | 2026-03-12 |
| Title tag: 54 chars ✅ | 2026-03-12 |
| Meta desc (layout default): 140 chars ✅ | 2026-03-12 |
| reviewCount: dynamic from REVIEW_COUNT | 2026-03-12 |
| llms.txt: comprehensive entity file | Prior session |
| robots.ts: AI bots allowed, SEO bots blocked | Prior session |
| icon.png + apple-icon.png added to public/ | Prior session |
| 29 WordPress → Next.js 301 redirects | 2026-03-13 |
| Gallery sitemap date fixed (future date bug) | 2026-03-13 |
| /quote-request → /quote redirect consolidated | 2026-03-13 |
| Homepage sr-only H1 added (page.tsx:208) | 2026-03-16 |
| Homepage meta desc: 174→146 chars | 2026-03-16 |
| Banner meta desc: 157→150 chars | 2026-03-16 |
| Coroplast meta desc: 159→152 chars | 2026-03-16 |
| Homepage H2 strengthened (Signs, Banners & Print Products — Saskatoon) | 2026-03-16 |
| manifest.webmanifest created | 2026-03-16 |
| image-sitemap.xml route created | 2026-03-16 |
| Image sitemap referenced in robots.ts | 2026-03-16 |
