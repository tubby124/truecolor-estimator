\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END;
$roles$;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  status text NOT NULL,
  paid_at timestamptz,
  conversion_type text,
  gclid text,
  gbraid text,
  wbraid text,
  latest_paid_gclid text,
  latest_paid_gbraid text,
  latest_paid_wbraid text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  gst numeric(12,2) NOT NULL DEFAULT 0,
  pst numeric(12,2) NOT NULL DEFAULT 0
);

\ir ../../../supabase/migrations/20260720110000_google_ads_conversion_outbox.sql
\ir ../../../supabase/migrations/20260722154500_google_ads_outbox_null_guard.sql
\ir ../../../supabase/migrations/20260723123000_google_data_manager_diagnostics.sql

DO $regression$
DECLARE
  v_legacy_id uuid;
  v_paid_id uuid;
  v_count bigint;
BEGIN
  INSERT INTO public.orders (order_number, status, conversion_type, total, gst, pst)
  VALUES ('NULL-GUARD-LEGACY', 'pending_payment', NULL, 113.00, 5.00, 8.00)
  RETURNING id INTO v_legacy_id;

  -- Exact production-incident shape: a legacy/manual order becomes paid while
  -- conversion_type remains NULL. The trigger must return without inserting.
  UPDATE public.orders
  SET status = 'payment_received',
      paid_at = now()
  WHERE id = v_legacy_id;

  SELECT count(*) INTO v_count
  FROM public.google_ads_conversion_outbox
  WHERE order_id = v_legacy_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'NULL conversion_type created % outbox rows; expected 0', v_count;
  END IF;

  INSERT INTO public.orders (
    order_number, status, conversion_type, latest_paid_gclid, total, gst, pst
  )
  VALUES (
    'NULL-GUARD-PAID', 'pending_payment', 'purchase_online', 'test-gclid', 113.00, 5.00, 8.00
  )
  RETURNING id INTO v_paid_id;

  UPDATE public.orders
  SET status = 'payment_received',
      paid_at = now()
  WHERE id = v_paid_id;

  SELECT count(*) INTO v_count
  FROM public.google_ads_conversion_outbox
  WHERE order_id = v_paid_id
    AND conversion_type = 'purchase_online'
    AND conversion_value = 100.00
    AND status = 'pending';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'valid paid conversion created % matching rows; expected 1', v_count;
  END IF;

  -- Confirmation reloads/webhook retries can update the same paid state. The
  -- order-level unique key plus ON CONFLICT must keep revenue exactly once.
  UPDATE public.orders
  SET status = 'payment_received'
  WHERE id = v_paid_id;

  SELECT count(*) INTO v_count
  FROM public.google_ads_conversion_outbox
  WHERE order_id = v_paid_id;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'duplicate paid update created % outbox rows; expected 1', v_count;
  END IF;
END;
$regression$;

SELECT 'google_ads_outbox_trigger_regression_passed' AS result;
