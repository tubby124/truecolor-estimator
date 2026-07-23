# Revenue Growth Search Operating Plan

**Evidence refreshed:** 2026-07-18

**Ads account:** True Color Display Print `107-281-6342`

**Current state:** Last live verification on 2026-07-17 found all Search campaigns paused at CA$0; the 2026-07-18 verifier run is blocked by an invalid OAuth refresh token, so current live state is unverified and launch remains prohibited

## Objective and planning truth

The operating goal is to double True Color revenue without teaching Google to buy low-quality clicks or low-value diagnostic actions.

The latest captured Supabase paid-order baseline is 2026-06-20 through 2026-07-17:

| Metric | Latest 28 days | Prior 28 days | Change |
| --- | ---: | ---: | ---: |
| Non-archived paid orders | 31 | 32 | -3.1% |
| Gross customer charges | CA$6,665.55 | CA$6,903.47 | -3.4% |
| Gross AOV | CA$215.02 | CA$215.73 | -0.3% |
| Pretax subtotal | CA$5,777.97 | CA$6,181.49 | -6.5% |

The durable order baseline excludes archived orders and `TEST-%` orders. Gross customer charges include tax and are not contribution revenue. Supabase captures portal/configurator orders and many manual payment-request orders, but it is not yet reconciled to all Wave, bank, cash, e-transfer, or other offline revenue. Whole-business revenue doubling requires that reconciled denominator.

At the current captured pretax AOV of CA$186.39, doubling the latest captured Supabase 28-day pretax subtotal requires approximately CA$5,777.97 of additional captured pretax sales, or about 31 additional average orders. This is not yet a whole-business doubling calculation. The separate customer-charge/GMV figure includes GST/PST and must not be treated as revenue. The correct planning equations are:

```text
incremental orders required = incremental pretax sales target / product-specific paid pretax AOV
clicks required = incremental paid orders / observed paid click-to-paid-order rate
ad spend = clicks required × observed CPC
allowable CPA = net contribution per order × approved acquisition share
break-even contribution ROAS = 1 / contribution margin rate
allowable max CPC = allowable CPA × observed paid click-to-paid-order rate
```

No reliable paid conversion rate or product contribution margin exists yet. Whole-business revenue must first be reconciled across Supabase, Wave, bank, cash, e-transfer, refunds, cancellations, and any offline work. Therefore, “double revenue” is a business objective, not a defensible paid-search forecast.

## What current evidence says

### Search demand and organic capture

The latest complete GSC window is 2026-06-17 through 2026-07-14:

- 42 clicks from 7,686 impressions at 0.55% CTR and average position 24.78.
- Prior window: 47 clicks from 6,005 impressions at 0.78% CTR and position 26.04.
- Impressions increased 28%, clicks fell 11%, and CTR fell about 30% relative even though average position improved.
- No new location pages are justified. The opportunity is better click capture, stronger product intent, and conversion measurement.

Proven or useful query signals:

| Cohort | Evidence | Operating use |
| --- | --- | --- |
| Sticker printing | `sticker printing saskatoon`: 3 clicks / 31 impressions / 9.68% CTR / position 4.16 | Tier 1 paid product; direct sticker configurator |
| Poster printing | `poster printing saskatoon`: 3 / 43 / 6.98% / position 2.72 | Organic winner; later tightly capped product test after revenue-path review |
| Coroplast | Product page: 2 / 61 / 3.28%; strong settled-order evidence | Tier 1 paid product; direct coroplast configurator |
| Die-cut sticker/label variants | Several high-intent page-one/page-two queries with zero clicks | Exact/phrase ad-message test; do not rewrite the protected sticker title |
| Generic printing | `printing near me`: 0 / 187 / position 10.29 | Tier 2 only; generic traffic is not a product-order proxy |
| Flyers/large format/sign shop | High impressions with weak rank/CTR; paid economics remain unproven | Hold or tightly cap; do not let Maximize Clicks consume the pilot |

### Paid-order product evidence

Recent pretax line revenue by normalized product cohort:

| Cohort | Latest 28 days | Prior 28 days | Paid-search conclusion |
| --- | ---: | ---: | --- |
| Coroplast signs | 7 orders / 40 units / CA$1,897.02 | 5 / 7 / CA$353.60 | Strongest direct-configurator pilot candidate; one large manual order means scale must still be validated |
| Stickers/labels | 9 / 1,847 / CA$1,742.00 | 6 / 1,062 / CA$737.00 | Strong demand; tightly controlled because 8 of 9 recent orders were manual |
| ACP signs | 2 / 12 / CA$512.00 | 2 / 4 / CA$1,520.00 | High ticket but manual and outlier-prone; later exact/quote cohort |
| Banners/retractables | 2 / 2 / CA$505.00 | 7 / 7 / CA$999.98 | Small exact product test; do not assume past volume will recur |
| Small-format print (flyers, brochures, business cards, postcards) | 7 / 1,200 / CA$502.00 | 4 / 840 / CA$299.00 | More orders but lower value; CPC economics need strict control |

Twenty of the latest 31 orders contained manual items and represented CA$5,342.38, or 80.1% of gross customer charges. Only 11 fully configured orders represented CA$1,323.17. Search growth cannot be managed only as ecommerce checkout; qualified quotes and custom orders must retain click IDs and import revenue when they become paid.

### Measurement reality

- GA4 organic landing snapshot for 2026-06-18 through 2026-07-15: 334 sessions, 221 engaged sessions, 66.17% engagement, and zero organic key events.
- A separate all-channel direct GA4 report for 2026-06-20 through 2026-07-17 found 17 purchases worth CA$3,157.95, all classified as `Unassigned`; the production database contained 31 paid orders worth CA$6,665.55.
- GA4 is useful for landing engagement but is not currently a revenue source of truth.
- Recent order attribution: 20 of 31 unknown/direct; only 10 known external-source orders; zero click-ID orders because paid campaigns have not launched.
- Database click-ID fields and the durable conversion outbox are built. Revenue bidding requires distinct server-side `UPLOAD_CLICKS` actions for `purchase_online` and `quote_won`; their real account IDs and observed imports remain blocked. Browser events are GA4 diagnostics only and never deliver Google Ads revenue.
- Current 30-day first-touch storage can suppress a newer paid click for a returning visitor. Preserve first touch and latest paid touch separately before using internal attribution to judge scale.

## Why budget is not the current growth constraint

The correct-account Keyword Planner forecast at the staged ceilings estimates approximately:

| Campaign | Forecast clicks/day | Forecast cost/day | CPC ceiling |
| --- | ---: | ---: | ---: |
| Core product Search | 0.72 | CA$2.12 | CA$4.00 |
| Exact competitor conquest | 1.89 | CA$2.18 | CA$2.50 |
| Combined | 2.61 | CA$4.30 | — |

That is roughly 78 clicks and CA$129 over 30 days, not a guarantee. Producing 31 additional average orders from 78 clicks would require roughly a 40% paid click-to-order rate. Raising the CA$40 Core or CA$7 Competitor daily budgets cannot manufacture more local high-intent searches. Relevance, query coverage, conversion rate, custom-order attribution, repeat business, and eventually additional proven channels are the scale levers.

The CA$600 promotion is financing, not profit. Exclude promotional credit when calculating CPA and ROAS.

## Campaign architecture

### Tier 1 — controlled demand capture

1. Core product groups remain exact/phrase and route to their exact configurators.
2. Coroplast and stickers are the primary revenue cohorts in reporting.
3. Vinyl banners, retractables, business cards, and flyers remain eligible because forecast volume is sparse, but their spend and paid revenue must be reviewed separately.
4. Competitor conquest remains exact-only and separate. Brand-only competitor terms route to `/why-true-color`.
5. If the search-term report reveals a competitor plus an explicit product, create a dedicated exact keyword and route it directly to the matching configurator.

### Tier 2 — held expansion

- Rush/same-day, generic print pricing, and generic sign-shop ad groups remain paused until Tier 1 measurement reconciles.
- Poster/photo-poster, ACP, and high-value quote cohorts are candidates only after landing and revenue-path review.
- Brand remains paused unless Auction Insights proves material competitor encroachment.

### Explicit holds

- No broad match.
- No Search Partners or Display.
- No Performance Max or Shopping until product identifiers, feed accuracy, live purchase value, and direct-order economics are proven.
- No new location pages.
- No geographic broadening to manufacture volume.

## Budget and bidding controls

- Core: CA$8 average daily budget; CA$4.00 Maximize Clicks ceiling; CA$480 over the 60-day window.
- Competitor: CA$2 average daily budget; CA$2.50 ceiling; CA$120 over the 60-day window.
- Brand: staged at CA$3/day and CA$1.50 ceiling, but held at launch and excluded from the approved pilot spend.
- Qualifying-spend target: CA$600 from July 20 through September 17, 2026. Warning: CA$500. Protective pause: CA$625. Absolute cap: CA$650.
- Google may spend above the average daily budget on an individual day. Cumulative cost must therefore be enforced by the monitor rather than inferred from daily budgets.
- Do not raise budgets unless the campaign is actually budget-limited.
- Do not raise CPC ceilings unless search terms are qualified, paid economics are positive, and lost impression share shows rank—not budget—is restricting proven demand.

Start with Maximize Clicks because there is no clean paid conversion history. Move toward Maximize conversion value only after:

1. transaction-specific CAD values reconcile to paid database orders;
2. duplicate, missing, and late conversions are controlled;
3. values have reported consistently for at least four weeks or three complete conversion cycles;
4. product contribution economics are known;
5. a revised average daily budget and cumulative hard stop are explicitly approved from observed allowable CPA/contribution ROAS; the launch budgets must never carry into the bidding switch by default because Maximize conversion value without a target attempts to spend the available budget.

Only consider Target ROAS after the conversion-tracking level has at least 15 timely value conversions in the previous 30 days, the target can be seeded from actual trailing-30-day contribution economics/ROAS, and the individual Core or Conquest campaign has enough clean signal to support its own strategy. Account-level volume alone does not prove each campaign is ready.

## Conversion hierarchy

Primary bidding conversions:

1. `purchase_online`: paid website purchase uploaded server-side to its own primary `UPLOAD_CLICKS` action with transaction ID, actual pretax CAD value, and original click ID.
2. `quote_won`: quote-linked order only after it becomes paid, uploaded server-side to a distinct primary `UPLOAD_CLICKS` action with its own transaction ID, actual pretax CAD value, and original click ID.

Browser `purchase_online` and `quote_won` events are GA4 diagnostics only. The site must not send direct Google Ads browser conversions; the durable outbox is the sole Ads revenue path.

Secondary, excluded from bidding:

- a duration-qualified phone-call action with a live-read duration threshold and its own account action ID. Raw phone clicks are not qualified calls.

Diagnostic-only actions:

- product-list view;
- product selection;
- configurator start;
- add to cart;
- checkout start;
- phone click;
- directions click;
- reviews click;
- quote submission before qualification/payment.

Diagnostic actions must never be assigned the same optimization weight as paid revenue.

## Launch sequence

### Gate 0 — no public pilot spend

All of these must be evidenced before the separately approved controlled-test activation:

- production `/why-true-color` returns 200, remains noindex, and passes AdsBot/mobile/product-link QA;
- distinct numeric `purchase_online` and `quote_won` `UPLOAD_CLICKS` action IDs are read from the owned account, configured, primary, included in conversions, and validated live;
- a duration-qualified phone-call action and threshold are read back live as secondary and excluded from conversions/bidding;
- Google Ads OAuth is reauthorized and the credential-gated paused-state verifier passes again;
- RSA and manual assets are approved;
- Saskatoon +35 km presence-only, Search-only networks, active customer, final URLs, suffix, budgets, CPC ceilings, and dates pass live preview;
- CA$600 promotion eligibility and exact qualifying terms are confirmed in Billing → Promotions;
- CA$8/CA$2 launch budgets, held Brand state, CA$4.00/CA$2.50 ceilings, September 17 end date, CA$600 target, CA$650 cap, monitoring owner, and pause procedure are explicitly approved;
- mobile landing, configurator, cart, checkout, payment, and confirmation paths pass;
- Enhanced Conversions remains disabled unless purpose-specific customer-data consent/disclosure is approved;
- Brand remains paused without Auction Insights justification.

If the planned start date passes before these gates clear, regenerate the campaign dates through the repository contract. Never enable simply because a calendar date arrived.

### Controlled attribution test — separately approved activation

A real ad-click order cannot be observed while every ad is inactive. After Gate 0 clears, use a deliberately bounded test state before authorizing the public pilot:

1. obtain explicit approval for a temporary Core budget of CA$5/day, a maximum 72-hour window, and a CA$30 cumulative test cap;
2. enable only one Tier 1 exact-product ad group, starting with Coroplast; keep every other campaign, ad group, phrase keyword, and Brand paused;
3. never click the ad internally or ask staff to manufacture a click—wait for genuine eligible demand;
4. stop at the first genuine paid order or at the time/spend cap, whichever occurs first;
5. immediately re-pause and reconcile click ID → database/outbox → paid timestamp/value → the correct distinct Google Ads action; both `purchase_online` and `quote_won` need their own observed proof before public activation;
6. if no genuine paid order occurs, record the test as incomplete rather than weakening the attribution gate;
7. authorize the wider Tier 1 pilot only after both distinct attributable-revenue chains pass and the original approved launch budgets are restored through validate-only plus live readback.

### Cumulative-spend hard-stop mechanism

The CA$650 absolute cap is not enforceable through an end date or a manual glance. Before any controlled or public activation, deploy and prove the following checked-in controls:

- a credentialed API monitor polling exact-account cumulative cost across every campaign at least every 15 minutes in `America/Regina`, with any unexpected enabled campaign treated as unsafe;
- automatic account-wide pause of every enabled campaign at a protective CA$25 threshold during the CA$30 controlled test; during the public pilot, warn at CA$500 and automatically pause every enabled campaign at CA$625, leaving a CA$25 buffer below the CA$650 absolute cap;
- durable operator alert through the lifecycle rollup containing monitor state, spend, action, timestamp, and pause result;
- after exact True Color account verification, fail-closed account-wide pause attempts when spend or campaign state cannot be verified; wrong/unreadable account identity never mutates, and authentication, mutation, or readback failure remains red;
- a tested manual fallback owned by Hasan: if automation is unhealthy, inspect current cumulative spend immediately and keep every campaign paused until monitoring is healthy and the state is reconciled;
- a paused-state simulation/fixture proving threshold detection, pause targeting, alerting, timezone, and idempotency before live use.

The authenticated cron route is deployed behind the Railway-native `google-ads-monitor-cron` service on `*/15 * * * *`; the GitHub Actions schedule remains a backup. Railway Wait for CI is enabled so a failed main-branch check suite is skipped instead of deployed. The controlled activation controller requires exactly three signed in-window execute-mode heartbeats with no gap above 20 minutes, plus warning, verified-pause, and fail-closed evidence. The hard-stop gate remains blocked until that real cadence and Telegram evidence is collected.

### First 14 live days

Review daily:

- spend, status, disapprovals, landing availability, conversion-tag diagnostics;
- search terms, match type, physical location, network, and device;
- click-ID and ValueTrack persistence;
- purchase/quote-won conversion type, distinct action ID, transaction ID, value, currency, payment state, outbox state, and conversion lag;
- mobile funnel drop-off;
- cumulative spend against the hard stop.

Search-term actions:

- irrelevant intent → negative at the narrowest safe level immediately;
- relevant but wrong product → cross-negative and correct routing;
- qualified new term → promote to exact with its best matching landing page;
- low-volume omitted terms → treat as unknown, not proof of zero waste.

Do not run a 50/50 landing experiment at launch; the forecast is underpowered. Establish the baseline first. Then test one variable at a time with paid revenue/CPA declared in advance as the success metric.

## Stop and scale rules

Immediate pause/negative:

- wrong geography or network;
- irrelevant/research/employment/supply intent;
- broken landing, checkout, tag, transaction value, or click-ID path;
- policy issue or unsupported claim;
- duplicate purchase or wrong currency/value.

Economic review after contribution inputs exist:

- pause/review a relevant keyword or cohort when spend reaches its allowable CPA without a paid conversion;
- never use a generic dollar stop unrelated to product economics;
- scale only from confirmed paid purchases or paid qualified orders after normal conversion lag;
- change one material variable at a time and log the hypothesis, date, cohort, result, and rollback.

Weekly revenue review:

- join Ads cost/click IDs to paid orders by campaign, ad group, query, product, device, and landing;
- report paid CVR, CPA, pretax sales ROAS, and contribution ROAS when costs are available;
- compare paid terms with GSC/GA4 demand and order categories;
- feed proven paid purchase terms into SEO only through the protected-page and 28-day evidence gates;
- feed high-impression GSC language into tightly matched RSA tests without assuming impressions equal purchase intent.

## Required business inputs before aggressive scale

For each paid product cohort, record:

- material and ink cost;
- production and finishing labour;
- install, packaging, delivery, and payment fees;
- expected waste, reprints, cancellations, and refunds;
- capacity and turnaround at two-times volume;
- new-versus-returning customer split and repeat/LTV evidence.

Do not use the current engine's placeholder or incomplete cost estimates as paid CAC limits. Historical manual orders cannot be reconstructed reliably from those estimates.

## Combined path to the revenue objective

Paid Search is one part of the growth system:

1. **Capture:** Tier 1 direct-product and exact competitor Search.
2. **Convert:** exact configurators for known product intent; fast chooser for ambiguous competitor intent; mobile checkout friction monitored.
3. **Attribute:** paid website purchase plus paid quote/manual-order revenue; first and latest paid touches preserved.
4. **Expand organic capture:** protect proven pages, improve CTR/query match under the 28-day gate, and publish only real-data templates/projects/comparisons/kits.
5. **Retain:** measure repeat orders and use owned customer channels; paid acquisition should not carry the full doubling target.
6. **Clone proven demand:** after Google produces clean purchase economics, copy only winning exact/phrase cohorts to Microsoft Ads because Bing already appears in real order attribution.

The objective is managed against paid orders, paid pretax sales net of discounts/refunds/cancellations, contribution, and reconciled total settled pretax revenue—not GST/PST-inclusive collections, clicks, impressions, product-card selections, or promotional credit.

## Official operating references

- [Maximize Clicks and bid limits](https://support.google.com/google-ads/answer/6336101?hl=en)
- [Maximize conversion value requirements and budget behavior](https://support.google.com/google-ads/answer/7684216?hl=en)
- [Average daily budgets and overdelivery](https://support.google.com/google-ads/answer/2375454?hl=en)
- [Value bidding and Target ROAS readiness](https://support.google.com/google-ads/answer/15099424?hl=en)
- [Search terms report](https://support.google.com/google-ads/answer/2472708?hl=en_us_us)
- [Enhanced conversions for web](https://support.google.com/google-ads/answer/15712870)
- [Google Ads experiments](https://support.google.com/google-ads/answer/7281575?hl=en)
