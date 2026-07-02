# SEO Protected Pages — Rankings as of 2026-06-15

> This file supplements ~/.claude/rules/truecolor-seo-safety.md with specific page rankings.
> **Refresh cadence: every 28 days from GSC (weekly read is fine; full doc refresh ≥ every 28 days).**
> Last refreshed: 2026-06-15 from `seo_gsc_snapshots` Supabase table (28-day window 2026-05-18 → 2026-06-12, 3,105 rows, full pagination — not the old 1,000-row PostgREST cap).
> Prior refresh: 2026-05-29 (the post-crash baseline). Positions below are impression-weighted page-level rollups across ALL queries serving each page.

These pages have confirmed rankings AS OF the refresh date above. Any edit requires:
1. Price-only fixes (no content restructuring) on DEFEND pages
2. NEVER change: meta title, H1, URL slug, title tag — on DEFEND pages still in top 10
3. Meta descriptions: trim only if over 160 chars, preserve keywords

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

## Protected pages (current — 2026-06-15)

| Page | Page pos (all queries) | 28d imp | clk | Lock level | Notes |
|------|------------------------|---------|-----|------------|-------|
| sticker-printing-saskatoon | **11.4** | **780** | 2 | **DEFEND (HOLD — do not edit)** | Strongest page by far. BUT die-cut cluster slid 2–6 pos in last 14d (custom die cut labels 4.0→10.3, die cut labels 7.4→11.3) and CTR is ~0 despite page-1 positions on several queries. This is a **CTR-on-frozen-title problem + post-June-4 volatility**, not a content gap. Per conflicting-signal rule: HOLD. Do NOT run /paa-faq here reflexively. If the cluster stays sub-10 for 60+ days, the decay rule unlocks a proper title rewrite — that is the real fix. |
| wall-graphics-saskatoon | **6.1** (was 13.8 → 11.8 → 6.1) | 127+ | 0 | **HOLD — conflicting signal (reclassified 2026-07-02)** | Continued improving past page-2 into firm page-1 (6.1) but STILL 0% CTR — this flipped from a content gap to a CTR/snippet problem. **The prior "June 19 /paa-faq" plan is CANCELLED — do not run it.** Same bucket as sticker-printing-saskatoon now: HOLD + diagnose, watch for decay-rule/CTR-fix path, do not add more body/FAQ content. |
| business-cards-saskatoon | **19.6** | 61 | 0 | **RECOVERING (was DECAYED)** | Primary query "business cards saskatoon" reclaimed page 1 (8.9) and the dedicated page now outranks the homepage for it — cannibalization fix from 831b91c CONFIRMED. Page-rollup still 19.6 (long-tail drag). Hold; let it settle. |
| banner-printing-saskatoon | **23.6** | 96 | 0 | **RECOVERING (was DECAYED 33.2)** | Strong recovery. Still sub-10 target. No edit until it plateaus — observe. |
| flyer-printing-saskatoon | **37.5** | 356 | 1 | **DECAYED — recovering slowly** | High impressions (356 = real demand) but still deep + ~0 clicks. Candidate for a later wave (body depth + intent), not next. |
| graphic-design-saskatoon | **34.0** | 199 | 0 | **DECAYED — just edited (cooldown)** | Body internal-links added 2026-06-12 (419313c). High imp, 0 clicks. Under 7-day cooldown — DO NOT touch before ~2026-06-19. Watch for movement. |
| coroplast-signs-saskatoon | **32.3** | 63 | 2 | **RECOVERING (was DECAYED 44.7)** | Big recovery + clicks returning. Observe. |
| aluminum-signs-saskatoon | **26.8** | 45 | 0 | **RECOVERING (was DECAYED 31.8)** | Observe. |
| sign-company-saskatoon | **24.5** | 52 | 0 | **DECAYED — now measurable** | Real sample now (was noise). Hub-rebuild plan still valid but not next. |
| vinyl-lettering-saskatoon | **13.5** | 48 | 1 | **DEFEND (HOLD)** | Mild slip from 10.6, still page-1 edge. Hold — do not react. |
| signs-yorkton-sk | **38.1** | 72 | 0 | **DECAYED — eligible for rewrite** | Recovering slightly. Low priority (small market). |
| agriculture-signs-saskatoon | 2.0 (1 imp — NOISE) | 1 | 0 | **DEFEND (LOW CONFIDENCE)** | Sample too small to claim anything. Hold defensively. |
| business-cards-moose-jaw-sk | NO DATA | 0 | 0 | **INVESTIGATE — possibly de-indexed** | Still zero impressions. Confirm sitemap presence + URL inspection in GSC before any change. |

## New DEFEND candidates (high-impression pages NOT yet in the formal list — surface from full 28d survey)

| Page | Page pos | 28d imp | clk | Note |
|------|---------:|--------:|----:|------|
| photo-poster-printing-saskatoon | **8.6** | 120 | 1 | **PAGE 1 + real demand.** Strong new DEFEND candidate. Promote to DEFEND next refresh; treat title as protected now. |
| poster-printing-saskatoon | 17.2 | 122 | 3 | Page-2 + real clicks. **Possible cannibalization with photo-poster-printing** for "poster printing saskatoon" — investigate which URL should own it before any edit. |
| foamboard-printing-saskatoon | 19.5 | 109 | 1 | Page-2, real demand. Future wave candidate. |
| same-day-printing-saskatoon | 23.7 | 103 | 1 | Decayed-ish, real demand. Future candidate. |
| retail-signs-saskatoon | 44.1 | 112 | 0 | High imp but deep — low near-term ROI. |
| community-printing-saskatoon | 56.1 | 98 | 0 | Decay alert ("non profit printing services" 51.7→57). Not frozen, but pos 56 = too deep for a quick win. Low priority. |

## Competing pages (Google can't decide which URL ranks for a keyword)

- **"business cards saskatoon"** — RESOLVED. Dedicated /business-cards-saskatoon now outranks the homepage on the primary query (8.9 vs ~9). The 831b91c rewrite worked. Keep watching but no action.
- **"poster printing saskatoon"** — NEW. Both /poster-printing-saskatoon (17.2) and /photo-poster-printing-saskatoon (8.6) serve poster queries. Decide the canonical owner before editing either. Do NOT edit both.

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
