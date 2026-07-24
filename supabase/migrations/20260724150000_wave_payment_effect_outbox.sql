-- Durable Wave paid-invoice processing.
--
-- One transaction owns payment truth:
--   orders transition + order_payments ledger + one work row per external effect.
-- The worker uses short leased claims and conditional acknowledgements so a
-- crash can be retried without reopening the revenue transition.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL OR
     to_regclass('public.customers') IS NULL OR
     to_regclass('public.order_payments') IS NULL THEN
    RAISE EXCEPTION
      'Wave payment outbox preflight failed: orders, customers, or order_payments is missing';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.wave_payment_effect_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  effect_type text NOT NULL CHECK (
    effect_type IN ('receipt', 'ga4_purchase', 'brevo_payment_date')
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'retry', 'sent', 'skipped', 'dead')
  ),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wave_payment_effect_outbox_order_effect_uidx
    UNIQUE (order_id, effect_type)
);

CREATE UNIQUE INDEX IF NOT EXISTS order_payments_wave_invoice_once_uidx
  ON public.order_payments (order_id, method, external_reference)
  WHERE method = 'wave'
    AND status = 'recorded'
    AND external_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS wave_payment_effect_outbox_due_idx
  ON public.wave_payment_effect_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retry', 'processing');

ALTER TABLE public.wave_payment_effect_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wave_payment_effect_outbox FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.wave_payment_effect_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.accept_wave_paid_invoice(
  p_wave_invoice_id text
)
RETURNS TABLE (
  outcome text,
  order_id uuid,
  order_number text,
  payment_transitioned boolean,
  effects_pending integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order record;
  v_paid_at timestamptz;
  v_transitioned boolean := false;
  v_pending integer := 0;
BEGIN
  IF btrim(COALESCE(p_wave_invoice_id, '')) = '' OR
     length(p_wave_invoice_id) > 300 THEN
    RAISE EXCEPTION 'WAVE_PAYMENT_INVALID_INVOICE_ID' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    o.id,
    o.order_number,
    o.customer_id,
    o.total,
    o.status,
    o.paid_at,
    o.wave_payment_recorded_at,
    o.payment_method,
    c.name AS customer_name,
    c.company AS customer_company,
    c.email AS customer_email
  INTO v_order
  FROM public.orders o
  LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.wave_invoice_id = p_wave_invoice_id
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 'not_found'::text, NULL::uuid, NULL::text, false, 0;
    RETURN;
  END IF;

  -- Every checkout can have a Wave bookkeeping invoice. Only a customer-paid
  -- Wave order owns these effects; Clover/e-transfer paths have their own
  -- transition and receipt workers.
  IF v_order.payment_method <> 'wave' THEN
    RETURN QUERY
    SELECT
      'not_wave_order'::text,
      v_order.id,
      v_order.order_number,
      false,
      0;
    RETURN;
  END IF;

  IF v_order.status = 'pending_payment' AND v_order.paid_at IS NULL THEN
    v_paid_at := now();
    UPDATE public.orders o
    SET
      status = 'payment_received',
      paid_at = v_paid_at,
      wave_payment_recorded_at = COALESCE(o.wave_payment_recorded_at, v_paid_at)
    WHERE o.id = v_order.id
      AND o.status = 'pending_payment'
      AND o.paid_at IS NULL;
    GET DIAGNOSTICS v_pending = ROW_COUNT;
    v_transitioned := v_pending = 1;
    IF NOT v_transitioned THEN
      RAISE EXCEPTION 'WAVE_PAYMENT_TRANSITION_LOST' USING ERRCODE = '40001';
    END IF;
  ELSIF v_order.paid_at IS NOT NULL AND
        v_order.status IN (
          'payment_received',
          'in_production',
          'ready_for_pickup',
          'complete',
          'completed'
        ) THEN
    -- A duplicate accepted by this implementation already has its durable work.
    -- Do not synthesize effects for older paid rows: there is no reliable
    -- per-effect evidence for the legacy handler, so doing that could resend a
    -- receipt or GA4 purchase that it actually delivered.
    IF NOT EXISTS (
      SELECT 1
      FROM public.wave_payment_effect_outbox e
      WHERE e.order_id = v_order.id
    ) THEN
      RETURN QUERY
      SELECT
        'legacy_already_paid'::text,
        v_order.id,
        v_order.order_number,
        false,
        0;
      RETURN;
    END IF;
    v_paid_at := v_order.paid_at;
  ELSE
    RETURN QUERY
    SELECT
      'not_payable'::text,
      v_order.id,
      v_order.order_number,
      false,
      0;
    RETURN;
  END IF;

  IF
    NULLIF(btrim(COALESCE(v_order.customer_name, '')), '') IS NULL AND
    NULLIF(btrim(COALESCE(v_order.customer_company, '')), '') IS NULL AND
    NULLIF(btrim(COALESCE(v_order.customer_email, '')), '') IS NULL
  THEN
    RAISE EXCEPTION 'WAVE_PAYMENT_CUSTOMER_IDENTITY_MISSING' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.order_payments (
    order_id,
    amount,
    currency,
    method,
    status,
    payer_name,
    payer_company,
    payer_email,
    external_reference,
    recorded_by,
    recorded_at,
    notes,
    metadata
  )
  SELECT
    v_order.id,
    v_order.total,
    'CAD',
    'wave',
    'recorded',
    NULLIF(btrim(COALESCE(v_order.customer_name, '')), ''),
    NULLIF(btrim(COALESCE(v_order.customer_company, '')), ''),
    NULLIF(btrim(COALESCE(v_order.customer_email, '')), ''),
    p_wave_invoice_id,
    'wave-webhook',
    v_paid_at,
    'Auto-recorded from Wave paid-invoice webhook (' || p_wave_invoice_id || ')',
    jsonb_build_object(
      'wave_invoice_id', p_wave_invoice_id,
      'source', 'invoice.paid'
    )
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.order_payments p
    WHERE p.order_id = v_order.id
      AND p.method = 'wave'
      AND p.external_reference = p_wave_invoice_id
      AND p.status = 'recorded'
  )
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM public.order_payments p
    WHERE p.order_id = v_order.id
      AND p.method = 'wave'
      AND p.external_reference = p_wave_invoice_id
      AND p.status = 'recorded'
  ) THEN
    RAISE EXCEPTION 'WAVE_PAYMENT_LEDGER_CONFLICT' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.wave_payment_effect_outbox (
    order_id,
    effect_type,
    status,
    completed_at
  )
  SELECT
    v_order.id,
    effect.effect_type,
    CASE
      WHEN effect.effect_type IN ('receipt', 'brevo_payment_date') AND
           NULLIF(btrim(COALESCE(v_order.customer_email, '')), '') IS NULL
        THEN 'skipped'
      ELSE 'pending'
    END,
    CASE
      WHEN effect.effect_type IN ('receipt', 'brevo_payment_date') AND
           NULLIF(btrim(COALESCE(v_order.customer_email, '')), '') IS NULL
        THEN now()
      ELSE NULL
    END
  FROM (
    VALUES
      ('receipt'::text),
      ('ga4_purchase'::text),
      ('brevo_payment_date'::text)
  ) AS effect(effect_type)
  ON CONFLICT ON CONSTRAINT wave_payment_effect_outbox_order_effect_uidx
    DO NOTHING;

  SELECT count(*)::integer
  INTO v_pending
  FROM public.wave_payment_effect_outbox e
  WHERE e.order_id = v_order.id
    AND e.status IN ('pending', 'retry', 'processing');

  RETURN QUERY
  SELECT
    CASE WHEN v_transitioned THEN 'transitioned' ELSE 'already_processed' END,
    v_order.id,
    v_order.order_number,
    v_transitioned,
    v_pending;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_wave_payment_effects(
  p_limit integer DEFAULT 1,
  p_order_id uuid DEFAULT NULL
)
RETURNS SETOF public.wave_payment_effect_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT e.id
    FROM public.wave_payment_effect_outbox e
    WHERE (p_order_id IS NULL OR e.order_id = p_order_id)
      AND (
        (
          e.status IN ('pending', 'retry')
          AND e.next_attempt_at <= now()
        )
        OR (
          e.status = 'processing'
          AND e.processing_started_at < now() - interval '10 minutes'
        )
      )
    ORDER BY e.created_at, e.effect_type
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 10)
  )
  UPDATE public.wave_payment_effect_outbox e
  SET
    status = 'processing',
    attempt_count = e.attempt_count + 1,
    processing_started_at = now(),
    updated_at = now()
  FROM candidates c
  WHERE e.id = c.id
  RETURNING e.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_wave_payment_effect(
  p_effect_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_effect_id uuid;
BEGIN
  UPDATE public.wave_payment_effect_outbox e
  SET
    status = 'sent',
    completed_at = COALESCE(e.completed_at, now()),
    processing_started_at = NULL,
    last_error = NULL,
    updated_at = now()
  WHERE e.id = p_effect_id
    AND e.status = 'processing'
  RETURNING e.id INTO v_effect_id;

  RETURN v_effect_id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.retry_wave_payment_effect(
  p_effect_id uuid,
  p_error text,
  p_max_attempts integer DEFAULT 8
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_status text;
BEGIN
  IF p_max_attempts < 1 OR p_max_attempts > 20 THEN
    RAISE EXCEPTION 'WAVE_EFFECT_INVALID_MAX_ATTEMPTS' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.wave_payment_effect_outbox e
  SET
    status = CASE
      WHEN e.attempt_count >= p_max_attempts THEN 'dead'
      ELSE 'retry'
    END,
    next_attempt_at = CASE
      WHEN e.attempt_count >= p_max_attempts THEN e.next_attempt_at
      ELSE now() + make_interval(
        mins => LEAST(power(2, GREATEST(e.attempt_count - 1, 0))::integer, 60)
      )
    END,
    processing_started_at = NULL,
    last_error = left(COALESCE(NULLIF(btrim(p_error), ''), 'Unknown effect error'), 1000),
    updated_at = now()
  WHERE e.id = p_effect_id
    AND e.status = 'processing'
  RETURNING e.status INTO v_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WAVE_EFFECT_NOT_PROCESSING' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_status;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_wave_paid_invoice(text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_wave_payment_effects(integer, uuid)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_wave_payment_effect(uuid)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.retry_wave_payment_effect(uuid, text, integer)
  FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.accept_wave_paid_invoice(text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_wave_payment_effects(integer, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_wave_payment_effect(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_wave_payment_effect(uuid, text, integer)
  TO service_role;

COMMENT ON TABLE public.wave_payment_effect_outbox IS
  'Crash-recoverable receipt, GA4 purchase, and Brevo work created atomically with a Wave payment transition.';
