# Technical SEO Audit — 2026-04-30

> Run by `seo-technical` subagent. Findings prioritized P0/P1/P2 with wave assignment per `.claude/rules/truecolor-seo-safety.md`.

**Score: 78/100**

| Category | Score | Status |
|---|---|---|
| Crawlability (robots, sitemap, noindex headers) | 95 | PASS |
| Indexability (canonicals, redirect graph) | 92 | PASS |
| Security headers | 100 | PASS — all headers from `truecolor-security.md` deployed verbatim |
| URL structure | 90 | PASS — minor inconsistencies |
| Mobile optimization | 70 | NEEDS FIX — viewport export missing |
| Core Web Vitals | 75 | LCP good, INP risk on estimator |
| Structured data | 65 | TWO Wave-3a-BLOCKING @id collisions still present |
| JavaScript rendering | 95 | PASS — SSR confirmed across all 94 SEO pages |
| Internal linking | 70 | SiteNav megamenu leaks PageRank into noindex /products/* |

---

## P0 — Wave-3a Gate Blockers (ship in Wave 3b Commit 2 — 2026-05-02)

These prevent Wave 3a's Organization schema from validating cleanly when Google recrawls. **Full diffs locked in [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md).**

### P0-1. Duplicate Organization @id collision on /about
- **File:** `src/app/about/page.tsx` lines 22-77
- **Problem:** Declares a second Organization with `@id: https://truecolorprinting.ca/#organization` — same @id as layout.tsx, but missing `legalName`, `alternateName` (4 entries), structured `logo`, `image`, `taxID`. Google merges nodes by @id; conflicting properties produce non-deterministic merge — the 4-entry `alternateName` (the entire point of Wave 3a) gets dropped on /about loads.
- **Fix:** Replace with `AboutPage` referencing canonical Organization via `mainEntity: { "@id": "..." }`. See [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md) §1.

### P0-2. Duplicate LocalBusiness @id collision on /contact
- **File:** `src/app/contact/page.tsx` lines 24-60
- **Problem:** Declares a second LocalBusiness with `@id: https://truecolorprinting.ca/#localbusiness` missing 12 fields the layout version has (parentOrganization → #organization, legalName, alternateName, areaServed GeoCircle, paymentAccepted, currenciesAccepted, knowsAbout, hasOfferCatalog, **aggregateRating**, hasMap). If Google merges contact's node first it sees no aggregateRating → fewer star snippets.
- **Fix:** Delete the entire `localBusinessSchema` block (layout.tsx already injects on every page). See [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md) §2.

### P0-3. Wrong phone in vehicle-decals-saskatoon Service.provider
- **File:** `src/app/vehicle-decals-saskatoon/page.tsx` line 56
- **Problem:** `telephone: "+1-306-700-0272"` — every other schema across the codebase uses `+13069548688`. NAP inconsistency dilutes the local-SEO signal sitewide.
- **Fix:** Single-line correction. See [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md) §3.

---

## P1 — Active issues hurting current rankings (deferred to Wave 4, post-2026-05-25)

### P1-1. SiteNav megamenu sends PageRank to noindex /products/*
- **File:** `src/components/site/SiteNav.tsx` lines 13-48
- **Problem:** PRODUCT_CATEGORIES megamenu links 14 of 18 product entries to `/products/[slug]` — all noindex per next.config.ts. SiteNav appears on every page including all 5 frozen ranking pages. This sitewide PageRank leak counteracts the entire Wave 3b Commit 1 (flyer link repoint) which fixes only one instance of this pattern.
- **Fix scope (Wave 4):** Repoint all 14 `/products/*` hrefs in PRODUCT_CATEGORIES to indexed `/[product]-saskatoon` equivalents. Keep label text unchanged. **High blast radius** — touches every page including 5 frozen pages, so requires 7+ days of clean post-Wave-3c GSC data first.

### P1-2. Orphan pages in sitemap (city × product cluster + cluster hubs)
- **File:** `src/app/sitemap.ts` lines 99-103, 119-141
- **Problem:** 13 pages live in sitemap with priority 0.7-0.85, zero inbound internal links beyond the sitemap entry. Verified via Grep across SiteNav.tsx + SiteFooter.tsx + all `src/components/`.
  - **City × product orphans (priority 0.7):** /vehicle-magnets-regina, /business-cards-regina, /flyer-printing-regina, plus 4 each for Moose Jaw, Prince Albert, Yorkton (13 total)
  - **Cluster hub orphans (priority 0.8-0.85):** /commercial-signs-saskatoon, /education-signs-saskatoon, /community-printing-saskatoon, /trades-signs-saskatoon — built 2026-04-13, never wired into nav/footer
- **Crawl-budget impact:** Googlebot indexes once but rarely revisits. lastmod bumps will be ignored. 0.85 priority + zero internal-link weight = mismatched signals = Google distrusts.
- **Fix scope (Wave 4):** Add 4 cluster hub pages to a new "Saskatoon Hubs" row in SiteFooter. For city × product orphans, link from each city's parent page (e.g., /banner-printing-regina links to /vehicle-magnets-regina, /business-cards-regina, /flyer-printing-regina via "Other Regina print services" footer block).

### P1-3. Booklet + window-perf orphan regression already fixed (carryover from 2026-04-12 audit)
- **File:** `src/components/site/SiteFooter.tsx` lines 84, 95
- **Status:** Already in footer. No action — log update only to memory/seo-sprints.md so the 2026-04-12 audit gets closed.

### P1-4. SiteNav repoint covers same root cause as P1-1
- **File:** `src/components/site/SiteNav.tsx`
- **Status:** Same commit as P1-1 in Wave 4. Listed separately because it specifically affects vehicle magnets, window decals, vinyl lettering, postcards, stickers, business cards, flyers, brochures, photo posters — all of which have published `-saskatoon` SEO pages with confirmed rankings.

---

## P2 — Improvements (Wave 5/6 deferred)

### P2-1. Missing viewport export in layout.tsx (Next 16 deprecation)
- **File:** `src/app/layout.tsx`
- **Problem:** No `export const viewport` declared. Next 16 deprecated viewport-in-metadata; the explicit export is the documented Next 16 pattern.
- **Fix:** Add `export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1c1712" }`.
- **Wave:** 6 (Mobile/UX). Very low risk, very low impact.

### P2-2. /products noindex covers /products/[slug] but /products itself is in sitemap
- **Status:** Confirmed correct. Header rule `/products/:path+` uses `:path+` (one-or-more) — bare /products stays indexable. No action.

### P2-3. INP risk on /products/[slug] estimator
- **File:** `src/components/product/ProductPageClient.tsx` + `src/components/estimator/OptionsPanel.tsx`
- **Problem:** Estimator is the heaviest interactive surface. INP risk on slider drags + dimension inputs. Page is noindex so SERP impact is zero, but UX bounce risk is real.
- **Fix:** Get CrUX field data from PageSpeed Insights API for /products/[slug]. If 75th-percentile INP > 200ms, debounce dimension inputs by 150ms and move price calc to a Web Worker.
- **Wave:** 5 (Performance/CWV). Watch CrUX 28-day window.

### P2-4. CSP allows unsafe-inline + unsafe-eval (accepted risk)
- Documented in `.claude/rules/truecolor-security.md`. Required by Trustindex widget + GTM. No action.

### P2-5. /same-day-printing-saskatoon lastmod = 2025-11-15
- Either page hasn't changed (correct per safety rule "leave dates alone") OR content changed and date wasn't bumped. Manual verify needed. Old dates aren't penalized for genuinely-stale pages.

### P2-6. Image-sitemap URL mismatches (5 entries 404)
- **File:** `src/app/image-sitemap.xml/route.ts` lines 274, 299, 389, 414, 795
- **Problem:** Image-sitemap declares image data for 5 page URLs that don't exist as routes:
  - `/postcards-saskatoon` — actual route is `/postcard-printing-saskatoon`
  - `/brochures-saskatoon` — actual route is `/brochure-printing-saskatoon`
  - `/photo-posters-saskatoon` — actual route is `/photo-poster-printing-saskatoon`
  - `/magnet-calendars-saskatoon` — actual route is `/custom-magnets-saskatoon`
  - `/ramadan-printing-saskatoon` — actual route is `/ramadan-eid-banners-saskatoon`
- **Impact:** Google fetches image-sitemap, follows the `<loc>` URLs, gets 404s, drops the image associations. Images less likely to surface in Image search.
- **Fix:** Update 5 `${BASE}/<slug>` strings to match actual route slugs.
- **Wave:** 4 — bundle with P1-1 SiteNav repoint OR ship standalone (single-file, low risk).

### P2-7. Coroplast meta description = 158 chars
- **File:** `src/app/coroplast-signs-saskatoon/page.tsx` line 8
- **Status:** 158 < 160, page is FROZEN, frozen rule says "trim only if over 160 chars." No action.

### P2-8. SiteNav `"use client"` — verified SSR works
- Confirmed Next 16 server component → client component child still SSRs the JSX tree, so all `<Link>` hrefs are in initial HTML. Crawlable. No action.

---

## Wave assignment summary

| Wave | Items | Ship date target |
|---|---|---|
| **3b Commit 2** (gated on 2026-05-02 GSC pass) | P0-1, P0-2, P0-3 — single "schema integrity" commit | 2026-05-02 |
| **3c** | (existing prep) printing-near-me + printing-services hub pages | 2026-05-11+ |
| **4** | P1-1 (SiteNav repoint), P1-2 (orphan link-in via city parents + cluster hubs in footer), P1-4 (megamenu cleanup — same commit), P2-6 (image-sitemap URL fixes) | post-2026-05-25 |
| **5** | P2-3 (INP after CrUX field data confirms regression) | post-2026-06-01 |
| **6** | P2-1 (viewport export deprecation cleanup) | Anytime, very low priority |

---

## Wave 3a validation specifically — what's blocking clean recrawl

Wave 3a shipped 2026-04-27. It put 4-entry `alternateName` + `legalName` + structured `logo`+`image`+`taxID` on the layout-level Organization, all linked via `@id`. **Three things prevent it validating cleanly:**

1. **about/page.tsx** ships a competing Organization on the same `@id` missing alternateName/legalName/taxID. P0-1.
2. **contact/page.tsx** ships a competing LocalBusiness on the same `@id` missing aggregateRating + 11 other fields. P0-2.
3. **vehicle-decals-saskatoon Service.provider** declares wrong phone. P0-3.

All three documented in [SCHEMA-AUDIT-2026-04-30.md](SCHEMA-AUDIT-2026-04-30.md). Diffs in [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md). Wave 3b is the next-available-wave fix.

**Net assessment:** Wave 3a will not validate cleanly until P0-1, P0-2, P0-3 ship. The Organization graph is structurally correct in layout.tsx, but the duplicate @id nodes corrupt the merge result on the affected pages.
