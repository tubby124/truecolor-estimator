# True Color SEO — Homepage CTR Brief for Claude Code (2026-08-05)

## Context

Hasan noticed True Color orders slowing down. Live order/quote/GSC checks on 2026-08-05 showed:

- Paid orders/revenue are down over the latest 28-day comparison.
- Quote volume is up, but recent quote requests are not marked won/converted.
- Google Ads monitor reports `spend=0.00`; canonical campaigns are paused, so paid ads are not currently feeding orders.
- The live site is healthy: homepage, quote page, banner page, and `/api/health` returned HTTP 200.

This note is intentionally **diagnostic only**. Do **not** edit protected SEO pages from this brief alone.

## Data source

Data came from Supabase tables using service-role read access:

- `orders`
- `quote_requests`
- `seo_gsc_snapshots`
- `analytics_ga4_snapshots`
- `seo_gsc_sync_log`
- `cron_runs`

Important: direct Google Search Console OAuth token in `/root/.secrets` returned `invalid_grant`, but the app-side `gsc-sync` is currently healthy.

Latest GSC sync observed:

- `ran_at`: `2026-08-04T15:54:03.674527+00:00`
- `date_from`: `2026-07-26`
- `date_to`: `2026-08-01`
- `rows_inserted`: `1570`
- `status`: `ok`

## Homepage finding

The homepage is not broken and not de-indexed. The issue is **broad local intent impressions with weak/no clicks**.

Homepage comparison:

| Range | Clicks | Impressions | Avg position |
|---|---:|---:|---:|
| 2026-07-19 → 2026-07-25 | 8 | 294 | 16.2 |
| 2026-07-26 → 2026-08-01 | 6 | 293 | 23.8 |

Interpretation:

- Impressions are basically flat.
- Clicks slipped slightly.
- Average position worsened materially because the homepage is being surfaced for a messy mix of broad/local/product-ish queries.
- The biggest issue is not just ranking; it is that position 4-10 queries are still producing zero clicks.

## Homepage query-level CTR drag

Current period: `2026-07-26` → `2026-08-01`, page `https://truecolorprinting.ca/`.

| Query | Impressions | Clicks | CTR | Avg position | Read |
|---|---:|---:|---:|---:|---|
| `printing near me` | 37 | 0 | 0% | 10.1 | High-intent local query; no click pull. |
| `print shop saskatoon` | 18 | 0 | 0% | 8.1 | Should be clickable at this position. |
| `printing saskatoon` | 13 | 0 | 0% | 6.9 | Strong local intent; zero clicks is the problem. |
| `print shop near me` | 11 | 0 | 0% | 4.5 | Very concerning CTR miss. |
| `logo printing` | 8 | 0 | 0% | 4.9 | Query intent may not match homepage snippet. |
| `printing services saskatoon` | 6 | 0 | 0% | 9.2 | Local/commercial intent; no click. |
| `custom printing saskatoon` | 6 | 0 | 0% | 8.8 | Local/commercial intent; no click. |
| `banner printing saskatoon` | 6 | 0 | 0% | 2.2 | Ranking is strong but homepage may be the wrong/snippet-poor result. |

Queries that did earn homepage clicks in the same period:

| Query | Impressions | Clicks | CTR | Avg position |
|---|---:|---:|---:|---:|
| `saskatoon print shops` | 6 | 2 | 33.3% | 4.0 |
| `print shops saskatoon` | 9 | 1 | 11.1% | 6.0 |
| `true color printing` | 7 | 1 | 14.3% | 6.0 |

## Working hypothesis

The homepage snippet/title/result framing may be too brand/generic for broad local buyer searches.

Likely searcher expectation:

- “Print shop Saskatoon”
- “Printing near me”
- “Custom printing Saskatoon”
- “Signs, banners, stickers, business cards”
- “Fast/local/quote/order online”

Possible SERP issue:

- Google is willing to show the homepage for local generic print-shop intent.
- But users may not instantly see it as the best answer versus competitors that lead harder with “Print Shop Saskatoon,” hours/location/reviews, or product categories.

## Protected-page warning

Hasan is explicitly scared of touching protected SEO pages because previous broad edits caused damage. Treat this as a **review brief**, not authorization to change metadata.

Before any homepage title/meta/H1/body/schema edit:

1. Run the established True Color SEO workflow / opportunity check.
2. Confirm current protected-page rules are fresh.
3. Pull a fresh 28-day GSC rollup, not just this 7-day snapshot.
4. Compare homepage vs dedicated page cannibalization for:
   - `printing near me`
   - `print shop saskatoon`
   - `printing saskatoon`
   - `banner printing saskatoon`
   - `business cards saskatoon`
   - `sticker printing saskatoon`
5. Prefer a preview plan and human approval before shipping.

## Possible safe direction to evaluate, not blindly ship

If fresh data confirms the same pattern, evaluate a conservative homepage snippet/title adjustment around:

- Primary title concept: `Print Shop Saskatoon | Signs, Banners, Stickers & Business Printing`
- Meta concept: `Saskatoon print shop for banners, signs, stickers, flyers, business cards, decals and rush local printing. Get an online quote from True Color Display Printing.`

Do not copy blindly. Claude Code should verify current metadata, current protected rules, and current GSC data before proposing an exact diff.

## Non-metadata alternative / lower-risk ideas

If metadata change is too risky, consider body-only or internal UX reinforcements:

- Add or strengthen above-fold “Saskatoon print shop” language if not already present.
- Ensure homepage clearly surfaces core products: banners, signs, stickers, business cards, flyers, decals.
- Add clear local proof / turnaround / quote CTA language.
- Improve internal links from homepage to the strongest matching dedicated pages, if current architecture allows without cannibalization.

Again: evaluate against protected-page rules first.

## Quote funnel note

The more immediate revenue leak may be quote follow-up:

- Last 30d quote requests: 23
- Marked replied: 20
- No reply recorded: 3
- Won/converted: 0
- Many recent rows say `Marked as replied (replied outside system)` with no quote total, checkout start, won status, or conversion.

Claude Code should not solve this with SEO. It may need operational/status tracking fixes or staff process changes.
