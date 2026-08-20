-- Live 2026-08-20 conversion graph: Google Ads has materialised the legacy codeless
-- "About Us" PAGE_VIEW action (7688596965) as ENABLED but secondary/excluded. The
-- original paid-search feedback-loop migration incorrectly required that action to be
-- primary. This forward-only repair replaces only that stale attestation constraint.
-- purchase_online and quote_won remain the only primary/included bidding revenue actions.
-- Unknown included/biddable actions are intentionally rejected by the application contract
-- before persistence and by the jsonpath guard below at the receipt boundary.

ALTER TABLE public.google_ads_metric_sync_runs
  DROP CONSTRAINT IF EXISTS google_ads_metric_sync_runs_conversion_goal_attestation_check;

ALTER TABLE public.google_ads_metric_sync_runs
  ADD CONSTRAINT google_ads_metric_sync_runs_conversion_goal_attestation_check CHECK (
    conversion_goal_attestation IS NULL
    OR (
      jsonb_typeof(conversion_goal_attestation) = 'object'
      AND (
        conversion_goal_attestation
        - ARRAY[
          'conversionTracking',
          'conversionActions',
          'customerConversionGoals'
        ]
      ) = '{}'::jsonb
      AND conversion_goal_attestation -> 'conversionTracking' = '{
        "googleAdsConversionCustomer": "customers/1072816342",
        "conversionTrackingStatus": "CONVERSION_TRACKING_MANAGED_BY_SELF",
        "conversionTrackingId": "18330693756",
        "crossAccountConversionTrackingId": null
      }'::jsonb
      AND jsonb_typeof(
        conversion_goal_attestation -> 'conversionActions'
      ) = 'array'
      AND jsonb_array_length(conversion_goal_attestation -> 'conversionActions') BETWEEN 3 AND 100
      AND (conversion_goal_attestation -> 'conversionActions') @> '[{
        "id": "7694360837",
        "name": "purchase_online",
        "status": "ENABLED",
        "category": "PURCHASE",
        "origin": "WEBSITE",
        "ownerCustomer": "customers/1072816342",
        "primaryForGoal": true,
        "includeInConversionsMetric": true
      }]'::jsonb
      AND (conversion_goal_attestation -> 'conversionActions') @> '[{
        "id": "7694360840",
        "name": "quote_won",
        "status": "ENABLED",
        "category": "PURCHASE",
        "origin": "WEBSITE",
        "ownerCustomer": "customers/1072816342",
        "primaryForGoal": true,
        "includeInConversionsMetric": true
      }]'::jsonb
      AND (conversion_goal_attestation -> 'conversionActions') @> '[{
        "id": "7694360843",
        "name": "qualified_call_60s",
        "status": "ENABLED",
        "category": "PHONE_CALL_LEAD",
        "origin": "CALL_FROM_ADS",
        "ownerCustomer": "customers/1072816342",
        "primaryForGoal": false,
        "includeInConversionsMetric": false
      }]'::jsonb
      AND (
        NOT jsonb_path_exists(
          conversion_goal_attestation -> 'conversionActions',
          '$[*] ? (@.id == "7688596965")'
        )
        OR (conversion_goal_attestation -> 'conversionActions') @> '[{
          "id": "7688596965",
          "name": "About Us",
          "status": "ENABLED",
          "category": "PAGE_VIEW",
          "origin": "WEBSITE",
          "ownerCustomer": "customers/1072816342",
          "primaryForGoal": false,
          "includeInConversionsMetric": false
        }]'::jsonb
      )
      AND NOT jsonb_path_exists(
        conversion_goal_attestation -> 'conversionActions',
        '$[*] ? ((@.primaryForGoal == true || @.includeInConversionsMetric == true) && !(@.id == "7694360837" || @.id == "7694360840"))'
      )
      AND jsonb_typeof(
        conversion_goal_attestation -> 'customerConversionGoals'
      ) = 'array'
      AND (conversion_goal_attestation -> 'customerConversionGoals') @> '[
        {"category": "PURCHASE", "origin": "WEBSITE", "biddable": true},
        {
          "category": "PHONE_CALL_LEAD",
          "origin": "CALL_FROM_ADS",
          "biddable": false
        }
      ]'::jsonb
      AND (
        NOT jsonb_path_exists(
          conversion_goal_attestation -> 'customerConversionGoals',
          '$[*] ? (@.category == "PAGE_VIEW" && @.origin == "WEBSITE")'
        )
        OR (conversion_goal_attestation -> 'customerConversionGoals') @> '[
          {"category": "PAGE_VIEW", "origin": "WEBSITE", "biddable": false}
        ]'::jsonb
      )
      AND NOT jsonb_path_exists(
        conversion_goal_attestation -> 'customerConversionGoals',
        '$[*] ? (@.biddable == true && !(@.category == "PURCHASE" && @.origin == "WEBSITE"))'
      )
    )
  );
