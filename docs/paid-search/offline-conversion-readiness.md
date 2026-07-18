# Offline paid-search conversion readiness

Future quote-to-paid and order conversion exports need one of the captured click IDs (`gclid`, `gbraid`, or `wbraid`) plus:

- the True Color quote or order reference;
- the actual conversion timestamp and its timezone;
- currency `CAD`;
- actual paid revenue, not an estimate or unpaid order total.

The first-touch fields are stored on both `quote_requests` and `orders`. A later export must use the timestamp when payment was confirmed, preserve the timezone explicitly, and exclude unpaid/cancelled records.

The True Color Google Ads advertiser `107-281-6342` is actively linked under MCC `112-540-2990`. Google Ads OAuth was reauthorized on 2026-07-17 and the owned primary purchase action now exists: `Purchase - Website (True Color)`, action `7689029977`, destination `AW-18330693756/F1pQCNmStdIcEPzg4KRE`. Offline imports remain blocked until True Color approves the measurement consent/process, selects a distinct offline action if needed, and verifies Google's current developer-token/import requirements. Do not reuse the browser action for a second conversion event without an explicit measurement design.

Direct browser purchase conversion is disabled until Railway `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL` is set to the verified full destination `AW-18330693756/F1pQCNmStdIcEPzg4KRE`. Set it only with the scheduled site release, then verify a real paid order before campaign activation. The matching `AW-...` Google tag destination is derived from the validated environment value; no account ID is hardcoded.

Enhanced Conversions are not dispatched. The checkout marketing checkbox covers promotional email only and is not purpose-specific consent for Google Ads measurement. Wiring `user_data` remains blocked until True Color approves an Ads-measurement disclosure and consent flow and the Google Ads account/conversion action is confirmed. A pure Web Crypto email-normalization/hash helper is retained for future implementation, but production purchase tracking sends no customer data.
