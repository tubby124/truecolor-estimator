-- Fail-closed Wave provisioning for all customer Clover checkout paths.
-- An order must have a durably linked, approved Wave invoice before the
-- application is allowed to create or resume a Clover checkout. The original
-- quote_wave_* names are retained because this migration first introduced the
-- state machine for quotes; the state now applies to every order.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION 'Wave provisioning migration preflight failed: orders table is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'wave_invoice_id'
  ) THEN
    RAISE EXCEPTION 'Wave provisioning migration preflight failed: orders.wave_invoice_id is missing';
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quote_wave_state text,
  ADD COLUMN IF NOT EXISTS quote_wave_reservation_id uuid,
  ADD COLUMN IF NOT EXISTS quote_wave_reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_wave_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_wave_last_error text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_submission_id uuid,
  ADD COLUMN IF NOT EXISTS checkout_request_fingerprint text;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS checkout_line_key text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE NULLIF(btrim(wave_invoice_id), '') IS NOT NULL
    GROUP BY btrim(wave_invoice_id) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave provisioning migration preflight failed: duplicate orders.wave_invoice_id values';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE NULLIF(btrim(quote_checkout_session_id), '') IS NOT NULL
    GROUP BY btrim(quote_checkout_session_id) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave provisioning migration preflight failed: duplicate orders.quote_checkout_session_id values';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_submission_id_uidx
  ON public.orders (checkout_submission_id)
  WHERE checkout_submission_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_wave_invoice_id_uidx
  ON public.orders (btrim(wave_invoice_id))
  WHERE NULLIF(btrim(wave_invoice_id), '') IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_quote_checkout_session_id_uidx
  ON public.orders (btrim(quote_checkout_session_id))
  WHERE NULLIF(btrim(quote_checkout_session_id), '') IS NOT NULL;
DROP INDEX IF EXISTS public.order_items_checkout_line_key_uidx;
CREATE UNIQUE INDEX order_items_checkout_line_key_uidx
  ON public.order_items (checkout_line_key);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_quote_wave_state_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_quote_wave_state_check
      CHECK (quote_wave_state IS NULL OR quote_wave_state IN ('creating', 'ready', 'ambiguous', 'failed'))
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_checkout_fingerprint_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_checkout_fingerprint_check
  CHECK (
    checkout_submission_id IS NULL OR
    (
      checkout_request_fingerprint IS NOT NULL AND
      checkout_request_fingerprint ~ '^[0-9a-f]{64}$'
    )
  ) NOT VALID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_quote_wave_ready_link_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_quote_wave_ready_link_check
      CHECK (
        quote_wave_state IS DISTINCT FROM 'ready' OR
        (NULLIF(btrim(wave_invoice_id), '') IS NOT NULL AND wave_invoice_approved_at IS NOT NULL)
      ) NOT VALID;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.reserve_quote_wave_provisioning(uuid);
DROP FUNCTION IF EXISTS public.complete_quote_wave_provisioning(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.fail_quote_wave_provisioning(uuid, uuid, boolean, text);
DROP FUNCTION IF EXISTS public.reserve_order_checkout(uuid);
DROP FUNCTION IF EXISTS public.complete_order_checkout(uuid, uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.fail_order_checkout(uuid, uuid, boolean, text);

-- Locks the order so only one request may become the Wave creator. A stale
-- creating reservation is intentionally not recycled: the process may have
-- reached Wave before dying, so an automatic retry could create a duplicate.
CREATE OR REPLACE FUNCTION public.reserve_quote_wave_provisioning(p_order_id uuid)
RETURNS TABLE (
  wave_action text,
  wave_reservation_id uuid,
  linked_wave_invoice_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_reservation_id uuid;
BEGIN
  SELECT
    o.id, o.status, o.paid_at, o.wave_invoice_id, o.wave_invoice_approved_at,
    o.quote_wave_state, o.quote_wave_reservation_id
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- Only linkage plus a durable approval timestamp is ready. A legacy or
  -- interrupted link without durable approval is ambiguous and must be
  -- reconciled manually; creating another invoice could duplicate revenue.
  IF NULLIF(btrim(v_order.wave_invoice_id), '') IS NOT NULL THEN
    IF v_order.wave_invoice_approved_at IS NOT NULL THEN
      UPDATE public.orders o SET
        quote_wave_state = 'ready',
        quote_wave_completed_at = COALESCE(o.quote_wave_completed_at, now()),
        quote_wave_last_error = NULL
      WHERE o.id = p_order_id;

      RETURN QUERY SELECT 'ready'::text, v_order.quote_wave_reservation_id, v_order.wave_invoice_id;
    ELSE
      UPDATE public.orders o SET
        quote_wave_state = 'ambiguous',
        quote_wave_last_error = 'Linked Wave invoice approval is not durably confirmed'
      WHERE o.id = p_order_id;
      RETURN QUERY SELECT 'wait'::text, v_order.quote_wave_reservation_id, NULL::text;
    END IF;
    RETURN;
  END IF;

  IF v_order.status <> 'pending_payment' OR v_order.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_PAYABLE' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.quote_wave_state IN ('creating', 'ambiguous') THEN
    RETURN QUERY SELECT 'wait'::text, v_order.quote_wave_reservation_id, NULL::text;
    RETURN;
  END IF;

  v_reservation_id := gen_random_uuid();
  UPDATE public.orders o SET
    quote_wave_state = 'creating',
    quote_wave_reservation_id = v_reservation_id,
    quote_wave_reserved_at = now(),
    quote_wave_completed_at = NULL,
    quote_wave_last_error = NULL
  WHERE o.id = p_order_id;

  RETURN QUERY SELECT 'create'::text, v_reservation_id, NULL::text;
END;
$$;

-- Catalog checkout uses the existing locked checkout columns introduced for
-- quotes. A duplicate POST or pay-link GET resumes the one active session.
-- Stale/ambiguous creation is never recycled automatically because Clover may
-- have created a session before the application lost the response.
CREATE OR REPLACE FUNCTION public.reserve_order_checkout(p_order_id uuid)
RETURNS TABLE (
  checkout_action text,
  checkout_reservation_id uuid,
  checkout_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_reservation_id uuid;
BEGIN
  SELECT
    o.status, o.paid_at, o.quote_request_id,
    o.quote_wave_state, o.wave_invoice_id, o.wave_invoice_approved_at,
    o.quote_checkout_state, o.quote_checkout_reservation_id,
    o.quote_checkout_expires_at, o.quote_checkout_url
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF v_order.status <> 'pending_payment' OR v_order.paid_at IS NOT NULL OR
     v_order.quote_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_PAYABLE' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.quote_wave_state <> 'ready' OR
     NULLIF(btrim(v_order.wave_invoice_id), '') IS NULL OR
     v_order.wave_invoice_approved_at IS NULL THEN
    RAISE EXCEPTION 'ORDER_WAVE_NOT_READY' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.quote_checkout_state = 'ready' AND
     NULLIF(btrim(v_order.quote_checkout_url), '') IS NOT NULL AND
     v_order.quote_checkout_expires_at > now() THEN
    RETURN QUERY SELECT 'resume'::text, v_order.quote_checkout_reservation_id, v_order.quote_checkout_url;
    RETURN;
  END IF;

  IF v_order.quote_checkout_state = 'ambiguous' THEN
    RETURN QUERY SELECT 'wait'::text, v_order.quote_checkout_reservation_id, NULL::text;
    RETURN;
  END IF;

  IF v_order.quote_checkout_state = 'creating' THEN
    IF v_order.quote_checkout_expires_at IS NULL OR v_order.quote_checkout_expires_at <= now() THEN
      UPDATE public.orders o SET
        quote_checkout_state = 'ambiguous',
        quote_checkout_last_error = 'Clover checkout creation did not complete before its reservation expired'
      WHERE o.id = p_order_id;
    END IF;
    RETURN QUERY SELECT 'wait'::text, v_order.quote_checkout_reservation_id, NULL::text;
    RETURN;
  END IF;

  v_reservation_id := gen_random_uuid();
  UPDATE public.orders o SET
    payment_reference = o.id::text,
    quote_checkout_state = 'creating',
    quote_checkout_reservation_id = v_reservation_id,
    quote_checkout_reserved_at = now(),
    quote_checkout_expires_at = now() + interval '16 minutes',
    quote_checkout_url = NULL,
    quote_checkout_session_id = NULL,
    quote_checkout_last_error = NULL
  WHERE o.id = p_order_id;

  RETURN QUERY SELECT 'create'::text, v_reservation_id, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_order_checkout(
  p_order_id uuid,
  p_reservation_id uuid,
  p_checkout_url text,
  p_session_id text,
  p_expires_at timestamptz
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
  UPDATE public.orders o SET
    quote_checkout_state = 'ready',
    quote_checkout_url = p_checkout_url,
    quote_checkout_session_id = NULLIF(p_session_id, ''),
    quote_checkout_expires_at = p_expires_at,
    quote_checkout_last_error = NULL
  WHERE o.id = p_order_id AND o.status = 'pending_payment'
    AND o.quote_request_id IS NULL
    AND o.quote_wave_state = 'ready'
    AND NULLIF(btrim(o.wave_invoice_id), '') IS NOT NULL
    AND o.wave_invoice_approved_at IS NOT NULL
    AND o.quote_checkout_state = 'creating'
    AND o.quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_order_checkout(
  p_order_id uuid,
  p_reservation_id uuid,
  p_ambiguous boolean,
  p_error text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders o SET
    quote_checkout_state = CASE WHEN p_ambiguous THEN 'ambiguous' ELSE 'failed' END,
    quote_checkout_last_error = left(COALESCE(NULLIF(p_error, ''), 'Checkout creation failed'), 1000),
    quote_checkout_expires_at = CASE WHEN p_ambiguous
      THEN GREATEST(COALESCE(o.quote_checkout_expires_at, now()), now() + interval '16 minutes')
      ELSE now()
    END
  WHERE o.id = p_order_id AND o.status = 'pending_payment'
    AND o.quote_request_id IS NULL
    AND o.quote_checkout_state = 'creating'
    AND o.quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

-- Migration 100000 creates this function before Wave state columns exist.
-- Replace it here, after those columns are present, so no caller can finalize
-- a quote checkout unless accounting readiness is durably locked in.
CREATE OR REPLACE FUNCTION public.complete_quote_checkout_reservation(
  p_order_id uuid,
  p_reservation_id uuid,
  p_checkout_url text,
  p_session_id text,
  p_expires_at timestamptz
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
  UPDATE public.orders o SET
    quote_checkout_state = 'ready',
    quote_checkout_url = p_checkout_url,
    quote_checkout_session_id = NULLIF(p_session_id, ''),
    quote_checkout_expires_at = p_expires_at,
    quote_checkout_last_error = NULL
  WHERE o.id = p_order_id AND o.status = 'pending_payment'
    AND o.quote_request_id IS NOT NULL
    AND o.quote_wave_state = 'ready'
    AND NULLIF(btrim(o.wave_invoice_id), '') IS NOT NULL
    AND o.wave_invoice_approved_at IS NOT NULL
    AND o.quote_checkout_state = 'creating'
    AND o.quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

-- Links the approved invoice under the same order lock. Repeating completion
-- with the same invoice is safe; a different linked invoice is never replaced.
CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning(
  p_order_id uuid,
  p_reservation_id uuid,
  p_wave_invoice_id text,
  p_wave_invoice_number text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
BEGIN
  IF NULLIF(btrim(COALESCE(p_wave_invoice_id, '')), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_WAVE_PROVISIONING_RESULT' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    o.status, o.wave_invoice_id, o.wave_invoice_approved_at,
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

  IF v_order.wave_invoice_id IS NOT NULL OR v_order.status <> 'pending_payment' OR
     v_order.quote_wave_state <> 'creating' OR
     v_order.quote_wave_reservation_id IS DISTINCT FROM p_reservation_id THEN
    RETURN false;
  END IF;

  UPDATE public.orders o SET
    wave_invoice_id = p_wave_invoice_id,
    wave_invoice_number = NULLIF(btrim(p_wave_invoice_number), ''),
    wave_invoice_approved_at = now(),
    quote_wave_state = 'ready',
    quote_wave_completed_at = now(),
    quote_wave_last_error = NULL
  WHERE o.id = p_order_id;
  RETURN true;
END;
$$;

-- Ambiguous means a Wave API call may have succeeded and blocks automatic
-- retry. Failed is reserved for errors known to occur before any Wave call.
CREATE OR REPLACE FUNCTION public.fail_quote_wave_provisioning(
  p_order_id uuid,
  p_reservation_id uuid,
  p_ambiguous boolean,
  p_error text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT
    o.wave_invoice_id, o.wave_invoice_approved_at,
    o.quote_wave_state, o.quote_wave_reservation_id
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_order.wave_invoice_id IS NOT NULL AND
     v_order.wave_invoice_approved_at IS NOT NULL AND
     v_order.quote_wave_state = 'ready' THEN RETURN true; END IF;

  IF v_order.quote_wave_reservation_id IS DISTINCT FROM p_reservation_id OR
     v_order.quote_wave_state NOT IN ('creating', 'ambiguous', 'failed') THEN
    RETURN false;
  END IF;

  UPDATE public.orders o SET
    quote_wave_state = CASE
      WHEN o.quote_wave_state = 'ambiguous' OR p_ambiguous THEN 'ambiguous'
      ELSE 'failed'
    END,
    quote_wave_last_error = left(COALESCE(NULLIF(p_error, ''), 'Wave provisioning failed'), 1000)
  WHERE o.id = p_order_id;
  RETURN true;
END;
$$;

ALTER TABLE public.orders VALIDATE CONSTRAINT orders_quote_wave_state_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_quote_wave_ready_link_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_checkout_fingerprint_check;

REVOKE ALL ON FUNCTION public.reserve_quote_wave_provisioning(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_quote_wave_provisioning(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_quote_wave_provisioning(uuid, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_order_checkout(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_order_checkout(uuid, uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_order_checkout(uuid, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_quote_checkout_reservation(uuid, uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_quote_wave_provisioning(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_quote_wave_provisioning(uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_quote_wave_provisioning(uuid, uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_order_checkout(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_order_checkout(uuid, uuid, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_order_checkout(uuid, uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_quote_checkout_reservation(uuid, uuid, text, text, timestamptz) TO service_role;

COMMENT ON COLUMN public.orders.quote_wave_state IS
  'Order Wave provisioning state for quote and online checkout. Ambiguous/creating states require reconciliation and are never auto-retried.';
COMMENT ON COLUMN public.orders.quote_wave_reservation_id IS
  'Ownership token for the one request allowed to create and approve an order Wave invoice.';
COMMENT ON COLUMN public.orders.checkout_submission_id IS
  'Browser-generated idempotency key. One checkout submission may materialize at most one order.';
COMMENT ON COLUMN public.orders.checkout_request_fingerprint IS
  'Server-computed SHA-256 over the authoritative checkout payload; duplicate submission IDs must match it exactly.';
COMMENT ON COLUMN public.order_items.checkout_line_key IS
  'Deterministic browser-submission line key used to make concurrent catalog order item inserts idempotent.';
