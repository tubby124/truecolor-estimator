# Full SEO Audit — truecolorprinting.ca

**Date:** 2026-05-20
**Previous Score:** 68/100 (2026-04-27)
**Method:** Codebase-first delta audit (3 parallel agents + inline checks)

---

## SEO Health Score: 69 / 100 (+1 vs baseline)

| Category | Weight | Prev | Current | Delta | Weighted |
|----------|--------|------|---------|-------|----------|
| Technical SEO | 25% | 67 | 68 | +1 | 17.00 |
| Content Quality | 25% | 64 | 66 | +2 | 16.50 |
| On-Page SEO | 20% | 60 | 60 | 0 | 12.00 |
| Schema / Structured Data | 10% | 71 | 77 | +6 | 7.70 |
| Performance (CWV) | 10% | 76 | 76 | 0 | 7.60 |
| Images | 5% | 87 | 87 | 0 | 4.35 |
| AI Search Readiness | 5% | 89 | 82 | −7 | 4.10 |
| **TOTAL** | 100% | **68** | **69** | **+1** | **69.25** |

**Honest read:** Two big wins land — (1) Organization schema with `alternateName` array shipped, resolving the F1 brand-string Knowledge Graph problem from the prior baseline; (2) Wave 3 today (commit `102faed`) swept 27 files of stale `$30/$45/$60 minimum charge` references and rewrote [.claude/rules/truecolor-pricing-comms.md](.claude/rules/truecolor-pricing-comms.md) to the new $25 order-total-min policy. But the sweep was incomplete — `public/llms.txt` (11+ stale references), `src/app/contact/page.tsx`, `src/app/church-banners-saskatoon/page.tsx`, `src/app/vinyl-lettering-saskatoon/page.tsx` (DEFEND #7.4), `src/app/coroplast-signs-saskatoon/page.tsx` subtitle, and `src/app/car-dealership-signs-saskatoon/page.tsx` still carry the old per-product min anchors. AI Search Readiness drops −7 because the llms.txt drift is what ChatGPT/Perplexity will cite when asked about True Color pricing. Wave 3 cleaned the obvious surfaces but the audit found 6+ more pages it missed.

**Critical self-correction:** My homepage ACP card change today (`from $60` → `from $25`) contradicts the canonical [data/PRICING_QUICK_REFERENCE.md](data/PRICING_QUICK_REFERENCE.md):24, which says ACP marketing anchor = **"from $39"** because the smallest realistic ACP order (18×24" = $39) is already above the $25 floor — the floor doesn't apply to ACP. Same correction needed in [src/lib/data/products-content.ts](src/lib/data/products-content.ts):356 and [.claude/rules/truecolor-pricing-comms.md](.claude/rules/truecolor-pricing-comms.md).

---

## What changed since 2026-04-27

### RESOLVED (5 items)

| Item | Was | Now | Wave |
|------|-----|-----|------|
| F1 — Three brand-name strings causing Knowledge Graph split | LocalBusiness `name` + Twitter title + default title disagreed | Organization schema shipped with `alternateName: [4 variants]` + `logo` field at [layout.tsx:84-113](src/app/layout.tsx#L84-L113) | 3a — DONE |
| Service schema `url` field | Was added as conditional | Verified at [IndustryPage.tsx:78](src/components/site/IndustryPage.tsx#L78) | 3 — DONE |
| Per-product min `$30/$45/$60` copy across 22 niche pages | Marketing anchors lied about engine reality | Wave 3 commit `102faed` swept 22 niche pages + homepage cards + products-content.ts + comms rule | Wave 3 (today) |
| Sitemap dynamic dates | Risk of `new Date()` bulk drift | All 56 entries use hardcoded per-page dates. /products/* properly excluded | 1 — DONE |
| 20 new label pages + property-management + for-lease shipped | — | All dated 2026-05-14 with consistent city-variant pattern | 2 — DONE |

### NEW since baseline (8 items)

| # | Issue | Severity | File |
|---|-------|----------|------|
| N6 | **llms.txt has 11+ stale per-product min references** — coroplast `$30 minimum`, magnets `$45`, decals `$45`, perf `$40`, for-lease ACP `$60` etc. AI bots will cite stale prices | **CRITICAL** | [public/llms.txt](public/llms.txt):11, 15, 18, 19, 41, 44, 50, 75, 81, 105 |
| N7 | contact page still says "signs from $30" in meta + body | HIGH | [src/app/contact/page.tsx:12, 17, 345](src/app/contact/page.tsx#L12) |
| N8 | church-banners-saskatoon page has 4 stale `$30` coroplast references (description, whyPoints, product card, body Link text) | HIGH | [src/app/church-banners-saskatoon/page.tsx:29, 56, 75, 83](src/app/church-banners-saskatoon/page.tsx#L29) |
| N9 | **vinyl-lettering-saskatoon (DEFEND #7.4)** cross-sell product array shows stale `from $45` (decals + magnets) + `from $30` (coroplast) | HIGH | [src/app/vinyl-lettering-saskatoon/page.tsx:89-92](src/app/vinyl-lettering-saskatoon/page.tsx#L89-L92) |
| N10 | **coroplast-signs-saskatoon subtitle** "18×24" from $30" — page was FROZEN but is now DECAYED per 2026-05-05 GSC refresh | HIGH | [src/app/coroplast-signs-saskatoon/page.tsx:24](src/app/coroplast-signs-saskatoon/page.tsx#L24) |
| N11 | car-dealership-signs-saskatoon meta + body say "magnets from $45" | MEDIUM | [src/app/car-dealership-signs-saskatoon/page.tsx:8, 66](src/app/car-dealership-signs-saskatoon/page.tsx#L8) |
| N12 | **Homepage ACP card set to `from $25` contradicts PRICING_QUICK_REFERENCE.md** which says "from $39" (smallest 18×24" is $39, above floor) | HIGH (self-introduced) | [src/app/page.tsx:77](src/app/page.tsx#L77) |
| N13 | **products-content.ts ACP fromPrice set to `$25`** — should be `$39` per same policy. truecolor-pricing-comms.md rule also says ACP `from $25` and needs correction | HIGH (self-introduced) | [src/lib/data/products-content.ts:356](src/lib/data/products-content.ts#L356), [.claude/rules/truecolor-pricing-comms.md](.claude/rules/truecolor-pricing-comms.md) |

### PENDING (carried from 2026-04-27)

| Item | Wave | Why |
|------|------|-----|
| Title length: business-cards-saskatoon 67 chars + flyer-printing-saskatoon 63 chars | DEFER | Both pages decayed per 2026-05-05 (BC #16, flyer #25) — eligible for rewrite per protected-pages rule, but title change + content change must be separate commits |
| Product schema on coroplast/banner/BC/flyer | Wave 4 | Gated until those pages show ranking recovery signal |
| HeroSlider bundle audit | Wave 5 | Overdue since 2026-04-11 |
| Mobile/UX font + tap target audit | Wave 6 | Overdue since 2026-04-18 |
| sticker-printing-saskatoon DDG + descriptionNode | Wave 7.2 | Still missing per current state |
| wall-graphics-saskatoon title (89 chars truncated in SERP) + meta | Wave 7.1 | High-CTR opportunity left on table |
| "near me" hub pages (/printing-near-me-saskatoon, /printing-services-saskatoon) | Wave 7.3 | ≥130 imp/mo with no dedicated landing |
| Banner page only 2 internal links (was 4 per baseline) | Wave 7.4 | Soft regression; verify intent |

---

## Per-Category Detail

### Technical SEO — 68 / 100 (+1)

**Sitemap.** 56 pages, hardcoded `new Date("YYYY-MM-DD")` per entry, /products/* properly excluded. No dynamic-date drift. Wave 2026-05-14 added 20 label pages + for-lease + property-management with clean dates.

**Redirects.** 48 active 301s, all `permanent: true`. Cannibalization consolidations from 2026-05-05 (event-banners, custom-magnets, trades-signs) in place. WordPress legacy paths cleaned.

**robots.ts.** AI bots allowed (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot). Commercial scrapers blocked. Dual sitemap (sitemap.xml + image-sitemap.xml) referenced.

**noindex coverage.** /cart /checkout /order-confirmed /pay/* /staff/* /account/* /products/* /api/* per CLAUDE.md route map.

### Content Quality — 66 / 100 (+2)

**Wave 3 today** swept 27 files of `$30 minimum charge` / `Minimum $30` / `$45 minimum` / `$60 minimum` patterns and replaced with `$25 order-total minimum at checkout`. Build clean, 124/124 tests pass.

**But** the sweep missed 6 surfaces (N6–N11 above). Wave 3.1 follow-up needed:
- llms.txt (11+ stale refs)
- contact page (3 refs)
- church-banners-saskatoon (4 refs)
- vinyl-lettering-saskatoon (3 refs in product cards array — DEFEND page)
- coroplast-signs-saskatoon (1 ref in subtitle)
- car-dealership-signs-saskatoon (2 refs)

**5 ranking pages all meet content depth standard:** ≥400 words, 8 FAQs, price in first paragraph, Saskatoon/Saskatchewan in first paragraph, +$40 rush mentioned, $35 designer mentioned, all 5 have DesignDirectionGrid. Banner-printing has Roland UV mention, coroplast and sign-company too. Business-cards + flyer use Konica Minolta (correct equipment for those products — not a fault).

### On-Page SEO — 60 / 100 (0)

**Title lengths still failing on 2 ranking pages:**
- business-cards-saskatoon: "Business Cards Saskatoon | 250 Cards from $45 | True Color" = 67 chars
- flyer-printing-saskatoon: "Flyer Printing Saskatoon | 100 Flyers from $45 | True Color" = 63 chars

Both pages are DECAYED per 2026-05-05 GSC (BC #16, flyer #25) — eligible for rewrite. But rewrite must be a separate commit from any content/schema change per safety policy.

**Other ranking page titles pass:** banner-printing 59 chars, coroplast 56, sign-company 57.

**Banner page internal link count** dropped from baseline's 4 → 2. Verify intent.

### Schema / Structured Data — 77 / 100 (+6)

**Organization schema shipped** at [layout.tsx:84-113](src/app/layout.tsx#L84-L113) with `alternateName` array (resolves F1 baseline issue):
```ts
alternateName: [
  "True Color Printing",
  "True Color Display Printing",
  "True Color Display Printing Ltd.",
  // 4th variant
]
+ logo field
```

LocalBusiness has paymentAccepted, currenciesAccepted: CAD, hasMap, logo, sameAs, @id, aggregateRating with reviewCount. WebSite has SearchAction potentialAction.

**Still missing:** Product schema on coroplast/banner/BC/flyer (Wave 4 — gated until ranking recovery).

### Performance (CWV) — 76 / 100 (0)

GTM still uses `strategy="lazyOnload"` at [layout.tsx:251, 253](src/app/layout.tsx#L251) — does not block LCP. HeroSlider is client component with `priority` on slide 0 image at line 171. QuoteModal is a static array (no dynamic import needed because no QuoteModal in the slider).

Wave 5 HeroSlider bundle audit still pending.

### Images — 87 / 100 (0)

No images >500KB. Wave 2 image generation queue (~25 webp files for industries/ subfolders) status unknown.

### AI Search Readiness — 82 / 100 (−7)

**llms.txt is now actively misleading AI bots** about True Color pricing. The 2026-05-19 → 2026-05-20 system change (per-product mins killed, $25 order-total min instead) was not propagated to llms.txt. ChatGPT, Perplexity, Claude all cite from here.

Stale claims in [public/llms.txt](public/llms.txt):
- Line 11: "Coroplast Signs ... $30 minimum" — dead system
- Line 15: "Vehicle Magnets: From $45" — should be $25
- Line 18: "Window Decals: From $45" — should be $25
- Line 19: "Window Perf: From $40" — should be $25
- Line 41: For Lease Signs lists "coroplast signs from $30" + "ACP aluminum from $60"
- Line 44: "Vehicle Magnets from $45"
- Line 50: "$8/sqft with a $30 order minimum"
- Line 75: "coroplast signs from $8/sqft with a $30 minimum"
- Line 105: "coroplast for-lease signs from $30, ... ACP aluminum versions ... start at $60"

Robots, sitemap, image-sitemap, structured data all still solid.

---

## Wave Schedule — Updated

| Wave | Items | Status |
|------|-------|--------|
| Immediate (N1–N5) | 5 items | COMPLETE 2026-04-12 |
| Wave 1 — Technical | 8 items | COMPLETE 2026-03-16 |
| Wave 2 — Content Quality | 9 items | COMPLETE 2026-04-12 (images still pending) |
| Wave 2 (security+content 2026-05-20) | 32 files | COMPLETE 2026-05-20 (commits e8c73a4, 22fbc46) |
| Wave 3 — Schema expansion (Service.url, image-sitemap) | 3 items | COMPLETE 2026-03-16 |
| **Wave 3a — Organization schema** | 1 item | **COMPLETE** (shipped, resolves F1) |
| **Wave 3 — Pricing comms alignment** | 27 files | **COMPLETE 2026-05-20** (commit 102faed) |
| **Wave 3.1 — Pricing comms sweep CONTINUED (N6–N13)** | 8 surfaces | **NEW — TODO** |
| Wave 4 — Product schema | 4 items | PENDING (gate on ranking recovery) |
| Wave 5 — CWV / HeroSlider bundle | 3 items | OVERDUE since 2026-04-11 |
| Wave 6 — Mobile / UX | 3 items | OVERDUE since 2026-04-18 |
| Wave 7 — CTR Recovery | 6 items | PARTIAL (sticker, wall-graphics, near-me hubs still TODO) |

---

## Projected Score Path

| Wave | Score impact | Cumulative |
|------|-------------|-----------|
| **Now** | — | 69 |
| Wave 3.1 (N6–N13 sweep — llms.txt + 5 pages + homepage ACP correction) | +5 (AI Readiness 82→90, Content 66→69) | 73 |
| Wave 4 (Product schema on 4 ranking pages) | +3 (Schema 77→85) | 75 |
| Wave 5 (HeroSlider bundle reduce) | +3 (CWV 76→82) | 77 |
| Wave 7.1 (wall-graphics title + meta rewrite) | +1 (On-Page 60→64) | 78 |
| Wave 7.2 (sticker-printing DDG + content) | +2 (Content 69→72) | 80 |

A clean 80/100 is reachable in 4–6 weeks if Wave 3.1 (today) + Wave 4 + 7.1/7.2 ship in order.

---

## Top 3 Actions for Next Wave (Wave 3.1 — IMMEDIATE)

1. **Correct homepage + products-content + comms rule: ACP `from $25` → `from $39`** ([src/app/page.tsx:77](src/app/page.tsx#L77), [src/lib/data/products-content.ts:356](src/lib/data/products-content.ts#L356), [.claude/rules/truecolor-pricing-comms.md](.claude/rules/truecolor-pricing-comms.md)). I introduced this drift in commit `102faed` an hour ago. PRICING_QUICK_REFERENCE.md is the canonical truth.

2. **Rewrite public/llms.txt against current $25 order-total-min policy** — replace all `$30 minimum`, `$45 minimum`, `$60 minimum` claims with the canonical "from $X" anchors from PRICING_QUICK_REFERENCE.md. Also update Q&A FAQ section. ~12 distinct edits.

3. **Sweep 5 remaining pages**: [contact](src/app/contact/page.tsx), [church-banners-saskatoon](src/app/church-banners-saskatoon/page.tsx), [vinyl-lettering-saskatoon](src/app/vinyl-lettering-saskatoon/page.tsx) (DEFEND — body only), [coroplast-signs-saskatoon](src/app/coroplast-signs-saskatoon/page.tsx) (DECAYED — subtitle line 24 only, no H1/title), [car-dealership-signs-saskatoon](src/app/car-dealership-signs-saskatoon/page.tsx). Body-copy only.

All three actions are body-copy / metadata only — zero risk to title/H1/slug/schema on any DEFEND or FROZEN page. Can ship as one Wave 3.1 commit followed by GSC re-check on 2026-05-27.
