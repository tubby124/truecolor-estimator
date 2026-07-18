# True Color Keyword Planner forecast — 2026-07-17

## Scope

Read-only Google Ads API v24 forecast from True Color customer `107-281-6342`, not the real-estate advertiser. Inputs match the live paused build: Saskatoon `1002791`, English `1000`, Google Search, exact/phrase keywords, and July 20 through August 18, 2026.

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

Use a global CA$4.00 Maximize Clicks CPC ceiling for the initial controlled pilot if Hasan approves it. The CA$2.50 ceiling materially suppresses forecast Core capture, while the CA$4.00 ceiling raises Competitor's forecast average CPC only to CA$1.36. Keep the CA$40/CA$7 campaign budgets and daily search-term monitoring as separate controls.

The forecast is complete, but `CURRENT_KEYWORD_PLANNER_FORECAST` remains blocked until the CA$4.00 ceiling is explicitly approved and staged in both the canonical config and paused live campaigns. No bid setting, status, budget, or spend changed during this read.
