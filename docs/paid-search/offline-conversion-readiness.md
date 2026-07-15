# Offline paid-search conversion readiness

Future quote-to-paid and order conversion exports need one of the captured click IDs (`gclid`, `gbraid`, or `wbraid`) plus:

- the True Color quote or order reference;
- the actual conversion timestamp and its timezone;
- currency `CAD`;
- actual paid revenue, not an estimate or unpaid order total.

The first-touch fields are stored on both `quote_requests` and `orders`. A later export must use the timestamp when payment was confirmed, preserve the timezone explicitly, and exclude unpaid/cancelled records.

Offline import remains blocked until the True Color Google Ads account and conversion action exist and their required identifiers are confirmed. Do not hardcode an Ads account ID or conversion label.

Direct browser purchase conversion is disabled unless `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL` contains a valid full destination such as `AW-123456789/example_label`. The matching `AW-...` Google tag destination is configured from that validated value; no account ID is hardcoded.

Enhanced Conversions remain disabled unless `NEXT_PUBLIC_GOOGLE_ADS_ENHANCED_CONVERSIONS_ENABLED` is exactly `true`, the order customer has explicit marketing consent, and a valid email is present. When all gates pass, the browser normalizes and SHA-256 hashes the email with Web Crypto, supplies only the hash through Google tag `user_data`, and then sends the purchase conversion. The hash is never logged or stored.
