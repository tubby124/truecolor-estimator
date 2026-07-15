# Offline paid-search conversion readiness

Future quote-to-paid and order conversion exports need one of the captured click IDs (`gclid`, `gbraid`, or `wbraid`) plus:

- the True Color quote or order reference;
- the actual conversion timestamp and its timezone;
- currency `CAD`;
- actual paid revenue, not an estimate or unpaid order total.

The first-touch fields are stored on both `quote_requests` and `orders`. A later export must use the timestamp when payment was confirmed, preserve the timezone explicitly, and exclude unpaid/cancelled records.

Offline import remains blocked until the True Color Google Ads account and conversion action exist and their required identifiers are confirmed. Do not hardcode an Ads account ID or conversion label.

Direct browser purchase conversion is disabled unless `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL` contains a valid full destination such as `AW-123456789/example_label`. Enhanced Conversion email preparation is also disabled unless `NEXT_PUBLIC_GOOGLE_ADS_ENHANCED_CONVERSIONS_ENABLED` is exactly `true` and the customer has explicit marketing consent. The app prepares a normalized SHA-256 email only; it does not send Google Ads `user_data` until the account-specific official tag syntax is confirmed.
