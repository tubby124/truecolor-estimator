# True Color Keyword Planner forecast — 2026-07-17

## Scope

Read-only Google Ads API v24 forecast from True Color customer `107-281-6342`, not the real-estate advertiser. Inputs match the live paused build: Saskatoon `1002791`, English `1000`, Google Search, Core exact/phrase plus Competitor exact-only keywords, and July 20 through August 18, 2026.

Google documents historical metrics as Keyword Planner-equivalent search volume, competition, and top-of-page bid ranges, and forecast metrics as estimates for clicks, cost, and average CPC. See [historical metrics](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics) and [forecast metrics](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-forecast-metrics).

## Historical demand signals

Google returned 37 canonical keyword rows; 25 had non-zero average monthly search volume. Highest relevant Saskatoon/account signals included:

| Keyword | Avg. monthly searches | Competition | Top-of-page range |
| --- | ---: | --- | ---: |
| `24 hour signs` | 210 | Low | unavailable |
| `pgi printers` | 210 | Low | unavailable |
| `staples printing saskatoon` | 170 | Low | CA$0.95–CA$2.85 |
| `minuteman press saskatoon` | 140 | Low | CA$1.74–CA$5.14 |
| `sign company saskatoon` | 110 | Low | CA$2.59–CA$5.73 |
| `qwik signs` | 90 | Low | unavailable |
| `business cards saskatoon` | 70 | High | CA$0.61–CA$5.02 |
| `sign shop saskatoon` | 40 | Low | unavailable |
| `sticker printing saskatoon` | 20 | High | CA$1.24–CA$4.88 |
| `coroplast signs` | 20 | High | CA$1.29–CA$5.98 |
| `same day printing saskatoon` | 20 | High | CA$0.58–CA$3.05 |

Unavailable bid ranges are not treated as zero-cost traffic. Several long-tail Saskatoon variants reported zero rounded monthly volume; they remain tightly matched because they are commercially relevant and add little waste while paused/controlled.

## Daily forecast grid

| Campaign | Max CPC input | Forecast clicks/day | Forecast cost/day | Forecast average CPC |
| --- | ---: | ---: | ---: | ---: |
| Core | CA$1.50 | 0.13 | CA$0.16 | CA$1.22 |
| Core | CA$2.50 | 0.22 | CA$0.43 | CA$1.92 |
| Core | CA$4.00 | 0.72 | CA$2.12 | CA$2.96 |
| Competitor | CA$1.50 | 1.24 | CA$0.92 | CA$0.74 |
| Competitor | CA$2.50 | 1.90 | CA$2.19 | CA$1.15 |
| Competitor | CA$4.00 | 2.17 | CA$2.96 | CA$1.36 |
| Brand | CA$1.50–CA$4.00 | 0 | CA$0 | unavailable |

These are estimates, not guarantees. Exact/phrase volume is forecast well below the configured daily budgets, especially for Core. Brand's zero forecast reinforces the existing Auction Insights gate and paused state.

## Recommendation

Use campaign-specific Maximize Clicks ceilings: Core CA$4.00, Competitor CA$2.50, and Brand CA$1.50. The CA$2.50 ceiling materially suppresses forecast Core capture, but preserves about 88% of the exact-only Competitor click forecast versus CA$4.00 while capping exposure. Brand forecasts zero and remains held for Auction Insights. This July 17 forecast records the historical CA$40/CA$7/CA$3 paused build; the current canonical launch plan supersedes those budgets with CA$8 Core, CA$2 Competitor, and Brand held.

The ceilings were validate-only checked, staged in the canonical config, applied to the paused live campaigns, and read back successfully on 2026-07-17. `CURRENT_KEYWORD_PLANNER_FORECAST` is verified. No campaign, ad group, keyword, or ad was enabled; budgets were unchanged and spend remained CA$0.

## Competitor demand refinement

Current official-site overlap research and True Color account metrics added exact-only `ink house saskatoon` (110 average monthly searches, low competition) and `rayacom saskatoon` (30, low competition). The current nine-term exact-only set forecasts about 1.89 clicks/day and CA$2.18/day cost at the CA$2.50 ceiling, compared with 2.16 clicks/day and CA$2.94/day at CA$4.00. Competitor trademarks remain keywords only and never appear in RSA text, paths, or assets.
