# Paid-search revenue conversion readiness

True Color sends paid revenue through the Google Data Manager API. The previous Google Ads API `UploadClickConversions` path is prohibited for this developer token as of the June 2026 restriction and must not be restored.

## Production contract

- Advertiser / operating account: `1072816342`
- Login manager: `1125402990`
- `purchase_online` destination: `7694360837`
- `quote_won` destination: `7694360840`
- Both destinations are enabled `UPLOAD_CLICKS`, primary, included in conversions, dynamic CAD, and `MANY_PER_CLICK`.
- Historical browser purchase `7689029977` is secondary and excluded.
- `qualified_call_60s` is secondary, excluded, and non-biddable.

Each paid order supplies exactly one of `gclid`, `gbraid`, or `wbraid`, the stable order number as `transactionId`, the confirmed payment time as RFC 3339, currency `CAD`, and actual pretax revenue (`total - GST - PST`). `purchase_online` and `quote_won` are mutually exclusive classifications.

The Data Manager API uses a separate refresh token with the `https://www.googleapis.com/auth/datamanager` scope. It also requires `GOOGLE_DATA_MANAGER_PROJECT_ID` for the Google Cloud quota project. The Google Ads refresh token remains separate so spend monitoring cannot be interrupted by conversion-delivery credential changes.

## Asynchronous delivery

A successful `events:ingest` response only acknowledges submission and returns a Data Manager `requestId`. The outbox remains `submitted` until diagnostics confirm delivery:

1. Ingest one order and one destination per request.
2. Store the request ID and schedule the first diagnostics check after 30 minutes.
3. Poll with 1.3× backoff capped at 60 minutes for at most 24 hours.
4. Mark `sent` only when the exact True Color destination returns `SUCCESS` with one record, or when the only final error is `PROCESSING_ERROR_REASON_DUPLICATE_TRANSACTION_ID`.
5. Keep processing requests submitted; surface all other failures for retry/dead-letter reconciliation.

Local uniqueness on order ID and `(order_number, conversion_type)` plus Google `transactionId` deduplication protect crash/retry paths. A duplicate GCLID is not treated as delivered.

## Launch gates

The following must all pass before any campaign is enabled:

- Data Manager API enabled in Google Cloud project `104043984345`.
- Separate Data Manager OAuth token installed in Railway with Data Manager scope.
- `GOOGLE_DATA_MANAGER_PROJECT_ID` installed in Railway.
- Live `validateOnly: true` request accepted for both conversion destinations.
- Additive outbox/diagnostics migration rehearsed, reviewed, and applied.
- One genuine catalog purchase reaches final diagnostics `SUCCESS` and reconciles to Supabase.
- One genuine quote-linked payment reaches final diagnostics `SUCCESS` as `quote_won`.

Browser funnel events remain GA4 diagnostics only. No customer user data or hardcoded consent is sent to Data Manager; the integration relies solely on the captured Google click identifier.
