# SEO Protected Pages — Rankings as of 2026-08-11

## Current verification supplement — 2026-09-04

Direct GSC API, domain property, web search, page aggregation: August 5–September 1
versus July 8–August 4, 2026. These figures supersede the historic figures below
for these pages only; protection levels and the location freeze remain. This is
not an automatic unlock or a claim that every historic baseline was refreshed.

| Page | Position | Impressions | Clicks | Prior position | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| homepage | 14.07 | 3046 | 112 | 16.79 | Preserve; no title rewrite |
| sticker-printing-saskatoon | 8.42 | 943 | 14 | 11.44 | DEFEND; conflicting broad-query signals |
| sign-company-saskatoon | 21.67 | 2031 | 13 | 16.05 | HOLD; diagnose query expansion/decay |
| poster-printing-saskatoon | 14.54 | 476 | 10 | 12.55 | DEFEND; exact local query 2.88 |
| aluminum-signs-saskatoon | 9.49 | 476 | 6 | 10.06 | DEFEND |
| photo-poster-printing-saskatoon | 9.17 | 752 | 6 | 12.91 | DEFEND |
| wall-graphics-saskatoon | 17.18 | 517 | 6 | 12.42 | HOLD; observe August 28 title experiment |
| banner-printing-saskatoon | 18.06 | 250 | 3 | 23.01 | Preserve recovery |
| flyer-printing-saskatoon | 23.14 | 399 | 3 | 31.47 | Preserve recovery; observe title test |
| foamboard-printing-saskatoon | 14.41 | 294 | 3 | 15.75 | Next content candidate; staged only |
| coroplast-signs-saskatoon | 29.76 | 242 | 2 | 29.16 | DEFEND commercial page |
| business-cards-saskatoon | 9.22 | 272 | 1 | 21.71 | DEFEND recovery |
| graphic-design-saskatoon | 22.98 | 385 | 1 | 26.30 | Preserve; queued experiment held |

September 4 Merchant SEO release resets the five-day site content release gate.
Reconsider no earlier than September 9 after deployment time and a fresh finalized
data review. See `seo-prep/2026-09-04-foamboard-strengthening.md` for the exact draft.

The remaining text records historical baselines and standing protections.

> This file supplements ~/.claude/rules/truecolor-seo-safety.md with specific page rankings.
> **Refresh cadence: every 28 days from GSC (weekly read is fine; full doc refresh ≥ every 28 days).**
> Last refreshed: 2026-08-11 from `seo_gsc_snapshots` Supabase table (28-day window 2026-07-12 → 2026-08-08, server-side SQL aggregation — no row-cap truncation; normal GSC three-day lag).
> Prior full refresh: 2026-07-15. Positions below are impression-weighted page-level rollups across ALL queries serving each page.

These pages have confirmed rankings AS OF the refresh date above. Any edit requires:
1. Price-only fixes (no content restructuring) on DEFEND pages
2. NEVER change: meta title, H1, URL slug, title tag — on DEFEND pages still in top 10
3. Meta descriptions: trim only if over 160 chars, preserve keywords

## 🛑 Location-page expansion is frozen (owner directive — 2026-07-15)

The sitemap now contains 124 public URLs (recounted 2026-08-11) and roughly 105 geo-keyword URLs. This exceeds the SEO skill's 50-location-page hard gate.

- Do not create any net-new city/location landing page, including another Saskatoon, Regina, Yorkton, Moose Jaw, Prince Albert, or Saskatchewan matrix page.
- New non-location case studies, customer proof, and genuinely useful resource content are still allowed.
- Existing location pages may be improved, consolidated, redirected, or noindexed only after page-level GSC and conversion evidence. Never bulk-prune them.
- Current growth work is CTR, proof, attribution, performance, GBP/Bing/AI distribution, and conversion—not URL count.

## ✅ Full refresh headline (2026-08-11)

Clicks finally moved: 9,725 impressions / 58 clicks / 0.60% CTR / position 28.2 versus 8,141 / 48 / 0.59% / 26.9 prior window. Impressions +19% AND clicks +21% — the first window since May where click growth kept pace with discovery. Average position drifted 1.3 deeper, which is normal when impression expansion adds long-tail queries.

What moved (2026-07-12 → 2026-08-08 vs prior 28d):

- **Homepage:** pos 22.4 (was 19.2 prior window) but clicks 20 → **29** (+45%) on 1,798 imp. The Jul 2 metadata rewrite is converting better even as new queries drag the average deeper. No further rewrite.
- **Winners:** sticker 12.8 → **11.8** with 5 → **7 clicks**; sign-company 27.3 → **21.1** on 523 imp (strong recovery continues); wall-graphics got its **first clicks ever** (0 → 2) at 14.0; flyer 37.0 → 35.0 with imp 587 → **765**; same-day 32.7 → 29.8 with its first click.
- **Sliders (do NOT panic-edit):** business-cards 16.1 → **30.4** (volatile all summer; see decay note below); coroplast 34.9 → **51.2** organic (still DEFEND — commercial winner via Bing/ChatGPT/direct); aluminum 8.1 → **17.4** (one-window slide off page 1, hold); poster 10.4 → 15.1 with clicks 9 → 3 (post-Jul-4 settling); photo-poster 14.0 → 15.9 but imp 121 → **369** (big discovery expansion).
- **Flyer is the next eligible wave:** 765 impressions, zero clicks, no edits since Jun 4. The Phase 101 Wave 1 metadata fix (restore rush + price ladder to title/meta) is now the clear #1 candidate for the next ship window.
- **business-cards decay note:** below pos 10 continuously since the May 25 crash except one brief window — the 60-day decay rule makes it title/meta-rewrite ELIGIBLE. But only ONE protected-page metadata wave at a time: flyer first (bigger impression pool, 765 vs 192). BC queues behind it.
- **2026-08-11 trust cleanup shipped this window:** price-only body corrections on banner/coroplast/wall-graphics/sticker(schema) + design-fee stragglers + llms.txt full regeneration. Per DEFEND rules these are price corrections, not restructuring — no volatility clock reset expected.

## ✅ Full refresh headline (2026-07-15)

Visibility is expanding, but CTR is the leak: 7,037 impressions / 41 clicks / 0.58% CTR / position 24.9 versus 6,005 / 47 / 0.78% / 26.0 in the prior window. Impressions rose 17% and position improved 1.1, while clicks fell 13%.

Commercial data changes the priority order:

- **Coroplast:** 10 paid orders / 49 units / about $1,939 paid line revenue versus 4 / 8 / about $312 prior. Tracked sources: Bing 3, ChatGPT 2, Google 2, unknown 3. The page is now **DEFEND — commercial winner** even though its organic rollup remains weak.
- **Stickers/labels:** 10 paid orders / 1,849 units / about $1,872 versus 5 / 1,085 / about $607 prior. Exact local query `sticker printing saskatoon` is strong (position 3.7, 12% CTR), while broad die-cut/near-me terms remain a zero-click conflicting signal. Keep frozen.
- **No new-page candidates** in either the 14-day or 28-day opportunity analyzer. The next clean existing-page opportunity is trade-show displays, but only after this performance/measurement wave settles.

| Page | Current pos | Imp | Clk | Prior pos | Decision |
|------|------------:|----:|----:|----------:|----------|
| sticker-printing-saskatoon | 12.5 | 660 | 5 | 11.8 | DEFEND / HOLD; no more FAQ or title work |
| poster-printing-saskatoon | 10.1 | 297 | 8 | 16.0 | DEFEND; Jul 4 differentiation worked |
| business-cards-saskatoon | 17.3 | 124 | 2 | 21.2 | RECOVERING; hold |
| photo-poster-printing-saskatoon | 9.1 | 93 | 2 | 12.6 | DEFEND; page 1 |
| coroplast-signs-saskatoon | 36.4 | 60 | 2 | 33.7 | DEFEND commercial winner; do not rewrite |
| flyer-printing-saskatoon | 36.1 | 535 | 0 | 39.2 | Discovery improving, CTR broken; hold this wave |
| sign-company-saskatoon | 24.0 | 259 | 0 | 34.9 | Strong recovery; hold |
| wall-graphics-saskatoon | 11.3 | 195 | 0 | 14.5 | HOLD conflicting signal |
| banner-printing-saskatoon | 28.6 | 174 | 0 | 29.5 | Mild recovery; hold |
| aluminum-signs-saskatoon | 6.5 | 50 | 0 | 27.0 | Promote to DEFEND; large improvement |
| homepage | 16.7 | 1,338 | 16 | 18.1 | Jul 2 metadata is improving rank; no new rewrite |

## ✅ Headline: broad recovery confirmed (2026-06-15)

The June 4–5 metadata-rewrite waves worked. Every decayed page improved vs the May 29 crash baseline, the homepage holds at 14.9 with 23 clicks, and **no page regressed**. This is the first refresh on data that fully covers the recovery waves (GSC OAuth token died June 5, was re-minted June 12 — data now flows daily again).

| Page | May 29 | Jun 15 | Move |
|------|-------:|-------:|------|
| sticker-printing-saskatoon | 14.6 | **11.4** | +3.2 ▲ (now 2 clicks, was 0) |
| business-cards-saskatoon | 22.1 | **19.6** | +2.5 ▲ (primary query reclaimed page 1 — see cannibalization) |
| banner-printing-saskatoon | 33.2 | **23.6** | +9.6 ▲ |
| flyer-printing-saskatoon | 40.6 | **37.5** | +3.1 ▲ |
| coroplast-signs-saskatoon | 44.7 | **32.3** | +12.4 ▲ (now 2 clicks) |
| aluminum-signs-saskatoon | 31.8 | **26.8** | +5.0 ▲ |
| sign-company-saskatoon | noise (3 imp) | **24.5** (52 imp) | now measurable |
| signs-yorkton-sk | 41.0 | **38.1** | +2.9 ▲ |
| vinyl-lettering-saskatoon | 10.6 | **13.5** | −2.9 ▽ (mild slip, still pg1 edge) |

Discipline note: do NOT react to the one mild slip (vinyl-lettering) — it is still page-1 edge and within normal post-wave volatility. Reacting to noise is how the May 25 crash started.

## ⚠ Decay rule

If a page drops below position 10 organic AND below position 5 in local pack for 60+ days, it loses FROZEN status and is eligible for title/meta rewrite. Verify against the latest GSC export before deciding.

## ⚠ Conflicting-signal rule (added 2026-06-15 — learned this session)

The analyzer can list the SAME page as both a page-2 "opportunity" AND a decay alert. When that happens, or when a page is **FROZEN + ranking page-1 + 0 clicks**, the problem is CTR/snippet or post-edit volatility — NOT missing content. **Do not pile on another FAQ/body edit.** Hold and diagnose. More copy does not fix a click-through problem at positions that already rank. This is the sticker-page situation right now (see below).

## 🔄 Session update — 2026-07-02 (/tc-seo-opportunities 28d read, NOT a full re-baseline)

This is a spot-check via the standard opportunities script, not the full-pagination manual pull used for the 2026-06-15 baseline above — treat as directional, next full refresh still due by 2026-07-13 (35-day cap on the 2026-06-15 baseline).

- **Homepage EDITED today (commit `9455b75`, pushed to main):** title/meta rewrite targeting "print shop" (pos 8.9, 56 imp, 0% CTR) + "printing near me" (pos 11.5, 56 imp, 0% CTR) — homepage is NOT on the frozen list, this was the only clean non-conflicted opportunity this window. All existing ranking keywords (Saskatoon, Signs/Banners/Cards, brand, flyers, rush, address) verified preserved. **Re-check date: 2026-07-09.** Full detail in `memory/seo-sprints.md` Phase 100.
- **sticker-printing-saskatoon: conflicting-signal trap CONFIRMED STILL ACTIVE.** Same 3 die-cut queries page-2 + decay + FROZEN + 0% CTR at page-1 positions. No change from 2026-06-15 status below — still HOLD. This has now been true for 17+ days; watch for the 60-day decay-rule unlock window.
- **wall-graphics-saskatoon: STATUS FLIP.** "wall graphics near me" improved 11.8 → **6.1** since June 15 (now FIRMLY page-1, not page-2 edge) but still 0% CTR — this is now a CTR/snippet problem, not a content gap. **The June 19 `/paa-faq wall-graphics-saskatoon` plan referenced in Phase 99 is STALE and should NOT be run as originally planned.** Reclassify from "DEFEND candidate (editable)" to HOLD + diagnose, same bucket as sticker-printing-saskatoon, until a fresh full pull confirms the position and a title-rewrite (not FAQ) path is evaluated.
- **flyer-printing-saskatoon: decay alert, 39.4 → 47.5** (118 imp) — **DIAGNOSED (read-only, see seo-sprints.md Phase 101).** No edits since June 4 (`46d6e32`); most likely post-recovery noise, not a regression. Page is otherwise SEO-standards-compliant. Secondary factor: June 4 metadata thinning dropped "Same-Day Rush" + price ladder from title/meta — queued as a Wave 1 (metadata-only) fix for the next eligible ship window, NOT actioned this session (would be a 2nd page edit). HOLD until 2026-07-13 full refresh confirms trend.
- **banner-printing-saskatoon:** 33.5 → 37.2 (20 imp) — RECOVERING, 3.7-pos slip on 20 imp is noise, left alone per existing rule.

### 🕐 Decay-rule unlock clocks (added 2026-07-04, Phase 102 — logging so these aren't lost)

- **sticker-printing-saskatoon die-cut cluster:** conflicting-signal trap first flagged at the 2026-06-15 baseline (Phase 99), reconfirmed 2026-07-02 (Phase 100) as "17+ days active." Clock start ≈ **2026-06-15**. If the cluster (die cut labels, die cut stickers, custom die cut labels near me — all sub-10, ~0% CTR) is still sub-10 organic AND sub-5 local pack for 60 consecutive days, the decay-rule unlock date is **~2026-08-14**. Do not title-rewrite before that unless the SERP-rendering investigation (Phase 102 batch) independently proves the on-page title isn't what Google is showing.
- **wall-graphics-saskatoon:** NOT on the same clock — this page is climbing (13.8→11.8→6.1), not decaying, so the 60-day sub-10 decay rule does not apply to it. It stays HOLD under the conflicting-signal rule (page-1 + 0% CTR) until the 2026-07-13 full refresh confirms the position and a schema/snippet fix (not title) path is evaluated.

## Protected pages (current — 2026-08-11)

| Page | Page pos (all queries) | 28d imp | clk | Lock level | Notes |
|------|------------------------|---------|-----|------------|-------|
| sticker-printing-saskatoon | **11.8** | **770** | **7** | **DEFEND (HOLD — do not edit)** | Improving on both position and clicks. The die-cut conflicting-signal cluster is moot while the page climbs — do not touch title/meta/FAQ. |
| wall-graphics-saskatoon | **14.0** | 201 | **2** | **HOLD — finally converting** | First clicks ever (0 → 2). Snippet started working — absolutely no edits while this beds in. |
| business-cards-saskatoon | **30.4** | 192 | 1 | **DECAY-ELIGIBLE (queued behind flyer)** | Slid 16.1 → 30.4 this window; sub-10 for 60+ days since May crash → title/meta rewrite eligible per decay rule. One metadata wave at a time: flyer ships first. |
| banner-printing-saskatoon | **29.0** | 308 | 0 | **RECOVERING slowly** | Flat position, impressions growing. 2026-08-11 price-only body fix shipped (no clock reset). |
| flyer-printing-saskatoon | **35.0** | **765** | 0 | **DECAYED — NEXT ELIGIBLE WAVE** | Highest-impression landing page, zero clicks, untouched since Jun 4. Phase 101 Wave 1 metadata fix (rush + price back into title/meta) is the #1 next ship. |
| graphic-design-saskatoon | **27.8** | 145 | 0 | **RECOVERING (stalled)** | 25.8 → 27.8. Hold; deferred Wave C items (DDG, price-in-first-para) stay deferred. |
| coroplast-signs-saskatoon | **51.2** | 106 | 0 | **DEFEND — commercial winner** | Organic deepened (36 → 51) but revenue flows via Bing/ChatGPT/Google/direct. Protect; 2026-08-11 price-only fix shipped. |
| aluminum-signs-saskatoon | **17.4** | 112 | 1 | **DEFEND (HOLD)** | Slipped off page 1 (6.5 → 17.4) in one window. Do not react — hold through next refresh. |
| sign-company-saskatoon | **21.1** | **523** | 0 | **RECOVERING strongly** | 34.9 → 24.0 → 21.1 with impressions doubling. Hold. |
| vinyl-lettering-saskatoon | **43.5** | 86 | 0 | **DEFEND (HOLD)** | Deepening (31 → 43) on low sample; no reactive edit. |
| signs-yorkton-sk | **55.0** | 187 | 1 | **DECAYED — location freeze** | No rewrite priority. |
| agriculture-signs-saskatoon | **79.2** | 47 | 0 | **LOCATION FREEZE** | Real impressions now but very deep; freeze bucket. |
| business-cards-moose-jaw-sk | 52.5 (2 imp — NOISE) | 2 | 0 | **LOCATION FREEZE** | No meaningful demand. |
| photo-poster-printing-saskatoon | **15.9** | **369** | 2 | **DEFEND (in main table since 2026-08-11)** | Impressions tripled (121 → 369); position settling after expansion. Do not touch. |
| poster-printing-saskatoon | **15.1** | 236 | 3 | **DEFEND (in main table since 2026-08-11)** | Post-Jul-4 settling (10.4 → 15.1, clicks 9 → 3). Normal volatility — hold through next refresh. |

## Watch list (high-impression pages NOT in the protected table)

| Page | Page pos | 28d imp | clk | Note |
|------|---------:|--------:|----:|------|
| large-format-printing-saskatoon | 37.5 | **626** | 0 | Second-highest landing-page impressions on the site, deep position. Strong future content/CTR candidate after flyer + BC waves. |
| banner-printing-regina | 35.5 | 366 | 1 | Real regional demand; meta trimmed 2026-08-11 (was 180 chars). Location freeze otherwise. |
| same-day-printing-saskatoon | 29.8 | 281 | 1 | First click this window. Hold. |
| retail-signs-saskatoon | 53.8 | 222 | 0 | Deep; inventory-audit bucket. |
| coroplast-signs-regina | 32.4 | 215 | 0 | Regional coroplast demand growing (97 → 215 imp). |
| foamboard-printing-saskatoon | 20.7 | 186 | 2 | Page 2 with steady clicks; opportunity after higher-priority work. |

## Competing pages (Google can't decide which URL ranks for a keyword)

- **"business cards saskatoon"** — RESOLVED. Dedicated /business-cards-saskatoon now outranks the homepage on the primary query (8.9 vs ~9). The 831b91c rewrite worked. Keep watching but no action.
- **"poster printing saskatoon"** — RESOLVED 2026-07-04 (differentiation, not merge/kill — reverses the "consider killing photo-poster" option floated back on 2026-05-05 when it was the weak page at pos 44; ranking positions flipped since then, so that old option is obsolete). Decision: **let both pages stand, own different intent, cross-link once.**
  - `/photo-poster-printing-saskatoon` (pos 8.6, winning, 1 click) = the photography/photo-print specialist — owns "photo poster", real-estate/event-photographer/office-art use cases. **NOT TOUCHED** this round — it's winning and is now a DEFEND candidate going forward (treat its title as protected).
  - `/poster-printing-saskatoon` (pos 17.2, page-2, 3 clicks) = the broader event/display hub — re-pointed its FAQs/body away from duplicating the photo-poster price ladder and toward its actual differentiators (foamboard displays, retractable banner stands, trade-show/non-profit/gala event packages). Title/H1/slug untouched — this was a Wave 2 content-only edit. 8 FAQs maintained per seo-standards.md. Sitemap lastmod → 2026-07-04.
  - Files changed: `src/app/poster-printing-saskatoon/page.tsx` (FAQ rewrite), `src/app/sitemap.ts` (lastmod). Commit + sprint-log entry same session.
  - Re-check date: 2026-07-11 (7-day content-wave observation). Watch that `/poster-printing-saskatoon` doesn't lose its existing 3 clicks/28d as a regression signal.

## What "DEFEND" means

- Meta title: DO NOT EDIT under any circumstances (pages currently in organic top 10 by impression-weighted average)
- H1 tag: DO NOT EDIT
- URL/slug: DO NOT EDIT
- Meta description: trim only if over 160 chars — preserve keyword placement
- Body content: price corrections allowed, no restructuring
- Internal link anchor text: DO NOT CHANGE

## What "DECAYED — eligible for rewrite" means

- Organic position has fallen below 10 for 60+ days
- Page has near-zero clicks despite impressions
- Title and meta rewrite is permitted but must follow Wave system (one page per commit, 5-7 day GSC observation between)
- Body content restructure permitted in Wave 2 (separate commit from title change)

## What "RECOVERING" means (added 2026-06-15)

- Was DECAYED, now climbing toward top 10 on fresh data after a recovery-wave edit.
- **Do NOT touch.** A page mid-recovery is settling — another edit resets the volatility clock and risks reversing the gain. Observe through at least one more weekly read before considering any change.

## Local pack baseline (last refreshed 2026-03-20 — STALE, refresh from Trustindex)

| Keyword | Local Pack Rank (March 2026) |
|---------|----|
| print banner saskatoon | #1 |
| flyer printing saskatoon | #3 |
| coroplast signs saskatoon | #3 |
| print store sign saskatoon | #4 |
| business cards saskatoon | #3 |

**TODO:** Refresh local pack rankings from Trustindex monthly. Title changes do NOT affect local pack — local pack is GBP-driven.

**⚠ Flagged 2026-07-04 (Fable synthesis): this TODO has been sitting untouched for 3.5+ months while 100% of SEO effort went into organic.** For a local print shop, map-pack visibility is arguably worth more than organic position — GBP has independently carried real orders (stickers/decals per `Projects/true-color/SEO/seo-recovery-log.md` 2026-04-27 entry) even while organic rankings were decayed. This is a separate workstream from the organic wave system above — GBP posts/photos/Q&A changes don't compete for the same ranking-risk budget as page.tsx edits, so it can run in parallel without touching the deploy clock. Use the `/gmb-update` skill (already installed, generates GBP posts/product descriptions/image prompts) and refresh the local-pack table above from Trustindex. This is the single highest-priority item not yet scheduled into any wave.

**Progress 2026-07-04:**
- **Real finding — stale NAP citations.** Directional web-search check (not a real rank pull — still need Trustindex/GBP Insights for exact numbers) found Yelp and a Mufc.ca directory listing showing an OLD address (1629 Ontario Ave) instead of the real 216 33rd St W. Inconsistent NAP across directories is a known local-pack ranking drag. **Action needed (owner, not code): claim/correct or remove those two listings.** Everything else (Yably, Mysask411, Yellow Pages, Facebook, ShopSaskatoon) shows correct, consistent NAP.
- True Color shows no visibility at all for the generic head terms "sign shop saskatoon" / "print shop saskatoon" (Minuteman, Pro Print, Saskatoon Sign Company, Staples dominate those). Likely just category framing — the site targets long-tail (coroplast/banner/business-card) rather than the generic head term — not necessarily a regression, but worth knowing before assuming local pack is otherwise healthy.
- **GBP content generated and ready to post:** summer/Saskatoon Fringe Festival campaign (Fringe confirmed July 30–Aug 8 2026) — 3 posts + 3 product listings, all real prices, all NAP-correct, images reused from existing assets (no new generation needed). Files: `GBP_UPLOAD/niches/summer-fringe-2026.html` and `GBP-UPDATE-summer-fringe-2026.md` (repo-adjacent, not in git). Owner needs to manually copy-paste into the GBP dashboard — nothing auto-posts.

## Category hub pages + Merchant Center (planned, not started — see SEO-REMAINING-WAVES.md)

- **Wave 8 — Category hub pages:** flagged 2026-07-04. Site is a flat 2-tier structure (every breadcrumb is `Home → Page`, no middle category tier), likely contributing to both the Wave 3.4a orphan-page problem and sitelinks never forming. Full phased plan (draft hub structure, 5-phase rollout, explicit "not doing" list) lives in `SEO-REMAINING-WAVES.md` under "Wave 8". Owner approval on the hub set required before any page gets built — this is an architecture change, not a quick edit.
- **Google Merchant Center free listings:** now that Product/Offer schema shipped on sticker-printing-saskatoon (2026-07-04), a Merchant Center feed reusing that schema data could win free Shopping-tab listings with zero ad spend. Queue after Wave 4 schema rolls out to 2-3 more pages (a 1-page feed isn't worth setting up yet).

## Refresh process

1. Query Supabase `seo_gsc_snapshots` for the last 28-day window — **paginate past 1,000 rows** (28d ≈ 3,000+ rows; the old single-page pull silently truncated the survey).
2. Compute impression-weighted average position per page (across all queries) AND per (query, page) for tracked keywords.
3. Update positions, click counts, lock levels, and the trend column in the protected pages table.
4. Apply decay rule (60+ days below pos 10 = eligible for rewrite) AND the conflicting-signal rule (don't edit a page that's both an "opportunity" and a decay alert).
5. Survey for new top-10 candidates not yet in the DEFEND list.
6. Append a refresh entry to `memory/seo-sprints.md` and the vault recovery log.

## Files most relevant to SEO

| File | What It Controls |
|------|-----------------|
| `src/app/sitemap.ts` | All lastmod dates, priority, changeFreq — edit per-page dates only |
| `src/app/layout.tsx` | Title, meta description, OG tags, LocalBusiness schema, WebSite schema |
| `src/components/site/IndustryPage.tsx` | Service schema, FAQPage schema, BreadcrumbList schema on all SEO landing pages |
| `next.config.ts` | 301 redirects, security headers |
| `src/app/[slug]/page.tsx` | Individual SEO page content, metadata, schema props passed to IndustryPage |
| `public/llms.txt` | AI search index — hub list and price anchors for ChatGPT/Perplexity citation |
