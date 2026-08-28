# Google Search pilot launch readiness

Revenue baseline, campaign economics, operating cadence, and scale/stop rules are defined in [revenue-growth-operating-plan.md](revenue-growth-operating-plan.md). That plan is the commercial control layer; this file remains the technical launch checklist.

**2026-08-03 PM revision — efficiency-first, and it supersedes the morning bid plan below.** The owner rejected bidding above forecast. The objective is the most clicks and conversions per dollar, reaching CA$600 of qualifying spend without overshooting CPCs to manufacture it. Changes from the morning plan: CPC ceilings return to the forecast-optimal **Core CA$4.00 / Competitor CA$2.50 / Brand CA$1.50**; **Brand Defense returns to PAUSED** (True Color already holds organic #1 on its own brand terms, there is no Auction Insights evidence of a competitor bidding on them, and brand clicks would contaminate the non-brand conversion data this pilot exists to collect); Enhanced Conversions stays OFF. Daily budgets stay raised at Core CA$14 / Competitor CA$4 — budget is permission to spend, not a bid, so a high budget paired with a low ceiling captures every cheap click available without ever overpaying for one. Weeks 1–2 are an explicit measurement phase; bid and reach changes are driven by Search lost IS (rank) versus (budget), not by pacing anxiety.

**2026-08-03 23:50Z staged-state verification:** a fresh Railway-backed v24 readback confirmed the exact child advertiser, CAD/Regina identity, Core CA$14 / Competitor CA$4 / Brand CA$3 budgets, all three campaigns paused, 18 non-Brand ad groups and RSAs staged enabled, and the Brand group/RSA paused. The reconciled controlled-test preflight passes read-only against that live inventory. Public launch remains blocked by the intentionally outstanding real-transaction uploader proof; the bounded Coroplast test is allowed to generate that proof only after fresh monitor/promotion attestation.

**Escalation-ladder conflict — flagged, not resolved.** The morning plan's Stage 2–4 ladder (broad match → Search Partners → 100 km radius) is currently **forbidden by this repository's own launch controls**. `scripts/google-ads/config-validator.mjs` fails unless `noBroadeningToManufactureVolume === true`, `searchOnly === true`, `radiusKm === 35`, and match types are exactly `EXACT`/`PHRASE`. Every rung of that ladder therefore requires an explicit approved contract change, not a dashboard toggle. Treat the ladder as an unapproved proposal until that change is made.

**2026-08-03 AM disposition — promo-chase launch approved (bid and Brand values superseded above).** The owner approved a deliberate departure from the conservative pilot below to chase the redeemed CA$600 promotion before it expires 2026-09-16: spending CA$600 cash unlocks CA$600 credit. The repository contract was updated through the approved-change process (not bypassed): pilot re-dated 2026-08-03 → 2026-09-17 (46 inclusive days); budgets Core CA$14 / Competitor CA$4 / Brand CA$3 per day with **Brand live at launch** (superseding the "keep Brand paused" default while `AUCTION_INSIGHTS_SIGNOFF` remains an open documentation gate); Maximize Clicks ceilings CA$6.00 / CA$4.00 / CA$2.50, deliberately above the 2026-07-17 forecast; all nine Core ad groups released (`rush-same-day`, `generic-print-price`, `generic-sign-shop` promoted to Tier 1). The runtime hard-stop profile now warns at **CA$1000**, protectively pauses at **CA$1250**, and absolutely caps at **CA$1300**, with the monitor window extended to 2026-12-31 so the promotional credit can be spent after the promo window closes. **This raises maximum runaway exposure from CA$650 to CA$1,300 — that is the accepted cost of the decision.** Launch is manual (Google Ads UI enable-only; campaign start/end dates stay 2026-07-20 / 2026-09-17 until the credit lands). Post-launch drift detection runs via `npm run validate:google-ads:launched`; the paused mode remains intact for rollback. Escalation ladder on missed Monday pacing checkpoints (target CA$13.33/day): Stage 2 broad match on product groups only → Stage 3 Search Partners → Stage 4 radius 100 km. Performance Max and Shopping stay out. Kill criteria: unexpected enabled campaigns, two missed monitor heartbeats, conversion tracking unproven by a real transaction within 7 days, or under CA$300 cumulative by Aug 31 with Stage 4 exhausted.

**2026-07-25 disposition:** A fresh credential-gated v24 readback passed against child customer `1072816342` with no safety failures. All campaigns, ad groups, and ads remain paused and exact-account spend is CA$0. All 19 RSAs—including all nine Competitor RSAs—now return `APPROVED` / `REVIEWED` with no policy topics, and Policy Manager independently reports no policy issues after refresh. No appeal is required. The CA$600/CAD promotion is accepted as confirmed by the owner and remains API-visible as redeemed. The qualified-call asset is approved/reviewed. The Railway-native 15-minute monitor is producing valid CA$0 heartbeats, and the July 25 non-spend drill freshly verified the CA$500 warning, CA$625 protective pause, fail-closed path, Telegram delivery, and durable Supabase evidence without touching live campaigns. The controlled Coroplast activation/rollback controller and all 81 Google Ads contract tests pass. Campaign activation remains prohibited until a post-August launch date is supplied and genuine `purchase_online`/`quote_won` revenue reconciliation is obtained through the bounded controlled test.

## Current disposition

| Checkpoint | Status |
| --- | --- |
| Local artifacts | **BUILT** |
| Campaigns in Google Ads | **CREATED — PAUSED** |
| Local validation | **VALIDATED** |
| Google Ads API validate-only | **PASSED** |
| Live account verification | **PAUSED/STAGED — NO SAFETY FAILURES; REAL-TRANSACTION PROOF OUTSTANDING** |
| Railway deployment guard | **WAIT FOR CI ENABLED** |
| Railway monitor schedule | **DEPLOYED — CONTROLLED-WINDOW EVIDENCE REQUIRED AT ACTIVATION** |
| CA$600 promotion | **API CONFIRMED — REDEEMED, CA$0/CA$600 QUALIFYING SPEND** |
| Competitor RSA policy | **9/9 APPROVED / REVIEWED — STAGED ENABLED UNDER PAUSED CAMPAIGN** |
| Launched | **No** |
| Spend | **CA$0** |

True Color advertiser `107-281-6342` is actively linked under manager `112-540-2990` through manager-link ID `6626494765`. It remains a separate advertiser and billing account from real-estate customer `220-053-8686`. Billing setup `8490021913` is approved and auto-tagging is enabled.

The owned account now has distinct enabled primary `UPLOAD_CLICKS` actions `7694360837` (`purchase_online`) and `7694360840` (`quote_won`). Duration-qualified call action `7694360843` remains secondary, excluded from conversions, and its customer goal is non-biddable. Historical browser purchase action `7689029977` is explicitly secondary and excluded. The customer goal graph bids only against the purchase goal containing the two server revenue actions; page views and calls are non-biddable.

The action IDs and Data Manager uploader are configured, but revenue delivery is not launch-ready until one non-fabricated paid reconciliation proves each revenue action. The verifier deliberately blocks launch when valid action IDs exist without real transaction evidence.

Account call reporting and call-conversion reporting are enabled. Call asset `394889103183` is wired at customer scope to secondary action `7694360843` (`qualified_call_60s`) with a 60-second threshold and no campaign/ad-group call-asset drift. The July 23 live readback returned `APPROVED` / `REVIEWED`.

## Last verified live paused build

The August 3 credential-gated readback confirmed:

- Core campaign `24048123058`: CA$14/day, paused.
- Competitor campaign `24048123061`: CA$4/day, paused.
- Brand campaign `24048123064`: CA$3/day, held and paused.
- Three Search-only campaigns; 18 non-Brand ad groups and RSAs staged enabled beneath paused campaigns; the Brand ad group and RSA paused; 83 positive exact/phrase keywords and 189 negative criteria.
- Google Search on; Search Partners and Display off.
- Three presence-only proximity criteria centered at `52.129728,-106.659637`, each with a 35 km radius; no positive city-location criteria remain.
- Dates July 20 through September 17, 2026.
- Exact-account spend CA$0 and no enabled campaign.
- Nine competitor RSAs use `https://truecolorprinting.ca/why-true-color?source=google-ads`; all nine are staged enabled beneath the paused Competitor campaign and return `APPROVED` / `REVIEWED` with no policy topics.
- Qualified-call asset `394889103183` is correctly wired and returned `APPROVED` / `REVIEWED`.
- Production `/why-true-color` and the exact tracked query URL return HTTP 200, remain noindex, and expose the paid-page marker without redirecting.
- The fully expanded tracking URL has no tracking-template or AI Max rewrite and returns HTTP 200 for desktop/mobile AdsBot user agents. Policy Manager reports no current issues.

The source of truth remains [campaign-config.mjs](campaign-config.mjs). Generate and validate deterministic backup/import artifacts with:

```sh
node scripts/google-ads/export-google-ads.mjs
node scripts/google-ads/export-google-ads.mjs --check
node --test scripts/google-ads/node-tests/paid-search-config.node.mjs
```

The generated Editor CSVs do not encode an advertiser ID or the advanced presence-only setting. They do carry the +35 km radius for operator review, but the API request and readback must prove both the radius and presence-only behavior before launch. Do not hand-edit generated artifacts.

## Pilot controls (updated 2026-08-03 PM — efficiency-first)

- Core: CA$14/day; 46-day planning maximum CA$644.
- Competitor: CA$4/day; 46-day planning maximum CA$184.
- Brand: CA$3/day staged but **PAUSED**; excluded from approved pilot spend (planning maximum CA$0). Keeps the `HOLD_AUCTION_INSIGHTS` tier label.
- Target qualifying spend and protective pause: **CA$600** (Google's promo requirement, pre-tax). Authorized limit: **CA$650** (2026-08-28 owner authorization). The extra CA$50 is safety headroom for click granularity and spend posting between five-minute heartbeats, not a spend target. It does not change any daily budget, CPC ceiling, keyword, network, match type, or geo control.
- Google Ads uses daily budgets, not a true lifetime cap. The end date, monitoring, and hard stop are mandatory.
- Maximize Clicks ceilings: Core CA$4.00, Competitor CA$2.50, Brand CA$1.50 — the 2026-07-17 forecast-optimal values. **Budget and bid are different levers.** The daily budget is permission to spend; the ceiling is the maximum price paid for a single click. Maximize Clicks always buys the cheapest available clicks first, so a raised budget with an unraised ceiling captures all cheap inventory without inflating average CPC. Raising the ceiling only buys marginal auctions that were previously priced out — do it only when Search lost IS (rank) proves auctions are being lost to rank rather than to a thin market.
- All nine Core ad groups (Tier 1, including the three former Tier 2 expansion groups) plus exact-only competitor conquest launch together. Competitor stays exact-only permanently.
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

The controlled-test window is mandatory, interpreted in `America/Regina`, restricted to whole-hour boundaries, and cannot exceed 72 hours. Hour-segmented Google Ads cost is filtered to `window-start` inclusive and `window-end` exclusive. Its protective threshold is CA$25 against the separately approved CA$30 cap. The fixed public-pilot window is July 20, 2026 through December 31, 2026 local: CA$450 emits an operator warning, CA$600 starts the protective pause, and CA$650 is the owner-authorized limit. At or above a pause threshold—or after the selected window ends—the dry-run result is `STOP_REQUIRED` / `WOULD_PAUSE`.

Only the explicit `--execute` flag authorizes a pause:

```sh
npm run monitor:google-ads-spend -- --profile=public-pilot --execute
```

After exact account identity is verified, execute mode enumerates and pauses every enabled campaign in that account—not only the three planned IDs—and verifies that none remain enabled. Unexpected enabled campaigns trigger fail-closed protection. A wrong or unreadable account identity never authorizes mutation. If spend or campaign inventory cannot be verified after account verification, the monitor still attempts the account-wide enabled-campaign pause and exits nonzero even when pause readback succeeds. Authentication, mutation, or readback failure returns `ERROR_PAUSE_UNVERIFIED` and stays red. Dry-run never mutates. Do not treat process execution alone as success—automation must inspect both the exit code and JSON `outcome` / `pauseVerified` fields.

Railway service `google-ads-monitor-cron` invokes the monitor, conversion uploader, and dashboard-alert routes, with the spend monitor's primary schedule tightened to `*/5 * * * *` for the CA$600/CA$650 public-pilot contract. The GitHub schedule remains a 15-minute backup rather than the primary cadence guarantee. Railway, GitHub backup, and manual calls use distinct bearer credentials, and the derived scheduler source is persisted rather than accepted from a caller-supplied label. Each monitor attempt records a compact `google-ads-monitor` heartbeat plus a sanitized, uniquely identified `google_ads.monitor.heartbeat` audit event containing the exact account, profile, execution mode, window, spend micros, campaign state, scheduler source, and pause verification. The audit table has RLS enabled, no API-role access, explicit service-role access, and a unique heartbeat ID index. Every execute profile fails closed with HTTP 503 if durable evidence cannot be written, so a successful scheduler run cannot exist without proof.

The legacy controlled-test activation accepts only three persisted Railway heartbeats. Each adjacent gap must be 10–20 minutes, total coverage must be at least 25 minutes, database and application timestamps must be within 30 seconds, and all audit/database IDs must be distinct. Rapid Railway/GitHub duplicates and manual calls cannot satisfy that controlled-test cadence. Public-pilot Stage One uses the separate direct Railway schedule readback plus fresh-heartbeat gate documented above. Warning, verified stop, and unsafe/unverified-stop outcomes become stable red lifecycle issues and flow through the existing deduplicated Telegram alert path.

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

The controlled controller is read-only by default, validates the exact account/resource inventory, probes the production Coroplast URL, validates every mutation before execution, enables Core last, and rolls the full account back to the canonical paused/CA$14 staged state on any failure. Activation changes only Core's budget, the three Coroplast phrase keywords, the eight non-Coroplast Core ad groups, and finally Core's campaign status; Competitor and Brand are never enabled by the controlled test:

```sh
node scripts/google-ads/controlled-test-controller.mjs preflight
node scripts/google-ads/controlled-test-controller.mjs activate \
  --execute \
  --monitor-attestation=/absolute/path/to/signed-attestation.json
node scripts/google-ads/controlled-test-controller.mjs rollback --execute
```

The signed activation attestation must contain exactly three fresh execute-mode Railway heartbeats for the same active ≤72-hour Regina window, monotonic exact-account spend below CA$25, durable alert/pause/fail-closed evidence, a fresh Google Ads UI promotion proof whose eligibility window contains the full test, and the fresh `activationClearance` emitted by `npm run validate:google-ads` after every controlled-test blocker is clear. That clearance binds the exact account, paused inventory, networks, radius/presence, English targeting, dates, tracking suffix, conversion actions, call linkage, policy state, and zero unexpected spend. The separately reported real-transaction reconciliation remains a public-launch gate because the controlled test exists to obtain that evidence; it does not create a circular controlled-test blocker. No unsigned or hand-edited JSON authorizes activation.

The July 24 production drill exposed and fixed a fail-closed evidence bug before activation: PostgreSQL JSONB reorders object keys, while the original SHA-256 proof digest used insertion-order-sensitive JSON serialization. The producer and verifier now share a canonical recursive key-order digest, with a regression that reorders every object key. The full Google Ads suite passes 81/81, independent security review found no high/medium issues, and fresh production proof rows survive the real Supabase round trip. Existing pre-fix drill digests remain invalid by design.

## Measurement feedback loop — deployed and proven (2026-07-26)

The read-only performance feedback loop is live in production. This closes the last
reviewer NO-SHIP items, which were operational evidence gates rather than code defects.
It adds measurement only; it has no authority to mutate Google Ads and does not move any
launch gate below.

Deployed evidence, all captured while every campaign remained PAUSED at CA$0 spend:

- Migration `20260725183000_paid_search_feedback_loop.sql` applied to `dczbgraekmzirxknjvwe`
  and present in the remote ledger.
- Weekly migrations `20260803210000_paid_search_weekly_decision_surface.sql`,
  `20260803235500_paid_search_weekly_observed_day_pacing.sql`, and its additive
  correction `20260804001500_paid_search_weekly_elapsed_day_pacing.sql` are applied.
  The service-role-only weekly view reads successfully, partial weeks divide by
  completed calendar days through the latest successful sync (including zero-traffic
  days), and the lifecycle rollup flags a missing Core or Competitor row.
- Grant surface verified by role. The raw staging tables `google_ads_daily_metrics` and
  `google_ads_optimization_proposals` return 403 even to the service role (INSERT/UPDATE
  only, no SELECT); the only read path is the published views. Failed, partial, stale, and
  abandoned rows therefore cannot become published data by construction, not merely by
  query logic. Anon is 401 on every object.
- Two-call idempotency proof against the deployed route: call 1 returned
  `idempotent:false`, call 2 returned `idempotent:true`, and a third call from the
  scheduled GitHub workflow also returned `idempotent:true`. After all three calls the
  database holds exactly one `succeeded` receipt, key
  `google-ads-performance-v1:1072816342:2026-06-26:2026-07-25`, with
  `verified_currency_code=CAD` and `verified_time_zone=America/Regina` persisted.
- Published views remain empty with no duplicate rows. Zero metric rows across the full
  30-day window is the current CA$0 spend evidence.
- Persisted attestation confirms all three canonical campaigns PAUSED, conversion tracking
  owned by `customers/1072816342` as `CONVERSION_TRACKING_MANAGED_BY_SELF` with tracking ID
  `18330693756` and no cross-account ID, `purchase_online` and `quote_won` primary and
  included, `qualified_call_60s` secondary and excluded, the legacy `About Us` page-view
  action excluded, and PAGE_VIEW plus CALL_FROM_ADS goals non-biddable.
- Scheduled daily at 14:30 UTC via `.github/workflows/cron-google-ads-performance.yml`,
  registered in the lifecycle heartbeat panel and the reconcile harness at a 26h window.
  `npm run harness:reconcile` reports it green.

Observation for a future review, not a blocker: conversion action `7689029977`
"Purchase - Website (True Color)" is a second PURCHASE-category action on the account. It is
currently `primaryForGoal=false` and `includeInConversionsMetric=false`, so it does not
contribute to the biddable PURCHASE goal. If it is ever re-included it would double-count
against `purchase_online`. Leave it excluded.

Also closed this session: Wave payment-effect recovery moved to the Railway `*/15` cron
service as its primary source. The GitHub workflow previously declared `*/5`, a cadence
GitHub does not deliver, so the crash-recovery gap could run for hours unobserved; it is now
a truthful `*/15` backup. Verified by a live tick in which all four Railway-driven endpoints
recorded fresh heartbeats, including the Google Ads spend monitor.

## Remaining launch blockers

Campaign creation is complete, but public-pilot activation is prohibited until all remaining gates are evidenced. The real attributable imports below are obtained only through the separately approved bounded controlled-test state defined in the commercial operating plan; they are not permission for an informal self-click or full pilot launch:

1. Supply the exact post-August controlled-test date and create a new ≤72-hour Regina test window; do not use the expired July window.
2. Refresh three consecutive Railway controlled-window heartbeats plus warning, verified-stop, and fail-closed Telegram evidence for that activation window.
3. Observe one real attributable `purchase_online` import and one real attributable `quote_won` import, reconciling click ID, transaction ID, pretax CAD value, database/outbox state, and Google Ads evidence.
4. Make a purpose-specific Enhanced Conversions consent/disclosure decision. Current promotional-email consent does not authorize sending Ads measurement customer data.
5. Review Auction Insights and explicitly justify Brand Defense; otherwise keep Brand paused.
6. Review the full live account preview and sign off the Wilkie/Dubois controls.

The July start date has passed. Moving the pilot requires an explicit approved date change in both the config and validator contract after the owner supplies the exact post-August test date. Do not enable campaigns merely because a configured date arrives.

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
- [x] Call reporting is enabled and the customer-scoped call asset is wired to approved/reviewed `qualified_call_60s`.
- [x] Customer purchase goal is biddable; page-view and call goals are non-biddable.
- [x] Railway Wait for CI and the executable PostgreSQL outbox-trigger regression protect production from the prior app/schema drift and NULL-trigger incident.
- [ ] Railway `*/5` primary cadence plus the CA$600 protective pause / CA$650 limit must deploy and read back before Core resumes; GitHub remains the 15-minute backup.
- [x] The exact-resource controlled activation and account-wide rollback controller passes tests, live preflight, and live validate-only mutation checks without enabling spend.
- [x] CA$600/CAD promotion confirmed from the direct-customer API and qualified-call asset approved/reviewed.
- [x] All 19 RSAs, including all nine Competitor RSAs, are approved/reviewed with no policy topics.
- [ ] A post-August controlled window, fresh activation evidence, real `purchase_online`/`quote_won` reconciliations, and final launch signoff remain blocked.

Only the two source-backed review claims in `approvedClaims` may contain numbers in RSA copy. Do not add price, cutoff, turnaround, or guarantee claims without current evidence and a validator change.
