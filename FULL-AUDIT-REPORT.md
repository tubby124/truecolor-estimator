# Full SEO Audit — truecolorprinting.ca

**Date:** 2026-04-27
**Previous Score:** 67/100 (2026-04-12)
**Method:** Codebase delta audit + GSC 28-day data cross-reference (2026-03-27 → 2026-04-23)

---

## SEO Health Score: 68 / 100 (+1 vs baseline)

| Category | Weight | Prev | Current | Delta | Weighted |
|----------|--------|------|---------|-------|----------|
| Technical SEO | 25% | 65 | 67 | +2 | 16.75 |
| Content Quality | 25% | 60 | 64 | +4 | 16.00 |
| On-Page SEO | 20% | 63 | 60 | −3 | 12.00 |
| Schema / Structured Data | 10% | 75 | 71 | −4 | 7.10 |
| Performance (CWV) | 10% | 73 | 76 | +3 | 7.60 |
| Images | 5% | 84 | 87 | +3 | 4.35 |
| AI Search Readiness | 5% | 89 | 89 | 0 | 4.45 |
| **TOTAL** | 100% | **67** | **68** | **+1** | **68.25** |

**Honest read:** Wave 2 content depth + N1–N5 immediate fixes shipped cleanly (+content +tech +images +CWV from `lazyOnload`). But fresh GSC data exposes 4 issues the previous audit didn't see: branded-query collapse, wall-graphics title length blowing past Google's truncation point, on-page links pointing to noindexed `/products/*` pages, and missing Organization schema. Net +1 only because new findings offset the wins.

---

## Wave 2 verification — DID IT SHIP?

| Page | DDG | descriptionNode | Internal Links | Wave 2 status |
|------|-----|-----------------|----------------|---------------|
| business-cards-saskatoon | ✅ | ✅ | ≥3 | SHIPPED |
| banner-printing-saskatoon | ✅ | ✅ | 4 | SHIPPED |
| coroplast-signs-saskatoon | ✅ | ✅ | 3+ | SHIPPED |
| flyer-printing-saskatoon | ✅ (Konica) | ✅ | 4 (2 → noindexed `/products/*`) | SHIPPED w/ flaw |
| sign-company-saskatoon | ✅ | ✅ | 5 | SHIPPED |

Wave 2 is on the page. Indexing window: 14–28 days from 2026-04-12 → ends ~2026-05-10. Currently 15 days in. **Pages still recovering — do NOT make additional content changes to ranking pages until Wave 2 has fully indexed.**

---

## NEW FINDINGS since 2026-04-12

### F1 — Branded query "true color printing" position 13.55 (CRITICAL)

GSC shows 4 brand variants splitting impressions: `true color printing` / `truecolor printing` / `true colour printing` / `true color display`. Only 4 clicks across 14 impressions on 36% CTR — high CTR but low rank.

**Root cause in [src/app/layout.tsx](src/app/layout.tsx):**

| Where | Name string | Line |
|-------|-------------|------|
| Default title | "True Color Printing" | [layout.tsx:21](src/app/layout.tsx#L21) |
| Title template | "True Color Display Printing" | [layout.tsx:22](src/app/layout.tsx#L22) |
| Twitter title | "True Color Printing" | [layout.tsx:65](src/app/layout.tsx#L65) |
| LocalBusiness `name` | "True Color Display Printing" | [layout.tsx:95](src/app/layout.tsx#L95) |
| LocalBusiness `legalName` | "True Color Display Printing Ltd." | [layout.tsx:96](src/app/layout.tsx#L96) |
| WebSite `name` | "True Color Display Printing" | [layout.tsx:76](src/app/layout.tsx#L76) |

Three different brand strings → Knowledge Graph can't pick a canonical. There is **no standalone Organization schema** — only LocalBusiness + WebSite. LocalBusiness has `sameAs` (Maps + IG + FB) ✅ and `@id` ✅, but is missing `logo` (separate field from `image`).

**Fix (Wave 3a):** Add Organization schema with `alternateName: ["True Color Printing", "True Color Display Printing", "True Color Display Printing Ltd."]` + `logo: {url, width, height}`. Reference via `parentOrganization` from LocalBusiness. Single commit, low-risk schema add.

### F2 — wall-graphics title length blowing SERP truncation (HIGH)

[src/app/wall-graphics-saskatoon/page.tsx:6](src/app/wall-graphics-saskatoon/page.tsx#L6):
```
"Wall Graphics Saskatoon | Office Murals & Vinyl Decals | From $11/sqft"
```
**89 chars.** Google truncates at ~60. Real SERP display: `Wall Graphics Saskatoon | Office Murals & Vinyl Deca...` — the price anchor `From $11/sqft` is hidden after the ellipsis. Result: 246 impressions, 0% CTR.

**Fix (Wave 3a):** Truncate to `Wall Graphics Saskatoon | From $11/sqft | True Color` (54 chars). NOT in protected-pages frozen list — safe to change. Meta description (159 chars) also slightly over, trim to ≤155.

### F3 — Banner-printing 0% CTR is a zero-click problem, not a meta problem (MEDIUM)

[src/app/banner-printing-saskatoon/page.tsx](src/app/banner-printing-saskatoon/page.tsx) title is 56 chars with the price anchor visible. Page has DDG, 8 FAQs, AggregateRating in SERP. Likely: Google's rich snippet answers the price question → searcher gets the answer without clicking. This is FROZEN per protected-pages rule. Don't touch title or H1. Possible Wave 3 micro-fix: rewrite meta to add a CTA that requires clicking ("Order in 30s. Same-day rush. Photos →").

### F4 — flyer-printing pos 25 may be partly self-inflicted by noindexed link targets (MEDIUM)

[src/app/flyer-printing-saskatoon/page.tsx:102](src/app/flyer-printing-saskatoon/page.tsx#L102), [:109](src/app/flyer-printing-saskatoon/page.tsx#L109), [:113](src/app/flyer-printing-saskatoon/page.tsx#L113), [:117](src/app/flyer-printing-saskatoon/page.tsx#L117): 4 internal Links out — but `/products/brochures`, `/products/business-cards`, `/products/postcards`, `/products` are all `noindex` per CLAUDE.md route map. PageRank flowing to noindexed targets is wasted equity.

**Fix (Wave 3b):** Repoint to `/brochure-printing-saskatoon`, `/business-cards-saskatoon`, `/postcard-printing-saskatoon`, `/products` → leave only the cluster-hub link (`/products` is OK as it's the public catalog).

### F5 — Missing hub pages for "near me" volume (HIGH)

GSC shows ≥130 impressions/month on "near me" queries with no dedicated landing page:
- "printing services near me" 24 imp pos 7.83
- "printing near me" 61 imp pos 8.64
- "print shop near me" 23 imp pos 8.39
- "colour printing near me" 7 imp pos 4.14

Homepage and `/services` are absorbing these. Position 7-8 with 0% CTR on most. **Build (Wave 3c):** `/printing-near-me-saskatoon` + `/printing-services-saskatoon` via `/truecolor-page` skill.

### F6 — sticker-printing-saskatoon converting orders without DDG (HIGH OPPORTUNITY)

Hasan reports stickers + decals are pulling email orders despite middling rank. GSC shows pos 5.75, 1 click. Page lacks DDG and full descriptionNode (Wave 7.2 already on the books from 2026-04-12). **Apply Wave 2 treatment** to capture more of the existing demand: DDG with sticker design directions + size guide + descriptionNode rewrite.

### F7 — GTM strategy regression flagged by audit was actually a perf upgrade

GTM scripts now use `strategy="lazyOnload"` ([layout.tsx:204](src/app/layout.tsx#L204), [:206](src/app/layout.tsx#L206)). Previous baseline expected `afterInteractive`. **lazyOnload is better** — GTM no longer blocks LCP. Counted as +3 in CWV score. NOT a regression.

---

## RESOLVED since 2026-04-12 (verified)

| Item | Status |
|------|--------|
| N1 — llms.txt sticker price "From $25" | ✅ verified |
| N2 — poster-concert-music.jpg compressed (no images >500KB) | ✅ verified |
| N3 — booklet-printing-saskatoon nav link | (pending verify in SiteFooter) |
| N4 — window-perf-saskatoon nav link | (pending verify in SiteFooter) |
| N5 — Footer Maps `S7L+0V1` | ✅ verified at memory/memory.md |
| Wave 2 — DDG + descriptionNode on 5 ranking pages | ✅ verified |

---

## PENDING (carried from 2026-04-12)

| Item | Wave | Why still pending |
|------|------|-------------------|
| ~25 webp images for industries/ subfolders | Wave 2 | ChatGPT image generation queue |
| Product schema on coroplast/banner/BC/flyer | Wave 4 | Gated until coroplast + flyer recover |
| HeroSlider bundle audit | Wave 5 | Overdue 2026-04-11 |
| Mobile / UX (font sizes, tap targets, CLS) | Wave 6 | Due 2026-04-18 |
| GBP `REPLACE_WITH_GOOGLE_PLACE_ID` placeholder | Backlog | reviewRequest.ts:32 |
| true-color.ca → https chain | Backlog | Hostinger pending |

---

## Wave 3 plan (next sprint — owner approval pending)

Per [.claude/rules/truecolor-seo-safety.md](.claude/rules/truecolor-seo-safety.md): 5–7 days between waves, no schema+title+content combined commits, monitor GSC after each wave.

| Wave | Day | Risk | Files | Action |
|------|-----|------|-------|--------|
| 3a | 0 | Very Low | [layout.tsx](src/app/layout.tsx), [wall-graphics-saskatoon/page.tsx](src/app/wall-graphics-saskatoon/page.tsx) | Add Organization schema + `logo` + `alternateName`. Trim wall-graphics title 89→54 + meta 159→≤155. Single commit per file. |
| 3b | +7 | Low | [flyer-printing-saskatoon/page.tsx](src/app/flyer-printing-saskatoon/page.tsx), [sticker-printing-saskatoon/page.tsx](src/app/sticker-printing-saskatoon/page.tsx) | Repoint flyer's `/products/*` links to keyword pages. Apply Wave 2 (DDG + descriptionNode) to sticker page. |
| 3c | +14 | Low | NEW pages | `/truecolor-page printing-near-me-saskatoon` and `/truecolor-page printing-services-saskatoon`. Wire SiteNav + SiteFooter + sitemap. |
| 3d | +21 | Very Low | [public/llms.txt](public/llms.txt), [layout.tsx](src/app/layout.tsx) | GEO polish: confirm AI bot allowlist, refresh llms.txt with current pricing. |

---

## Projected score progression

| After | Projected | Key gain |
|-------|-----------|----------|
| Wave 3a | 71 | Branded query + 1 CTR fix |
| Wave 3b | 73 | Link equity recovered + sticker depth |
| Wave 3c | 76 | "Near me" volume captured |
| Wave 3d | 77 | GEO polish |
| Wave 4 (Product schema, deferred) | 80 | Pending coroplast + flyer recovery |

---

## Top 3 actions for next sprint

1. **Wall-graphics title fix** ([wall-graphics-saskatoon/page.tsx:6](src/app/wall-graphics-saskatoon/page.tsx#L6)) — trim 89→54 chars. Highest free-traffic recovery: 246 impressions/month at 0% CTR. Wave 3a.
2. **Organization schema in layout.tsx** ([layout.tsx](src/app/layout.tsx)) — fix "true color printing" pos 13.55 branded-query collapse. Wave 3a.
3. **Repoint flyer-printing internal links off `/products/*`** ([flyer-printing-saskatoon/page.tsx](src/app/flyer-printing-saskatoon/page.tsx)) — recover wasted PageRank. Wave 3b.

---

## GSC Rankings — last checked 2026-04-27 (28-day window)

See [vault snapshot](file:///Users/owner/Downloads/Obsidian%20Vault/Projects/true-color/SEO/gsc-baseline-2026-04-27.md). Highlights:
- "true color printing" — pos 13.55 (was implicitly #1) 🚨
- "business cards saskatoon" — pos 8.32 (was #1) 📉
- "flyer printing saskatoon" — pos 25 (was #3) 📉
- "wall graphics saskatoon" cluster — pos 10 with 0% CTR
- "sticker printing saskatoon" — pos 5.75 ✅
- Site-wide drift: 12.8 → 16.2 over 28 days

Re-check baseline 2026-05-10 (Wave 2 indexing window closes).
