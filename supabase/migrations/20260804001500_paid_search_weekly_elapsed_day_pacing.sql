-- Count every completed calendar day in a partial pilot week, including days
-- where Google Ads returned no metric row. The latest succeeded sync receipt is
-- the coverage boundary; the published interface and advisory actions are unchanged.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

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
WITH successful_coverage AS (
  SELECT
    sync_run.google_ads_customer_id,
    max(sync_run.date_to) AS completed_through
  FROM public.google_ads_metric_sync_runs AS sync_run
  WHERE sync_run.status = 'succeeded'
  GROUP BY sync_run.google_ads_customer_id
), weekly_campaign AS (
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
    GREATEST(
      1,
      LEAST(
        weekly_campaign.week_end,
        successful_coverage.completed_through,
        DATE '2026-09-16'
      ) - GREATEST(
        weekly_campaign.week_start,
        DATE '2026-08-03'
      ) + 1
    ) AS completed_calendar_days,
    sum(weekly_campaign.weekly_spend_cad) OVER (
      PARTITION BY weekly_campaign.google_ads_customer_id, weekly_campaign.week_start
    ) AS pilot_weekly_spend_cad
  FROM weekly_campaign
  INNER JOIN successful_coverage
    ON successful_coverage.google_ads_customer_id = weekly_campaign.google_ads_customer_id
), weekly_decision AS (
  SELECT
    weekly_pace.*,
    round(
      weekly_spend_cad / completed_calendar_days,
      2
    ) AS actual_daily_spend_cad,
    round(
      pilot_weekly_spend_cad / completed_calendar_days,
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

REVOKE ALL ON FUNCTION public.google_ads_published_weekly_campaign_rows()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.google_ads_published_weekly_campaign_rows()
  TO service_role;

COMMENT ON FUNCTION public.google_ads_published_weekly_campaign_rows() IS
  'Service-role-only weekly paid-search decision rows. Daily pace counts completed calendar days through the latest succeeded sync, including zero-traffic days; recommendations remain advisory and read-only.';

DO $$
BEGIN
  IF has_table_privilege(
       'service_role',
       'public.google_ads_daily_metrics',
       'SELECT'
     ) THEN
    RAISE EXCEPTION
      'Paid-search elapsed-day pacing hardening failed: staging SELECT exposed';
  END IF;

  IF NOT has_function_privilege(
       'service_role',
       'public.google_ads_published_weekly_campaign_rows()',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION
      'Paid-search elapsed-day pacing hardening failed: published function unavailable';
  END IF;
END;
$$;
