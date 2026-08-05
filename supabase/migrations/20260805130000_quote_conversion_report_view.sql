-- Canonical read surface for quote funnel reporting.
--
-- Query this view, never quote_requests.lifecycle_status directly:
-- lifecycle_status = 'quoted' only means a reply was marked sent. It does NOT
-- mean a price was quoted, and its absence does NOT mean the lead did not buy.
--
-- On 2026-08-05 a funnel read against the raw table concluded "23 quotes, 0
-- converted, the pipeline is leaking". The real number was 7 conversions worth
-- $926 in that window; the conversions were simply never attributed. This view
-- exists so that misread cannot repeat.

CREATE OR REPLACE VIEW public.quote_conversion_report AS
SELECT
  q.id,
  q.created_at,
  q.name,
  q.email,
  q.lifecycle_status,
  q.is_archived,
  (q.replied_at IS NOT NULL) AS was_replied,
  (q.quote_total_cents IS NOT NULL) AS was_priced,
  (q.converted_order_id IS NOT NULL) AS did_convert,
  q.attribution_method,
  q.quote_total_cents,
  q.won_at,
  q.converted_at,
  o.order_number AS converted_order_number,
  o.total AS converted_order_total,
  o.paid_at AS converted_order_paid_at
FROM public.quote_requests q
LEFT JOIN public.orders o
  ON o.id = q.converted_order_id;

COMMENT ON VIEW public.quote_conversion_report IS
  'Truthful quote funnel read surface. was_priced distinguishes a real priced quote from a plain reply; did_convert covers both pay_now and email_match attribution. Reporting must use this view.';

GRANT SELECT ON public.quote_conversion_report TO service_role;
