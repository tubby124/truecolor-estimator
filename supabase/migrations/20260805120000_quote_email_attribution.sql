-- Quote conversion attribution by customer email.
--
-- Context: the structured Pay Now path (materialize_quote_order) sets
-- orders.quote_request_id and the paid_at trigger stamps won_at/converted_at.
-- Verified 2026-08-05: that path has NEVER been exercised in production
-- (0 orders with quote_request_id, 0 quotes with quote_total_cents, all time).
-- Staff reply from Gmail and customers order through normal checkout or in
-- store, so every real conversion is invisible to the funnel report.
--
-- This migration adds an INDEPENDENT attribution path. It writes only to
-- quote_requests. It never writes to orders, so the Pay Now invariants, the
-- orders_quote_request_id_uidx index, and the Google Ads conversion outbox
-- trigger (which is ON public.orders) are all unaffected.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS attribution_method text,
  ADD COLUMN IF NOT EXISTS attributed_at timestamptz;

ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_attribution_method_check;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_attribution_method_check
  CHECK (attribution_method IS NULL OR attribution_method IN ('pay_now', 'email_match'));

-- One order may only ever be credited to one quote.
-- Already created by 20260720100000; restated here so this migration is
-- self-contained and safe to re-run.
CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_converted_order_id_uidx
  ON public.quote_requests (converted_order_id)
  WHERE converted_order_id IS NOT NULL;

COMMENT ON COLUMN public.quote_requests.attribution_method IS
  'pay_now = materialized through the signed Pay Now token; email_match = inferred from a paid order by the same customer email inside the attribution window.';

CREATE OR REPLACE FUNCTION public.attribute_quote_conversions(
  p_window_days integer DEFAULT 60,
  p_dry_run boolean DEFAULT false
)
RETURNS TABLE (
  quote_id uuid,
  order_id uuid,
  quote_email text,
  quote_created_at timestamptz,
  order_paid_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT
      q.id AS quote_id,
      o.id AS order_id,
      lower(btrim(q.email)) AS quote_email,
      q.created_at AS quote_created_at,
      o.paid_at AS order_paid_at
    FROM public.quote_requests q
    JOIN public.customers c
      ON lower(btrim(c.email)) = lower(btrim(q.email))
    JOIN public.orders o
      ON o.customer_id = c.id
    WHERE q.email IS NOT NULL
      AND btrim(q.email) <> ''
      AND q.converted_order_id IS NULL
      AND q.is_archived IS NOT TRUE
      AND o.paid_at IS NOT NULL
      AND o.paid_at >= q.created_at
      AND o.paid_at < q.created_at + make_interval(days => p_window_days)
      AND o.quote_request_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.quote_requests claimed
        WHERE claimed.converted_order_id = o.id
      )
  ),
  -- Each order is claimed by the earliest quote that could have produced it.
  order_claimed AS (
    SELECT DISTINCT ON (order_id) *
    FROM candidate
    ORDER BY order_id, quote_created_at ASC, quote_id ASC
  ),
  -- Each quote takes at most one order: its earliest paid match.
  final AS (
    SELECT DISTINCT ON (quote_id) *
    FROM order_claimed
    ORDER BY quote_id, order_paid_at ASC, order_id ASC
  ),
  upd AS (
    UPDATE public.quote_requests q
    SET
      converted_order_id = f.order_id,
      checkout_started_at = COALESCE(q.checkout_started_at, f.order_paid_at),
      won_at = COALESCE(q.won_at, f.order_paid_at),
      converted_at = COALESCE(q.converted_at, f.order_paid_at),
      attribution_method = COALESCE(q.attribution_method, 'email_match'),
      attributed_at = COALESCE(q.attributed_at, now()),
      lifecycle_status = 'won'
    FROM final f
    WHERE q.id = f.quote_id
      AND NOT p_dry_run
    RETURNING q.id
  )
  SELECT
    f.quote_id,
    f.order_id,
    f.quote_email,
    f.quote_created_at,
    f.order_paid_at
  FROM final f
  ORDER BY f.order_paid_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.attribute_quote_conversions(integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_quote_conversions(integer, boolean) TO service_role;

-- Label the conversions the Pay Now path already owns, so the two are
-- distinguishable the first time that path is ever used.
UPDATE public.quote_requests
SET attribution_method = 'pay_now',
    attributed_at = COALESCE(attributed_at, converted_at, won_at, now())
WHERE converted_order_id IS NOT NULL
  AND attribution_method IS NULL;
