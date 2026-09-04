-- Staff-only customer PST resale exemption support. Historical documents retain
-- their existing treatment; new snapshots are immutable on each quote/order.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS pst_vendor_number text,
  ADD COLUMN IF NOT EXISTS pst_vendor_number_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pst_vendor_number_updated_by text;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS pst_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pst_vendor_number text,
  ADD COLUMN IF NOT EXISTS pst_resale_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pst_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pst_vendor_number text,
  ADD COLUMN IF NOT EXISTS pst_resale_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS wave_voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by text,
  ADD COLUMN IF NOT EXISTS void_reason text,
  ADD COLUMN IF NOT EXISTS replaces_order_id uuid REFERENCES public.orders(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_requests_pst_exemption_check') THEN
    ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_pst_exemption_check CHECK (
      NOT pst_exempt OR (pst_resale_confirmed AND nullif(btrim(pst_vendor_number), '') IS NOT NULL)
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_pst_exemption_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_pst_exemption_check CHECK (
      NOT pst_exempt OR (pst_resale_confirmed AND nullif(btrim(pst_vendor_number), '') IS NOT NULL)
    ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_pst_exemption_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_pst_exemption_check;

CREATE UNIQUE INDEX IF NOT EXISTS orders_replaces_order_id_uidx
  ON public.orders (replaces_order_id) WHERE replaces_order_id IS NOT NULL;

-- A complete v3 marker means this revision is exempt for resale. Legacy and v2
-- rows retain their original PST formula, preventing a deployment from changing
-- any earlier quote or payment link.
CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents_v2(p_line_items jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT CASE
    WHEN COALESCE((
      SELECT bool_and(item->>'pstExempt' = 'true')
      FROM jsonb_array_elements(p_line_items) AS lines(item)
    ), false) THEN 0
    ELSE COALESCE(sum(
      round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer
    ) FILTER (
      WHERE item->>'taxClass' NOT IN ('design_service', 'rush_service')
    ), 0)::integer
  END
  FROM jsonb_array_elements(p_line_items) AS lines(item)
$$;

CREATE OR REPLACE FUNCTION public.prepare_structured_quote_send_v3(
  p_quote_id uuid,
  p_total_cents integer,
  p_subtotal_cents integer,
  p_gst_cents integer,
  p_pst_cents integer,
  p_description text,
  p_line_items jsonb,
  p_request_fingerprint text,
  p_recipient text,
  p_subject text,
  p_reply_body text,
  p_pst_exempt boolean,
  p_pst_vendor_number text,
  p_pst_resale_confirmed boolean
)
RETURNS TABLE (
  delivery_id uuid,
  quote_revision integer,
  delivery_status text,
  provider_message_id text,
  delivery_created_at timestamptz,
  provider_window_started_at timestamptz,
  pay_url text,
  rendered_html text,
  rendered_text text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_line_items jsonb;
  v_delivery record;
BEGIN
  IF p_pst_exempt AND (
    NOT p_pst_resale_confirmed OR nullif(btrim(coalesce(p_pst_vendor_number, '')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'PST_EXEMPTION_EVIDENCE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT jsonb_agg(item || jsonb_build_object('pstExempt', p_pst_exempt) ORDER BY ordinality)
  INTO v_line_items
  FROM jsonb_array_elements(p_line_items) WITH ORDINALITY AS lines(item, ordinality);

  SELECT * INTO v_delivery
  FROM public.prepare_structured_quote_send(
    p_quote_id, p_total_cents, p_subtotal_cents, p_gst_cents, p_pst_cents,
    p_description, v_line_items, p_request_fingerprint, p_recipient, p_subject, p_reply_body
  );

  UPDATE public.quote_requests
  SET
    pst_exempt = p_pst_exempt,
    pst_vendor_number = CASE WHEN p_pst_exempt THEN btrim(p_pst_vendor_number) ELSE NULL END,
    pst_resale_confirmed = p_pst_exempt AND p_pst_resale_confirmed
  WHERE id = p_quote_id AND quote_revision = v_delivery.quote_revision;

  UPDATE public.orders
  SET
    pst_exempt = p_pst_exempt,
    pst_vendor_number = CASE WHEN p_pst_exempt THEN btrim(p_pst_vendor_number) ELSE NULL END,
    pst_resale_confirmed = p_pst_exempt AND p_pst_resale_confirmed
  WHERE quote_request_id = p_quote_id;

  RETURN QUERY SELECT
    v_delivery.delivery_id, v_delivery.quote_revision, v_delivery.delivery_status,
    v_delivery.provider_message_id, v_delivery.delivery_created_at,
    v_delivery.provider_window_started_at, v_delivery.pay_url,
    v_delivery.rendered_html, v_delivery.rendered_text;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_quote_pst_exemption_to_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_quote record;
BEGIN
  IF NEW.quote_request_id IS NOT NULL THEN
    SELECT pst_exempt, pst_vendor_number, pst_resale_confirmed
    INTO v_quote FROM public.quote_requests WHERE id = NEW.quote_request_id;
    IF FOUND THEN
      NEW.pst_exempt := v_quote.pst_exempt;
      NEW.pst_vendor_number := v_quote.pst_vendor_number;
      NEW.pst_resale_confirmed := v_quote.pst_resale_confirmed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- A page-level stale-link check is not enough: a void can race an existing
-- checkout request. Keep the final authority inside the locked reservation
-- functions, where no Clover session can be created or finalized for a
-- voided request.
CREATE OR REPLACE FUNCTION public.reserve_order_checkout(p_order_id uuid)
RETURNS TABLE (checkout_action text, checkout_reservation_id uuid, checkout_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order record; v_reservation_id uuid;
BEGIN
  SELECT o.status, o.paid_at, o.quote_request_id, o.voided_at,
    o.quote_wave_state, o.wave_invoice_id, o.wave_invoice_approved_at,
    o.quote_checkout_state, o.quote_checkout_reservation_id,
    o.quote_checkout_expires_at, o.quote_checkout_url
  INTO v_order FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF v_order.voided_at IS NOT NULL OR v_order.status <> 'pending_payment' OR
     v_order.paid_at IS NOT NULL OR v_order.quote_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_PAYABLE' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.quote_wave_state <> 'ready' OR NULLIF(btrim(v_order.wave_invoice_id), '') IS NULL OR
     v_order.wave_invoice_approved_at IS NULL THEN
    RAISE EXCEPTION 'ORDER_WAVE_NOT_READY' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.quote_checkout_state = 'ready' AND NULLIF(btrim(v_order.quote_checkout_url), '') IS NOT NULL AND
     v_order.quote_checkout_expires_at > now() THEN
    RETURN QUERY SELECT 'resume'::text, v_order.quote_checkout_reservation_id, v_order.quote_checkout_url; RETURN;
  END IF;
  IF v_order.quote_checkout_state = 'ambiguous' THEN
    RETURN QUERY SELECT 'wait'::text, v_order.quote_checkout_reservation_id, NULL::text; RETURN;
  END IF;
  IF v_order.quote_checkout_state = 'creating' THEN
    IF v_order.quote_checkout_expires_at IS NULL OR v_order.quote_checkout_expires_at <= now() THEN
      UPDATE public.orders SET quote_checkout_state = 'ambiguous',
        quote_checkout_last_error = 'Clover checkout creation did not complete before its reservation expired'
      WHERE id = p_order_id;
    END IF;
    RETURN QUERY SELECT 'wait'::text, v_order.quote_checkout_reservation_id, NULL::text; RETURN;
  END IF;
  v_reservation_id := gen_random_uuid();
  UPDATE public.orders SET payment_reference = id::text, quote_checkout_state = 'creating',
    quote_checkout_reservation_id = v_reservation_id, quote_checkout_reserved_at = now(),
    quote_checkout_expires_at = now() + interval '16 minutes', quote_checkout_url = NULL,
    quote_checkout_session_id = NULL, quote_checkout_last_error = NULL
  WHERE id = p_order_id AND voided_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_PAYABLE' USING ERRCODE = 'P0001'; END IF;
  RETURN QUERY SELECT 'create'::text, v_reservation_id, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_order_checkout(
  p_order_id uuid, p_reservation_id uuid, p_checkout_url text, p_session_id text, p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(COALESCE(p_checkout_url, '')) = '' OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'INVALID_CHECKOUT_RESERVATION_RESULT' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.orders o SET quote_checkout_state = 'ready', quote_checkout_url = p_checkout_url,
    quote_checkout_session_id = NULLIF(p_session_id, ''), quote_checkout_expires_at = p_expires_at,
    quote_checkout_last_error = NULL
  WHERE o.id = p_order_id AND o.voided_at IS NULL AND o.status = 'pending_payment'
    AND o.quote_request_id IS NULL AND o.quote_wave_state = 'ready'
    AND NULLIF(btrim(o.wave_invoice_id), '') IS NOT NULL AND o.wave_invoice_approved_at IS NOT NULL
    AND o.quote_checkout_state = 'creating' AND o.quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

DROP TRIGGER IF EXISTS orders_copy_quote_pst_exemption ON public.orders;
CREATE TRIGGER orders_copy_quote_pst_exemption
BEFORE INSERT OR UPDATE OF quote_request_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.copy_quote_pst_exemption_to_order();

REVOKE ALL ON FUNCTION public.prepare_structured_quote_send_v3(
  uuid, integer, integer, integer, integer, text, jsonb, text, text, text, text, boolean, text, boolean
) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_structured_quote_send_v3(
  uuid, integer, integer, integer, integer, text, jsonb, text, text, text, text, boolean, text, boolean
) TO service_role;
