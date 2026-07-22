# Offline paid-search conversion readiness

Future quote-to-paid and order conversion exports need one of the captured click IDs (`gclid`, `gbraid`, or `wbraid`) plus:

- the True Color quote or order reference;
- the actual conversion timestamp and its timezone;
- currency `CAD`;
- actual paid revenue, not an estimate or unpaid order total.

The first-touch fields are stored on both `quote_requests` and `orders`. A later export must use the timestamp when payment was confirmed, preserve the timezone explicitly, and exclude unpaid/cancelled records.

The True Color Google Ads advertiser `107-281-6342` is actively linked under MCC `112-540-2990`. A historical browser purchase action exists in the account, but the site no longer sends direct Google Ads browser conversions and that action is not a launch dependency.

Production revenue imports require two distinct primary actions: `purchase_online` via `GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID` and `quote_won` via `GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID`. Both IDs are intentionally blank until read from the owned account. Each action must be `UPLOAD_CLICKS`, enabled, primary, included in conversions, accept dynamic CAD values, and be proved with a real paid import. Never copy an ID from another advertiser or invent one to clear the gate.

Run the credentialed paused-state verifier with the OAuth/API credentials even while these three action-ID variables are blank. Its `conversionActionInventory` output is the read-only source for selecting the owned-account IDs; blank IDs remain explicit launch blockers until configured and verified.

Browser `purchase_online` and `quote_won` events remain available in GA4 for funnel diagnosis. They have no Google Ads label, optimization role, or revenue-delivery authority. This one-path design prevents confirmation-page reloads and late payment webhooks from creating duplicate Ads conversions.

Qualified calls require a separate duration-qualified Google Ads action supplied through `GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID`. Its duration threshold must be approved and read back live, and the action must remain secondary and excluded from bidding. Raw phone clicks, directions clicks, and reviews clicks are GA4 diagnostics only.

Enhanced Conversions are not dispatched. The checkout marketing checkbox covers promotional email only and is not purpose-specific consent for Google Ads measurement. Wiring `user_data` remains blocked until True Color approves an Ads-measurement disclosure and consent flow and the Google Ads account/conversion action is confirmed. A pure Web Crypto email-normalization/hash helper is retained for future implementation, but production purchase tracking sends no customer data.
