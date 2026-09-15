-- Verified Wave Payments ingestion and provisional invoice recovery.
--
-- Wave invoice status is not payment evidence. The caller must read the
-- invoice's payment records and pass one CUSTOMER/PAID/WPP/SALE payment at a
-- time. This function re-validates those traits and commits ledger truth,
-- order state, and requested effects in one transaction.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL OR
     to_regclass('public.order_payments') IS NULL OR
     to_regclass('public.wave_payment_effect_outbox') IS NULL THEN
    RAISE EXCEPTION 'Wave provider-payment recovery preflight failed: required tables are missing';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.order_payments p
    WHERE p.method = 'wave' AND p.status = 'recorded'
      AND NULLIF(btrim(p.external_reference), '') IS NOT NULL
    GROUP BY p.external_reference
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave provider-payment recovery preflight failed: duplicate Wave payment references exist';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orders o
    WHERE NULLIF(btrim(o.wave_invoice_id), '') IS NOT NULL
    GROUP BY btrim(o.wave_invoice_id)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave provider-payment recovery preflight failed: duplicate Wave invoice identities exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS order_payments_wave_provider_reference_uidx
  ON public.order_payments (external_reference)
  WHERE method = 'wave'
    AND status = 'recorded'
    AND NULLIF(btrim(external_reference), '') IS NOT NULL;

ALTER TABLE public.wave_payment_effect_outbox
  DROP CONSTRAINT IF EXISTS wave_payment_effect_outbox_effect_type_check;
ALTER TABLE public.wave_payment_effect_outbox
  ADD CONSTRAINT wave_payment_effect_outbox_effect_type_check CHECK (
    effect_type IN ('receipt', 'ga4_purchase', 'brevo_payment_date', 'staff_paid')
  );

CREATE OR REPLACE FUNCTION public.record_quote_wave_provisional(
  p_order_id uuid,
  p_reservation_id uuid,
  p_wave_invoice_id text,
  p_wave_invoice_number text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF NULLIF(btrim(COALESCE(p_wave_invoice_id, '')), '') IS NULL OR
     length(p_wave_invoice_id) > 300 THEN
    RAISE EXCEPTION 'INVALID_WAVE_PROVISIONAL_ID' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders o
  SET
    wave_invoice_id = p_wave_invoice_id,
    wave_invoice_number = NULLIF(btrim(p_wave_invoice_number), ''),
    quote_wave_state = 'ambiguous',
    quote_wave_last_error = 'Wave invoice created; approval and financial readback pending'
  WHERE o.id = p_order_id
    AND o.status = 'pending_payment'
    AND o.paid_at IS NULL
    AND o.quote_wave_state = 'creating'
    AND o.quote_wave_reservation_id = p_reservation_id
    AND o.wave_invoice_id IS NULL
  RETURNING o.id INTO v_id;

  IF v_id IS NOT NULL THEN RETURN true; END IF;

  -- A response retry for the same reservation and provider identity is safe.
  RETURN EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND o.quote_wave_reservation_id = p_reservation_id
      AND o.wave_invoice_id = p_wave_invoice_id
      AND o.quote_wave_state IN ('ambiguous', 'ready')
  );
END;
$$;

-- Completion now accepts the same provisional identity retained before
-- financial verification and approval. It never replaces another identity.
CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning(
  p_order_id uuid,
  p_reservation_id uuid,
  p_wave_invoice_id text,
  p_wave_invoice_number text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_order record;
BEGIN
  IF NULLIF(btrim(COALESCE(p_wave_invoice_id, '')), '') IS NULL OR
     length(p_wave_invoice_id) > 300 THEN
    RAISE EXCEPTION 'INVALID_WAVE_PROVISIONING_RESULT' USING ERRCODE = 'P0001';
  END IF;

  SELECT o.status, o.paid_at, o.wave_invoice_id, o.wave_invoice_approved_at,
         o.quote_wave_state, o.quote_wave_reservation_id
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_order.wave_invoice_id = p_wave_invoice_id AND
     v_order.wave_invoice_approved_at IS NOT NULL AND
     v_order.quote_wave_state = 'ready' THEN
    UPDATE public.orders o SET
      wave_invoice_number = COALESCE(NULLIF(btrim(p_wave_invoice_number), ''), o.wave_invoice_number),
      quote_wave_completed_at = COALESCE(o.quote_wave_completed_at, now()),
      quote_wave_last_error = NULL
    WHERE o.id = p_order_id;
    RETURN true;
  END IF;

  IF v_order.status <> 'pending_payment' OR v_order.paid_at IS NOT NULL OR
     v_order.quote_wave_reservation_id IS DISTINCT FROM p_reservation_id OR
     v_order.quote_wave_state NOT IN ('creating', 'ambiguous') OR
     (v_order.wave_invoice_id IS NOT NULL AND v_order.wave_invoice_id <> p_wave_invoice_id) THEN
    RETURN false;
  END IF;

  UPDATE public.orders o SET
    wave_invoice_id = p_wave_invoice_id,
    wave_invoice_number = COALESCE(NULLIF(btrim(p_wave_invoice_number), ''), o.wave_invoice_number),
    wave_invoice_approved_at = now(),
    quote_wave_state = 'ready',
    quote_wave_completed_at = now(),
    quote_wave_last_error = NULL
  WHERE o.id = p_order_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_wave_provider_payment(
  p_wave_invoice_id text,
  p_wave_payment_id text,
  p_amount_cents bigint,
  p_paid_at timestamptz,
  p_payment_method text,
  p_origin text,
  p_state text,
  p_payment_provider text,
  p_transaction_type text,
  p_enqueue_customer_effects boolean DEFAULT false,
  p_enqueue_staff_effect boolean DEFAULT false
)
RETURNS TABLE (
  outcome text,
  order_id uuid,
  order_number text,
  source_payment_method text,
  actual_payment_provider text,
  payment_transitioned boolean,
  amount_paid_cents bigint,
  balance_due_cents bigint,
  effects_pending integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order record;
  v_existing record;
  v_order_total_cents bigint;
  v_amount_paid_cents bigint;
  v_balance_due_cents bigint;
  v_transitioned boolean := false;
  v_duplicate boolean := false;
  v_effects_pending integer := 0;
BEGIN
  IF NULLIF(btrim(COALESCE(p_wave_invoice_id, '')), '') IS NULL OR length(p_wave_invoice_id) > 300 OR
     NULLIF(btrim(COALESCE(p_wave_payment_id, '')), '') IS NULL OR length(p_wave_payment_id) > 300 OR
     p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_paid_at IS NULL THEN
    RAISE EXCEPTION 'WAVE_PROVIDER_PAYMENT_INVALID_INPUT' USING ERRCODE = 'P0001';
  END IF;
  IF p_origin IS DISTINCT FROM 'CUSTOMER' OR p_state IS DISTINCT FROM 'PAID' OR
     p_payment_provider IS DISTINCT FROM 'WPP' OR p_transaction_type IS DISTINCT FROM 'SALE' THEN
    RAISE EXCEPTION 'WAVE_PROVIDER_PAYMENT_UNVERIFIED' USING ERRCODE = 'P0001';
  END IF;

  SELECT o.id, o.order_number, o.customer_id, o.total, o.status, o.paid_at,
         o.voided_at, o.is_archived,
         o.payment_method, c.name AS customer_name, c.company AS customer_company,
         c.email AS customer_email
  INTO v_order
  FROM public.orders o
  LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.wave_invoice_id = p_wave_invoice_id
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid, NULL::text, NULL::text,
      'wave_payments'::text, false, 0::bigint, 0::bigint, 0;
    RETURN;
  END IF;
  IF v_order.voided_at IS NOT NULL OR COALESCE(v_order.is_archived, false) OR
     v_order.status NOT IN ('pending_payment', 'payment_received', 'in_production',
      'ready_for_pickup', 'complete', 'completed') THEN
    RETURN QUERY SELECT 'not_payable'::text, v_order.id, v_order.order_number,
      v_order.payment_method, 'wave_payments'::text, false, 0::bigint, 0::bigint, 0;
    RETURN;
  END IF;

  v_order_total_cents := round(v_order.total::numeric * 100)::bigint;
  IF v_order_total_cents <= 0 OR v_order.total::numeric * 100 <> v_order_total_cents THEN
    RAISE EXCEPTION 'WAVE_PROVIDER_PAYMENT_INVALID_ORDER_TOTAL' USING ERRCODE = 'P0001';
  END IF;

  -- The retired invoice-status handler wrote a synthetic full-total row keyed
  -- by invoice ID. A provider payment ID must not be added on top of it.
  IF EXISTS (
    SELECT 1 FROM public.order_payments p
    WHERE p.order_id = v_order.id AND p.method = 'wave' AND p.status = 'recorded'
      AND p.external_reference = p_wave_invoice_id
      AND p.metadata ->> 'source' = 'invoice.paid'
      AND NULLIF(p.metadata ->> 'wave_payment_id', '') IS NULL
  ) THEN
    RETURN QUERY SELECT 'ledger_conflict'::text, v_order.id, v_order.order_number,
      v_order.payment_method, 'wave_payments'::text, false, 0::bigint, 0::bigint, 0;
    RETURN;
  END IF;

  SELECT p.order_id, p.amount, p.currency, p.status
  INTO v_existing
  FROM public.order_payments p
  WHERE p.method = 'wave' AND p.external_reference = p_wave_payment_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.order_id <> v_order.id OR v_existing.status <> 'recorded' OR
       v_existing.currency <> 'CAD' OR
       round(v_existing.amount::numeric * 100)::bigint <> p_amount_cents THEN
      RETURN QUERY SELECT 'ledger_conflict'::text, v_order.id, v_order.order_number,
        v_order.payment_method, 'wave_payments'::text, false, 0::bigint, 0::bigint, 0;
      RETURN;
    END IF;
    v_duplicate := true;
  ELSE
    INSERT INTO public.order_payments (
      order_id, amount, currency, method, status, payer_name, payer_company,
      payer_email, external_reference, recorded_by, recorded_at, notes, metadata
    ) VALUES (
      v_order.id, p_amount_cents::numeric / 100, 'CAD', 'wave', 'recorded',
      NULLIF(btrim(COALESCE(v_order.customer_name, '')), ''),
      NULLIF(btrim(COALESCE(v_order.customer_company, '')), ''),
      NULLIF(btrim(COALESCE(v_order.customer_email, '')), ''),
      p_wave_payment_id, 'wave-provider-readback', p_paid_at,
      'Verified Wave Payments customer capture (' || p_wave_payment_id || ')',
      jsonb_build_object(
        'wave_invoice_id', p_wave_invoice_id,
        'wave_payment_id', p_wave_payment_id,
        'payment_provider', p_payment_provider,
        'origin', p_origin,
        'state', p_state,
        'transaction_type', p_transaction_type,
        'payment_method', p_payment_method,
        'source_payment_method', v_order.payment_method
      )
    );
  END IF;

  SELECT COALESCE(round(sum(p.amount::numeric) * 100)::bigint, 0)
  INTO v_amount_paid_cents
  FROM public.order_payments p
  WHERE p.order_id = v_order.id AND p.status = 'recorded' AND p.amount > 0;
  v_balance_due_cents := GREATEST(v_order_total_cents - v_amount_paid_cents, 0);

  IF v_amount_paid_cents >= v_order_total_cents AND
     v_order.status = 'pending_payment' AND v_order.paid_at IS NULL THEN
    UPDATE public.orders o SET
      status = 'payment_received',
      paid_at = p_paid_at,
      wave_payment_recorded_at = COALESCE(o.wave_payment_recorded_at, p_paid_at)
    WHERE o.id = v_order.id AND o.status = 'pending_payment' AND o.paid_at IS NULL;
    GET DIAGNOSTICS v_effects_pending = ROW_COUNT;
    v_transitioned := v_effects_pending = 1;
    IF NOT v_transitioned THEN
      RAISE EXCEPTION 'WAVE_PROVIDER_PAYMENT_TRANSITION_LOST' USING ERRCODE = '40001';
    END IF;
  ELSIF v_amount_paid_cents >= v_order_total_cents THEN
    UPDATE public.orders o
    SET wave_payment_recorded_at = COALESCE(o.wave_payment_recorded_at, p_paid_at)
    WHERE o.id = v_order.id;
  END IF;

  IF v_amount_paid_cents >= v_order_total_cents THEN
    IF p_enqueue_staff_effect THEN
      INSERT INTO public.wave_payment_effect_outbox (order_id, effect_type)
      VALUES (v_order.id, 'staff_paid')
      ON CONFLICT ON CONSTRAINT wave_payment_effect_outbox_order_effect_uidx DO NOTHING;
    END IF;
    IF p_enqueue_customer_effects AND (
      v_transitioned OR EXISTS (
        SELECT 1 FROM public.wave_payment_effect_outbox e
        WHERE e.order_id = v_order.id
          AND e.effect_type IN ('receipt', 'ga4_purchase', 'brevo_payment_date')
      )
    ) THEN
      INSERT INTO public.wave_payment_effect_outbox (order_id, effect_type, status, completed_at)
      SELECT v_order.id, e.effect_type,
        CASE WHEN e.effect_type IN ('receipt', 'brevo_payment_date') AND
          NULLIF(btrim(COALESCE(v_order.customer_email, '')), '') IS NULL
          THEN 'skipped' ELSE 'pending' END,
        CASE WHEN e.effect_type IN ('receipt', 'brevo_payment_date') AND
          NULLIF(btrim(COALESCE(v_order.customer_email, '')), '') IS NULL
          THEN now() ELSE NULL END
      FROM (VALUES ('receipt'::text), ('ga4_purchase'::text), ('brevo_payment_date'::text)) e(effect_type)
      ON CONFLICT ON CONSTRAINT wave_payment_effect_outbox_order_effect_uidx DO NOTHING;
    END IF;
  END IF;

  SELECT count(*)::integer INTO v_effects_pending
  FROM public.wave_payment_effect_outbox e
  WHERE e.order_id = v_order.id AND e.status IN ('pending', 'retry', 'processing');

  RETURN QUERY SELECT
    CASE
      WHEN v_amount_paid_cents > v_order_total_cents THEN 'overpaid'
      WHEN v_amount_paid_cents < v_order_total_cents THEN 'partial'
      WHEN v_transitioned THEN 'transitioned'
      WHEN v_duplicate THEN 'already_processed'
      ELSE 'already_processed'
    END,
    v_order.id, v_order.order_number, v_order.payment_method,
    'wave_payments'::text, v_transitioned, v_amount_paid_cents,
    v_balance_due_cents, v_effects_pending;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quote_wave_provisional(uuid, uuid, text, text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_wave_provider_payment(
  text, text, bigint, timestamptz, text, text, text, text, text, boolean, boolean
) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_quote_wave_provisional(uuid, uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_wave_provider_payment(
  text, text, bigint, timestamptz, text, text, text, text, text, boolean, boolean
) TO service_role;

COMMENT ON FUNCTION public.accept_wave_provider_payment(
  text, text, bigint, timestamptz, text, text, text, text, text, boolean, boolean
) IS 'Atomically ingests one verified Wave Payments customer capture while preserving the order intended payment method.';
