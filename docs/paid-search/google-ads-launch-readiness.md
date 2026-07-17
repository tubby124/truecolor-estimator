# Google Search pilot launch readiness

## Current disposition

| Checkpoint | Status |
| --- | --- |
| Local artifacts | **BUILT** |
| Campaigns in Google Ads | **NOT CREATED** |
| Local validation | **VALIDATED** |
| Google Ads API validate-only | **BLOCKED** |
| Launched | **No** |
| Spend | **CA$0** |

The True Color child advertiser is confirmed as `107-281-6342` under MCC `112-540-2990`; the user-confirmed account name is **True Color Display Print** and Google Ads currently shows **Setup in progress**. The canonical source and validator require that customer ID and reject real-estate customer `220-053-8686`. Google Ads Editor CSVs do not encode an advertiser ID, so they cannot enforce the open import target: verify the active account is exactly `107-281-6342` before import and again in the account preview. The existing Google Ads OAuth refresh token returns `invalid_grant`, so API validate-only and import remain blocked pending reauthorization. No API mutation, campaign creation, deployment, campaign activation, or spend authorization was performed.

## Source and generated imports

The source of truth is [campaign-config.mjs](campaign-config.mjs). Do not hand-edit the files in `generated/`.

Generate and validate deterministic Google Ads Editor/bulk-upload CSVs:

```sh
node scripts/google-ads/export-google-ads.mjs
node scripts/google-ads/export-google-ads.mjs --check
node --test scripts/google-ads/node-tests/paid-search-config.node.mjs
```

The committed output uses supported Google Ads Editor entities for campaigns, ad groups, locations, exact/phrase keywords, responsive search ads, negative keywords, and a machine-readable validation summary. The schema follows Google's [Editor CSV column definitions](https://support.google.com/google-ads/editor/answer/57747?hl=en) and [location import guidance](https://support.google.com/google-ads/editor/answer/30573?hl=en). These supported entities are prepared for True Color customer `107-281-6342`, but the CSV format does not carry that target. Before import, verify the active Editor/API customer ID equals `1072816342`; after import, inspect every proposed change in that account's preview and keep every campaign and ad group paused. The validation summary records `editorImportTargetEncoded: false` and `targetAccountPreflightRequired: true` so downstream tooling cannot mistake source validation for account enforcement. Negative rows use Editor's `Negative` and `Campaign negative` types and never use an enabled status. Starter waste negatives are repeated campaign-by-campaign so they can be imported without creating an unreviewed account-wide list. Competitor names are Core campaign routing negatives only—not account-wide negatives.

The CSVs do **not** set the advanced presence-only geo option. `locations.csv` adds Saskatoon criterion `1002791`; presence-only must be set manually in Editor or through the API and then verified in the account preview. The blocked `PRESENCE_ONLY_AND_EDITOR_PREVIEW` gate prevents launch until both checks are evidenced. Other account settings—including billing, auto-tagging, conversions, CPC ceiling, and advanced geo—remain manual/API blocked rather than being represented with unsupported CSV headers.

## Pilot controls

- `GOOG_Search_TC_CoreProducts_2026`: CA$40/day; 30-day planning maximum CA$1,200.
- `GOOG_Search_TC_CompetitorConquest_2026`: CA$7/day; 30-day planning maximum CA$210.
- `GOOG_Search_TC_BrandDefense_2026`: no more than CA$3/day; 30-day planning maximum CA$90; remains blocked by `AUCTION_INSIGHTS_REQUIRED` even if other gates clear.
- Total 30-day planning maximum: CA$1,500.
- Fixed pilot window: July 20 through August 18, 2026, inclusive (30 days). The exporter does not auto-roll dates. If gates are not clear before July 20, moving the pilot requires an explicit approved contract change to the dates in `campaign-config.mjs` and the matching validator constants, followed by regenerated artifacts and all checks. Editing only the CSVs is prohibited.
- Google Ads enforces a daily budget, not a true lifetime cap. The end date, hard stop, and active monitoring are mandatory to keep the planning maximum meaningful.
- Maximize Clicks is configured, but no CPC ceiling is invented. A current Keyword Planner forecast from the correct True Color account and an approved ceiling are required first.

All campaigns are paused, Google Search only, Search Partners off, Display off, English, and canonically require presence-only for Saskatoon criterion `1002791`. Keywords are exact or phrase only. The import cannot establish presence-only by itself; verify it manually/API before launch. Do not add broad match to manufacture volume.

The final URL suffix captures UTM/ValueTrack values for `keyword`, `matchtype`, `device`, `loc_physical_ms`, `loc_interest_ms`, `adgroupid`, `creative`, `campaignid`, and `network`. Google auto-tagging and `gclid` capture must be enabled and verified in the confirmed account; do not manually place `gclid` in the URL template.

## External gates before API validation or creation

The advertiser identity gate is resolved: True Color customer `107-281-6342` is confirmed under manager `112-540-2990`. All remaining items are blocking:

1. Finish advertiser setup, confirm full permission scope, and configure and verify billing in customer `107-281-6342`. Any import/API runner must fail closed unless its active customer ID is exactly `1072816342`.
2. Reauthorize the Google Ads OAuth connection for MCC `112-540-2990` with access to the True Color child.
3. Enable and test auto-tagging.
4. Create or identify the owned purchase conversion action; confirm its real full destination (`AW-.../label`) and ownership. Do not invent or copy a label.
5. Make a purpose-specific enhanced-conversion consent decision. Current marketing consent is not sufficient for sending Ads measurement user data.
6. Run a current Keyword Planner forecast in the True Color account and approve a Maximize Clicks CPC ceiling.
7. Review Auction Insights and explicitly justify the brand-defense campaign. Otherwise it stays paused and excluded from launch.
8. Reconfirm the three daily budgets and CA$1,500 planning maximum.
9. Confirm current start/end dates, mandatory end date, monitoring owner, and hard-stop procedure. The July 20 start must be replaced through the config-and-validator contract if these gates are not cleared before launch.
10. Complete mobile QA for every landing page, configurator, checkout, and conversion path.
11. Place one real, attributable test order and verify the click ID and conversion evidence before launch.
12. Set Saskatoon targeting to presence-only manually/API and verify the full Editor/account preview (`PRESENCE_ONLY_AND_EDITOR_PREVIEW`).

## Launch and monitoring rules

Before activation, re-run the validator, review the Google Ads Editor preview, confirm one-domain routing (`truecolorprinting.ca` only), and verify that product-intent ads land on the matching configurator. Competitor keywords may contain competitor/trademark terms, but competitor names must not appear in RSA copy, paths, or assets.

During the pilot, review search terms daily, add only unambiguous waste negatives, check spend against the daily plan, verify conversion attribution, and maintain the fixed hard stop. Do not negative `near me`, `online`, `cheap`, or competitor terms account-wide. Any change to match types, networks, geotargeting, dates, budgets, bidding, URLs, tracking, or conversion setup requires regeneration and local validation before Editor/API review.

## Wilkie/Dubois launch-control checklist

The canonical `launchControls` declaration and blocked `LAUNCH_CONTROL_SIGNOFF` gate make these lessons machine-validated. Every box must be evidenced before sign-off:

- [ ] Complete mobile post-click QA across each ad, landing page, configurator, checkout, and conversion path (`MOBILE_QA`).
- [ ] Confirm all ads and routes use the single True Color domain, `truecolorprinting.ca`; no mixed-domain redirects.
- [ ] After importing `locations.csv`, manually/API set Saskatoon criterion `1002791` to city presence-only—not presence-or-interest—and verify it in the Editor/account preview (`PRESENCE_ONLY_AND_EDITOR_PREVIEW`).
- [ ] Confirm Google Search only, Search Partners off, Display off, and exact/phrase keywords only.
- [ ] Do not add broad match or broaden targeting to manufacture volume.
- [ ] Complete a real attributable paid test order and reconcile its click ID, payment, and owned conversion (`ATTRIBUTABLE_TEST_ORDER`).
- [ ] Confirm the 30-day end date and operational hard stop. If gates miss the planned start, obtain an approved config-and-validator contract change before regenerating artifacts (`DATES_AND_HARD_STOP`).
- [ ] Assign an owner for daily search-term review and waste-negative decisions throughout the pilot.

Only the two sourced review-proof claims listed in `approvedClaims` may contain numbers in RSA copy. Currency, from-price, numeric turnaround, or cutoff claims are blocked unless a future source-backed claim is deliberately added to the canonical allowlist and validator.
