# Qualified Quote Lead Conversion Runbook

1. In Google Ads, create a conversion action named `quote_submit_qualified` (verify in UI).
2. Choose an offline/import conversion using click IDs (`UPLOAD_CLICKS`; verify in UI) and lead category `SUBMIT_LEAD_FORM` (verify in UI).
3. Set its value to no value (verify in UI), count one (verify in UI), and keep it secondary / excluded from Conversions (verify in UI).
4. Record the numeric action ID in `conversionMeasurement.qualifiedQuoteLeadAction.actionId` in `docs/paid-search/campaign-config.mjs` and set Railway `GOOGLE_ADS_QUOTE_LEAD_CONVERSION_ACTION_ID` to the same ID.
5. Confirm the config status is `VERIFIED_LIVE`, then apply `20260816010000_google_ads_quote_lead_outbox.sql` and deploy.
6. Watch paid-funnel report item 3 for `sent`, `retry`, `dead`, and `not_attributable` counts; do not use raw quote volume as an upload count.
7. Keep the action secondary until 10–20 verified paid-click quote submissions are observed and lead quality is acceptable; promote only after that gate is met.

No value is uploaded because a quote submission is not revenue and assigning a synthetic amount would distort bidding data.
It remains secondary while the team verifies that paid-click quote requests represent acceptable leads before optimization uses the signal.
