# True Color SEO Safety Rules

## SEO Sprint Log — MANDATORY UPDATE ON EVERY CHANGE

**File to update:** `~/.claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md`

Update it after ANY of:
- Page created / content expanded / copy changed
- Title, meta, or H1 touched
- Internal link hrefs updated
- Schema added/changed/removed
- Redirect added to next.config.ts
- Sitemap entry added or lastmod date changed
- Wave opportunity identified but deferred (flagged = must be logged)
- GSC ranking movement recorded

Do NOT end the session without appending a new `## SEO Phase [N]` entry. This is enforced by hook AND by rule.

## NEVER DO — Could Kill Rankings

- Never change H1 text on a ranking page (coroplast, banner, flyer, business cards)
- Never remove internal links to ranking pages
- Never delete or merge a ranking page without a 301 redirect in place first
- Never change sitemap `lastModified` to a bulk/dynamic date — Google ignores it and loses trust
- Never use `const now = new Date()` in sitemap.ts — always hardcode per-page dates
- Never change title tag and content on the same commit for a ranking page
- Never add schema + change content + change title in the same deploy
- Never ship all schema changes at once — stagger across commits (see Wave system below)
- Never add a page to the sitemap before it exists and returns 200
- Never change `priority` or `changeFrequency` on ranking pages without checking GSC first

## Current Baseline Rankings (check GSC before any SEO commit)

### GSC Organic (last updated: 2026-03-12)

| Keyword | Position | Page |
|---------|----------|------|
| print banner saskatoon | #2 | /banner-printing-saskatoon |
| flyer printing saskatoon | #3 | /flyer-printing-saskatoon |
| print store sign saskatoon | #4 | /sign-company-saskatoon (or homepage) |
| coroplast signs saskatoon | #5 | /coroplast-signs-saskatoon |
| business cards saskatoon | #1 | /business-cards-saskatoon |

### Google Maps / Local Pack — Trustindex (last updated: 2026-03-20)

| Keyword | Position | Prev | Delta |
|---------|----------|------|-------|
| print banner saskatoon | #1 | #2 | +1 |
| flyer printing saskatoon | #3 | #2 | -1 |
| coroplast signs saskatoon | #3 | #5 | +2 |
| print store sign saskatoon | #4 | #4 | stable |
| business cards saskatoon | #3 | #3 | stable |

If any of these drop after a commit, rollback immediately.

## Sitemap lastmod Rules

Every page in `sitemap.ts` must have a hardcoded date reflecting when it was **actually last changed**:
- When you CREATE a page → set lastmod to today
- When you UPDATE content on a page → update that page's lastmod to today
- When you do NOT touch a page → leave its lastmod date alone
- When a deploy ships → only the pages modified in that commit get a new date
- NEVER set lastmod to `new Date()` globally — this tells Google all 86 pages changed simultaneously, which destroys lastmod trust

Date pattern by page type (what looks organic and honest):
- Homepage: updates when content changes (not every deploy)
- Product/service SEO pages: update only when FAQ, price, or body content changes
- Industry pages: rarely change — keep original creation date
- Seasonal pages: update the season before the holiday
- Legal pages: yearly or less

## Wave System — How to Deploy SEO Changes Safely

When making multiple SEO changes, group them into waves deployed 5–7 days apart.
Check GSC after each wave before proceeding to the next.

| Wave | Contents | Risk | Wait Before Next |
|------|----------|------|-----------------|
| 1 | Redirects, sitemap dates, title/meta length fixes, reviewCount | Very Low | 5 days |
| 2 | Content improvements (word count, FAQ additions, copy fixes) | Low | 7 days |
| 3 | Schema: Service url, LocalBusiness properties | Very Low | 7 days |
| 4 | Product schema on landing pages | Low | 7 days |
| 5 | Performance (LCP, CWV) | Medium | Watch CrUX 28d |
| 6 | Mobile/UX (font sizes, tap targets, layout bugs) | Very Low | — |

**Rule:** If rankings drop after any wave, STOP and diagnose before proceeding.

## Title Tag Changes on Ranking Pages

- Keep all ranking keywords in the new title — just trim and reorder
- Maximum 60 characters
- City name ("Saskatoon") can move to the end — works fine for geo-targeting
- After changing: monitor GSC impressions/CTR for 14 days
- Volatility window: 1–3 weeks is normal

## Schema Rollout Safety

- Adding schema to ranking pages has low risk but must be a separate commit from content changes
- After adding schema: run Google Rich Results Test on the affected page
- Product schema: do NOT add to any page with a price inconsistency — resolve prices first
- FAQPage schema: won't generate rich results for non-gov/health sites (Aug 2023 restriction) — keep for knowledge graph but don't add more
- Schema + content change on same page = two separate commits, 7 days apart

## 301 Redirect Rules

- PageRank flows fully through 301 but with a crawl delay (days to weeks)
- Always add both the redirect AND the target URL to sitemap (target only, not source)
- After adding a redirect: submit target URL to Search Console for inspection
- Never 301 a ranking page to a non-equivalent destination
- For dead URLs (404s with no traffic): fix with 301 as soon as found — they bleed crawl budget

## What Is Currently Blocked (Do Not Change Without Review)

These are working well — any change needs explicit owner approval and GSC check:
- IndustryPage component core structure (headings, FAQ layout, CTA placement)
- Phase 15 homepage product card links (already updated to `/[product]-saskatoon` format)
- Existing 301s in next.config.ts
- Canonical tag implementation on all pages
- BreadcrumbList schema on IndustryPage
- AggregateRating schema (update count only — never change ratingValue)

## GSC Check Process (After Every SEO Commit)

1. Wait 3–5 days for Google to recrawl
2. GSC → Search results → filter by the 4 baseline keywords
3. Check impressions and average position — should be stable or improving
4. GSC → Coverage → check for new errors (404s, excluded pages)
5. If any baseline keyword drops more than 2 positions: investigate before Wave N+1
6. Full ranking check date: 2026-04-12

## Completed Infrastructure (2026-03-12)
- www.truecolorprinting.ca → 301 Cloudflare Redirect Rule ✅
- Cloudflare email obfuscation → OFF ✅
- /vinyl-banners-saskatoon → 301 → /banner-printing-saskatoon ✅
- Sitemap lastmod: per-page hardcoded dates, /products/* removed ✅
- Title: 54 chars | Meta desc: 141 chars | reviewCount: 29 ✅
- true-color.ca: still 3-hop chain — Hostinger fix pending (http:// → https://)

## Files Most Relevant to SEO

| File | What It Controls |
|------|-----------------|
| `src/app/sitemap.ts` | All lastmod dates, priority, changeFreq — edit per-page dates only |
| `src/app/layout.tsx` | Title, meta description, OG tags, LocalBusiness schema, WebSite schema |
| `src/components/site/IndustryPage.tsx` | Service schema, FAQPage schema, BreadcrumbList schema on all SEO landing pages |
| `next.config.ts` | 301 redirects, security headers |
| `src/app/[slug]/page.tsx` | Individual SEO page content, metadata, schema props passed to IndustryPage |
