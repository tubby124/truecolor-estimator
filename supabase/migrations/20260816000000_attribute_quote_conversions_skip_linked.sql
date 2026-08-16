-- Skip quotes an order already references. /api/staff/manual-order writes
-- orders.quote_request_id before payment, so the cron could otherwise claim that
-- same quote for a different paid order and payment sync would later re-point
-- converted_order_id at the wrong sale.
--
-- Replaces the definition from 20260805120000_quote_email_attribution.sql
-- verbatim, plus the NOT EXISTS guard on public.orders. Re-runnable.

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
      -- A staff manual order links the quote at creation, before it is paid.
      -- That order is the quote's conversion; email matching must not hand the
      -- same quote to some other order that happened to pay first.
      AND NOT EXISTS (
        SELECT 1 FROM public.orders o2
        WHERE o2.quote_request_id = q.id
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
