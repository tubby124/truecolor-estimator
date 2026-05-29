# True Color SEO Safety Rules

## What Happened: Commit 7ab5e48 (2026-05-25) — DO NOT REPEAT

On 2026-05-25, commit `7ab5e48` "Fix SEO schema and citation drift" touched **80+ pages in a single shot**, including **5 protected ranking pages**:

| Page | Pre-commit position | Post-commit (May 29) |
|------|--------------------|----------------------|
| business-cards-saskatoon | #1 → #16 (May 5) | #22.1 |
| banner-printing-saskatoon | #2 → #11.7 (May 5) | **#33.2** |
| flyer-printing-saskatoon | #3 → #25 (May 5) | #40.6 |
| sign-company-saskatoon | #4 → #30 (May 5) | (3 imp / 2 days — noise) |
| coroplast-signs-saskatoon | #5 → dropped from top pages (May 5) | #44.7 |

Every page in this table was hit in the **same commit** with **title + content + schema changes simultaneously**, in direct violation of the rules below. The Wave System rule existed; nothing enforced it.

### Hard rules going forward (enforced by hooks since 2026-05-29)

1. **ONE protected page per commit, ever.** Editing a second protected page while a first is uncommitted is blocked at PreToolUse by `scripts/hooks/seo-wave-guard.mjs`.
2. **2 page.tsx files maximum per SEO commit** regardless of protected status. The 80+ file commit would have been blocked at file #3.
3. **Title/H1/description + schema NEVER ship in the same commit on a protected page.** Split into two commits 7+ days apart.
4. **5–7 day GSC observation between waves on a protected page.** Enforced by `scripts/hooks/seo-cooldown-check.mjs` as a non-blocking warning so hotfixes can still ship with explicit rationale.
5. **Protected-pages doc must be refreshed within 35 days of any SEO edit.** Older than that, edits block at PostToolUse. The doc going stale was the root cause that allowed the 7ab5e48 violation to land on already-decayed pages — `seo-protected-pages.md` said positions that were already 60+ days dead.

### Hook scripts (do not delete or rename — they are wired in .claude/settings.json)

- `scripts/hooks/seo-wave-guard.mjs` — PreToolUse, exits with code 2 on rule violation
- `scripts/hooks/seo-cooldown-check.mjs` — PostToolUse, blocks on staleness and warns on cooldown
- `scripts/hooks/stop-price-validation.mjs` — Stop, blocks session end if a protected page change has no fresh sprint-log entry

## What the GSC "Blocked by robots.txt" alert means (do NOT panic)

When Search Console fires "Blocked by robots.txt" emails about truecolorprinting.ca paths, check what's blocked before assuming a problem:

- [src/app/robots.ts](src/app/robots.ts) only disallows transactional / private paths: `/staff/`, `/api/`, `/pay/`, `/cart`, `/checkout`, `/account/`, `/quote/`. These SHOULD be blocked.
- All public SEO pages remain crawlable.
- GSC will index a `/staff/...` URL it discovered via a stray link or referrer, then alert that it's blocked. This is **expected behavior** for a noindex+disallow path.

**Action when this alert fires:** Confirm the blocked URL is in the disallow list above. If yes, no action needed — close the alert. Do NOT loosen `robots.ts`. The 2026-05-29 instance of this alert is what triggered the diagnosis that uncovered the GSC cron failure and the wave-rule violation; the alert itself was a red herring.

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
