\set ON_ERROR_STOP on

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY,
  name text,
  company text,
  email text
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  order_number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  total numeric NOT NULL,
  status text NOT NULL,
  paid_at timestamptz,
  payment_method text,
  is_archived boolean DEFAULT false,
  voided_at timestamptz,
  wave_invoice_id text,
  wave_invoice_number text,
  wave_invoice_approved_at timestamptz,
  wave_payment_recorded_at timestamptz,
  quote_wave_state text,
  quote_wave_reservation_id uuid,
  quote_wave_completed_at timestamptz,
  quote_wave_last_error text
);

CREATE TABLE public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  amount numeric NOT NULL,
  currency text NOT NULL,
  method text NOT NULL,
  status text NOT NULL,
  payer_name text,
  payer_company text,
  payer_email text,
  external_reference text,
  recorded_by text,
  recorded_at timestamptz,
  notes text,
  metadata jsonb
);

CREATE TABLE public.wave_payment_effect_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  effect_type text NOT NULL CHECK (effect_type IN ('receipt', 'ga4_purchase', 'brevo_payment_date')),
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wave_payment_effect_outbox_order_effect_uidx UNIQUE (order_id, effect_type)
);

\ir ../migrations/20260915141000_wave_provider_payment_recovery.sql

INSERT INTO public.customers (id, name, email)
VALUES ('10000000-0000-4000-8000-000000000001', 'Test Customer', 'customer@example.com');

-- A created invoice is retained before approval and only that identity may finish.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, payment_method,
  quote_wave_state, quote_wave_reservation_id
) VALUES (
  '20000000-0000-4000-8000-000000000001', 'TC-PROVISIONAL',
  '10000000-0000-4000-8000-000000000001', 111, 'pending_payment', 'clover_card',
  'creating', '30000000-0000-4000-8000-000000000001'
);

DO $$
BEGIN
  IF NOT public.record_quote_wave_provisional(
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001', 'invoice-retained', '4001'
  ) THEN RAISE EXCEPTION 'provisional identity was not retained'; END IF;
  IF public.record_quote_wave_provisional(
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001', 'invoice-other', '4002'
  ) THEN RAISE EXCEPTION 'different provisional identity was accepted'; END IF;
  IF NOT public.complete_quote_wave_provisioning(
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001', 'invoice-retained', '4001'
  ) THEN RAISE EXCEPTION 'retained identity could not complete'; END IF;
END
$$;

-- A Clover-intended order can receive a real Wave Payments capture. A partial
-- remains pending and does not receive the full-payment timestamp or effects.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000002', 'TC-SPLIT',
  '10000000-0000-4000-8000-000000000001', 100, 'pending_payment', 'clover_card', 'invoice-split'
);

DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-split', 'payment-partial', 4000, '2026-09-15T12:00:00Z', 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', true, true
  );
  IF r.outcome <> 'partial' OR r.source_payment_method <> 'clover_card' OR
     r.actual_payment_provider <> 'wave_payments' OR r.amount_paid_cents <> 4000 OR
     r.balance_due_cents <> 6000 THEN
    RAISE EXCEPTION 'partial result is wrong: %', row_to_json(r);
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = r.order_id AND
      (o.status <> 'pending_payment' OR o.paid_at IS NOT NULL OR o.wave_payment_recorded_at IS NOT NULL)
  ) THEN RAISE EXCEPTION 'partial payment granted full-paid state'; END IF;
  IF EXISTS (SELECT 1 FROM public.wave_payment_effect_outbox e WHERE e.order_id = r.order_id) THEN
    RAISE EXCEPTION 'partial payment queued full-paid effects';
  END IF;

  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-split', 'payment-partial', 4000, '2026-09-15T12:00:00Z', 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', true, true
  );
  IF r.outcome <> 'partial' OR (SELECT count(*) FROM public.order_payments WHERE order_id = r.order_id) <> 1 THEN
    RAISE EXCEPTION 'duplicate partial was counted twice';
  END IF;

  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-split', 'payment-final', 6000, '2026-09-15T12:05:00Z', 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', true, true
  );
  IF r.outcome <> 'transitioned' OR NOT r.payment_transitioned OR r.balance_due_cents <> 0 THEN
    RAISE EXCEPTION 'full transition failed: %', row_to_json(r);
  END IF;
  IF (SELECT count(*) FROM public.order_payments WHERE order_id = r.order_id) <> 2 OR
     (SELECT count(*) FROM public.wave_payment_effect_outbox WHERE order_id = r.order_id) <> 4 THEN
    RAISE EXCEPTION 'full payment ledger/effects are not idempotent';
  END IF;
END
$$;

-- Null or manual traits can never enter the ledger through the SQL boundary.
DO $$
BEGIN
  BEGIN
    PERFORM public.accept_wave_provider_payment(
      'invoice-split', 'payment-unverified', 1000, now(), 'OTHER',
      NULL, 'PAID', 'WPP', 'SALE', false, false
    );
    RAISE EXCEPTION 'null origin was accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'WAVE_PROVIDER_PAYMENT_UNVERIFIED' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.accept_wave_provider_payment(
      'invoice-split', 'payment-manual', 1000, now(), 'OTHER',
      'BUSINESS', 'PAID', 'MANUAL', 'SALE', false, false
    );
    RAISE EXCEPTION 'manual bookkeeping was accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'WAVE_PROVIDER_PAYMENT_UNVERIFIED' THEN RAISE; END IF;
  END;
END
$$;

-- Overpayment is retained as evidence and surfaced, without changing order total.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000003', 'TC-OVER',
  '10000000-0000-4000-8000-000000000001', 100, 'pending_payment', 'wave', 'invoice-over'
);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-over', 'payment-over', 10500, now(), 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', false, false
  );
  IF r.outcome <> 'overpaid' OR r.amount_paid_cents <> 10500 OR r.balance_due_cents <> 0 THEN
    RAISE EXCEPTION 'overpayment result is wrong: %', row_to_json(r);
  END IF;
END
$$;

-- A retired invoice-level synthetic ledger row must hold reconciliation so a
-- provider payment cannot be counted on top of the same money.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, paid_at, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000006', 'TC-LEGACY',
  '10000000-0000-4000-8000-000000000001', 25, 'payment_received', now(), 'wave', 'invoice-legacy'
);
INSERT INTO public.order_payments (
  order_id, amount, currency, method, status, external_reference, metadata
) VALUES (
  '20000000-0000-4000-8000-000000000006', 25, 'CAD', 'wave', 'recorded',
  'invoice-legacy', '{"source":"invoice.paid"}'::jsonb
);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-legacy', 'payment-legacy-real', 2500, now(), 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', false, false
  );
  IF r.outcome <> 'ledger_conflict' OR
     (SELECT count(*) FROM public.order_payments WHERE order_id = r.order_id) <> 1 THEN
    RAISE EXCEPTION 'legacy synthetic payment was counted twice';
  END IF;
END
$$;

-- Reusing one provider payment against another order is a held conflict.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000004', 'TC-CONFLICT',
  '10000000-0000-4000-8000-000000000001', 40, 'pending_payment', 'wave', 'invoice-conflict'
);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.accept_wave_provider_payment(
    'invoice-conflict', 'payment-partial', 4000, now(), 'CREDIT_CARD',
    'CUSTOMER', 'PAID', 'WPP', 'SALE', false, false
  );
  IF r.outcome <> 'ledger_conflict' OR
     EXISTS (SELECT 1 FROM public.order_payments WHERE order_id = r.order_id) THEN
    RAISE EXCEPTION 'cross-order provider payment conflict was not held';
  END IF;
END
$$;

-- Historical readback may request a staff effect while customer effects stay suppressed.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, paid_at, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000005', 'TC-HISTORIC',
  '10000000-0000-4000-8000-000000000001', 50, 'payment_received', now(), 'clover_card', 'invoice-historic'
);
SELECT * FROM public.accept_wave_provider_payment(
  'invoice-historic', 'payment-historic', 5000, now(), 'CREDIT_CARD',
  'CUSTOMER', 'PAID', 'WPP', 'SALE', false, true
);
DO $$
BEGIN
  IF (SELECT array_agg(effect_type ORDER BY effect_type) FROM public.wave_payment_effect_outbox
      WHERE order_id = '20000000-0000-4000-8000-000000000005') IS DISTINCT FROM ARRAY['staff_paid']::text[] THEN
    RAISE EXCEPTION 'historical customer effects were not suppressed';
  END IF;
END
$$;

-- A late Wave capture on an order already paid elsewhere is real ledger
-- evidence, but must not synthesize a second customer receipt or purchase.
INSERT INTO public.orders (
  id, order_number, customer_id, total, status, paid_at, payment_method, wave_invoice_id
) VALUES (
  '20000000-0000-4000-8000-000000000007', 'TC-ALREADY-PAID',
  '10000000-0000-4000-8000-000000000001', 30, 'payment_received', now(), 'clover_card', 'invoice-already-paid'
);
SELECT * FROM public.accept_wave_provider_payment(
  'invoice-already-paid', 'payment-already-paid', 3000, now(), 'CREDIT_CARD',
  'CUSTOMER', 'PAID', 'WPP', 'SALE', true, true
);
DO $$
BEGIN
  IF (SELECT array_agg(effect_type ORDER BY effect_type) FROM public.wave_payment_effect_outbox
      WHERE order_id = '20000000-0000-4000-8000-000000000007') IS DISTINCT FROM ARRAY['staff_paid']::text[] THEN
    RAISE EXCEPTION 'already-paid order received duplicate customer effects';
  END IF;
END
$$;

SELECT 'wave provider payment recovery SQL regression passed' AS result;

ROLLBACK;
