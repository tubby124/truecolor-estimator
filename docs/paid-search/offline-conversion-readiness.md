# Offline paid-search conversion readiness

Future quote-to-paid and order conversion exports need one of the captured click IDs (`gclid`, `gbraid`, or `wbraid`) plus:

- the True Color quote or order reference;
- the actual conversion timestamp and its timezone;
- currency `CAD`;
- actual paid revenue, not an estimate or unpaid order total.

The first-touch fields are stored on both `quote_requests` and `orders`. A later export must use the timestamp when payment was confirmed, preserve the timezone explicitly, and exclude unpaid/cancelled records.

The True Color Google Ads child advertiser is confirmed as `107-281-6342` under MCC `112-540-2990`. Offline import remains blocked until the owned conversion action exists, its required identifiers are confirmed, and Google Ads OAuth is reauthorized. Do not hardcode a conversion label.

Direct browser purchase conversion is disabled unless `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL` contains a valid full destination such as `AW-123456789/example_label`. The matching `AW-...` Google tag destination is configured from that validated value; no account ID is hardcoded.

Enhanced Conversions are not dispatched. The checkout marketing checkbox covers promotional email only and is not purpose-specific consent for Google Ads measurement. Wiring `user_data` remains blocked until True Color approves an Ads-measurement disclosure and consent flow and the Google Ads account/conversion action is confirmed. A pure Web Crypto email-normalization/hash helper is retained for future implementation, but production purchase tracking sends no customer data.
