# Google Search pilot launch readiness

Revenue baseline, campaign economics, operating cadence, and scale/stop rules are defined in [revenue-growth-operating-plan.md](revenue-growth-operating-plan.md). That plan is the commercial control layer; this file remains the technical launch checklist.

**2026-07-23 disposition:** A fresh credential-gated readback passed against child customer `1072816342` with no safety failures. All campaigns remain paused and exact-account spend is CA$0. The CA$600/CAD promotion is API-confirmed as redeemed with CA$600 qualifying spend required, CA$0 accumulated, and a September 16, 2026 UTC fulfillment expiry. The qualified-call asset is approved/reviewed. All nine exact competitor RSAs now use the exact tracked `/why-true-color?source=google-ads` destination and are in `REVIEW_IN_PROGRESS` after the guarded URL-only review request. The Railway-native 15-minute monitor is deployed, Railway Wait for CI is enabled, and the controlled Coroplast activation/rollback controller passes local and live validate-only checks. RSA policy approval and genuine `purchase_online`/`quote_won` reconciliation still block activation.

## Current disposition

| Checkpoint | Status |
| --- | --- |
| Local artifacts | **BUILT** |
| Campaigns in Google Ads | **CREATED — PAUSED** |
| Local validation | **VALIDATED** |
| Google Ads API validate-only | **PASSED** |
| Live account verification | **BLOCKED — PAUSED, NO SAFETY FAILURES** |
| Railway deployment guard | **WAIT FOR CI ENABLED** |
| Railway monitor schedule | **DEPLOYED — CONTROLLED-WINDOW EVIDENCE REQUIRED AT ACTIVATION** |
| CA$600 promotion | **API CONFIRMED — REDEEMED, CA$0/CA$600 QUALIFYING SPEND** |
| Competitor RSA policy | **REVIEW_IN_PROGRESS — PAUSED** |
| Launched | **No** |
| Spend | **CA$0** |

True Color advertiser `107-281-6342` is actively linked under manager `112-540-2990` through manager-link ID `6626494765`. It remains a separate advertiser and billing account from real-estate customer `220-053-8686`. Billing setup `8490021913` is approved and auto-tagging is enabled.

The owned account now has distinct enabled primary `UPLOAD_CLICKS` actions `7694360837` (`purchase_online`) and `7694360840` (`quote_won`). Duration-qualified call action `7694360843` remains secondary, excluded from conversions, and its customer goal is non-biddable. Historical browser purchase action `7689029977` is explicitly secondary and excluded. The customer goal graph bids only against the purchase goal containing the two server revenue actions; page views and calls are non-biddable.

The action IDs and Data Manager uploader are configured, but revenue delivery is not launch-ready until one non-fabricated paid reconciliation proves each revenue action. The verifier deliberately blocks launch when valid action IDs exist without real transaction evidence.

Account call reporting and call-conversion reporting are enabled. Call asset `394889103183` is wired at customer scope to secondary action `7694360843` (`qualified_call_60s`) with a 60-second threshold and no campaign/ad-group call-asset drift. The July 23 live readback returned `APPROVED` / `REVIEWED`.

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
- Nine competitor RSAs use `https://truecolorprinting.ca/why-true-color?source=google-ads`; the guarded URL-only mutation completed once, its idempotent rerun returned `ALREADY_REQUESTED`, and all nine remain paused in `REVIEW_IN_PROGRESS`.
- Qualified-call asset `394889103183` is correctly wired and returned `APPROVED` / `REVIEWED`.
- Production `/why-true-color` and the exact tracked query URL return HTTP 200, remain noindex, and expose the paid-page marker without redirecting.

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

Railway service `google-ads-monitor-cron` now invokes the monitor, conversion uploader, and dashboard-alert routes on `*/15 * * * *`; the GitHub schedule remains a backup rather than the primary cadence guarantee. Railway, GitHub backup, and manual calls use distinct bearer credentials, and the derived scheduler source is persisted rather than accepted from a caller-supplied label. Each monitor attempt records a compact `google-ads-monitor` heartbeat plus a sanitized, uniquely identified `google_ads.monitor.heartbeat` audit event containing the exact account, profile, execution mode, window, spend micros, campaign state, scheduler source, and pause verification. The audit table has RLS enabled, no API-role access, explicit service-role access, and a unique heartbeat ID index. Every execute profile fails closed with HTTP 503 if durable evidence cannot be written, so a successful scheduler run cannot exist without proof.

Activation accepts only three persisted Railway heartbeats. Each adjacent gap must be 10–20 minutes, total coverage must be at least 25 minutes, database and application timestamps must be within 30 seconds, and all audit/database IDs must be distinct. Rapid Railway/GitHub duplicates and manual calls cannot satisfy cadence. Warning, verified stop, and unsafe/unverified-stop outcomes become stable red lifecycle issues and flow through the existing deduplicated Telegram alert path.

Run the non-spend safety drill before building an attestation. It exercises the production warning, protective-pause, and fail-closed code against an exact-account in-memory adapter, sends a labeled Telegram drill message, and writes signed-input proof rows without mutating Google Ads:

```sh
npm run drill:google-ads-monitor -- --execute
```

The attestation builder queries those locked audit rows plus the latest Railway heartbeat rows, derives every monitor proof flag, signs the envelope, and validates it before writing a mode-0600 file:

```sh
npm run build:google-ads-attestation -- \
  --promotion-proof=/absolute/path/to/promotion.json \
  --live-verification=/absolute/path/to/live-verification.json \
  --output=/absolute/path/to/controlled-test-attestation.json
```

The controlled controller is read-only by default, validates the exact account/resource inventory, probes the production Coroplast URL, validates every mutation before execution, enables Core last, and rolls the full account back to the canonical paused/CA$8 state on any failure:

```sh
node scripts/google-ads/controlled-test-controller.mjs preflight
node scripts/google-ads/controlled-test-controller.mjs activate \
  --execute \
  --monitor-attestation=/absolute/path/to/signed-attestation.json
node scripts/google-ads/controlled-test-controller.mjs rollback --execute
```

The signed activation attestation must contain exactly three fresh execute-mode Railway heartbeats for the same active ≤72-hour Regina window, monotonic exact-account spend below CA$25, durable alert/pause/fail-closed evidence, a fresh Google Ads UI promotion proof whose eligibility window contains the full test, and the fresh `activationClearance` emitted by `npm run validate:google-ads` after every controlled-test blocker is clear. That clearance binds the exact account, paused inventory, networks, radius/presence, English targeting, dates, tracking suffix, conversion actions, call linkage, policy state, and zero unexpected spend. The separately reported real-transaction reconciliation remains a public-launch gate because the controlled test exists to obtain that evidence; it does not create a circular controlled-test blocker. No unsigned or hand-edited JSON authorizes activation.

## Remaining launch blockers

Campaign creation is complete, but public-pilot activation is prohibited until all remaining gates are evidenced. The real attributable imports below are obtained only through the separately approved bounded controlled-test state defined in the commercial operating plan; they are not permission for an informal self-click or full pilot launch:

1. Wait for all nine competitor RSAs to return approved/reviewed. The exact URL-only review request is already complete; do not repeat it or enable ads while review is pending.
2. Collect three consecutive Railway controlled-window heartbeats plus warning, verified-stop, and fail-closed Telegram evidence for the activation window.
3. Observe one real attributable `purchase_online` import and one real attributable `quote_won` import, reconciling click ID, transaction ID, pretax CAD value, database/outbox state, and Google Ads evidence.
4. Make a purpose-specific Enhanced Conversions consent/disclosure decision. Current promotional-email consent does not authorize sending Ads measurement customer data.
5. Review Auction Insights and explicitly justify Brand Defense; otherwise keep Brand paused.
6. Review the full live account preview and sign off the Wilkie/Dubois controls.

If these gates are not cleared before July 20, moving the pilot requires an explicit approved change to both the config and validator contract. Do not enable campaigns simply because the configured start date arrives.

## Wilkie/Dubois controls already verified

- [x] Correct True Color advertiser and separate billing context.
- [x] One domain only: `truecolorprinting.ca`.
- [x] Search only; Search Partners off; Display off.
- [x] Exact/phrase positive keywords only; no broad match.
- [x] Saskatoon +35 km presence-only applied and read back at `52.129728,-106.659637`; no positive city criteria remain.
- [x] Product intent routes to matching configurators.
- [x] Competitor terms excluded from RSA copy and routed to the exact tracked `/why-true-color?source=google-ads` destination.
- [x] Competitor targeting exact-only; Ink House and Rayacom added from current local-overlap research.
- [x] Campaign-specific CPC ceilings staged from the correct-account forecast.
- [x] Six direct-product sitelinks plus callout/snippet assets linked across campaigns.
- [x] Conversion-first launch tiers keep generic/rush and Brand traffic out of the first controlled test.
- [x] Checked-in launch manifest allows only Tier 1 product/conquest candidates, holds Tier 2 and Brand, and refuses activation while any gate remains blocked.
- [x] All campaigns, ad groups, and ads are paused; the July 23 readback found CA$0 exact-account spend.
- [x] Distinct revenue actions and the secondary 60-second call action are owned-account verified; the historical browser purchase action is non-primary and excluded.
- [x] Call reporting is enabled and the customer-scoped call asset is wired to `qualified_call_60s`; policy re-review remains pending.
- [x] Customer purchase goal is biddable; page-view and call goals are non-biddable.
- [x] Railway Wait for CI and the executable PostgreSQL outbox-trigger regression protect production from the prior app/schema drift and NULL-trigger incident.
- [x] A Railway-native `*/15` scheduler is deployed with the GitHub schedule retained as backup.
- [x] The exact-resource controlled activation and account-wide rollback controller passes tests, live preflight, and live validate-only mutation checks without enabling spend.
- [x] CA$600/CAD promotion confirmed from the direct-customer API and qualified-call asset approved/reviewed.
- [ ] Competitor RSA policy approval, three controlled-window heartbeats, real `purchase_online`/`quote_won` reconciliations, and final launch signoff remain blocked.

Only the two source-backed review claims in `approvedClaims` may contain numbers in RSA copy. Do not add price, cutoff, turnaround, or guarantee claims without current evidence and a validator change.
