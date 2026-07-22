-- Durable at-least-once paid-revenue delivery to Google Ads. A crash after
-- Google accepts but before local acknowledgement may upload again; Google Ads
-- deduplicates retries by conversion action + stable orderId (order_number).
-- A paid order creates exactly one outbox row. Browser confirmation is not the
-- source of truth, so late Clover webhooks and staff-confirmed payments are covered.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.google_ads_conversion_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('purchase_online', 'quote_won')),
  gclid text,
  gbraid text,
  wbraid text,
  conversion_value numeric(12,2) NOT NULL CHECK (conversion_value >= 0),
  conversion_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'not_attributable', 'dead')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  google_job_id text,
  last_error text,
  uploaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_ads_conversion_outbox_order_uidx UNIQUE (order_id),
  CONSTRAINT google_ads_conversion_outbox_order_number_type_uidx UNIQUE (order_number, conversion_type),
  CONSTRAINT google_ads_conversion_outbox_click_id_check CHECK (
    num_nonnulls(gclid, gbraid, wbraid) <= 1
  )
);

ALTER TABLE public.google_ads_conversion_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.google_ads_conversion_outbox FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.google_ads_conversion_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_paid_google_ads_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gclid text;
  v_gbraid text;
  v_wbraid text;
  v_status text;
  v_value numeric(12,2);
BEGIN
  IF NEW.paid_at IS NULL
     OR NEW.status NOT IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
     OR NEW.conversion_type IS NULL
     OR NEW.conversion_type NOT IN ('purchase_online', 'quote_won') THEN
    RETURN NEW;
  END IF;

  -- Choose the latest paid click as one atomic identifier group. Falling back
  -- column-by-column can incorrectly let an old first-touch GCLID suppress a
  -- newer GBRAID/WBRAID.
  v_gclid := NULLIF(NEW.latest_paid_gclid, '');
  v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.latest_paid_gbraid, '') END;
  v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.latest_paid_wbraid, '') END;
  IF v_gclid IS NULL AND v_gbraid IS NULL AND v_wbraid IS NULL THEN
    v_gclid := NULLIF(NEW.gclid, '');
    v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.gbraid, '') END;
    v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.wbraid, '') END;
  END IF;
  v_status := CASE WHEN num_nonnulls(v_gclid, v_gbraid, v_wbraid) = 1 THEN 'pending' ELSE 'not_attributable' END;
  v_value := ROUND(GREATEST(
    COALESCE(NEW.total, 0) - COALESCE(NEW.gst, 0) - COALESCE(NEW.pst, 0),
    0
  )::numeric, 2);

  INSERT INTO public.google_ads_conversion_outbox (
    order_id, order_number, conversion_type, gclid, gbraid, wbraid,
    conversion_value, conversion_time, status
  ) VALUES (
    NEW.id, NEW.order_number, NEW.conversion_type, v_gclid, v_gbraid, v_wbraid,
    v_value, NEW.paid_at, v_status
  )
  ON CONFLICT (order_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enqueue_google_ads_conversion ON public.orders;
CREATE TRIGGER orders_enqueue_google_ads_conversion
AFTER INSERT OR UPDATE OF status, paid_at ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_paid_google_ads_conversion();

CREATE OR REPLACE FUNCTION public.claim_google_ads_conversions(p_limit integer DEFAULT 20)
RETURNS SETOF public.google_ads_conversion_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.google_ads_conversion_outbox
    WHERE (
      status IN ('pending', 'retry')
      AND next_attempt_at <= now()
    ) OR (
      status = 'processing'
      AND processing_started_at < now() - interval '15 minutes'
    )
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  UPDATE public.google_ads_conversion_outbox o
  SET status = 'processing',
      attempt_count = o.attempt_count + 1,
      processing_started_at = now(),
      updated_at = now()
  FROM candidates c
  WHERE o.id = c.id
  RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_google_ads_conversions(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_ads_conversions(integer) TO service_role;

COMMENT ON TABLE public.google_ads_conversion_outbox IS
  'Idempotent server-side Google Ads paid-revenue outbox; one row per paid order.';
COMMENT ON COLUMN public.google_ads_conversion_outbox.order_number IS
  'Google Ads orderId/transaction ID used for platform-side deduplication.';
