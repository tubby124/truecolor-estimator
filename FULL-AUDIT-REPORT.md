# Full SEO Audit - truecolorprinting.ca

**Date:** 2026-05-29
**Previous Score:** 79/100 (2026-05-25 baseline)
**Method:** Codebase-first delta audit (3 parallel agents + inline verification; no live crawl)

---

## SEO Health Score: 79 / 100 (flat vs 2026-05-25)

| Category | Weight | 2026-05-25 | 2026-05-29 | Delta | Weighted |
|----------|--------|------------|------------|-------|----------|
| Technical SEO | 25% | 80 | 78 | −2 | 19.50 |
| Content Quality | 25% | 78 | 79 | +1 | 19.75 |
| On-Page SEO | 20% | 75 | 78 | +3 | 15.60 |
| Schema / Structured Data | 10% | 78 | 70 | **−8** | 7.00 |
| Performance (CWV) | 10% | 77 | 77 | 0 | 7.70 |
| Images | 5% | 92 | 92 | 0 | 4.60 |
| AI Search Readiness | 5% | 90 | 92 | +2 | 4.60 |
| **TOTAL** | 100% | **79** | **79** | **0 net** | **78.75** |

**Headline read:** Net-flat. Content + on-page recovery from the 7 protected-page ships tonight is offset by a newly-discovered schema regression (`aggregateRating` removed in commit 7ab5e48 — the same disaster commit that crashed rankings in May). Restoring it is the highest-leverage next action.

---

## 🚨 NEW CRITICAL FINDING — aggregateRating regression from 7ab5e48

`git log --all -S "aggregateRating" -- src/app/layout.tsx` shows the schema was last touched in:
- `7ab5e48` (2026-05-25, "Fix SEO schema and citation drift") — **THE EXACT COMMIT** that crashed the 5 protected ranking pages
- `bafd1e7` (2026-02-28, the original add)

The May 25 disaster commit didn't only damage protected pages via the title/content/schema storm. It ALSO stripped the site-wide `aggregateRating` schema. Current `layout.tsx` has no `aggregateRating`, no `reviewCount`, no `ratingValue` anywhere — `grep` returns zero matches.

**Impact:** Knowledge Panel rating signal lost. AI engine citation eligibility for review-related queries reduced. Trustindex 4.5+ verified status is still in the page UI but Google + AI engines don't see it in structured data.

**Fix:** Restore the schema to layout.tsx with current values (5.0 stars / 29 reviews per memory.md). Single commit. Not a protected-page edit. No hook block. Pure addition.

---

## What Changed Since 2026-05-25

### RESOLVED (positive deltas)

| Item | Was | Now | Wave |
|------|-----|-----|------|
| Sticker FAQ depth | 9 FAQs (gap on near-me queries) | 12 FAQs covering all 7 zero-click queries + AI-citable 145-word definition passage | Wave 2 (sticker) |
| 7 protected-page sitemap dates | Stale 2026-04-12 → 2026-05-25 | All 7 dated 2026-05-29 | Technical |
| Protected-page titles | Some 57-67 chars, brand-suffix heavy | 6/7 within 54-58 chars, recovery-tuned (banner + 5 fresh tonight) | On-Page |
| GA4 secondary ingestion | Single-pipe (GSC) — May 13-29 outage was undetectable for 16d | ga4-sync route + cron + rollup divergence signal + critical-cron alerting | Backlog → Phase 9d shipped |
| Hook enforcement | Cardinal rule was prose-only | seo-wave-guard + seo-cooldown-check + stop-price-validation Cat F all wired | Backlog → shipped |

### NEW / REGRESSIONS DISCOVERED

| # | Issue | Severity | Wave |
|---|-------|----------|------|
| **R1** | **`aggregateRating` REMOVED from `layout.tsx` (regression from commit 7ab5e48)** — Knowledge Panel + AI citation rating signal lost | **CRITICAL** | **Wave 3a-restore (do next)** |
| R2 | `aluminum-signs-saskatoon` has only 6 FAQs (below 8-FAQ standard) AND missing DesignDirectionGrid | HIGH | Wave 7 |
| R3 | `flyer-printing-saskatoon` title 61 chars (1 over 60 ceiling — shipped tonight) | LOW | Wave 7 |
| R4 | Coroplast page still has stale "$30" FAQ reference in realtor Q&A (Wave 3.3 said COMPLETE but this slipped through) | MEDIUM | Wave 3.3-continued |
| R5 | Sitemap bulk-date pattern repeated tonight (7 entries clustered on 2026-05-29) — same anti-pattern that destroys lastmod trust per seo-safety.md | MEDIUM | Process |
| R6 | Banner-printing-saskatoon BC + Flyer pages mention only Konica Minolta — brand-voice.md requires "Roland UV" mention on every page (Konica IS what prints flyers/cards; rule may need amending OR Roland mention added) | LOW | Process |
| R7 | Homepage HeroSlider is "use client" with no `<h1>` (slide 0 main headline is `<p>`); hero image has `priority` but missing `fetchPriority="high"` | MEDIUM | Wave 5 |

### CARRIED FORWARD from 2026-05-25 baseline

| # | Issue | Severity | Wave |
|---|-------|----------|------|
| N20 | Product schema not emitted (no `Product` JSON-LD anywhere) | MEDIUM | Wave 4 |
| N21 | HeroSlider client island, LCP depends on hydration | MEDIUM | Wave 5 |
| N17 | 40 sitemap-indexed pages not linked from nav/footer (partial cleanup done 5/25) | MEDIUM | Wave 3.4-continued |
| N18 | 48 page meta descriptions over 155 chars (mostly non-protected) | MEDIUM | Wave 3.4-continued |

---

## Protected Ranking Pages (post 2026-05-29 ships)

| Page | Title (ch) | Meta (ch) | FAQs | DDG | Links | Roland UV? | Risk |
|------|-----------|-----------|------|-----|-------|-----------|------|
| business-cards-saskatoon | 58 ✅ | 158 ⚠ | 8 ✅ | yes | 5 | NO (Konica) | minor — Roland UV missing per brand-voice rule |
| banner-printing-saskatoon | 57 ✅ | 143 ✅ | 8 ✅ | yes | 2 | yes ✅ | thin internal-link count (2) |
| flyer-printing-saskatoon | **61 ⚠** | 159 ⚠ | 8 ✅ | yes | 5 | NO (Konica) | title 1 over, Roland UV gap |
| coroplast-signs-saskatoon | 58 ✅ | 149 ✅ | 8 ✅ | yes | 3 | yes ✅ | **stale $30 in realtor FAQ — Wave 3.3 leftover** |
| sign-company-saskatoon | 53 ✅ | 154 ✅ | 8 ✅ | yes | 5 | yes ✅ | healthy |
| sticker-printing-saskatoon | 55 ✅ | 152 ✅ | **12 ✅** | yes | 3 | yes ✅ | strongest — 12 FAQs + AI-citable passage |
| aluminum-signs-saskatoon | 54 ✅ | 152 ✅ | **6 ❌** | **NO ❌** | 3 | yes ✅ | **needs DDG + 2 more FAQs** |

---

## Technical SEO

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| Sitemap entries | 90 indexed entries, all hardcoded `new Date("YYYY-MM-DD")` | RESOLVED | Technical |
| `/products/*` exclusion | Comment-confirmed | RESOLVED | Technical |
| Sitemap bulk-date | 7 entries on 2026-05-29 (today's ships) | **NEW R5** | Process |
| Redirects | 42 pairs, no noindex destinations | RESOLVED | Technical |
| robots.ts AI crawlers | 19 AI bots explicitly allowed | RESOLVED | AI |
| llms.txt | 12.4 KB, all 7 protected pages reflected with current prices | RESOLVED | AI |
| Meta length batch | 48 non-protected descriptions over 155 chars | PENDING | Wave 3.4 |
| Nav/footer wiring | 40 orphan sitemap pages | PENDING | Wave 3.4 |

---

## Schema / Structured Data — biggest delta this audit

| Check | Finding | Status | Wave |
|-------|---------|--------|------|
| **aggregateRating** | **REMOVED from layout.tsx in commit 7ab5e48** — zero `grep` matches now | **REGRESSION R1** | **Wave 3a-restore** |
| Service schema | Present on every IndustryPage with `url` field | RESOLVED | Wave 3 |
| BreadcrumbList | Present on every IndustryPage when canonicalSlug exists | RESOLVED | Wave 3 |
| LocalBusiness | paymentAccepted + currenciesAccepted + hasMap + geo + openingHours | RESOLVED | Wave 3 |
| Organization | alternateName (4 variants) + logo + sameAs (3 URLs) | RESOLVED | Wave 3a |
| Person (founder) | Albert Yeung schema present | RESOLVED | Wave 3a |
| FAQPage JSON-LD | **NOT emitted from IndustryPage** — FAQ content renders as `<details>` only across all 80+ SEO pages | PENDING | Wave 4 |
| Product schema | Not emitted | PENDING | Wave 4 |
| WebSite SearchAction | Not present | PENDING | Wave 4 |

---

## Performance / Images / AI

| Area | Finding | Status |
|------|---------|--------|
| HeroSlider | `"use client"`, slide 0 client-rendered, **NO `<h1>` on hero** (slide 0 is `<p>`), `priority` set but **no `fetchPriority="high"`** | NEW R7 (MEDIUM) |
| GA4 load strategy | `lazyOnload` ✅ | RESOLVED |
| Oversized images (>500KB) | Zero ✅ | RESOLVED |
| WebP ratio | 285 WebP / 19 PNG (93.8% WebP) ✅ | RESOLVED |
| Image alt attributes | All `<Image src=>` in page.tsx files have `alt=` ✅ | RESOLVED |
| Image sitemap | Exists at `/image-sitemap.xml` — 165 WebP images across 27 page groups ✅ | RESOLVED |
| robots.ts AI bots | 19 explicit allows (GPTBot, ClaudeBot, PerplexityBot, all variants of OAI + Anthropic + Google + Apple + Meta + ByteDance + Cohere + Amazon + others) | RESOLVED |
| llms.txt | 12,417 bytes — comprehensive product list + key facts + page hub. All 7 protected pages reflected. | RESOLVED |
| Author/Article schema on content pages | None (founder Person exists in layout, but no per-page Author) | PENDING (E-E-A-T gap) |

---

## Wave Schedule — Updated

| Wave | Items | Status |
|------|-------|--------|
| Immediate (N1-N5) | 5 items | COMPLETE 2026-04-12 |
| Wave 1 - Technical | 8 items | COMPLETE 2026-03-16 |
| Wave 2 - Content Quality | 9 items + sticker FAQ expansion 2026-05-29 | COMPLETE |
| Wave 3 - Schema (Service.url, image-sitemap, robots) | 3 items | COMPLETE |
| Wave 3a - Organization + Person + alternateName + logo + sameAs | | COMPLETE |
| **Wave 3a-restore - aggregateRating restore (NEW)** | 1 item | **NEXT — do immediately, single safe commit to layout.tsx** |
| Wave 3.1 - Pricing comms sweep | 8 surfaces | COMPLETE |
| Wave 3.2 - Post-audit cleanup | 3 items | COMPLETE |
| Wave 3.3 - Trust drift cleanup | most items COMPLETE; **coroplast realtor FAQ $30 leftover** | PARTIAL — 1 item remaining |
| Wave 3.4 - Internal linking + meta batch | 40 orphans + 48 long metas | PARTIAL — multi-session work |
| Wave A-F protected-page recovery (2026-05-29) | banner + sticker + BC + flyer + coroplast + aluminum + signs-yorkton | SHIPPED, verification 2026-06-05 |
| Wave 4 - Product schema + FAQPage JSON-LD on IndustryPage + WebSite SearchAction | 3 schema improvements | ON HOLD — wait until 2026-06-05 verification |
| Wave 5 - CWV / HeroSlider H1 + fetchPriority | 3 items | OVERDUE |
| Wave 6 - Mobile / UX | 3 items | OVERDUE |
| Wave 7 - CTR Recovery + cleanup | flyer title trim, aluminum DDG+FAQ, BC/flyer Roland UV mention | PENDING — after 2026-06-05 verification |
| Phase 9d - GA4 secondary ingestion + rollup divergence | 4 commits | SHIPPED 2026-05-29 (env vars pending) |

---

## Projected Score by Wave (next 4-6 weeks)

| Wave | Score impact | Cumulative |
|------|--------------|------------|
| Now | — | 79 |
| **Wave 3a-restore — aggregateRating** | +1 | **80** |
| Wave 3.3-continued — coroplast $30 FAQ fix (after 6/5) | +1 | 81 |
| Wave 7 — aluminum DDG + 2 FAQs + flyer title trim (after 6/5) | +2 | 83 |
| Wave 4 — Product schema + FAQPage JSON-LD on IndustryPage | +3 | 86 |
| Wave 5 — Homepage H1 + fetchPriority + HeroSlider audit | +2 | 88 |
| Wave 3.4-continued — orphan-page linking + meta trim batch | +2 | 90 |

---

## Top 3 Actions

1. **🚨 Wave 3a-restore — restore `aggregateRating` to layout.tsx.** Single commit, layout.tsx not under wave-guard, no protected-page touch. Reverses a damage vector from commit 7ab5e48 that we missed. Recommended values: `5.0 / 29` per memory.md. Schema score 70 → 80. Recommended NEXT.

2. **Defer Wave 7 (aluminum DDG + FAQ, flyer title trim, coroplast realtor FAQ $30 fix) until 2026-06-05 verification gate.** Same-session edits to pages that just got title commits would trigger the cooldown-check WARN and stress-test the wave system. All 3 items are queued in the next-wave doc.

3. **Sleep on Wave 4 (Product schema + FAQPage JSON-LD on IndustryPage).** Component touches all 50+ SEO pages — must wait for 6/5 banner+sticker+5-more verification to be sure the current ships are holding. If recovery signal is good 6/5, this is the highest-impact post-recovery commit (lifts FAQPage to AI-citation-eligible across the whole site).

---

## Verification

- 3 parallel agents read source files only (no live crawl)
- Inline grep confirmed aggregateRating absence + FAQPage absence
- `git log --all -S "aggregateRating"` traced regression to commit 7ab5e48
- All 7 protected pages re-audited against current PRICING_QUICK_REFERENCE.md
- Source code unchanged by this audit (READ-ONLY per skill spec)
