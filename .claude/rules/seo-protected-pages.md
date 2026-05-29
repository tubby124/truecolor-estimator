# SEO Protected Pages — Rankings as of 2026-05-29

> This file supplements ~/.claude/rules/truecolor-seo-safety.md with specific page rankings.
> **Refresh cadence: every 28 days from GSC.**
> Last refreshed: 2026-05-29 from `seo_gsc_snapshots` Supabase table (28-day window 2026-05-01 → 2026-05-28).

These pages have confirmed rankings AS OF the refresh date above. Any edit requires:
1. Price-only fixes (no content restructuring) on DEFEND pages
2. NEVER change: meta title, H1, URL slug, title tag — on DEFEND pages still in top 10
3. Meta descriptions: trim only if over 160 chars, preserve keywords

## ⚠ Decay rule

If a page drops below position 10 organic AND below position 5 in local pack for 60+ days, it loses FROZEN status and is eligible for title/meta rewrite. Verify against the latest GSC export before deciding.

## Protected pages (current — 2026-05-29)

Methodology: impression-weighted average position for each (query, page) pair over the 28-day window, then a page-level rollup across all queries serving that page. "Page pos" is the weighted average across ALL queries serving the page; "primary query pos" is the doc-tracked keyword specifically.

| Page | Primary keyword | Primary query pos | Page pos (all queries) | 28d imp | Lock level | Notes |
|------|-----------------|-------------------|------------------------|---------|------------|-------|
| business-cards-saskatoon | business cards saskatoon | **27.0** (was #16 May 5; #1 March) | 22.1 | 56 | **DECAYED — eligible for rewrite** | Further decay since May 5. **Wave A target** (Phase 3 of recovery plan). Homepage / now serves position 8.7 for the same query — see "competing pages" below. |
| banner-printing-saskatoon | print banner saskatoon | not in top queries this window | **33.2** | 67 | **DECAYED — eligible for rewrite** | Was "meta-desc-only" (11.7) on May 5. **Massive crash to pos 33.2.** Top serving query is "banner printing near me" at pos 51.8 (21 imp). Recovery plan Phase 7 (meta-only) is now insufficient — page needs full title rewrite. |
| flyer-printing-saskatoon | flyer printing saskatoon | not in top queries this window | **40.6** | 445 | **DECAYED — eligible for rewrite** | Further decay (was 25 on May 5). High impressions (445 = real demand) but no clicks. **Wave B target** (Phase 4). |
| sign-company-saskatoon | print store sign saskatoon | not tracked this window | 8.0 (only 3 imp / 2 days — NOISE) | 3 | **DECAYED — investigate first** | Page-level pos 8.0 looks improved BUT sample is 3 impressions — not actionable. Wave C (Phase 5) hub-rebuild plan still correct. |
| coroplast-signs-saskatoon | coroplast signs saskatoon | not in top queries this window | **44.7** | 40 | **DECAYED — eligible for rewrite** | Page IS still indexed (40 imp / 17 days) — not de-indexed as feared. Serving for "sign company saskatoon" (pos 44.9), "saskatoon signs" (61.4). Lost specific "coroplast signs saskatoon" keyword. Phase 6 investigation will likely confirm canonical health, then standard rewrite. |
| aluminum-signs-saskatoon | aluminum signs saskatoon | not in top queries this window | **31.8** | 32 | **DECAYED — eligible for rewrite** | Was 16.4 on May 5. Decayed further. Not on the recovery plan but should be added to a future wave after Phase 7. |
| sticker-printing-saskatoon | sticker printing saskatoon | not in top queries this window | **14.6** | **780** | **DEFEND (PROMOTED)** | Strongest page in the protected list. 780 impressions, primary queries "custom die cut stickers near me" pos 4.6, "die cut stickers near me" pos 7.8, "die cut labels near me" pos 6.5. **Upgraded from "FAQ-price-fix" to DEFEND.** Do NOT touch title/H1. |
| vinyl-lettering-saskatoon | vinyl lettering | not in top queries this window | **10.6** | 63 | **DEFEND (HOLD)** | Slight decay from 7.4 → 10.6 but still pg1 edge. Top query "decals saskatoon" at pos 9.0 (33 imp). Defend mode holds. |
| agriculture-signs-saskatoon | agriculture signs saskatoon | not in top queries this window | 6.0 (only 2 imp — NOISE) | 2 | **DEFEND (LOW CONFIDENCE)** | Page-pos 6.0 ranking is real but only 2 impressions in 28 days. Hold defensively but flag that sample size doesn't support strong claims. |
| signs-yorkton-sk | signs yorkton sk | not in top queries this window | **41.0** | 16 | **DECAYED — eligible for rewrite** | Was 9.7 on May 5. Lost top-10 in Yorkton market entirely. Top query now "custom signs near me" at pos 60.5. |
| business-cards-moose-jaw-sk | business cards moose jaw | NO DATA in window | NO DATA | 0 | **INVESTIGATE — possibly de-indexed** | Zero impressions over 28 days. Either lost indexing or fell below the GSC display threshold. Confirm sitemap presence + run URL inspection in GSC before any change. |

## New top-10 candidates (NOT yet in DEFEND list, surface from 28-day survey)

Note: 1000-row sample (PostgREST cap), so this is partial — re-run with pagination for full survey. Captured here as candidates:

| Query | Page | Weighted pos | 28d imp | Note |
|-------|------|-------------|---------|------|
| color printing | / (homepage) | 2.8 | 6 | Low impressions; query is broad — may be junk |
| print shops saskatoon | / (homepage) | 4.9 | 8 | Real intent + 1 click. Homepage is the destination — flag for "should we route to a sub-page?" |
| printing shop near me | / (homepage) | 5.8 | 5 | |
| tarpaulin printing | / (homepage) | 6.6 | 5 | Niche query — potential dedicated page candidate |
| business cards saskatoon | / (homepage) | 8.7 | 9 | **COMPETING WITH /business-cards-saskatoon** — see "competing pages" below |
| same day printing saskatoon | /foamboard-printing-saskatoon | 9.0 | 6 | Odd page-query mismatch — should be homepage or quote page |
| printing saskatoon | / (homepage) | 9.5 | 18 | |
| wall printing near me | /wall-graphics-saskatoon | 9.7 | 7 | NEW DEFEND candidate |
| printing services near me | / (homepage) | 9.8 | 6 | |
| retail signs saskatoon | /retail-signs-saskatoon | 10.3 | 6 | NEW DEFEND candidate |

## Competing pages (Google can't decide which URL ranks for a keyword)

- **"business cards saskatoon"** is served by both / (pos 8.7, 9 imp) and /business-cards-saskatoon (pos 27.0, 5 imp). The homepage is outranking the dedicated landing page on the exact target keyword. This is a strong signal that the BC landing page has lost topical authority. Wave A (Phase 3 of recovery plan) title/meta rewrite is the correct response.

## ⚠ Critical insight from 2026-05-29 refresh

**The May 25 wave-rule-violating commit (7ab5e48) crashed 5 pages further than the May 5 refresh showed:**

| Page | March 2026 | May 5 | May 29 | Total drop |
|------|-----------|-------|--------|------------|
| business-cards-saskatoon | #1 | #16 | #22.1 | -21 |
| banner-printing-saskatoon | #2 | #11.7 | **#33.2** | -31 |
| flyer-printing-saskatoon | #3 | #25 | #40.6 | -38 |
| sign-company-saskatoon | #4 | #30 | (noise) | unknown |
| coroplast-signs-saskatoon | #5 | (dropped from top pages) | #44.7 | unknown |

**Banner is now WORSE than business-cards.** The recovery plan's Phase 7 ("Wave E: banner-printing-saskatoon meta-only fix") is no longer appropriate — banner needs the same DECAYED treatment as business-cards. Recommend re-sequencing Wave A and Wave E priorities at next planning checkpoint, but execute Wave A on business-cards as written first.

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

1. Query Supabase `seo_gsc_snapshots` for the last 28-day window
2. Compute impression-weighted average position per page (across all queries) AND per (query, page) for tracked keywords
3. Update positions, click counts, lock levels in the protected pages table
4. Apply decay rule (60+ days below pos 10 = eligible for rewrite)
5. Survey for new top-10 candidates not yet in the DEFEND list
6. Append a refresh entry to `memory/seo-sprints.md`

## Files most relevant to SEO

| File | What It Controls |
|------|-----------------|
| `src/app/sitemap.ts` | All lastmod dates, priority, changeFreq — edit per-page dates only |
| `src/app/layout.tsx` | Title, meta description, OG tags, LocalBusiness schema, WebSite schema |
| `src/components/site/IndustryPage.tsx` | Service schema, FAQPage schema, BreadcrumbList schema on all SEO landing pages |
| `next.config.ts` | 301 redirects, security headers |
| `src/app/[slug]/page.tsx` | Individual SEO page content, metadata, schema props passed to IndustryPage |
| `public/llms.txt` | AI search index — hub list and price anchors for ChatGPT/Perplexity citation |
