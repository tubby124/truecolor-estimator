# SEO Protected Pages — Rankings as of 2026-05-05

> This file supplements ~/.claude/rules/truecolor-seo-safety.md with specific page rankings.
> **Refresh cadence: every 28 days from GSC.**
> Last refreshed: 2026-05-05 from `~/Downloads/truecolorprinting.ca-Performance-on-Search-2026-05-05/`.

These pages have confirmed top-10 rankings AS OF the refresh date above. Any edit requires:
1. Price-only fixes (no content restructuring)
2. NEVER change: meta title, H1, URL slug, title tag — for pages still in top 10
3. Meta descriptions: trim only if over 160 chars, preserve keywords

## ⚠ Decay rule

If a page drops below position 10 organic AND below position 5 in local pack for 60+ days, it loses FROZEN status and is eligible for title/meta rewrite. Verify against the latest GSC export before deciding.

## Protected pages (current — 2026-05-05)

| Page | Keyword | Organic Rank (Pages CSV) | Clicks 28d | Lock Level | Notes |
|------|---------|------|---|---|---|
| business-cards-saskatoon | business cards saskatoon | **16** (was #1 in March 2026) | 0 | **DECAYED — eligible for rewrite** | Lost #1 organic. Local pack still #3 per March 2026 baseline. Title rewrite may help. |
| banner-printing-saskatoon | print banner saskatoon | **11.7** (was #2 in March) | 2 | meta desc only | Bottom of page 1. Title rewrite = high risk. |
| flyer-printing-saskatoon | flyer printing saskatoon | **25** (was #3 in March) | 2 | **DECAYED — eligible for rewrite** | Page 3 organic. Title rewrite OK. |
| sign-company-saskatoon | print store sign saskatoon | **30** for query (was #4 in March) | 0 | **DECAYED — eligible for rewrite** | Page 3+. Hub rebuild candidate. |
| coroplast-signs-saskatoon | coroplast signs saskatoon | **not in top pages CSV** (was #5) | 0 | meta desc only | Investigate before any change — may have lost indexing. |
| aluminum-signs-saskatoon | aluminum signs saskatoon | **16.4** | 2 | meta desc trim only | Holding mid-page-2. |
| sticker-printing-saskatoon | sticker printing saskatoon | **16** | 7 | FAQ price fix only | Strong click leader. Don't touch title. |
| vinyl-lettering-saskatoon | vinyl lettering | **7.4** | 5 | meta desc only | Genuine top-10 organic — DEFEND. |
| agriculture-signs-saskatoon | agriculture signs saskatoon | **6.3** | 1 | meta desc only | Top 10 niche win — DEFEND. |
| signs-yorkton-sk | signs yorkton sk | **9.7** | 2 | meta desc only | Yorkton market top-10 — DEFEND. |
| business-cards-moose-jaw-sk | business cards moose jaw | **6** | 0 | meta desc only | Moose Jaw market top-10 — DEFEND. |

## ⚠ Critical insight from 2026-05-05 refresh

**Most "FROZEN" rankings in the prior version of this doc had already decayed.** The freeze was protecting positions that no longer existed. Refreshing this doc against current GSC data is a prerequisite to any SEO wave.

Pages that NEWLY entered top-10 organic since March 2026 baseline: vinyl-lettering, agriculture-signs, signs-yorkton, business-cards-moose-jaw. These should be added to the DEFEND list.

Pages that LOST top-10 since March: business-cards (now 16), flyer-printing (now 25), sign-company (now 30), coroplast (no longer in top pages). These are eligible for title/meta rewrite.

## What "FROZEN" means

- Meta title: DO NOT EDIT under any circumstances (pages currently in organic top 10)
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

1. Pull latest 28-day GSC export to `~/Downloads/truecolorprinting.ca-Performance-on-Search-[YYYY-MM-DD]/`
2. Compare current Pages.csv positions to the table above
3. Update positions, click counts, lock levels
4. Apply decay rule (60+ days below pos 10 = eligible for rewrite)
5. Append a refresh entry to `memory/seo-sprints.md`

## Files most relevant to SEO

| File | What It Controls |
|------|-----------------|
| `src/app/sitemap.ts` | All lastmod dates, priority, changeFreq — edit per-page dates only |
| `src/app/layout.tsx` | Title, meta description, OG tags, LocalBusiness schema, WebSite schema |
| `src/components/site/IndustryPage.tsx` | Service schema, FAQPage schema, BreadcrumbList schema on all SEO landing pages |
| `next.config.ts` | 301 redirects, security headers |
| `src/app/[slug]/page.tsx` | Individual SEO page content, metadata, schema props passed to IndustryPage |
| `public/llms.txt` | AI search index — hub list and price anchors for ChatGPT/Perplexity citation |
