-- Read-only paid-search feedback storage.
--
-- This migration creates reporting and a review-only proposal queue. It does not create
-- a trigger, mutation function, scheduler, or approval path that can change
-- Google Ads. Proposals cannot represent approval or execution.
--
-- Revenue and conversion value are CAD pre-tax values (GST/PST excluded).
-- Page views, cart activity, and submitted quotes are observation signals only;
-- they are not Google Ads bidding conversions.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.google_ads_metric_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_token uuid NOT NULL DEFAULT gen_random_uuid(),
  google_ads_customer_id text NOT NULL,
  idempotency_key text NOT NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'succeeded', 'partial', 'failed')
  ),
  campaign_rows integer NOT NULL DEFAULT 0 CHECK (campaign_rows >= 0),
  ad_group_rows integer NOT NULL DEFAULT 0 CHECK (ad_group_rows >= 0),
  keyword_rows integer NOT NULL DEFAULT 0 CHECK (keyword_rows >= 0),
  search_term_rows integer NOT NULL DEFAULT 0 CHECK (search_term_rows >= 0),
  proposal_rows integer NOT NULL DEFAULT 0 CHECK (proposal_rows >= 0),
  verified_currency_code text,
  verified_time_zone text,
  canonical_campaign_inventory jsonb,
  conversion_goal_attestation jsonb,
  search_term_disclosure_summary jsonb,
  error_detail text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_ads_metric_sync_runs_exact_account_check CHECK (
    google_ads_customer_id = '1072816342'
  ),
  CONSTRAINT google_ads_metric_sync_runs_idempotency_key_check CHECK (
    btrim(idempotency_key) <> '' AND length(idempotency_key) <= 200
  ),
  CONSTRAINT google_ads_metric_sync_runs_date_range_check CHECK (
    date_from <= date_to
  ),
  CONSTRAINT google_ads_metric_sync_runs_currency_attestation_check CHECK (
    verified_currency_code IS NULL OR verified_currency_code = 'CAD'
  ),
  CONSTRAINT google_ads_metric_sync_runs_time_zone_attestation_check CHECK (
    verified_time_zone IS NULL OR verified_time_zone = 'America/Regina'
  ),
  CONSTRAINT google_ads_metric_sync_runs_campaign_attestation_check CHECK (
    canonical_campaign_inventory IS NULL
    OR (
      jsonb_typeof(canonical_campaign_inventory) = 'array'
      AND jsonb_array_length(canonical_campaign_inventory) = 3
      AND canonical_campaign_inventory @> '[{
        "id": "24048123058",
        "name": "GOOG_Search_TC_CoreProducts_2026"
      }]'::jsonb
      AND canonical_campaign_inventory @> '[{
        "id": "24048123061",
        "name": "GOOG_Search_TC_CompetitorConquest_2026"
      }]'::jsonb
      AND canonical_campaign_inventory @> '[{
        "id": "24048123064",
        "name": "GOOG_Search_TC_BrandDefense_2026",
        "status": "PAUSED"
      }]'::jsonb
      AND (
        canonical_campaign_inventory @> '[{
          "id": "24048123058",
          "status": "PAUSED"
        }]'::jsonb
        OR canonical_campaign_inventory @> '[{
          "id": "24048123058",
          "status": "ENABLED"
        }]'::jsonb
      )
      AND (
        canonical_campaign_inventory @> '[{
          "id": "24048123061",
          "status": "PAUSED"
        }]'::jsonb
        OR canonical_campaign_inventory @> '[{
          "id": "24048123061",
          "status": "ENABLED"
        }]'::jsonb
      )
    )
  ),
  CONSTRAINT google_ads_metric_sync_runs_conversion_goal_attestation_check CHECK (
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
      AND jsonb_array_length(
        conversion_goal_attestation -> 'conversionActions'
      ) BETWEEN 4 AND 100
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
      AND (conversion_goal_attestation -> 'conversionActions') @> '[{
        "id": "7688596965",
        "name": "About Us",
        "status": "ENABLED",
        "category": "PAGE_VIEW",
        "origin": "WEBSITE",
        "ownerCustomer": "customers/1072816342",
        "primaryForGoal": true,
        "includeInConversionsMetric": false
      }]'::jsonb
      AND jsonb_typeof(
        conversion_goal_attestation -> 'customerConversionGoals'
      ) = 'array'
      AND (conversion_goal_attestation -> 'customerConversionGoals') @> '[
        {"category": "PURCHASE", "origin": "WEBSITE", "biddable": true},
        {"category": "PAGE_VIEW", "origin": "WEBSITE", "biddable": false},
        {
          "category": "PHONE_CALL_LEAD",
          "origin": "CALL_FROM_ADS",
          "biddable": false
        }
      ]'::jsonb
    )
  ),
  CONSTRAINT google_ads_metric_sync_runs_disclosure_attestation_check CHECK (
    search_term_disclosure_summary IS NULL
    OR (
      jsonb_typeof(search_term_disclosure_summary) = 'object'
      AND (
        search_term_disclosure_summary
        - ARRAY[
          'account_clicks',
          'disclosed_search_term_clicks',
          'undisclosed_search_terms'
        ]
      ) = '{}'::jsonb
      AND jsonb_typeof(
        search_term_disclosure_summary -> 'account_clicks'
      ) = 'string'
      AND (
        search_term_disclosure_summary ->> 'account_clicks'
      ) ~ '^[0-9]+$'
      AND jsonb_typeof(
        search_term_disclosure_summary -> 'disclosed_search_term_clicks'
      ) = 'string'
      AND (
        search_term_disclosure_summary ->> 'disclosed_search_term_clicks'
      ) ~ '^[0-9]+$'
      AND jsonb_typeof(
        search_term_disclosure_summary -> 'undisclosed_search_terms'
      ) = 'string'
      AND (
        search_term_disclosure_summary ->> 'undisclosed_search_terms'
      ) = 'UNKNOWN'
    )
  ),
  CONSTRAINT google_ads_metric_sync_runs_completion_check CHECK (
    (
      status = 'running'
      AND completed_at IS NULL
      AND verified_currency_code IS NULL
      AND verified_time_zone IS NULL
      AND canonical_campaign_inventory IS NULL
      AND conversion_goal_attestation IS NULL
      AND search_term_disclosure_summary IS NULL
    )
    OR
    (
      status = 'succeeded'
      AND completed_at IS NOT NULL
      AND verified_currency_code IS NOT NULL
      AND verified_time_zone IS NOT NULL
      AND canonical_campaign_inventory IS NOT NULL
      AND conversion_goal_attestation IS NOT NULL
      AND search_term_disclosure_summary IS NOT NULL
    )
    OR
    (
      status IN ('partial', 'failed')
      AND completed_at IS NOT NULL
      AND verified_currency_code IS NULL
      AND verified_time_zone IS NULL
      AND canonical_campaign_inventory IS NULL
      AND conversion_goal_attestation IS NULL
      AND search_term_disclosure_summary IS NULL
    )
  ),
  CONSTRAINT google_ads_metric_sync_runs_id_account_uidx
    UNIQUE (id, google_ads_customer_id),
  CONSTRAINT google_ads_metric_sync_runs_account_idempotency_uidx
    UNIQUE (google_ads_customer_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS google_ads_metric_sync_runs_freshness_idx
  ON public.google_ads_metric_sync_runs (
    google_ads_customer_id,
    completed_at DESC
  )
  WHERE status = 'succeeded';

CREATE INDEX IF NOT EXISTS google_ads_metric_sync_runs_audit_idx
  ON public.google_ads_metric_sync_runs (
    google_ads_customer_id,
    started_at DESC
  );

CREATE TABLE IF NOT EXISTS public.google_ads_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL,
  attempt_token uuid NOT NULL,
  google_ads_customer_id text NOT NULL,
  metric_date date NOT NULL,
  entity_type text NOT NULL CHECK (
    entity_type IN ('campaign', 'ad_group', 'keyword', 'search_term')
  ),
  entity_key text NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  ad_group_id text,
  ad_group_name text,
  keyword_criterion_id text,
  keyword_text text,
  keyword_match_type text,
  search_term text,
  currency_code text NOT NULL DEFAULT 'CAD' CHECK (currency_code = 'CAD'),
  impressions bigint NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks bigint NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  cost_micros bigint NOT NULL DEFAULT 0 CHECK (cost_micros >= 0),
  bidding_conversions numeric(18,6) NOT NULL DEFAULT 0
    CHECK (bidding_conversions >= 0),
  bidding_conversion_value_cad numeric(18,2) NOT NULL DEFAULT 0
    CHECK (bidding_conversion_value_cad >= 0),
  paid_orders integer NOT NULL DEFAULT 0 CHECK (paid_orders >= 0),
  pretax_revenue_cad numeric(18,2) NOT NULL DEFAULT 0
    CHECK (pretax_revenue_cad >= 0),
  observed_page_views integer NOT NULL DEFAULT 0
    CHECK (observed_page_views >= 0),
  observed_cart_events integer NOT NULL DEFAULT 0
    CHECK (observed_cart_events >= 0),
  observed_submitted_quotes integer NOT NULL DEFAULT 0
    CHECK (observed_submitted_quotes >= 0),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_ads_daily_metrics_exact_account_check CHECK (
    google_ads_customer_id = '1072816342'
  ),
  CONSTRAINT google_ads_daily_metrics_entity_key_check CHECK (
    btrim(entity_key) <> ''
  ),
  CONSTRAINT google_ads_daily_metrics_campaign_id_check CHECK (
    btrim(campaign_id) <> ''
  ),
  CONSTRAINT google_ads_daily_metrics_grain_check CHECK (
    (
      entity_type = 'campaign'
      AND ad_group_id IS NULL
      AND ad_group_name IS NULL
      AND keyword_criterion_id IS NULL
      AND keyword_text IS NULL
      AND keyword_match_type IS NULL
      AND search_term IS NULL
    )
    OR (
      entity_type = 'ad_group'
      AND ad_group_id IS NOT NULL
      AND btrim(ad_group_id) <> ''
      AND ad_group_name IS NOT NULL
      AND btrim(ad_group_name) <> ''
      AND keyword_criterion_id IS NULL
      AND keyword_text IS NULL
      AND keyword_match_type IS NULL
      AND search_term IS NULL
    )
    OR (
      entity_type = 'keyword'
      AND ad_group_id IS NOT NULL
      AND btrim(ad_group_id) <> ''
      AND ad_group_name IS NOT NULL
      AND btrim(ad_group_name) <> ''
      AND keyword_criterion_id IS NOT NULL
      AND btrim(keyword_criterion_id) <> ''
      AND keyword_text IS NOT NULL
      AND btrim(keyword_text) <> ''
      AND keyword_match_type IS NOT NULL
      AND btrim(keyword_match_type) <> ''
      AND search_term IS NULL
    )
    OR (
      entity_type = 'search_term'
      AND ad_group_id IS NOT NULL
      AND btrim(ad_group_id) <> ''
      AND ad_group_name IS NOT NULL
      AND btrim(ad_group_name) <> ''
      AND keyword_criterion_id IS NULL
      AND keyword_text IS NULL
      AND keyword_match_type IS NULL
      AND search_term IS NOT NULL
      AND btrim(search_term) <> ''
    )
  ),
  CONSTRAINT google_ads_daily_metrics_sync_account_fk
    FOREIGN KEY (sync_run_id, google_ads_customer_id)
    REFERENCES public.google_ads_metric_sync_runs(id, google_ads_customer_id)
    ON DELETE RESTRICT,
  CONSTRAINT google_ads_daily_metrics_run_day_entity_uidx
    UNIQUE (
      sync_run_id,
      attempt_token,
      google_ads_customer_id,
      metric_date,
      entity_type,
      entity_key
    )
);

CREATE INDEX IF NOT EXISTS google_ads_daily_metrics_rollup_idx
  ON public.google_ads_daily_metrics (
    google_ads_customer_id,
    metric_date DESC,
    entity_type
  );

CREATE INDEX IF NOT EXISTS google_ads_daily_metrics_sync_account_idx
  ON public.google_ads_daily_metrics (
    sync_run_id,
    google_ads_customer_id,
    attempt_token
  );

CREATE INDEX IF NOT EXISTS google_ads_daily_metrics_campaign_rollup_idx
  ON public.google_ads_daily_metrics (
    google_ads_customer_id,
    campaign_id,
    metric_date DESC
  );

CREATE INDEX IF NOT EXISTS google_ads_daily_metrics_freshness_idx
  ON public.google_ads_daily_metrics (
    google_ads_customer_id,
    fetched_at DESC
  );

CREATE TABLE IF NOT EXISTS public.google_ads_optimization_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL,
  attempt_token uuid NOT NULL,
  google_ads_customer_id text NOT NULL,
  proposal_key text NOT NULL,
  evidence_date_from date NOT NULL,
  evidence_date_to date NOT NULL,
  entity_type text NOT NULL CHECK (
    entity_type IN ('account', 'campaign', 'ad_group', 'keyword', 'search_term')
  ),
  entity_key text NOT NULL,
  recommendation_type text NOT NULL CHECK (
    recommendation_type IN (
      'negative_keyword_review',
      'exact_keyword_review',
      'search_term_review'
    )
  ),
  rationale text NOT NULL,
  evidence jsonb NOT NULL CHECK (
    jsonb_typeof(evidence) = 'object'
    AND (
      evidence
      - ARRAY[
        'review_only',
        'proposal_type',
        'disclosed_search_term',
        'evidence'
      ]
    ) = '{}'::jsonb
    AND evidence @> '{"review_only": true}'::jsonb
    AND jsonb_typeof(evidence -> 'proposal_type') = 'string'
    AND (
      evidence ->> 'proposal_type'
    ) IN (
      'NEGATIVE_KEYWORD_REVIEW',
      'PROMOTE_EXACT_REVIEW',
      'SEARCH_TERM_REVIEW'
    )
    AND jsonb_typeof(evidence -> 'disclosed_search_term') = 'string'
    AND btrim(evidence ->> 'disclosed_search_term') <> ''
    AND jsonb_typeof(evidence -> 'evidence') = 'object'
    AND (
      (evidence -> 'evidence')
      - ARRAY[
        'clicks',
        'cost_micros',
        'conversions',
        'conversion_value_cad',
        'targeting_status'
      ]
    ) = '{}'::jsonb
    AND jsonb_typeof(evidence -> 'evidence' -> 'clicks') = 'string'
    AND (
      evidence -> 'evidence' ->> 'clicks'
    ) ~ '^[0-9]+$'
    AND jsonb_typeof(evidence -> 'evidence' -> 'cost_micros') = 'string'
    AND (
      evidence -> 'evidence' ->> 'cost_micros'
    ) ~ '^[0-9]+$'
    AND jsonb_typeof(evidence -> 'evidence' -> 'conversions') = 'number'
    AND jsonb_typeof(
      evidence -> 'evidence' -> 'conversion_value_cad'
    ) = 'number'
    AND jsonb_typeof(evidence -> 'evidence' -> 'targeting_status') = 'string'
    AND evidence::text !~* '"(operations|resource_?name|update_?mask|mutate|create|remove)"[[:space:]]*:'
  ),
  status text NOT NULL DEFAULT 'pending_review' CHECK (
    status = 'pending_review'
  ),
  execution_state text NOT NULL DEFAULT 'review_only' CHECK (
    execution_state = 'review_only'
  ),
  requires_human_review boolean NOT NULL DEFAULT true CHECK (
    requires_human_review
  ),
  auto_apply boolean NOT NULL DEFAULT false CHECK (
    NOT auto_apply
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_ads_optimization_proposals_exact_account_check CHECK (
    google_ads_customer_id = '1072816342'
  ),
  CONSTRAINT google_ads_optimization_proposals_key_check CHECK (
    btrim(proposal_key) <> '' AND length(proposal_key) <= 200
  ),
  CONSTRAINT google_ads_optimization_proposals_evidence_range_check CHECK (
    evidence_date_from <= evidence_date_to
  ),
  CONSTRAINT google_ads_optimization_proposals_entity_key_check CHECK (
    btrim(entity_key) <> ''
  ),
  CONSTRAINT google_ads_optimization_proposals_rationale_check CHECK (
    btrim(rationale) <> ''
  ),
  CONSTRAINT google_ads_optimization_proposals_sync_account_fk
    FOREIGN KEY (sync_run_id, google_ads_customer_id)
    REFERENCES public.google_ads_metric_sync_runs(id, google_ads_customer_id)
    ON DELETE RESTRICT,
  CONSTRAINT google_ads_optimization_proposals_run_key_uidx
    UNIQUE (
      sync_run_id,
      attempt_token,
      google_ads_customer_id,
      proposal_key
    )
);

CREATE INDEX IF NOT EXISTS google_ads_optimization_proposals_review_queue_idx
  ON public.google_ads_optimization_proposals (
    sync_run_id,
    google_ads_customer_id,
    attempt_token,
    created_at DESC
  )
  WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS google_ads_optimization_proposals_evidence_idx
  ON public.google_ads_optimization_proposals (
    google_ads_customer_id,
    evidence_date_to DESC
  );

CREATE OR REPLACE FUNCTION public.google_ads_published_daily_metric_rows()
RETURNS SETOF public.google_ads_daily_metrics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
SELECT DISTINCT ON (
  metric.google_ads_customer_id,
  metric.metric_date,
  metric.entity_type,
  metric.entity_key
)
  metric.*
FROM public.google_ads_daily_metrics AS metric
JOIN public.google_ads_metric_sync_runs AS sync_run
  ON sync_run.id = metric.sync_run_id
  AND sync_run.google_ads_customer_id = metric.google_ads_customer_id
  AND sync_run.attempt_token = metric.attempt_token
WHERE sync_run.status = 'succeeded'
ORDER BY
  metric.google_ads_customer_id,
  metric.metric_date,
  metric.entity_type,
  metric.entity_key,
  sync_run.completed_at DESC,
  sync_run.id DESC;
$$;

CREATE OR REPLACE FUNCTION public.google_ads_published_proposal_rows()
RETURNS SETOF public.google_ads_optimization_proposals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
SELECT DISTINCT ON (
  proposal.google_ads_customer_id,
  proposal.proposal_key
)
  proposal.*
FROM public.google_ads_optimization_proposals AS proposal
JOIN public.google_ads_metric_sync_runs AS sync_run
  ON sync_run.id = proposal.sync_run_id
  AND sync_run.google_ads_customer_id = proposal.google_ads_customer_id
  AND sync_run.attempt_token = proposal.attempt_token
WHERE sync_run.status = 'succeeded'
ORDER BY
  proposal.google_ads_customer_id,
  proposal.proposal_key,
  sync_run.completed_at DESC,
  sync_run.id DESC;
$$;

CREATE OR REPLACE VIEW public.google_ads_published_daily_metrics
WITH (security_invoker = true, security_barrier = true)
AS
SELECT published.*
FROM public.google_ads_published_daily_metric_rows() AS published;

CREATE OR REPLACE VIEW public.google_ads_published_optimization_proposals
WITH (security_invoker = true, security_barrier = true)
AS
SELECT published.*
FROM public.google_ads_published_proposal_rows() AS published;

ALTER TABLE public.google_ads_metric_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_optimization_proposals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.google_ads_metric_sync_runs
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.google_ads_daily_metrics
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.google_ads_optimization_proposals
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.google_ads_published_daily_metrics
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.google_ads_published_optimization_proposals
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.google_ads_published_daily_metric_rows()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.google_ads_published_proposal_rows()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.google_ads_metric_sync_runs
  TO service_role;
GRANT INSERT, UPDATE ON TABLE public.google_ads_daily_metrics
  TO service_role;
GRANT INSERT, UPDATE ON TABLE public.google_ads_optimization_proposals
  TO service_role;
GRANT SELECT ON TABLE public.google_ads_published_daily_metrics
  TO service_role;
GRANT SELECT ON TABLE public.google_ads_published_optimization_proposals
  TO service_role;
GRANT EXECUTE ON FUNCTION public.google_ads_published_daily_metric_rows()
  TO service_role;
GRANT EXECUTE ON FUNCTION public.google_ads_published_proposal_rows()
  TO service_role;

COMMENT ON TABLE public.google_ads_metric_sync_runs IS
  'Service-role-only per-run audit for idempotent Google Ads daily metric syncs and historical backfills.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.google_ads_customer_id IS
  'Exact True Color Google Ads client customer ID 1072816342; never the manager/login customer ID.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.idempotency_key IS
  'Caller-stable exact-account/date-range key. One logical receipt serializes identical calls; failed retries rotate attempt_token.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.attempt_token IS
  'Current staging generation. Failed retries rotate this token so abandoned child rows can never become published.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.verified_currency_code IS
  'Succeeded-run attestation that the exact Google Ads account reported CAD.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.verified_time_zone IS
  'Succeeded-run attestation that the exact Google Ads account reported America/Regina.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.canonical_campaign_inventory IS
  'Succeeded-run attestation of the three validated canonical campaign IDs, names, and allowed states.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.conversion_goal_attestation IS
  'Succeeded-run self-owned conversion tracking, exact action ownership/flags, and customer-goal bidding proof.';
COMMENT ON COLUMN public.google_ads_metric_sync_runs.search_term_disclosure_summary IS
  'Succeeded-run search-term privacy attestation: account clicks, disclosed clicks, and UNKNOWN undisclosed terms.';

COMMENT ON TABLE public.google_ads_daily_metrics IS
  'Service-role-only per-attempt staging for daily campaign, ad-group, keyword, and search-term feedback. Read current data through google_ads_published_daily_metrics.';
COMMENT ON COLUMN public.google_ads_daily_metrics.google_ads_customer_id IS
  'Exact True Color Google Ads client customer ID 1072816342, constrained to prevent cross-account metric mixing.';
COMMENT ON COLUMN public.google_ads_daily_metrics.entity_key IS
  'Stable caller-generated grain key: campaign ID; campaign/ad-group IDs; campaign/ad-group/criterion IDs; or campaign/ad-group plus exact normalized search term.';
COMMENT ON COLUMN public.google_ads_daily_metrics.bidding_conversions IS
  'Primary Google Ads bidding conversions only. Page views, carts, and submitted quotes must not be counted here.';
COMMENT ON COLUMN public.google_ads_daily_metrics.bidding_conversion_value_cad IS
  'Google Ads bidding conversion value in CAD pre-tax; excludes GST and PST.';
COMMENT ON COLUMN public.google_ads_daily_metrics.pretax_revenue_cad IS
  'Attributed paid revenue in CAD pre-tax; excludes GST and PST.';
COMMENT ON COLUMN public.google_ads_daily_metrics.observed_page_views IS
  'Observation signal only; page views are not bidding conversions.';
COMMENT ON COLUMN public.google_ads_daily_metrics.observed_cart_events IS
  'Observation signal only; cart activity is not a bidding conversion.';
COMMENT ON COLUMN public.google_ads_daily_metrics.observed_submitted_quotes IS
  'Observation signal only; submitted quotes are not bidding conversions.';

COMMENT ON TABLE public.google_ads_optimization_proposals IS
  'Service-role-only per-attempt pending-review evidence staging. Read current proposals through google_ads_published_optimization_proposals.';
COMMENT ON COLUMN public.google_ads_optimization_proposals.evidence IS
  'Review-only evidence with mutation-shaped keys rejected at the database boundary.';
COMMENT ON COLUMN public.google_ads_optimization_proposals.auto_apply IS
  'Invariant false: proposals cannot authorize automatic Google Ads mutation.';
COMMENT ON VIEW public.google_ads_published_daily_metrics IS
  'Service-role-only current metrics from succeeded sync attempts; failed/partial staging and superseded successful rows are excluded.';
COMMENT ON VIEW public.google_ads_published_optimization_proposals IS
  'Service-role-only current review evidence from succeeded sync attempts; failed/partial staging and superseded successful rows are excluded.';

DO $$
BEGIN
  IF to_regclass('public.google_ads_metric_sync_runs') IS NULL
     OR to_regclass('public.google_ads_daily_metrics') IS NULL
     OR to_regclass('public.google_ads_optimization_proposals') IS NULL
     OR to_regclass('public.google_ads_published_daily_metrics') IS NULL
     OR to_regclass(
       'public.google_ads_published_optimization_proposals'
     ) IS NULL THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: relation missing';
  END IF;

  IF to_regprocedure(
       'public.google_ads_published_daily_metric_rows()'
     ) IS NULL
     OR to_regprocedure(
       'public.google_ads_published_proposal_rows()'
     ) IS NULL THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: row source missing';
  END IF;

  IF to_regclass('public.google_ads_optimization_action_ledger') IS NOT NULL THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: action ledger must not exist';
  END IF;

  IF to_regclass('public.google_ads_daily_metrics_sync_account_idx') IS NULL THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: child account index missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY[
      'google_ads_metric_sync_runs_exact_account_check',
      'google_ads_metric_sync_runs_completion_check',
      'google_ads_metric_sync_runs_conversion_goal_attestation_check',
      'google_ads_metric_sync_runs_id_account_uidx',
      'google_ads_daily_metrics_exact_account_check',
      'google_ads_daily_metrics_grain_check',
      'google_ads_daily_metrics_sync_account_fk',
      'google_ads_daily_metrics_run_day_entity_uidx',
      'google_ads_optimization_proposals_exact_account_check',
      'google_ads_optimization_proposals_sync_account_fk',
      'google_ads_optimization_proposals_run_key_uidx',
      'google_ads_optimization_proposals_recommendation_type_check',
      'google_ads_optimization_proposals_evidence_check',
      'google_ads_optimization_proposals_status_check',
      'google_ads_optimization_proposals_execution_state_check',
      'google_ads_optimization_proposals_requires_human_review_check',
      'google_ads_optimization_proposals_auto_apply_check'
    ]) AS required(conname)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_constraint actual
      WHERE actual.conname = required.conname
        AND actual.conrelid IN (
          'public.google_ads_metric_sync_runs'::regclass,
          'public.google_ads_daily_metrics'::regclass,
          'public.google_ads_optimization_proposals'::regclass
        )
    )
  ) THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: safety constraint missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN (
        'google_ads_metric_sync_runs',
        'google_ads_daily_metrics',
        'google_ads_optimization_proposals'
      )
      AND NOT relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: RLS is not enabled';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'google_ads_metric_sync_runs',
        'google_ads_daily_metrics',
        'google_ads_optimization_proposals'
      )
  ) THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: API policy must not exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN (
        'google_ads_published_daily_metrics',
        'google_ads_published_optimization_proposals'
      )
      AND (
        relation.relkind <> 'v'
        OR NOT (
          'security_invoker=true' = ANY (
            coalesce(relation.reloptions, ARRAY[]::text[])
          )
        )
        OR NOT (
          'security_barrier=true' = ANY (
            coalesce(relation.reloptions, ARRAY[]::text[])
          )
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: published view is unsafe';
  END IF;

  IF has_table_privilege(
    'anon',
    'public.google_ads_published_daily_metrics',
    'SELECT'
  ) OR has_table_privilege(
    'authenticated',
    'public.google_ads_published_daily_metrics',
    'SELECT'
  ) OR has_table_privilege(
    'anon',
    'public.google_ads_published_optimization_proposals',
    'SELECT'
  ) OR has_table_privilege(
    'authenticated',
    'public.google_ads_published_optimization_proposals',
    'SELECT'
  ) OR has_table_privilege(
    'service_role',
    'public.google_ads_daily_metrics',
    'SELECT'
  ) OR has_table_privilege(
    'service_role',
    'public.google_ads_optimization_proposals',
    'SELECT'
  ) OR has_table_privilege(
    'service_role',
    'public.google_ads_optimization_proposals',
    'DELETE'
  ) OR NOT has_table_privilege(
    'service_role',
    'public.google_ads_published_daily_metrics',
    'SELECT'
  ) OR NOT has_table_privilege(
    'service_role',
    'public.google_ads_published_optimization_proposals',
    'SELECT'
  ) OR has_function_privilege(
    'anon',
    'public.google_ads_published_daily_metric_rows()',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.google_ads_published_daily_metric_rows()',
    'EXECUTE'
  ) OR has_function_privilege(
    'anon',
    'public.google_ads_published_proposal_rows()',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.google_ads_published_proposal_rows()',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.google_ads_published_daily_metric_rows()',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.google_ads_published_proposal_rows()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'Paid-search feedback schema postcondition failed: published ACL is unsafe';
  END IF;
END
$$;
