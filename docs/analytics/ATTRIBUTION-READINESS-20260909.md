# Attribution readiness — 2026-09-09

Status: repair merged and deployed with production browser continuity/privacy verified; genuine purchase attribution proof remains incomplete. See [release receipt](CONTINUITY-RELEASE-20260909.md). Campaigns stay paused. This report authorizes no spend, settings changes, synthetic events, order creation, payment, replay, or customer communication.

## Verified provider reads

Read at 2026-09-09 21:28 UTC using the canonical Railway-linked checkout and the absolute worktree script path. Window: 30 complete property-time-zone days (August 10–September 8), excluding today. GA4 Data API and identity-guarded Google Ads queries succeeded. Private operational output is outside this public repository; no customer/order identifiers or item descriptions are published here.

| Session acquisition | Sessions | Engaged sessions | Ecommerce purchases | Purchase revenue CAD |
|---|---:|---:|---:|---:|
| Direct | 1,616 | 409 | 0 | 0 |
| Google organic | 458 | 304 | 0 | 0 |
| Google paid search | 328 | 202 | 0 | 0 |
| Unassigned / source not set | 3 | 0 | 52 | 8,625.38 |

All reported purchases fall in Unassigned and desktop. This does not establish the real customer's device or prove the mechanism causing missing attribution. Source investigation separately found two website Clover orders since September 4 missing the three stored GA identifiers; that evidence and these aggregates are consistent with missing browser context, but are not a proven causal join.

Event activity: 84 add_to_cart, 35 begin_checkout and 52 purchase events. These are independent aggregates, not the same users progressing through an ordered funnel; no conversion ratios should be calculated from them. Session-start event count is 2,721 while summed device sessions are 2,718: the legacy report's use of session_start eventCount as sessions was incorrect. It now requests sessions separately without eventName. Historical synthetic traffic is not filtered from the new readiness report and may affect its window.

The new report separately queries first-user acquisition (totalUsers/newUsers), device, landing page, itemName with itemsPurchased/itemRevenue, and event activity. Item names become stable hash aliases in output because manual order lines can contain customer details. Landing paths redact payment/account/order routes and remove query strings. Data API metadata is retained for thresholding/currency/time-zone interpretation.

## Google Ads goals

All three non-removed campaigns are PAUSED. Both purchase_online and quote_won are enabled UPLOAD_CLICKS purchase actions and primary for goals. Website Purchase is enabled but secondary. GA4 purchase is hidden and secondary. Other inspected actions are secondary.

Customer and campaign PURCHASE/WEBSITE goals are biddable; all three campaign goal configurations use CUSTOMER level. No custom goals were returned. This read found no additional primary browser/GA4 purchase action or custom-goal override causing obvious bidding duplication. It does not prove that a single sale cannot reach both primary upload actions: genuine order-level delivery and deduplication evidence remain necessary. Secondary actions can still appear in All conversions; do not sum all actions as unique sales.

GA4 Admin API reads each failed with HTTP 403, PERMISSION_DENIED, reason SERVICE_DISABLED. The authorized owner browser session supplied the following independent readback on September 9, approximately 21:30–21:33 UTC; no settings were changed:

- One web stream, `homepage`, for the canonical public domain; measurement ID `G-6HMQT7MNLL`; data collection active in the past 48 hours. Enhanced measurement enabled. Email redaction active, URL query-key redaction inactive, zero connected site tags.
- Four key events: purchase and generate_lead show stream activity; close_convert_lead and qualify_lead show no stream data. These are GA4 key events, not proof of Ads primary-goal status.
- Reporting attribution: data-driven, paid and organic channels. Acquisition key-event lookback 30 days; other key events 90 days; engaged-view window fixed at 3 days. This setting does not repair missing session identity.
- One completed Google Ads link to the expected True Color account, personalized advertising enabled, linked August 14. No pending approvals/requests.
- Google tag quality reports two unresolved diagnostics: some pages untagged and additional domains detected. Their exact URL/domain lists were not audited here. Intentional payment-page exclusion must not be removed to clear a generic diagnostic. These warnings remain follow-up evidence, not a proven cause of the two missing-context orders.

The Admin API remains disabled, so automated configuration reads still exit incomplete even though the owner UI verified the listed settings.

## Remaining acceptance evidence

For Google PPC, require one genuine future consent-eligible browser purchase after deployment: captured real client/session context reaches the persisted order; its real payment confirmation produces one purchase with correct transaction, CAD value and items; GA4 reports the expected source/session after processing; when a genuine Google Ads click identifier exists, the correct single primary upload action is credited with no duplicate sale across purchase_online/quote_won/browser/GA4 paths. Delivery logs alone are not credited conversion proof. Never invent identifiers or replay old purchases to fill this gap. An organic purchase can prove browser/session continuity but cannot prove Google paid-click attribution.

For future Meta paid traffic, configuration presence alone is insufficient. Verify consent-aware collection, approved source/medium/campaign tagging, genuine click/browser context, Pixel/CAPI event-ID deduplication, matching purchase value/currency, and provider receipt/attribution diagnostics on a genuine future purchase. Meta setup does not clear the Google proof gate; Google proof does not clear Meta. No Meta spend or campaign launch is authorized by this report.

## Reproduce safely

Run `railway run node /absolute/path/to/scripts/google-ads/attribution-readiness.mjs 30` from the canonical linked repository. Redirect output to a private folder outside the public repository. The new script only queries GA4 Data/Admin and Google Ads (OAuth token exchange is authentication); it has no Data Manager probe. Nonzero exit with section errors means incomplete evidence, not an empty successful audit.

Do not run the older paid-funnel-report merely for this audit: it retains a synthetic Data Manager validateOnly probe when enabled. Only its session-count bug was corrected here.

Checks: three mocked Node tests pass for metric-scope separation, pagination/query-only clients, privacy and stable resource aliases; both scripts pass syntax checks. Live reads returned six GA4 reports and all Ads goal sections; four Admin API sections remain blocked, supplemented by the owner UI readback above.

Sources: [GA4 dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema), [Admin attribution settings read](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/getAttributionSettings), [Google Ads conversion goals](https://developers.google.com/google-ads/api/docs/conversions/goals/overview).
