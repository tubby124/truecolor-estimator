# Google Search pilot launch readiness

Revenue baseline, campaign economics, operating cadence, and scale/stop rules are defined in [revenue-growth-operating-plan.md](revenue-growth-operating-plan.md). That plan is the commercial control layer; this file remains the technical launch checklist.

**2026-07-18 freshness warning:** the credential-gated live verifier now fails during the OAuth token exchange. The last confirmed live state is the 2026-07-17 paused/CA$0 readback; it must not be treated as current until OAuth is reauthorized and the verifier passes again.

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

The account historically contains browser purchase action `7689029977`, but the site no longer sends Google Ads browser revenue conversions. The launch candidate requires two distinct primary `UPLOAD_CLICKS` actions—`purchase_online` and `quote_won`—with IDs read from the owned account and supplied through `GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID` and `GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID`. Both IDs are intentionally unconfigured and blocked; no action ID has been invented. Browser `purchase_online` and `quote_won` events remain GA4 diagnostics only. The durable server outbox is the sole Google Ads revenue-delivery path, preventing confirmation reloads or late webhooks from duplicating revenue.

The paused-state verifier requires only the four Google Ads OAuth/API credentials to perform its read-only account audit. It always reads and reports the complete non-removed conversion-action inventory. Missing purchase, quote-won, or qualified-call action IDs therefore return a `BLOCKED` launch status after account, campaign, spend, and conversion readback; they do not prevent discovery and do not cause any mutation.

## Last verified live paused build

All account mutations passed Google Ads API v24 validate-only before creation. A read-after-write verification then confirmed the exact paused account state:

- Core campaign `24048123058`: CA$40/day.
- Competitor campaign `24048123061`: CA$7/day.
- Brand campaign `24048123064`: CA$3/day.
- Three Search-only campaigns, 19 paused ad groups, 71 positive keywords, 189 negative criteria, and 19 paused responsive search ads.
- Core product terms remain tightly themed exact/phrase. Competitor conquest is exact-only and now includes the verified local-overlap targets Ink House and Rayacom, alongside Qwik Signs, Minuteman Press, 24 Hour Signs, Anytime Printing, PGI, Staples, and VistaPrint.
- Ten additional research/template/equipment themes are excluded as exact/phrase campaign negatives so paid budget stays on order intent. Protected commercial terms such as `near me`, `online`, and `cheap` are not blocked.
- Six direct-product sitelinks, six callouts, and one structured snippet are linked to every campaign. Sitelinks route directly to the six canonical configurators.
- Google Search on; Search Partners and Display off.
- Saskatoon criterion `1002791`, English, and presence-only targeting on all three campaigns.
- Core product ads route directly to matching configurators; competitor traffic routes to paid-only `/why-true-color`; brand traffic routes to the homepage.
- Production currently returns HTTP 404 for `/why-true-color`; this is an explicit launch blocker until the held site release deploys it, confirms 200/noindex/mobile/product links, and Google policy review is rechecked.
- Fixed account dates are July 20 through August 18, 2026. Every campaign and ad group remains paused.
- RSA policy approval currently reports `UNKNOWN`, so policy review is not yet cleared.

That readback is historical. The current canonical launch candidate supersedes it with 83 positive keywords, CA$8/day Core, CA$2/day Competitor, Brand held, July 20 through September 17 dates, and Saskatoon +35 km presence-only targeting. Those changes are staged locally only; the campaigns must remain paused while OAuth is restored, the candidate is applied through validate-only, and a fresh API readback proves the exact state.

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
2. Create and freshly verify distinct primary `UPLOAD_CLICKS` actions for `purchase_online` and `quote_won`, then set their exact account IDs in Railway. Do not reuse action `7689029977` unless Google Ads proves it is the required `UPLOAD_CLICKS` type.
3. Create and read back a duration-qualified phone-call conversion with an explicitly approved duration threshold. It must remain secondary and excluded from bidding; a phone-link click is not a qualified call.
4. Make a purpose-specific Enhanced Conversions consent/disclosure decision. Current promotional-email consent does not authorize sending Ads measurement customer data.
5. Deploy `/why-true-color`, verify live HTTP 200/noindex/mobile/product links, and recheck competitor RSA policy review.
6. Obtain RSA and manual-asset policy approval. Keep any disapproved, pending, or unknown assets paused behind the campaign state.
7. Review Auction Insights and explicitly justify Brand Defense; otherwise keep Brand paused.
8. Explicitly approve the staged CA$4.00/CA$2.50/CA$1.50 CPC ceilings, CA$8 Core and CA$2 Competitor daily budgets, held Brand state, CA$600 target, CA$650 cap, September 17 end date, monitoring owner, and hard-stop procedure.
9. Complete post-deploy mobile QA across every landing page, configurator, checkout, and conversion path.
10. Observe one real attributable `purchase_online` import and one real attributable `quote_won` import, reconciling click ID, transaction ID, paid timestamp/value, database/outbox state, and Google Ads evidence for each distinct action.
11. Review the full live account preview and sign off the Wilkie/Dubois controls.

If these gates are not cleared before July 20, moving the pilot requires an explicit approved change to both the config and validator contract. Do not enable campaigns simply because the configured start date arrives.

## Wilkie/Dubois controls already verified

- [x] Correct True Color advertiser and separate billing context.
- [x] One domain only: `truecolorprinting.ca`.
- [x] Search only; Search Partners off; Display off.
- [x] Exact/phrase positive keywords only; no broad match.
- [ ] Saskatoon +35 km presence-only applied and freshly read back through the API; the last live readback covered city-only targeting.
- [x] Product intent routes to matching configurators.
- [x] Competitor terms excluded from RSA copy and routed to `/why-true-color`.
- [x] Competitor targeting exact-only; Ink House and Rayacom added from current local-overlap research.
- [x] Campaign-specific CPC ceilings staged from the correct-account forecast.
- [x] Six direct-product sitelinks plus callout/snippet assets linked across campaigns.
- [x] Conversion-first launch tiers keep generic/rush and Brand traffic out of the first controlled test.
- [x] Checked-in launch manifest allows only Tier 1 product/conquest candidates, holds Tier 2 and Brand, and refuses activation while any gate remains blocked.
- [x] All campaigns, ad groups, and ads were created paused; last successful live readback on 2026-07-17 found CA$0 spend. Current fresh state is unverified until OAuth is restored.
- [ ] Account preview, policy approval, observed server-side `purchase_online` and `quote_won` imports, duration-qualified secondary call action, budget/date approval, scheduler/alert proof, monitoring owner, and hard-stop signoff.

Only the two source-backed review claims in `approvedClaims` may contain numbers in RSA copy. Do not add price, cutoff, turnaround, or guarantee claims without current evidence and a validator change.
