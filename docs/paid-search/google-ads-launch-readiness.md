# Google Search pilot launch readiness

Revenue baseline, campaign economics, operating cadence, and scale/stop rules are defined in [revenue-growth-operating-plan.md](revenue-growth-operating-plan.md). That plan is the commercial control layer; this file remains the technical launch checklist.

**2026-07-23 disposition:** OAuth was reauthorized and the credential-gated readback passed against child customer `1072816342`. All campaigns remain paused and exact-account spend is CA$0. This snapshot records evidence; it is not activation permission.

## Current disposition

| Checkpoint | Status |
| --- | --- |
| Local artifacts | **BUILT** |
| Campaigns in Google Ads | **CREATED — PAUSED** |
| Local validation | **VALIDATED** |
| Google Ads API validate-only | **PASSED** |
| Live account verification | **VALIDATED_PAUSED** |
| Launched | **No** |
| Spend | **CA$0** |

True Color advertiser `107-281-6342` is actively linked under manager `112-540-2990` through manager-link ID `6626494765`. It remains a separate advertiser and billing account from real-estate customer `220-053-8686`. Billing setup `8490021913` is approved and auto-tagging is enabled.

The owned account now has distinct enabled primary `UPLOAD_CLICKS` actions `7694360837` (`purchase_online`) and `7694360840` (`quote_won`). Duration-qualified call action `7694360843` remains secondary, excluded from conversions, and its customer goal is non-biddable. Historical browser purchase action `7689029977` is explicitly secondary and excluded. The customer goal graph bids only against the purchase goal containing the two server revenue actions; page views and calls are non-biddable.

The action IDs are verified, but revenue delivery is not launch-ready. Google’s current offline-conversion path requires a supported uploader migration and one real paid reconciliation for each revenue action. The checked-in blocker `OFFLINE_UPLOADER_MIGRATION` prevents the existence of valid action IDs from being mistaken for a working end-to-end uploader.

## Last verified live paused build

All account mutations passed Google Ads API v24 validate-only before execution. The July 23 read-after-write verification confirmed:

- Core campaign `24048123058`: CA$8/day, paused.
- Competitor campaign `24048123061`: CA$2/day, paused.
- Brand campaign `24048123064`: CA$3/day, held and paused.
- Three Search-only campaigns, 19 paused ad groups, 83 positive exact/phrase keywords, 189 negative criteria, and 19 paused responsive search ads.
- Google Search on; Search Partners and Display off.
- Three presence-only proximity criteria centered at `52.129728,-106.659637`, each with a 35 km radius; no positive city-location criteria remain.
- Dates July 20 through September 17, 2026.
- Exact-account spend CA$0 and no enabled campaign.
- Nine competitor RSAs require one targeted `DESTINATION_NOT_WORKING` policy appeal after the landing-page repair; they remain paused.
- Production `/why-true-color` returns HTTP 200 and remains noindex.

The source of truth remains [campaign-config.mjs](campaign-config.mjs). Generate and validate deterministic backup/import artifacts with:

```sh
node scripts/google-ads/export-google-ads.mjs
node scripts/google-ads/export-google-ads.mjs --check
node --test scripts/google-ads/node-tests/paid-search-config.node.mjs
```

The generated Editor CSVs do not encode an advertiser ID or the advanced presence-only setting. They do carry the +35 km radius for operator review, but the API request and readback must prove both the radius and presence-only behavior before launch. Do not hand-edit generated artifacts.

## Pilot controls

- Core: CA$8/day; 60-day planning maximum CA$480.
- Competitor: CA$2/day; 60-day planning maximum CA$120.
- Brand: held at launch; its staged CA$3/day budget is not part of the approved pilot spend.
- Target qualifying spend: CA$600. Absolute pilot cap: CA$650.
- Google Ads uses daily budgets, not a true lifetime cap. The end date, monitoring, and hard stop are mandatory.
- Maximize Clicks is configured with forecast-backed ceilings staged while paused: Core CA$4.00, Competitor CA$2.50, Brand CA$1.50. The current exact-only Competitor forecast is about 1.89 clicks/day at CA$2.50 versus 2.16 at CA$4.00, so the lower ceiling preserves most modeled capture while limiting auction exposure.
- Technical forecast/staging is verified; owner approval to use these exact ceilings at launch remains a separate blocked gate.
- Launch Tier 1 contains the six direct-product ad groups plus exact-only competitor conquest. Rush, generic pricing, and generic sign-shop groups are Tier 2 and must remain paused during the first controlled conversion test. Brand remains held for Auction Insights.
- The final URL suffix preserves UTM and ValueTrack fields for keyword, match type, device, location, ad group, creative, campaign, and network. Auto-tagging supplies the click ID.

### Cumulative-spend hard stop

The one-shot monitor at `scripts/google-ads/hard-stop-monitor.mjs` is locked to True Color customer `1072816342`. It verifies the exact CAD/`America/Regina` account, reads cumulative customer-level cost across every campaign for the full approved window, inventories every non-removed campaign, and emits one structured JSON result. The three planned campaign IDs remain identity controls, but they are not the spend boundary. Any unexpected enabled campaign is unsafe. It never prints credential values.

Dry-run is the default and cannot mutate Google Ads:

```sh
npm run monitor:google-ads-spend -- --profile=public-pilot
npm run monitor:google-ads-spend -- \
  --profile=controlled-test \
  --window-start=2026-07-20T08:00 \
  --window-end=2026-07-23T08:00
```

The controlled-test window is mandatory, interpreted in `America/Regina`, restricted to whole-hour boundaries, and cannot exceed 72 hours. Hour-segmented Google Ads cost is filtered to `window-start` inclusive and `window-end` exclusive. Its protective threshold is CA$25 against the separately approved CA$30 cap. The fixed public-pilot window is July 20 through September 17 local: CA$500 emits an operator warning, CA$625 triggers the protective pause, and CA$650 is the absolute cap. At or above a pause threshold—or after the selected window ends—the dry-run result is `STOP_REQUIRED` / `WOULD_PAUSE`.

Only the explicit `--execute` flag authorizes a pause:

```sh
npm run monitor:google-ads-spend -- --profile=public-pilot --execute
```

After exact account identity is verified, execute mode enumerates and pauses every enabled campaign in that account—not only the three planned IDs—and verifies that none remain enabled. Unexpected enabled campaigns trigger fail-closed protection. A wrong or unreadable account identity never authorizes mutation. If spend or campaign inventory cannot be verified after account verification, the monitor still attempts the account-wide enabled-campaign pause and exits nonzero even when pause readback succeeds. Authentication, mutation, or readback failure returns `ERROR_PAUSE_UNVERIFIED` and stays red. Dry-run never mutates. Do not treat process execution alone as success—automation must inspect both the exit code and JSON `outcome` / `pauseVerified` fields.

The repository now includes an authenticated production cron route plus a GitHub Actions schedule that invokes it every 15 minutes in execute/fail-closed mode. Each attempt records a `google-ads-monitor` heartbeat; warning, stop, or failure states enter the lifecycle rollup so the existing deduplicated Telegram alert path can notify the operator. This is not production proof: deployment secrets, one successful heartbeat, one warning/stop fixture, and one stale-heartbeat alert must be verified before activation. Do not enable campaigns until the corresponding controlled-test or public-pilot approval is recorded.

## Remaining launch blockers

Campaign creation is complete, but public-pilot activation is prohibited until all remaining gates are evidenced. The real attributable imports below are obtained only through the separately approved bounded controlled-test state defined in the commercial operating plan; they are not permission for an informal self-click or full pilot launch:

1. Confirm the CA$600 offer and exact qualifying terms inside **Billing → Promotions**. Only spend after redemption/eligibility is confirmed counts toward the offer.
2. Migrate the revenue uploader to Google’s supported production offline-conversion path and prove that it accepts a non-fabricated conversion from this developer token.
3. Submit one targeted policy appeal for the nine repaired competitor RSAs and wait for approval; do not use repeated appeals or enable them while disapproved.
4. Observe one real attributable `purchase_online` import and one real attributable `quote_won` import, reconciling click ID, transaction ID, pretax CAD value, database/outbox state, and Google Ads evidence.
5. Make a purpose-specific Enhanced Conversions consent/disclosure decision. Current promotional-email consent does not authorize sending Ads measurement customer data.
6. Review Auction Insights and explicitly justify Brand Defense; otherwise keep Brand paused.
7. Explicitly approve the staged CPC ceilings, held Brand state, monitoring owner, and hard-stop procedure.
8. Review the full live account preview and sign off the Wilkie/Dubois controls.

If these gates are not cleared before July 20, moving the pilot requires an explicit approved change to both the config and validator contract. Do not enable campaigns simply because the configured start date arrives.

## Wilkie/Dubois controls already verified

- [x] Correct True Color advertiser and separate billing context.
- [x] One domain only: `truecolorprinting.ca`.
- [x] Search only; Search Partners off; Display off.
- [x] Exact/phrase positive keywords only; no broad match.
- [x] Saskatoon +35 km presence-only applied and read back at `52.129728,-106.659637`; no positive city criteria remain.
- [x] Product intent routes to matching configurators.
- [x] Competitor terms excluded from RSA copy and routed to `/why-true-color`.
- [x] Competitor targeting exact-only; Ink House and Rayacom added from current local-overlap research.
- [x] Campaign-specific CPC ceilings staged from the correct-account forecast.
- [x] Six direct-product sitelinks plus callout/snippet assets linked across campaigns.
- [x] Conversion-first launch tiers keep generic/rush and Brand traffic out of the first controlled test.
- [x] Checked-in launch manifest allows only Tier 1 product/conquest candidates, holds Tier 2 and Brand, and refuses activation while any gate remains blocked.
- [x] All campaigns, ad groups, and ads are paused; the July 23 readback found CA$0 exact-account spend.
- [x] Distinct revenue actions and the secondary 60-second call action are owned-account verified; the historical browser purchase action is non-primary and excluded.
- [x] Customer purchase goal is biddable; page-view and call goals are non-biddable.
- [ ] Offline uploader migration, promotion eligibility, targeted competitor RSA appeal, real `purchase_online`/`quote_won` reconciliations, and final launch signoff remain blocked.

Only the two source-backed review claims in `approvedClaims` may contain numbers in RSA copy. Do not add price, cutoff, turnaround, or guarantee claims without current evidence and a validator change.
