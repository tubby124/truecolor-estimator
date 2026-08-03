-- Read-only weekly paid-search decision surface.
--
-- This migration adds campaign-level auction-share observations to the existing
-- service-role staging table and publishes a derived weekly review view. It does
-- not create any Google Ads mutation, scheduler, approval, or execution path.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.google_ads_daily_metrics
  ADD COLUMN search_impression_share numeric(8,6),
  ADD COLUMN search_rank_lost_impression_share numeric(8,6),
  ADD COLUMN search_budget_lost_impression_share numeric(8,6),
  ADD CONSTRAINT google_ads_daily_metrics_search_impression_share_check CHECK (
    search_impression_share IS NULL
    OR search_impression_share BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT google_ads_daily_metrics_search_rank_lost_is_check CHECK (
    search_rank_lost_impression_share IS NULL
    OR search_rank_lost_impression_share BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT google_ads_daily_metrics_search_budget_lost_is_check CHECK (
    search_budget_lost_impression_share IS NULL
    OR search_budget_lost_impression_share BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT google_ads_daily_metrics_campaign_share_grain_check CHECK (
    entity_type = 'campaign'
    OR (
      search_impression_share IS NULL
      AND search_rank_lost_impression_share IS NULL
      AND search_budget_lost_impression_share IS NULL
    )
  );

-- SELECT * in a PostgreSQL view is expanded when the view is created. Replacing
-- the published view appends the new nullable columns without exposing staging.
CREATE OR REPLACE VIEW public.google_ads_published_daily_metrics
WITH (security_invoker = true, security_barrier = true)
AS
SELECT published.*
FROM public.google_ads_published_daily_metric_rows() AS published;

CREATE OR REPLACE FUNCTION public.google_ads_published_weekly_campaign_rows()
RETURNS TABLE (
  google_ads_customer_id text,
  week_start date,
  week_end date,
  campaign_id text,
  campaign_name text,
  currency_code text,
  weekly_spend_cad numeric,
  actual_daily_spend_cad numeric,
  pilot_actual_daily_spend_cad numeric,
  target_daily_pace_cad numeric,
  impressions bigint,
  clicks bigint,
  bidding_conversions numeric,
  bidding_conversion_value_cad numeric,
  search_impression_share numeric,
  search_rank_lost_impression_share numeric,
  search_budget_lost_impression_share numeric,
  recommended_action text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
WITH weekly_campaign AS (
  SELECT
    metric.google_ads_customer_id,
    date_trunc('week', metric.metric_date)::date AS week_start,
    LEAST(
      date_trunc('week', metric.metric_date)::date + 6,
      DATE '2026-09-16'
    ) AS week_end,
    metric.campaign_id,
    max(metric.campaign_name) AS campaign_name,
    max(metric.currency_code) AS currency_code,
    sum(metric.cost_micros)::numeric / 1000000 AS weekly_spend_cad,
    sum(metric.impressions) AS impressions,
    sum(metric.clicks) AS clicks,
    sum(metric.bidding_conversions) AS bidding_conversions,
    sum(metric.bidding_conversion_value_cad) AS bidding_conversion_value_cad,
    avg(metric.search_impression_share) AS search_impression_share,
    avg(metric.search_rank_lost_impression_share)
      AS search_rank_lost_impression_share,
    avg(metric.search_budget_lost_impression_share)
      AS search_budget_lost_impression_share
  FROM public.google_ads_published_daily_metric_rows() AS metric
  WHERE metric.entity_type = 'campaign'
    AND metric.campaign_id IN ('24048123058', '24048123061')
    AND metric.metric_date BETWEEN DATE '2026-08-03' AND DATE '2026-09-16'
  GROUP BY
    metric.google_ads_customer_id,
    date_trunc('week', metric.metric_date)::date,
    metric.campaign_id
), weekly_pace AS (
  SELECT
    weekly_campaign.*,
    GREATEST(1, week_end - week_start + 1) AS pilot_days_in_week,
    sum(weekly_spend_cad) OVER (
      PARTITION BY google_ads_customer_id, week_start
    ) AS pilot_weekly_spend_cad
  FROM weekly_campaign
), weekly_decision AS (
  SELECT
    weekly_pace.*,
    round(
      weekly_spend_cad / pilot_days_in_week,
      2
    ) AS actual_daily_spend_cad,
    round(
      pilot_weekly_spend_cad / pilot_days_in_week,
      2
    ) AS pilot_actual_daily_spend_cad,
    round(
      600::numeric / ((DATE '2026-09-16' - DATE '2026-08-03') + 1),
      2
    ) AS target_daily_pace_cad
  FROM weekly_pace
)
SELECT
  google_ads_customer_id,
  week_start,
  week_end,
  campaign_id,
  campaign_name,
  currency_code,
  round(weekly_spend_cad, 2) AS weekly_spend_cad,
  actual_daily_spend_cad,
  pilot_actual_daily_spend_cad,
  target_daily_pace_cad,
  impressions,
  clicks,
  bidding_conversions,
  bidding_conversion_value_cad,
  round(search_impression_share, 6) AS search_impression_share,
  round(search_rank_lost_impression_share, 6)
    AS search_rank_lost_impression_share,
  round(search_budget_lost_impression_share, 6)
    AS search_budget_lost_impression_share,
  CASE
    WHEN search_rank_lost_impression_share IS NULL
      OR search_budget_lost_impression_share IS NULL
      THEN 'insufficient auction data; hold current contract'
    WHEN search_rank_lost_impression_share > 0.10
      THEN 'raise CPC ceiling, auctions lost on price'
    WHEN search_budget_lost_impression_share > 0
      THEN 'raise daily budget, budget-limited'
    WHEN search_rank_lost_impression_share <= 0.10
      AND search_budget_lost_impression_share = 0
      AND pilot_actual_daily_spend_cad < target_daily_pace_cad
      THEN 'thin market; bids cannot fix; reach change requires an approved contract change'
    ELSE 'hold current contract; weekly evidence does not support a change'
  END AS recommended_action
FROM weekly_decision;
$$;

CREATE OR REPLACE VIEW public.google_ads_published_weekly_campaign_performance
WITH (security_invoker = true, security_barrier = true)
AS
SELECT published.*
FROM public.google_ads_published_weekly_campaign_rows() AS published;

REVOKE ALL ON TABLE public.google_ads_published_weekly_campaign_performance
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.google_ads_published_weekly_campaign_rows()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.google_ads_published_weekly_campaign_performance
  TO service_role;
GRANT EXECUTE ON FUNCTION public.google_ads_published_weekly_campaign_rows()
  TO service_role;

COMMENT ON COLUMN public.google_ads_daily_metrics.search_impression_share IS
  'Campaign-day Search impression share from the read-only Google Ads report; NULL when unavailable or at a non-campaign grain.';
COMMENT ON COLUMN public.google_ads_daily_metrics.search_rank_lost_impression_share IS
  'Campaign-day Search lost impression share from Ad Rank; NULL when unavailable or at a non-campaign grain.';
COMMENT ON COLUMN public.google_ads_daily_metrics.search_budget_lost_impression_share IS
  'Campaign-day Search lost impression share from budget; NULL when unavailable or at a non-campaign grain.';
COMMENT ON FUNCTION public.google_ads_published_weekly_campaign_rows() IS
  'Service-role-only weekly campaign decision rows for the CA$600 paid-search pilot. The >10% rank threshold is the review definition of high; output is advisory and read-only.';
COMMENT ON VIEW public.google_ads_published_weekly_campaign_performance IS
  'Service-role-only weekly campaign pace, auction-share evidence, and one review recommendation. Brand is excluded because its approved pilot spend cap is zero.';

DO $$
BEGIN
  IF to_regclass(
       'public.google_ads_published_weekly_campaign_performance'
     ) IS NULL THEN
    RAISE EXCEPTION
      'Paid-search weekly decision postcondition failed: published view missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    WHERE relation.oid = 'public.google_ads_daily_metrics'::regclass
      AND relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION
      'Paid-search weekly decision postcondition failed: staging RLS disabled';
  END IF;

  IF has_table_privilege(
       'service_role',
       'public.google_ads_daily_metrics',
       'SELECT'
     ) THEN
    RAISE EXCEPTION
      'Paid-search weekly decision postcondition failed: staging SELECT exposed';
  END IF;

  IF NOT has_table_privilege(
       'service_role',
       'public.google_ads_published_weekly_campaign_performance',
       'SELECT'
     ) THEN
    RAISE EXCEPTION
      'Paid-search weekly decision postcondition failed: published SELECT missing';
  END IF;
END;
$$;
