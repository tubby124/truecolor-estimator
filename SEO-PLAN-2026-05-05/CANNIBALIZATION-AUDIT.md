# Cannibalization Audit — 2026-05-05

**Method:** Cross-reference GSC Pages.csv (28d) against Queries.csv to find queries where 2+ pages compete.
**Source:** `~/Downloads/truecolorprinting.ca-Performance-on-Search-2026-05-05/`
**Indexed pages:** 95 public marketing pages

## Confirmed cannibalization conflicts

### Conflict 1 — "event signs / event banners"
| Page | Position | Imp | Clicks |
|---|---|---|---|
| /event-signs-saskatoon | 33.45 | 69 | 0 |
| /event-banners | 19.6 | 52 | 2 |

**Diagnosis:** Both target "event signs" + "event banners" intent. Google can't pick a winner, neither ranks well.
**Decision needed:** Pick canonical:
- **A.** Keep /event-banners (higher CTR proven). 301 /event-signs-saskatoon → /event-banners.
- **B.** Keep both, but differentiate strictly: /event-banners = vinyl banners only, /event-signs-saskatoon = coroplast directional signs only. Update internal links + meta to reflect.

**Recommendation: B** — these ARE different products. Clarify intent rather than redirect.

### Conflict 2 — "coroplast / lawn / yard / election signs"
| Page | Position | Imp |
|---|---|---|
| /coroplast-signs-saskatoon | not in top pages | 0 |
| /election-signs | 7 (from query "yard signs near me") | 1 |
| (no /lawn-signs-saskatoon yet) | — | — |

**Diagnosis:** /coroplast-signs-saskatoon may have lost indexing. Other coroplast-adjacent pages are fragmented.
**Decision needed:**
- **A.** Investigate why /coroplast-signs-saskatoon dropped from top pages. Check GSC URL inspection.
- **B.** Build /coroplast-signs-saskatoon as the dominant hub; /election-signs becomes a spoke explicitly linked from the hub.
- **C.** Add /lawn-signs-saskatoon as new spoke (separate from /coroplast hub).

**Recommendation: A then B** — fix indexing first, then hub-and-spoke.

### Conflict 3 — "for lease / property management"
| Page | Position | Imp | Clicks |
|---|---|---|---|
| /property-management-signs-saskatoon | 13.35 | 162 | 0 |
| (no /for-lease-signs-saskatoon yet) | — | — | — |

**Diagnosis:** "lease signage saskatchewan" pulls 94 imp at pos 8.56 but lands on property-management page which doesn't say "lease."
**Decision:** Build /for-lease-signs-saskatoon (this audit's recommendation) + content inject "lease" into property-management. Differentiate intent: /for-lease = SIGN buyers, /property-mgmt = LANDLORD service buyers.

**SHIPPED in this wave (2026-05-05):** /for-lease-signs-saskatoon page created.

### Conflict 4 — "large format / poster / foamboard"
| Page | Position | Imp |
|---|---|---|
| /large-format-printing-saskatoon | not in top pages | 0 |
| /poster-printing-saskatoon | 5 (for "poster printing") | 0 |
| /foamboard-printing-saskatoon | 12 | 120 |
| /photo-poster-printing-saskatoon | 44 (for "photo printing saskatoon") | 0 |

**Diagnosis:** /large-format hub doesn't get traffic; spokes (poster, foamboard, photo-poster) compete with each other.
**Decision needed:**
- **A.** Strengthen /large-format-printing-saskatoon as hub; ensure all 3 spokes link UP to it.
- **B.** Kill /photo-poster-printing-saskatoon (low impressions, redundant with /poster-printing-saskatoon). 301 → poster.

**Recommendation: B** — too much overlap. /poster-printing covers the intent. /photo-poster has 3 imp and pos 44 — kill it.

### Conflict 5 — "business cards" Saskatoon vs city variants
| Page | Position | Imp |
|---|---|---|
| /business-cards-saskatoon | 16 | 137 |
| /business-cards-moose-jaw-sk | 6 | 8 |
| /business-cards-prince-albert-sk | not in top pages | 0 |
| /business-cards-regina | not in top pages | 0 |

**Diagnosis:** Saskatoon page is the workhorse but dropped from #1. City variants likely cannibalize for "business cards near me" → Google picks based on user location. Less of a problem than Conflict 1-4.
**Decision:** Defend Saskatoon ranking via meta desc rewrite (when wave-allowed). Leave city variants — they're geo-isolated and low-volume.

### Conflict 6 — Seasonal pages (silent killers)
| Page | Position | Imp | Status |
|---|---|---|---|
| /st-patricks-day-printing-saskatoon | 0 | 0 | DEAD |
| /mothers-day-printing-saskatoon | 0 | 0 | DEAD |
| /graduation-banners-saskatoon | low | low | weak |
| /ramadan-eid-banners-saskatoon | 16 | 8 | weak |

**Diagnosis:** Seasonal pages eat crawl budget without delivering rankings. Some had relevance during their season.
**Decision needed:**
- **A.** Kill (404 + remove from sitemap) /st-patricks-day and /mothers-day.
- **B.** Convert to blog posts under /resources/[seasonal-slug] and 301 the old URLs.
- **C.** Leave them dormant; they may rank again next season cycle.

**Recommendation: B** — preserve any backlinks via 301, declutter sitemap.

### Conflict 7 — Hub vs spoke title overlap
- /sign-company-saskatoon (hub, pos 30, 0 clicks)
- /commercial-signs-saskatoon (intended spoke, but title overlap)
- /signs-saskatoon (does this exist? Check)

**Action required:** Review title tags on hub vs all sign-spoke pages to ensure no duplicate keyword targeting.

## Summary by action class

### KILL (5 pages — recommend 301 to most-relevant page)
- /st-patricks-day-printing-saskatoon → /resources or kill
- /mothers-day-printing-saskatoon → /resources or kill
- /photo-poster-printing-saskatoon → /poster-printing-saskatoon (301)
- /event-signs-saskatoon → IF Decision A on Conflict 1 (else KEEP and differentiate)
- /community-printing-saskatoon → /non-profit-signs-saskatoon (overlap per SITE-STRUCTURE.md)

### MERGE / 301 (3 pages)
- /event-signs-saskatoon → /event-banners (only if Decision A)

### DIFFERENTIATE (3 pages — needs copy/title work)
- /event-signs-saskatoon vs /event-banners (Decision B)
- /property-management-signs vs /for-lease-signs (LANDLORD vs SIGN-buyer intent)
- /large-format vs /poster vs /foamboard (hub-and-spoke clarity)

### INVESTIGATE (2 pages)
- /coroplast-signs-saskatoon (why is this not in Pages.csv?)
- /signs-saskatoon (does this URL even exist? Check)

## Wave plan

### Wave A.0 (THIS WAVE — 2026-05-05)
- ✅ Refresh seo-protected-pages.md with current GSC
- ✅ Build /for-lease-signs-saskatoon page (resolves Conflict 3)
- ✅ Document this audit (no actions taken yet on conflicts)

### Wave A.1 (≥ 2026-05-12 after GSC stability check)
- Title/meta rewrite on DECAYED pages: /flyer-printing, /sign-company, /business-cards (decay confirmed)
- Title/meta rewrite on /wall-graphics, /vehicle-magnets, /vehicle-decals (not protected)

### Wave A.2 (≥ 2026-05-19)
- Resolve Conflict 1 (event signs vs event banners) — owner decision required first
- Resolve Conflict 4 (kill /photo-poster, 301)
- Investigate Conflict 2 (/coroplast indexing issue — possibly an emergency before any other action)

### Wave A.3 (≥ 2026-05-26)
- Seasonal page pruning (Conflict 6)
- Hub/spoke title disambiguation (Conflict 7)

## Decisions made (2026-05-05)

1. **Event signs vs event banners** — DIFFERENTIATE (Decision B). Keep both. /event-banners = vinyl banners only; /event-signs-saskatoon = coroplast directional/wayfinding. Owner-confirmed 2026-05-05.
2. **Seasonal pages** — KEEP. Mother's Day is upcoming, may rank seasonally. Re-evaluate after each season's GSC data.
3. **Photo-poster page** — KEEP. No 301. Owner-confirmed.
4. **Vehicle wraps** — STAY DECALS-ONLY. /vehicle-decals-saskatoon is canonical. No /vehicle-wraps-saskatoon page. Owner-confirmed.
5. **/coroplast-signs-saskatoon investigation — RESOLVED 2026-05-05.**

## /coroplast-signs-saskatoon investigation findings

- **Page healthy:** HTTP 200, prerendered (`x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`), no noindex header.
- **Currently ranking for one query only:** `coroplast printing near me` at pos 2, 1 impression, 0 clicks (28 days).
- **Lost the main keyword:** Zero impressions for `coroplast signs saskatoon` in 28 days. Was #5 in March 2026.

### Likely root causes
1. **FAQ #8 pricing contradiction** — "A single 18×24" sign is $24, so the $30 minimum charge applies automatically for a one-sign order — you pay $30." Uses $24 and $30 in same sentence. Post-edit-price-check hook flags `Coroplast "from $24"` as a wrong pattern. Trust signal failure.
2. **Word count ~480** — lowest of any major hub page (peers run 800-1500 words).
3. **Last refreshed 2026-04-12** — stale while competitors (Mako, SaskatoonSigns, Print Linkage, Canada Lawn Signs) keep updating.

### Recommended fix (Wave 2 content refresh, separate commit ≥ 2026-05-08)
- Fix FAQ #8 pricing language to remove $24 reference (rewrite as "An 18×24″ sign at $8/sqft works out to $24 by the rate, but the $30 minimum order applies, so the price for one sign is $30")
- Expand body content from 480 to 800+ words: substrate explanation, weatherproofing detail, install methods, sample use cases by industry
- Refresh `lastmod` to deploy date
- Title and H1 stay locked (already aligned with primary keyword)
- Run `/seo-page coroplast-signs-saskatoon` audit before deploy
- After deploy, submit URL inspection in GSC to request re-crawl
