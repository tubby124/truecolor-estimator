# SEO Remaining Waves — truecolorprinting.ca

**Last updated:** 2026-05-25
**Full audit:** `FULL-AUDIT-REPORT.md`
**GSC baseline (2026-03-12):** BC #1 | banner #2 | flyer #3 | sign #4 | coroplast #5
**GSC actual (2026-04-12):** See ranking slip section below — baseline is no longer accurate

---

## 🚨 GSC Ranking Slip — 2026-04-12 (CRITICAL)

First real GSC check since March 12. Rankings have shifted significantly. The March "baseline" is stale.

### Ranking page positions — March vs April

| Page | March position (claimed) | April position (actual) | Delta | Clicks | Impressions |
|------|--------------------------|-------------------------|-------|--------|-------------|
| business-cards-saskatoon | #1 | 14.24 | 📉 DROPPED | 1 | 97 |
| banner-printing-saskatoon | #2 | 11.02 | ≈ stable | 3 | 280 |
| flyer-printing-saskatoon | #3 | 29.76 | 📉 PAGE 3 | 3 | 507 |
| sign-company-saskatoon | #4 | 10.00 | ≈ stable | 0 | 1 |
| coroplast-signs-saskatoon | #5 | not in top 40 | 📉 GONE | 0 | 0 |

**flyer and coroplast are the emergencies.** Flyer has 507 impressions (highest of any ranking page) but sitting on page 3 — that volume at page 1-2 would be worth 15–30 clicks/month. Coroplast has vanished from the top 40 entirely.

### Unexpected performers (weren't in Wave 2 focus)

| Page | Position | Clicks | Impressions | CTR | Issue |
|------|----------|--------|-------------|-----|-------|
| sticker-printing-saskatoon | 19.16 | 7 | 284 | 2.46% | No DDG, no descriptionNode — Wave 2 treatment needed |
| wall-graphics-saskatoon | 10.26 | 1 | 235 | 0.43% | Page 1-2 position, criminal CTR — meta/title mismatch |
| foamboard-printing-saskatoon | 15.82 | 2 | 66 | 3.03% | Decent CTR, low volume |
| about | 15.36 | 1 | 337 | 0.30% | High impressions, near-zero CTR |

**sticker-printing is outperforming 4 of the 5 Wave 2 pages by clicks.** It was invisible in the March audit because it wasn't a "ranking page" — it just started ranking.

### What likely caused the slips

1. **Coroplast gone from top 40** — possible: competitor content update, or a technical issue (page was thin content + no DDG). Wave 2.4 just fixed the content — may recover in 2–4 weeks.
2. **Business cards dropped to 14** — was probably a featured snippet / pack entry in March. The page had zero `descriptionNode` and zero internal links — it was ranking on domain authority alone. Wave 2.1/2.2 just fixed both gaps.
3. **Flyer at pos 29** — page 3. The page had content but no DDG and no CTR signal. Wave 2.5 adds DDG. But at pos 29 the content fix alone may not be enough — may need additional page depth.
4. **Wall-graphics at pos 10 with 0% CTR** — the title/meta is not matching what people are searching for. Not a content volume problem — a meta relevance problem.

### Action required before Wave 4

- [ ] Re-check GSC in 2–3 weeks after Wave 2 content indexes to see if coroplast + flyer recover
- [ ] Fix wall-graphics meta title/desc — it's on page 1 with 0% CTR, this is free traffic being left on the table
- [ ] Add sticker-printing to Wave 7 (DDG + descriptionNode, same treatment as Wave 2)
- [ ] Do NOT start Wave 4 (Product schema) until coroplast + flyer show recovery signal — adding schema to a page that's already slipping could confuse signals

---

## ⚡ Immediate Fixes (NEW — do before Wave 2)

Status: **TODO** — all 5 are quick, low risk, can be batched in one commit.

| # | Item | File | Fix |
|---|------|------|-----|
| N1 | llms.txt sticker price wrong | `public/llms.txt:22` | "From $95" → "From $25" |
| N2 | Oversized image >500KB | `public/images/industries/poster-printing/poster-concert-music.jpg` | Compress with `gs` — target <300KB |
| N3 | `/booklet-printing-saskatoon` orphan page | `src/components/site/SiteFooter.tsx` | Add to Products grid |
| N4 | `/window-perf-saskatoon` orphan page | `src/components/site/SiteFooter.tsx` | Add to Products grid |
| N5 | Footer Maps postal code wrong | `src/components/site/SiteFooter.tsx:47` | `S7L+0V5` → `S7L+0V1` |

**Rule going forward:** Any new high-priority page added to `sitemap.ts` must also be wired into either `SiteNav.tsx` INDUSTRY_LINKS or `SiteFooter.tsx` Products/Industries grid before merging.

---

## Wave 1 — Technical Quick Fixes

Status: **COMPLETE** ✅ (8/8 done)

| # | Item | Status |
|---|------|--------|
| 1.1 | sr-only H1 on homepage | ✅ RESOLVED (2026-03-16) |
| 1.2 | Remove conditional H1 from HeroSlider | ✅ RESOLVED (2026-04-12 audit confirmed `<p>` at line 178) |
| 1.3 | Trim homepage meta desc 174→146 chars | ✅ RESOLVED (2026-03-16) |
| 1.4 | Trim banner-printing meta desc 157→150 chars | ✅ RESOLVED (2026-03-16) |
| 1.5 | Trim coroplast meta desc 159→152 chars | ✅ RESOLVED (2026-03-16) |
| 1.6 | Strengthen first H2 on homepage | ✅ RESOLVED (2026-03-16) |
| 1.7 | Create manifest.webmanifest | ✅ RESOLVED (2026-03-16) |
| 1.8 | Update sitemap lastmod for touched pages | ✅ RESOLVED (2026-03-16) |

---

## Wave 2 — Content Quality

Status: **COMPLETE** ✅ (8/8 done 2026-04-12)
**Pending:** ~25 webp images still need to be generated via ChatGPT and dropped into `public/images/industries/` subfolders. DDG structure is live but images show broken until then.

| # | Item | File | Priority | Status |
|---|------|------|----------|--------|
| 2.1 | Add DesignDirectionGrid to business-cards-saskatoon | `src/app/business-cards-saskatoon/page.tsx` | HIGH | ✅ DONE |
| 2.2 | Add descriptionNode + internal links to business-cards-saskatoon | same | HIGH | ✅ DONE (3 links) |
| 2.3 | Add DesignDirectionGrid to banner-printing-saskatoon | `src/app/banner-printing-saskatoon/page.tsx` | HIGH | ✅ DONE |
| 2.4 | Add DesignDirectionGrid to coroplast-signs-saskatoon | `src/app/coroplast-signs-saskatoon/page.tsx` | HIGH | ✅ DONE |
| 2.4b | Fix FAQ price: 18×24" = "$24" → "$30" | same | HIGH | ✅ DONE (2 instances fixed) |
| 2.5 | Add DesignDirectionGrid to flyer-printing-saskatoon | `src/app/flyer-printing-saskatoon/page.tsx` | MEDIUM | ✅ DONE (Konica only) |
| 2.6 | Add descriptionNode + internal links to sign-company-saskatoon | `src/app/sign-company-saskatoon/page.tsx` | MEDIUM | ✅ DONE (5 links) |
| 2.7 | Add in-house press mention to business-cards | same | LOW | ✅ DONE |
| 2.8 | Update sitemap lastmod for all Wave 2 pages | `src/app/sitemap.ts` | LOW | ✅ DONE |

**Image paths that need real webp files generated:**
```
public/images/industries/business-cards/   card-realtor, card-contractor, card-restaurant, finish-gloss, finish-matte
public/images/industries/banners/          banner-grand-opening, banner-trade-show, banner-fence-outdoor, retractable-economy, retractable-premium
public/images/industries/coroplast/        sign-real-estate, sign-election, sign-event-directional, sign-job-site, sign-contractor, sign-hoarding
public/images/industries/flyers/           flyer-restaurant-promo, flyer-grand-opening, flyer-open-house, size-letter, size-half-letter
public/images/industries/sign-company/     sign-yard-real-estate, sign-job-site, sign-event-directional, acp-storefront, acp-office-directory, acp-hoarding
```

---

## Wave 3 — Schema Expansion

Status: **COMPLETE** ✅ (3/3 done)

| # | Item | Status |
|---|------|--------|
| 3.1 | Add `url` field to Service schema | ✅ RESOLVED — `IndustryPage.tsx:74` conditional url |
| 3.2 | Create image-sitemap.xml route | ✅ RESOLVED (2026-03-16) |
| 3.3 | Add image sitemap to robots.ts | ✅ RESOLVED (2026-03-16) |

---

## Wave 4 — Product Schema

Status: **OVERDUE** (was 2026-04-04)
**Pre-Wave 4 gate:** Run `/pricing-health` before this wave. No price inconsistencies allowed.

| # | Item | File | Status |
|---|------|------|--------|
| 4.1 | Add Product schema to coroplast-signs-saskatoon | landing page + IndustryPage | ⬜ PLANNED |
| 4.2 | Add Product schema to banner-printing-saskatoon | landing page + IndustryPage | ⬜ PLANNED |
| 4.3 | Add Product schema to business-cards-saskatoon | landing page + IndustryPage | ⬜ PLANNED |
| 4.4 | Add Product schema to flyer-printing-saskatoon | landing page + IndustryPage | ⬜ PLANNED |

---

## Wave 5 — Core Web Vitals

Status: **OVERDUE** (was 2026-04-11)

| # | Item | Status |
|---|------|--------|
| 5.1 | Audit HeroSlider bundle size (Framer Motion + AnimatePresence) | ⬜ PLANNED |
| 5.2 | Evaluate dynamic import strategy for heavy components | ⬜ PLANNED |
| 5.3 | Run CrUX data check (28-day window) | ⬜ PLANNED |

---

## Wave 6 — Mobile / UX

Status: **DUE 2026-04-18**

| # | Item | Status |
|---|------|--------|
| 6.1 | Font size audit (≥16px body, ≥14px labels) | ⬜ PLANNED |
| 6.2 | Tap target size check (≥48×48px on CTAs) | ⬜ PLANNED |
| 6.3 | Layout shift check on hero/image load | ⬜ PLANNED |

---

## Wave 7 — CTR Recovery + Emerging Pages

Status: **NEW** — discovered 2026-04-12 from GSC data
**Do after:** Wave 2 content has had 2–3 weeks to index and position signal has stabilized

| # | Item | Page | Issue | Priority |
|---|------|------|-------|----------|
| 7.1 | Fix meta title + description | `wall-graphics-saskatoon` | pos 10.26 with 235 impressions and 0% CTR — people see it and don't click. Title/desc not matching search intent | HIGH |
| 7.2 | Add descriptionNode + DDG | `sticker-printing-saskatoon` | 7 clicks / pos 19 — Wave 2 treatment. Currently no descriptionNode, no DDG. Most clicked non-homepage page | HIGH |
| 7.3 | Investigate coroplast recovery | `coroplast-signs-saskatoon` | Was #5 in March, gone from top 40 in April. Wave 2 added DDG — re-audit after indexing. If still absent, may need link building or content expansion | HIGH |
| 7.4 | Flyer content depth audit | `flyer-printing-saskatoon` | 507 impressions at pos 29.76. Wave 2 added DDG. If still on page 3 post-index, may need FAQ expansion or additional sections | MEDIUM |
| 7.5 | Fix about page meta | `/about` | 337 impressions, pos 15.36, 0.3% CTR — meta desc is not compelling enough for the query | LOW |
| 7.6 | Update GSC baseline | — | Re-record actual positions after Wave 2 indexes (allow 2–3 weeks from 2026-04-12) | LOW |

**wall-graphics is the fastest win:** position 10 with real impressions and zero CTR. Rewriting the meta title to match "wall graphics saskatoon" search intent more directly could convert those 235 monthly impressions to 5–10 clicks for free.

---

## Backlog (No Wave Assigned)

| Item | Notes |
|------|-------|
| GBP `REPLACE_WITH_GOOGLE_PLACE_ID` placeholder | `reviewRequest.ts:32` — hardcoded placeholder |
| true-color.ca redirect chain | Hostinger fix pending — http → https still 3 hops |
| Blog / Resources content | Neither True Color nor Minuteman has one — first-mover wins local print authority |
| "Free local delivery" mention | Only add if True Color actually offers this |
| DECAL bug: RMVN006 can't be selected | OptionsPanel issue |

---

## Wave Status Summary

| Wave | Items | Status |
|------|-------|--------|
| Immediate Fixes (N1–N5) | 5 items | **COMPLETE** ✅ 2026-04-12 |
| Wave 1 — Technical | 8 items | **COMPLETE** ✅ 2026-03-16 |
| Wave 2 — Content Quality | 9 items | **COMPLETE** ✅ 2026-04-12 — images pending |
| Wave 3 — Schema (Service.url, image-sitemap, robots reference) | 3 items | **COMPLETE** ✅ 2026-03-16 |
| Wave 3a — Organization schema + alternateName + logo (resolves F1) | 1 item | **COMPLETE** ✅ |
| Wave 3 — Pricing comms alignment ($25 order-total min sweep) | 27 files | **COMPLETE** ✅ 2026-05-20 (commit 102faed) |
| Wave 3.1 — Pricing comms sweep continued | 8 surfaces | **COMPLETE** ✅ 2026-05-20 |
| Wave 3.2 — Post-audit cleanup | 3 fix-up items | **COMPLETE** ✅ 2026-05-20 |
| **Wave 3.3 — Trust drift cleanup** | stale minimum/pricing copy + guard rails | **COMPLETE** ✅ 2026-05-25 |
| **Wave 3.4 — Internal linking + meta batch** | orphan links + priority meta trims | **PARTIAL** ✅ 2026-05-25 |
| Wave 4 — Product Schema | 4 items | **ON HOLD** — wait for coroplast/flyer recovery signal |
| Wave 5 — Core Web Vitals | 3 items | 0/3 overdue since 2026-04-11 |
| Wave 6 — Mobile/UX | 3 items | 0/3 overdue since 2026-04-18 |
| Wave 7 — CTR Recovery | 6 items | PARTIAL — sticker, wall-graphics, near-me hubs still TODO |

---

## Wave 3.1 — Pricing Comms Sweep Continued (COMPLETE 2026-05-20)

**Trigger:** Full audit 2026-05-20 found 8 surfaces still using stale per-product min anchors despite Wave 3 sweep that morning.

| # | Item | File | Severity |
|---|------|------|----------|
| 3.1a | **CRITICAL: ACP homepage card I just set to `from $25` contradicts PRICING_QUICK_REFERENCE.md** — should be `from $39` (smallest 18×24" = $39, above $25 floor so floor doesn't apply) | [src/app/page.tsx:77](src/app/page.tsx#L77) | HIGH (self-introduced) |
| 3.1b | products-content.ts ACP fromPrice `$25` → `$39` | [src/lib/data/products-content.ts:356](src/lib/data/products-content.ts#L356) | HIGH (self-introduced) |
| 3.1c | truecolor-pricing-comms.md rule table says ACP `from $25` — fix to `from $39` | [.claude/rules/truecolor-pricing-comms.md](.claude/rules/truecolor-pricing-comms.md) | HIGH (self-introduced) |
| 3.1d | **llms.txt has 11+ stale per-product min refs** — AI bots cite stale prices | [public/llms.txt](public/llms.txt):11, 15, 18, 19, 41, 44, 50, 75, 81, 105 | **CRITICAL** |
| 3.1e | contact page meta + body say "signs from $30" | [src/app/contact/page.tsx](src/app/contact/page.tsx):12, 17, 345 | HIGH |
| 3.1f | church-banners-saskatoon: 4 stale `$30` coroplast refs | [src/app/church-banners-saskatoon/page.tsx](src/app/church-banners-saskatoon/page.tsx):29, 56, 75, 83 | HIGH |
| 3.1g | **vinyl-lettering-saskatoon (DEFEND #7.4)** cross-sell array shows stale prices | [src/app/vinyl-lettering-saskatoon/page.tsx](src/app/vinyl-lettering-saskatoon/page.tsx):89-92 | HIGH |
| 3.1h | coroplast-signs-saskatoon subtitle "18×24" from $30" | [src/app/coroplast-signs-saskatoon/page.tsx:24](src/app/coroplast-signs-saskatoon/page.tsx#L24) | HIGH |
| 3.1i | car-dealership-signs-saskatoon meta + body "magnets from $45" | [src/app/car-dealership-signs-saskatoon/page.tsx](src/app/car-dealership-signs-saskatoon/page.tsx):8, 66 | MEDIUM |

**Status:** Complete per `memory/seo-sprints.md` Phase 24. Body copy + metadata only. Zero intentional title/H1/slug/schema changes on protected DEFEND/FROZEN pages.

---

## Wave 3.2 — Post-Audit Cleanup (COMPLETE 2026-05-20)

**Trigger:** Follow-up verification after Wave 3.1 found one stale for-lease FAQ, 3 long meta descriptions, and stale sitemap dates for pages edited during Wave 3/Wave 3.1.

| # | Item | File | Status |
|---|------|------|--------|
| 3.2a | for-lease FAQ stale "$30" phrasing | `src/app/for-lease-signs-saskatoon/page.tsx` | COMPLETE |
| 3.2b | Trim overlong meta descriptions | `for-lease`, `property-management`, `vehicle-magnets-regina` | COMPLETE |
| 3.2c | Bump honest sitemap lastmod dates for pages edited 2026-05-20 | `src/app/sitemap.ts` | COMPLETE |

---

## Wave 3.3 — Trust Drift Cleanup (NEW 2026-05-25)

**Trigger:** 2026-05-25 `/seo-audit` found the site is technically healthier than the 2026-05-20 report, but stale pricing examples still leak into protected and high-value pages. This is the current highest-risk SEO issue because it weakens snippet trust and AI answer consistency.

| # | Item | File | Severity |
|---|------|------|----------|
| 3.3a | Fix remaining coroplast `$30` examples; use `$8/sqft`, `$24 raw`, or `$25 order-total minimum` per context | `src/app/coroplast-signs-saskatoon/page.tsx`, `src/app/sign-company-saskatoon/page.tsx`, `src/app/real-estate-signs-saskatoon/page.tsx`, `src/app/agriculture-signs-saskatoon/page.tsx`, `src/app/services/page.tsx` | HIGH |
| 3.3b | Correct flyer DDG tier prices: `250 for $80` and `500 for $130` conflict with reference `250=$110`, `500=$135` | `src/app/flyer-printing-saskatoon/page.tsx` | HIGH |
| 3.3c | Verify Sign Company ACP `4x8 ft — $416` against CSV/source of truth before editing; quick reference common size says `4x8 ft = $320` | `src/app/sign-company-saskatoon/page.tsx`, `data/PRICING_QUICK_REFERENCE.md`, `data/tables/*` | HIGH |
| 3.3d | Refresh llms.txt review count/date so AI file matches `REVIEW_COUNT` and current review state | `public/llms.txt`, `src/lib/reviews.ts` | LOW |
| 3.3e | Emit `reviewCount` as numeric instead of string if schema validator confirms expected output | `src/app/layout.tsx` | LOW |
| 3.3f | Keep protected-page safety: body copy only on protected pages; do not combine title/H1/schema edits with pricing copy cleanup | protected SEO pages | RULE |

**Plan:** One narrow trust-cleanup commit after verifying the ACP price from CSV/source. No H1/title/schema changes on protected pages in the same commit.

---

## Wave 3.4 — Internal Linking + Meta Batch (NEW 2026-05-25)

**Trigger:** 2026-05-25 audit found 40 sitemap-indexed pages without SiteNav/SiteFooter links and 48 page meta descriptions over 155 chars. Protected ranking pages are clean; the issue is mostly newer city-variant and programmatic pages.

| # | Item | Scope | Priority |
|---|------|-------|----------|
| 3.4a | Add discoverable internal links for sitemap-indexed orphan pages, prioritizing label/service pages and city/product pages | 40 pages | MEDIUM |
| 3.4b | Trim non-protected meta descriptions over 155 chars; prioritize city pages, resources, window-perf, booklet, community/commercial/education hubs | 48 descriptions | MEDIUM |
| 3.4c | Review 3 legacy retractable-banner redirects that currently land on noindex `/products/retractable-banners` | `next.config.ts` | MEDIUM |

---

**Next session priority order:**
1. **Wave 3.3 trust drift cleanup** — stale coroplast/flyer/ACP examples, then llms review count.
2. **Wave 3.4 internal linking + meta batch** — connect orphan sitemap pages and trim long descriptions.
3. **Wave 4 Product schema** — only after pricing drift is clean.
4. **Wave 5 HeroSlider/CWV audit** — client island and bundle review.
5. **Wave 7 content recovery** — flyer/coroplast visible content depth and banner internal link count.

---

## Completed

| Item | Completed |
|------|-----------|
| www. → apex 301 Cloudflare Redirect Rule | 2026-03-12 |
| Cloudflare email obfuscation → OFF | 2026-03-12 |
| /vinyl-banners-saskatoon → /banner-printing-saskatoon | 2026-03-12 |
| Sitemap lastmod: per-page hardcoded dates | 2026-03-12 |
| /products/* removed from sitemap | 2026-03-12 |
| Title tag: 54 chars ✅ | 2026-03-12 |
| Meta desc default: 140 chars ✅ | 2026-03-12 |
| reviewCount: dynamic from REVIEW_COUNT | 2026-03-12 |
| llms.txt: comprehensive entity file | Prior session |
| robots.ts: AI bots allowed, SEO bots blocked | Prior session |
| icon.png + apple-icon.png | Prior session |
| 29 WordPress → Next.js 301 redirects | 2026-03-13 |
| Gallery sitemap date fixed (future date bug) | 2026-03-13 |
| /quote-request → /quote redirect | 2026-03-13 |
| Homepage sr-only H1 | 2026-03-16 |
| Homepage meta desc: 174→146 chars | 2026-03-16 |
| Banner meta desc: 157→150 chars | 2026-03-16 |
| Coroplast meta desc: 159→152 chars | 2026-03-16 |
| Homepage H2 strengthened | 2026-03-16 |
| manifest.webmanifest created | 2026-03-16 |
| image-sitemap.xml route created | 2026-03-16 |
| Image sitemap referenced in robots.ts | 2026-03-16 |
| HeroSlider H1 → `<p>` tag | Confirmed 2026-04-12 |
| Service schema `url` field | Confirmed 2026-04-12 |
| LocalBusiness paymentAccepted, currenciesAccepted, hasMap | Confirmed 2026-04-12 |
