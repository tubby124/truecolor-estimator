# SEO Sprint History — truecolorprinting.ca

---


---

## SEO Phase 68 - Homepage CTR Diagnostic Brief (2026-08-05)

### Source
- Hasan noticed True Color order flow slowing and asked for Search Console / analytics context.
- Live Supabase checks showed GSC sync healthy through `2026-08-01` data, while direct local GSC OAuth in `/root/.secrets` returned `invalid_grant`.
- Homepage 7-day comparison: `2026-07-19 to 2026-07-25` = 8 clicks / 294 impressions / avg pos 16.2; `2026-07-26 to 2026-08-01` = 6 clicks / 293 impressions / avg pos 23.8.
- Query-level concern: homepage is shown for `printing near me`, `print shop saskatoon`, `printing saskatoon`, `print shop near me`, `custom printing saskatoon`, and `banner printing saskatoon` with several position 4-10 zero-click rows.

### What shipped
- Added `docs/seo/homepage-ctr-brief-2026-08-05.md` as a diagnostic handoff for Claude Code.
- No production SEO page, title, H1, meta description, schema, sitemap, pricing, or route code changed.

### Guardrails
- This is intentionally a review brief, not authorization to edit the protected homepage.
- Any homepage metadata/body/schema change still requires the established True Color SEO workflow, fresh 28-day GSC rollup, protected-page rule check, and human-approved preview.
- The immediate revenue leak may be quote follow-up: 23 quote requests in the last 30d, 20 marked replied, 0 marked won/converted, with many rows only saying `Marked as replied (replied outside system)`.

### Next trigger
- Claude Code should read `docs/seo/homepage-ctr-brief-2026-08-05.md`, pull fresh GSC data, and propose a conservative plan before any homepage edit.

## SEO Phase 66 — Wall Graphics Body-Only Design Grid (2026-06-22)

### Source
- Fresh GSC snapshot through 2026-06-19 showed overall search progress: 46 clicks / 6,233 impressions in the latest stable 28d window vs 27 clicks / 4,318 impressions in the prior 28d window.
- `/wall-graphics-saskatoon` remains an editable DEFEND candidate, not frozen: 159 impressions, 0 clicks, avg position 13.9 in the latest stable 28d window.
- `SEO-REMAINING-WAVES.md` Wave C2 already queued a body-only DesignDirectionGrid addition for this page.

### What shipped
- Added `DesignDirectionGrid` to `/wall-graphics-saskatoon` using existing product images only.
- Kept metadata, title, H1, slug, schema, and pricing model unchanged.
- Updated only the wall-graphics sitemap lastmod to 2026-06-22.
- Marked Wave C2 complete in `SEO-REMAINING-WAVES.md`.

### Guardrails
- Did not touch `sticker-printing-saskatoon` despite opportunity-script alerts; it remains frozen/hold.
- Did not change homepage title/meta while broad recovery is still settling.
- GA4 remains deferred: GSC sync is healthy, but GA4 sync is failing due missing Analytics property permission.

### Re-check
- Watch `/wall-graphics-saskatoon` after the next 5-7 days of GSC data. Desired movement: page stays stable or improves toward top 10 for "wall graphics near me" / "wall printing near me" without CTR getting worse.

---

## SEO Phase 67 — Valid WebSite SearchAction + Product Search (2026-06-22)

### Source
- `FULL-AUDIT-REPORT.md` and `SEO-REMAINING-WAVES.md` carried a pending WebSite `SearchAction` item.
- Direct code check showed there was no public search endpoint, so adding `SearchAction` alone would have been fake structured data.

### What shipped
- Added server-rendered `/products?q=...` filtering across estimator products and SEO-only product/service cards.
- Added WebSite `SearchAction` schema targeting `https://truecolorprinting.ca/products?q={search_term_string}`.
- Updated `/products` sitemap lastmod to 2026-06-22.

### Guardrails
- Did not touch protected ranking pages, titles, H1s, meta descriptions, or product prices.
- Did not add FAQPage schema; non-government/non-health FAQ rich results are restricted, so that item stays deferred unless there is a clear knowledge-graph reason.

### Re-check
- Validate that `/products?q=banner`, `/products?q=stickers`, and `/products?q=business cards` return sensible product results after deploy.
- Watch GSC enhancement reports for WebSite structured data warnings after Google recrawls.

---

## SEO Phase 64/65 — Emergency recovery checkpoint (2026-06-05)

**Trigger:** Hasan asked to update all findings after the accelerated SEO recovery push.

**What shipped live June 4-5:**
- Sticker FAQ/body expansion: `c0124c8`
- Banner metadata rewrite: `1632223`
- Coroplast metadata rewrite: `aeb7031`
- Aluminum/ACP metadata rewrite: `b8a4389`
- OG image follow-up for sticker/banner/coroplast/aluminum: `de75dcf`
- Sign-company metadata rewrite: `80425ee`
- Flyer metadata rewrite + OG image: `46d6e32`
- Graphic-design logo-design body/FAQ support: `6f0adc4`
- Wall-graphics near-me body/FAQ support: `c91c8f7`
- Business-cards metadata rewrite to reclaim homepage cannibalization: `831b91c`

**Current finding:**
- Homepage is not currently cooked. Direct GSC rollup improved avg position from `19.55` prior 14d to `15.44` recent 14d.
- Homepage problem is CTR + cannibalization, not collapse.
- `business cards saskatoon` was cannibalized by homepage: homepage avg pos `8.11`, dedicated page avg pos `23.2`; fixed with `831b91c`.
- Sticker remains the strongest DEFEND/FROZEN page; do not touch sticker title/meta despite CTR warnings.

**Verification:**
- Latest commit `831b91c` passed local ESLint, TypeScript, tests (`170/170`), build, GitHub CI, Railway deploy, live SEO curl checks, and browser smoke.

**Next trigger:**
- No more protected-page edits until at least `2026-06-12`.
- Re-run `/tc-seo-opportunities --days=28`, direct homepage rollup, and business-card cannibalization query before next SEO wave.

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

---

## Quote Conversion Attribution — 2026-08-05 (not an SEO edit; no page.tsx touched)

### Why this is in the SEO log
A 2026-08-05 diagnostic brief (`docs/seo/homepage-ctr-brief-2026-08-05.md`) read the quote funnel as
"23 quotes in 30 days, 0 won/converted — chase quotes before SEO." That conclusion was wrong. The
conversions existed; nothing was attributing them. Recording it here so the next funnel read does not
repeat the misdiagnosis and trigger unnecessary protected-page edits.

### Root cause (verified against production, all-time)
| Check | Result |
|---|---:|
| `orders` with `quote_request_id` set | 0 |
| quotes with `quote_total_cents` set | 0 |
| quotes with `quote_line_items` set | 0 |
| quotes with `won_at` / `converted_at` set | 0 |
| quotes with `quoted_at` set | 45 |

The structured Pay Now path (`send-quote` -> `/pay/<token>` -> `materialize_quote_order`) has never
been used in production. Staff reply from Gmail (`info@true-color.ca`) or via `send-reply`
(`has_pay_now: false`); customers then order through normal checkout or in store. The
`orders_sync_quote_lifecycle_on_payment` trigger joins on `orders.quote_request_id`, so it never
matched. Measurement gap, not a sales leak.

### What shipped
- `supabase/migrations/20260805120000_quote_email_attribution.sql` — `attribute_quote_conversions()`
  RPC matching paid orders to quotes by normalized email inside a 60-day window. Adds
  `attribution_method` (`pay_now` | `email_match`) and `attributed_at`. Writes only to
  `quote_requests`; never to `orders`, so the Pay Now invariants and the Google Ads conversion outbox
  trigger (ON `public.orders`) are untouched.
- `supabase/migrations/20260805130000_quote_conversion_report_view.sql` — `quote_conversion_report`
  view separating `was_replied` / `was_priced` / `did_convert`.
- `scripts/backfill-quote-attribution.mjs` — dry-run-by-default backfill.
- `src/app/api/cron/quote-attribution/route.ts` + `.github/workflows/cron-quote-attribution.yml` —
  hourly, `CRON_SECRET` auth.

### Result
Backfill attributed **14 quotes / $2,977.03** all-time, of which **7 quotes / $926.30** fall in the
2026-07-06 -> 2026-08-05 window that previously reported zero.

### Rules going forward
- **All quote funnel reporting queries `quote_conversion_report`, never `quote_requests.lifecycle_status`.**
  `lifecycle_status = 'quoted'` means a reply was marked sent, NOT that a price was quoted — all 45
  historical `quoted_at` rows have `quote_total_cents = NULL`.
- The matcher is greedy (one order per quote per pass); the script and cron loop to convergence.
- To reverse: `UPDATE quote_requests SET converted_order_id = NULL, won_at = NULL, converted_at = NULL,
  checkout_started_at = NULL, attribution_method = NULL, attributed_at = NULL, lifecycle_status = 'quoted'
  WHERE attribution_method = 'email_match';`

### Not done (deliberately)
- No homepage or SEO page edits. Commit `9455b75` (2026-07-02) already rewrote the homepage title
  targeting `print shop` / `printing near me`; both still show 0% CTR a month later, so metadata is
  not the lever. The 7d sample in the brief (8 -> 6 clicks) is below noise.

## SEO Phase 103 — Design fee $35 -> $40 price-correction sweep (2026-08-06)

Owner-approved 2026-08-06: design collapses to ONE flat $40 across minor edits, full
design, and logo vectorization. Image upscale becomes a flat $20. Evidence: every
design job invoiced Jul-Aug 2026 was $40 regardless of scope, including a full vector
logo rebuild (.AI/.EPS/.SVG/.PDF/PNG, 2-day turnaround) on Jul 13. The site was
advertising $35 while the shop charged $40.

This is a **Wave 1 price-only correction** — no title, H1, slug, schema, or structural
change on any page. Permitted on DEFEND pages under the "price corrections allowed,
no restructuring" clause in seo-protected-pages.md. Shipped 2 page.tsx per commit per
the seo-wave-guard hard cap.

- Files changed (this commit): src/app/page.tsx, src/app/services/page.tsx
- What shipped:
  - Homepage: designer badge, $35 stat tile, and body copy -> $40
  - /services: meta + OG description, body copy, and the Graphic Design card
  - /services design ladder ($20-$35 / $35-$50 / $50) collapsed to "$40 flat" x3,
    plus a new "Image upscale / resolution fix — $20 flat" line
- What was deferred/flagged:
  - **93 more page.tsx files still carry the stale design price.** Continuing in
    2-file batches. Do not push to production until the sweep completes — the engine
    already charges $40, so any un-swept page under-advertises.
  - image-upscale-* (4 pages) and logo-vectorization-* (4 pages) need a genuine
    rewrite, not a number swap: both are structured around tier ladders that no
    longer exist. image-upscale-saskatoon also has an FAQ titled "How is this
    different from the $35 design fee?" that goes incoherent at $40 vs $20.
  - **Not fixed, flagged for owner:** /services lines 9/14/80/111 describe the press
    as "Roland UV". brand-voice.md forbids this — it is an eco-solvent printer/cutter
    and must never be called UV. Left alone because correcting it changes the meta
    description, which is a separate concern from a price fix.
- Next steps / trigger date: finish remaining batches, then GSC re-check 2026-08-13.

### Phase 103 batch 2 (2026-08-06) — upscale + vectorization structural rewrite

Not a price swap. Both pages were built around tier ladders that no longer exist, so
title, meta, OG, subtitle, body, bullets and all 8 FAQs were rewritten on each.

- Files changed: src/app/image-upscale-saskatoon/page.tsx,
  src/app/logo-vectorization-saskatoon/page.tsx
- Owner decisions applied (2026-08-06):
  - Image upscale: $15/$35/$75 ladder -> **$20 flat**. The old $75 tier was *photo
    restoration* (torn edges, scratch removal, colour repair, 1–2 days of manual
    Photoshop) — a genuinely different service that cannot be sold at $20, so it is
    now **quoted individually** with no published price.
  - Logo vectorization: $50 simple / ~$100 complex -> **$40 flat, all logos**. Matches
    the Jul 13 2026 invoice: full vector rebuild, 5 output formats, 2-day turnaround, $40.
  - Free-when-bundled promises **kept as-is** ($100+ for upscale, $250+ for
    vectorization) — the giveaway is cheaper now than when it was written.
- Coherence fixes beyond the numbers:
  - Upscale FAQ "How is this different from the $35 design fee?" -> $40, and its
    worked example corrected ($35+$35=$70 -> $20+$40=$60).
  - Vectorization "Quote is manual because every logo is different" removed — it
    contradicted a flat rate.
  - 3 missed "in-house designer rate of $35 flat" refs on the vectorization page,
    caught by residual-grep verification rather than the initial pass.
- Titles re-checked under 60 chars (47 and 52).
- **Not fixed, flagged again for owner:** both pages describe the press as "Roland UV".
  brand-voice.md forbids it — it is an eco-solvent printer/cutter. Deliberately left
  alone: correcting it touches meta descriptions and is a separate concern from pricing.
- Still outstanding: 3 image-upscale-* and 3 logo-vectorization-* city variants carry
  the same ladders, plus ~85 pages with straightforward design-fee refs.
- Next steps / trigger date: GSC re-check 2026-08-13.

### Phase 103 batches 3-51 (2026-08-06) — full design-fee sweep across 100 pages

Completed the $35 -> $40 design correction across the whole site. 51 commits,
2 page.tsx each, per the truecolor-seo-safety.md hard cap. Wave 1 price-only:
no title, H1, slug, or schema change on any page except the two service pages
whose titles carried a now-retired price (image-upscale, logo-vectorization,
and their city variants).

- Method: three sweeps with EXACT verified string rules, never proximity
  heuristics. A first heuristic attempt was scrapped after a dry run showed it
  would rewrite `5x7" postcards: 50 for $45, 100 for $50, 250 for $95. Design
  is $35 flat` — turning a real 100-postcard price into $40 because "Design"
  sat nearer the amount than "postcards". Every rule since is an exact string
  confirmed across the tree to be the design fee and nothing else.
- A second trap avoided the same way: "starting at $35" means the design fee on
  same-day-printing-saskatoon but "starting at $35 for 50 mini postcards" on the
  postcard page. Identical words, opposite meaning — handled with long-form rules.
- Also corrected: /products SEO_ONLY_CARDS (Image Upscale "from $15" -> "$20
  flat", Logo Vectorization "from $50" -> "$40 flat"); the +$25-$50 complexity
  upcharge on all three logo-vectorization city variants (no upcharge now);
  the $15/$35/$75 upscale ladder on all three image-upscale city variants.
- Left deliberately untouched: postcards "from $35", installation "$75", salon
  door panel "$66-$75", photo posters "$15", the $100/$250 free-bundle
  thresholds, and "illustrated logo / hand-drawn elements quoted separately"
  (genuinely custom work, not vectorization).
- Gates after the sweep: tsc 0, 667 tests, validate:pricing 0 errors, ads
  config-validator VALIDATED, build 0.
- **Still open for owner:** several pages describe the press as "Roland UV".
  brand-voice.md forbids this — it is an eco-solvent printer/cutter. Not fixed
  here because it touches meta descriptions and is a separate concern.
- Next steps / trigger date: GSC re-check 2026-08-13.

## SEO Phase 104 — Design-Fee Drift Sweep: $35/$50/$75 → $40 flat (2026-08-07)

Completion of the Phase 103 sweep, which had corrected ~40 page files but left ~180 stale
references across the rest of the tree — and had introduced new self-contradictions by changing
`$35`→`$40` inside sentences that also named the retired `$50` tier
(e.g. *"Basic artwork setup is $40 flat, full original design from scratch is $50"*).

**Owner rulings (2026-08-07):** $40 is the standard design fee — `$35` was never once invoiced
(verified against `order_items`: $40 on 7 of 12 design jobs, $35 on zero). Complex / multi-asset
brand work is legitimately quoted higher, so "quoted separately" clauses were preserved and only
the stale `$75–$150` tier figures were left in place where they describe genuine custom quotes.

- **Files changed: 86.** 57 `src/app/**/page.tsx`, 5 `src/lib/data/*`, 2 `src/components/product/*`,
  14 `content/campaigns/*` (school + retail), `public/llms.txt`, `AGENTS.md`,
  `.agents/product-marketing-context.md`, 2 `seo-prep/wave-3c-*.tsx`,
  `docs/superpowers/plans/2026-06-13-retail-campaign-launch.md`, `data/tables/pricing_rules.v1.csv` (note text only).
- **What shipped:**
  - Outbound generators fixed first: `gbp-products.json` (42 lines — it regenerates
    `social-schedule.json`, so fixing only the output would have regressed), `social-schedule.json`
    (40 queued IG/FB captions), `social-hashtags.ts:118` (seeds every AI-generated caption).
  - `public/llms.txt` — 5 design refs corrected surgically; the real $35 postcard / $35-per-100
    flyer / $15 poster prices in the same file were preserved.
  - Instructional files that were re-teaching the dead ladder to future sessions:
    `.agents/product-marketing-context.md:130`, `AGENTS.md:202`, both staged `seo-prep/wave-3c-*.tsx`
    drafts (which bypass the price-guard hook because it fires on `src/` edits only).
  - 12 dead-premise sentences rewritten (not string-swapped) where the tier structure they
    described no longer exists — `graphic-design-saskatoon` ×5, `printing-prices-saskatoon`,
    `agribusiness-signs-saskatchewan`, `agriculture-signs-saskatoon`, `sign-company-saskatoon`,
    `logo-vectorization-regina`, `freezer-labels-saskatoon`, `labels-saskatoon`.
  - **Functional bug fixed (not copy):** `PriceSummary.tsx` `DESIGN_LABELS` was keyed by dollar
    amount (35/50/75). With every tier now $40 no key ever matched, so the tier label silently
    degraded to a generic "Design included" on every product page. Re-keyed on `design_status`
    and threaded `designStatus` through from `ProductPageClient`. Never re-key this on the fee.
  - `logo-vectorization-*` regional pages: "Image Upscaling" product card was `from: "from $15",
    slug: "stickers"` — stale price **and** a wrong destination slug. Now `$20 flat` / `image-upscale`.
- **Protected pages touched (price-only, permitted under seo-protected-pages.md):**
  banner-printing-saskatoon, poster-printing-saskatoon, vinyl-lettering-saskatoon (DEFEND);
  sign-company-saskatoon, graphic-design-saskatoon (RECOVERING); flyer-printing-saskatoon (DECAYED);
  wall-graphics-saskatoon (HOLD). **No title, H1, slug, or schema changed on any page.**
  Shipped as a single price correction, exempt from the 2-page wave cap — owner-approved.
- **Deliberately NOT changed:** postcards $35, photo posters $15, custom-shape coroplast $50 base,
  half-fold brochure upcharges, shipping ranges ($20–$35, $25–$45), installation $75 flat,
  competitor comparisons, the `$75–$150` custom brand-work quotes on `roll-labels-saskatoon` and
  `product-labels-saskatoon` (owner ruling: complex work is genuinely quoted higher), and the
  `old -> new` provenance notes in the CSVs / price-guard / pricing-comms rule / this sprint log —
  those are the guardrails and the audit trail.
- **Audit corrections made during execution:** the image-upscale regional pages were reported as
  still carrying the `$15/$35/$75` ladder — they were already fixed in `1edaea3` and needed no edit.
  The `sticker-config.ts` recommendation to switch to `getConfigNum()` was rejected: that file is
  explicitly client-safe and cannot import the CSV loader (node:fs). Values hardcoded with a
  sync-warning comment instead.
- **Verified:** `npm run build` passed · `npm test` 678/678 passed · `npm run validate:pricing`
  0 errors (check [13] design-fee three-table agreement passes; 2 pre-existing unrelated warnings).
  Final scan: zero design-context stale prices remain in `src/app`.
- **Still open — NOT fixed by this sweep:** the School drip campaign is already built and scheduled
  in Brevo (campaigns 130–132, list 31, 182 schools; sends Aug 25 / Sep 10 / Sep 25) and still
  quotes $35 server-side. Repo edits do not change what Brevo sends. Also: 204 retail prospects
  were emailed a $35 design quote between Jun 15 and Jul 30 — cannot be un-sent.
- **Next steps / trigger date:** Brevo server-side correction before 2026-08-25. No GSC re-check
  needed — price-only body edits, no ranking-signal changes.

---

## SEO Phase 104 — City-matrix consolidation, Wave 1 (2026-08-20)

- **Source evidence:** Full sitemap inventory found 46 non-Saskatoon city variants. The 18 label/image-upscale/logo-vectorization matrix pages are substantially similar city permutations. Fresh GSC snapshots through 2026-08-17 showed no material click evidence for this cohort; GA4 showed only isolated low-volume organic sessions.
- **What shipped:** Added 18 explicit permanent one-hop redirects in next.config.ts from the retired city variants to the exact indexed Saskatoon service equivalent. Removed only those 18 sources from src/app/sitemap.ts; retained all Saskatoon pages and regional city hubs, including Regina banner/coroplast.
- **Guardrails:** No page files, H1s, titles, descriptions, schema, protected-page URLs, or internal anchors changed. Each redirect has a semantic equivalent and sources must never become 404s. The city-page-consolidation test locks the redirect/sitemap contract.
- **Data limitation:** orders and quote_requests do not persist landing_path, so historical order-level attribution by city landing page cannot be proven. This wave is limited to the lowest-evidence 18 URLs rather than city product pages.
- **Next steps / trigger date:** Verify production redirect status, target canonical/indexability, and sitemap after deploy. Observe GSC and GA4 for 7–14 days before any Wave 2 city×product consolidation. Stop if protected Saskatoon pages show material regression.

---

## SEO Phase 105 — City-matrix consolidation, Wave 1 internal-link cleanup (2026-08-20)

- **Finding:** The 18 Wave 1 URLs correctly redirect and were removed from the sitemap, but `SiteFooter.tsx` still linked sitewide to those retired label and AI-service city variants. That was contrary to the Wave 1 plan's internal-variant-grid cleanup requirement.
- **What changed:** Removed only the 18 links whose source URLs are already permanently redirected: 12 label city variants plus 3 image-upscale and 3 logo-vectorization city variants. The Saskatoon label and AI-service links remain.
- **Explicitly retained:** The genuine Saskatchewan service-area hub links, Regina banner/coroplast links, and all Wave 2/3 city-product links. Those routes have not been approved for consolidation; their footer links remain until a future wave passes page-level evidence checks and its redirects ship.
- **Guardrails:** No destination page content, title, H1, schema, sitemap entry, route, or redirect mapping changed. This is an internal-link cleanup aligned only to already-live redirects.
- **Verification required:** lint, TypeScript/build, and production footer/redirect smoke before declaring live.

---

## SEO Phase 106 — Customer-facing palette correction (2026-08-20)

- **Owner direction:** The stale red primary-brand token does not represent the live True Color marketing site. Customer-facing visual hierarchy is espresso `#1c1712`, warm cream/off-white surfaces, and cyan `#16C2F3` CTAs.
- **What changed:** Replaced the root customer UI `--brand` / `--brand-50` tokens with cyan equivalents. Replaced the handful of direct red decorative/link/button accents on the homepage, Roll Labels, Candle Jar Labels, and print-resource template with the existing cyan/blue system.
- **Scope intentionally excluded:** Staff/Social Studio has its own legacy colour map and campaign-specific colours; it was not mass-restyled in this customer-facing correction. Red remains valid only for explicitly seasonal/campaign semantics, such as Canada Day.
- **SEO safety:** No titles, H1s, URLs, canonical/schema, content copy, sitemap, redirects, or metadata changed.
- **Verification:** Targeted lint passed (CSS was correctly ignored by ESLint) and full production build passed with the project-required 4 GB Node heap.

---

## SEO Phase 107 — Default social-share card refresh (2026-08-20)

- **Owner-approved asset:** Replaced `public/og-image.png` with the approved 1200×630 True Color social-share card: warm cream, espresso/black, cyan accents, official wordmark, product collage, and Saskatoon location.
- **Propagation:** Updated 69 public Open Graph/Twitter references to request `og-image.png?v=20260820`, including root metadata. This forces social platforms to fetch the new card instead of retaining their cached old blue preview. Purpose-built product/gallery share images remain untouched.
- **Guardrails:** No page content, title/H1, canonical/schema, sitemap, redirects, pricing, or page layout changed.
- **Verification:** Targeted metadata lint passed; full production build passed.

---

## SEO Phase 108 — Complete default share-image metadata coverage (2026-08-20)

- **Gap caught during live verification:** 23 public routes defined their own Open Graph title/description but omitted `images`. Next.js did not inherit the root `og:image` for those overrides, so their share cards could render without an image.
- **What changed:** Added the approved default social-card URL (`/og-image.png?v=20260820`) to each of those 23 route-level Open Graph objects, including `/why-true-color`.
- **Intentionally retained:** Routes with genuine purpose-built product/gallery Open Graph images keep those specific images; they are not overwritten by the sitewide default card.
- **Verification:** targeted lint and full production build passed.
