-- Durable quote-to-order linkage and paid-search conversion measurement.
-- Deploy this migration before application code that calls the RPCs below.
-- Existing customer/order rows remain unchanged except for the explicit quote
-- lifecycle backfill near the end of this file.

-- Bound lock-sensitive DDL for the complete migration transaction.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL OR
     to_regclass('public.order_items') IS NULL OR
     to_regclass('public.customers') IS NULL OR
     to_regclass('public.quote_requests') IS NULL OR
     to_regclass('public.payment_attempts') IS NULL THEN
    RAISE EXCEPTION 'quote conversion migration preflight failed: required commerce tables are missing';
  END IF;
END $$;

-- Authoritative quote tax configuration. Quote revisions persist the rates used
-- so historical totals remain reproducible if legislation changes later.
CREATE TABLE IF NOT EXISTS public.truecolor_tax_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  gst_rate numeric(8,6) NOT NULL CHECK (gst_rate >= 0 AND gst_rate <= 1),
  pst_rate numeric(8,6) NOT NULL CHECK (pst_rate >= 0 AND pst_rate <= 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.truecolor_tax_config (id, gst_rate, pst_rate)
VALUES (true, 0.05, 0.06)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.truecolor_tax_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quote_measurement_event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  event_name text NOT NULL CHECK (event_name IN ('quote_submit', 'quote_qualified')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'dead')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_measurement_event_outbox_event_uidx UNIQUE (quote_id, event_name)
);
ALTER TABLE public.quote_measurement_event_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enqueue_quote_submit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.quote_measurement_event_outbox (quote_id, event_name)
  VALUES (NEW.id, 'quote_submit')
  ON CONFLICT (quote_id, event_name) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_enqueue_submit_event ON public.quote_requests;
CREATE TRIGGER quote_requests_enqueue_submit_event
AFTER INSERT ON public.quote_requests FOR EACH ROW
EXECUTE FUNCTION public.enqueue_quote_submit_event();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversion_type text,
  ADD COLUMN IF NOT EXISTS conversion_key text,
  ADD COLUMN IF NOT EXISTS quote_revision integer,
  ADD COLUMN IF NOT EXISTS quote_checkout_state text,
  ADD COLUMN IF NOT EXISTS quote_checkout_reservation_id uuid,
  ADD COLUMN IF NOT EXISTS quote_checkout_reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_checkout_url text,
  ADD COLUMN IF NOT EXISTS quote_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS quote_checkout_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_checkout_last_error text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_source text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_medium text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_campaign text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_content text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_term text,
  ADD COLUMN IF NOT EXISTS latest_paid_gclid text,
  ADD COLUMN IF NOT EXISTS latest_paid_gbraid text,
  ADD COLUMN IF NOT EXISTS latest_paid_wbraid text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_keyword text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_matchtype text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_device text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_loc_physical_ms text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_loc_interest_ms text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_adgroup_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_creative_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_campaign_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_network text,
  ADD COLUMN IF NOT EXISTS latest_paid_touch_captured_at timestamptz;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_subtotal_cents integer,
  ADD COLUMN IF NOT EXISTS quote_gst_cents integer,
  ADD COLUMN IF NOT EXISTS quote_pst_cents integer,
  ADD COLUMN IF NOT EXISTS quote_line_items jsonb,
  ADD COLUMN IF NOT EXISTS quote_gst_rate numeric(8,6),
  ADD COLUMN IF NOT EXISTS quote_pst_rate numeric(8,6),
  ADD COLUMN IF NOT EXISTS quote_revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_source text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_medium text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_campaign text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_content text,
  ADD COLUMN IF NOT EXISTS latest_paid_utm_term text,
  ADD COLUMN IF NOT EXISTS latest_paid_gclid text,
  ADD COLUMN IF NOT EXISTS latest_paid_gbraid text,
  ADD COLUMN IF NOT EXISTS latest_paid_wbraid text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_keyword text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_matchtype text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_device text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_loc_physical_ms text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_loc_interest_ms text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_adgroup_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_creative_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_campaign_id text,
  ADD COLUMN IF NOT EXISTS latest_paid_google_network text,
  ADD COLUMN IF NOT EXISTS latest_paid_touch_captured_at timestamptz;

CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents(p_line_items jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  -- Saskatchewan PST-20 taxes the full charge for taxable printed material,
  -- including design, materials, printing, rush, and installation components.
  SELECT COALESCE(sum(
    round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer
  ), 0)::integer
  FROM jsonb_array_elements(p_line_items) AS lines(item)
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_conversion_type_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_conversion_type_check
      CHECK (conversion_type IS NULL OR conversion_type IN ('purchase_online', 'quote_won')) NOT VALID;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quote_requests_lifecycle_status_check'
      AND conrelid = 'public.quote_requests'::regclass
      AND pg_get_constraintdef(oid) NOT LIKE '%archived%'
  ) THEN
    ALTER TABLE public.quote_requests DROP CONSTRAINT quote_requests_lifecycle_status_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_requests_lifecycle_status_check' AND conrelid = 'public.quote_requests'::regclass) THEN
    ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_lifecycle_status_check
      CHECK (lifecycle_status IN ('requested', 'quoted', 'checkout_started', 'won', 'lost', 'archived')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_requests_quote_amounts_check' AND conrelid = 'public.quote_requests'::regclass) THEN
    ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_quote_amounts_check
      CHECK (
        (quote_total_cents IS NULL OR quote_total_cents > 0) AND
        (quote_subtotal_cents IS NULL OR quote_subtotal_cents >= 0) AND
        (quote_gst_cents IS NULL OR quote_gst_cents >= 0) AND
        (quote_pst_cents IS NULL OR quote_pst_cents >= 0) AND
        (
          quote_total_cents IS NULL OR
          quote_subtotal_cents IS NULL OR
          quote_gst_cents IS NULL OR
          quote_pst_cents IS NULL OR
          quote_total_cents = quote_subtotal_cents + quote_gst_cents + quote_pst_cents
        )
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_requests_quote_totals_reconcile_check' AND conrelid = 'public.quote_requests'::regclass) THEN
    ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_quote_totals_reconcile_check
      CHECK (
        quote_total_cents IS NULL OR quote_subtotal_cents IS NULL OR
        quote_gst_cents IS NULL OR quote_pst_cents IS NULL OR
        quote_total_cents = quote_subtotal_cents + quote_gst_cents + quote_pst_cents
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_requests_tax_formula_check' AND conrelid = 'public.quote_requests'::regclass) THEN
    ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_tax_formula_check
      CHECK (
        quote_total_cents IS NULL OR quote_revision = 0 OR (
          quote_line_items IS NOT NULL AND quote_gst_rate IS NOT NULL AND quote_pst_rate IS NOT NULL AND
          quote_gst_cents = round(quote_subtotal_cents * quote_gst_rate)::integer AND
          quote_pst_cents = round(public.structured_quote_pst_base_cents(quote_line_items) * quote_pst_rate)::integer
        )
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_quote_checkout_state_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_quote_checkout_state_check
      CHECK (quote_checkout_state IS NULL OR quote_checkout_state IN ('creating', 'ready', 'ambiguous', 'failed')) NOT VALID;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.materialize_quote_order(uuid, integer);
DROP FUNCTION IF EXISTS public.materialize_quote_order(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.complete_quote_checkout_reservation(uuid, uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.fail_quote_checkout_reservation(uuid, uuid, boolean, text);

DO $$
BEGIN
  IF EXISTS (SELECT quote_request_id FROM public.orders WHERE quote_request_id IS NOT NULL GROUP BY quote_request_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'quote conversion migration preflight failed: duplicate orders.quote_request_id values';
  END IF;
  IF EXISTS (SELECT converted_order_id FROM public.quote_requests WHERE converted_order_id IS NOT NULL GROUP BY converted_order_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'quote conversion migration preflight failed: duplicate quote_requests.converted_order_id values';
  END IF;
  IF EXISTS (SELECT conversion_key FROM public.orders WHERE conversion_key IS NOT NULL GROUP BY conversion_key HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'quote conversion migration preflight failed: duplicate orders.conversion_key values';
  END IF;
  IF EXISTS (
    SELECT lower(email) FROM public.customers WHERE email IS NOT NULL
    GROUP BY lower(email) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'quote conversion migration preflight failed: case-insensitive duplicate customers.email values';
  END IF;
END $$;

-- Supabase migrations run in a transaction, so CREATE INDEX CONCURRENTLY is not
-- available. Production was measured at orders=137, quote_requests=71, and
-- customers=132 before this migration. Refuse the regular-index path if any
-- table has grown beyond the reviewed small-table envelope, and bound lock time.
DO $$
DECLARE
  v_orders_count bigint;
  v_quotes_count bigint;
  v_customers_count bigint;
BEGIN
  SELECT count(*) INTO v_orders_count FROM public.orders;
  SELECT count(*) INTO v_quotes_count FROM public.quote_requests;
  SELECT count(*) INTO v_customers_count FROM public.customers;
  IF v_orders_count > 10000 OR v_quotes_count > 10000 OR v_customers_count > 10000 THEN
    RAISE EXCEPTION
      'quote conversion index safety gate failed: orders=%, quote_requests=%, customers=%; review a non-transactional concurrent index rollout',
      v_orders_count, v_quotes_count, v_customers_count;
  END IF;
  RAISE NOTICE 'quote conversion index safety gate: orders=%, quote_requests=%, customers=%',
    v_orders_count, v_quotes_count, v_customers_count;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_quote_request_id_uidx
  ON public.orders (quote_request_id) WHERE quote_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_conversion_key_uidx
  ON public.orders (conversion_key) WHERE conversion_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_converted_order_id_uidx
  ON public.quote_requests (converted_order_id) WHERE converted_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_latest_paid_gclid_idx
  ON public.orders (latest_paid_gclid) WHERE latest_paid_gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_requests_latest_paid_gclid_idx
  ON public.quote_requests (latest_paid_gclid) WHERE latest_paid_gclid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_uidx
  ON public.customers (lower(email));

CREATE OR REPLACE FUNCTION public.validate_structured_quote_items(
  p_line_items jsonb,
  p_subtotal_cents integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_description text;
  v_qty numeric;
  v_unit_price numeric;
  v_sum_cents integer := 0;
BEGIN
  IF jsonb_typeof(p_line_items) <> 'array' OR jsonb_array_length(p_line_items) = 0 THEN
    RAISE EXCEPTION 'STRUCTURED_QUOTE_ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_line_items)
  LOOP
    v_description := btrim(COALESCE(v_item->>'description', ''));
    IF v_description = '' OR length(v_description) > 200 OR
       COALESCE(v_item->>'qty', '') !~ '^[0-9]+$' OR
       COALESCE(v_item->>'unitPrice', '') !~ '^([0-9]+)(\.[0-9]{1,2})?$' OR
       COALESCE(v_item->>'taxClass', '') NOT IN ('printed_good', 'design_service', 'rush_service', 'installation_service') THEN
      RAISE EXCEPTION 'INVALID_STRUCTURED_QUOTE_ITEM' USING ERRCODE = 'P0001';
    END IF;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    IF v_qty <= 0 OR v_unit_price < 0 THEN
      RAISE EXCEPTION 'INVALID_STRUCTURED_QUOTE_ITEM' USING ERRCODE = 'P0001';
    END IF;
    v_sum_cents := v_sum_cents + round(v_qty * v_unit_price * 100)::integer;
  END LOOP;
  IF v_sum_cents <> p_subtotal_cents THEN
    RAISE EXCEPTION 'QUOTE_ITEMS_DO_NOT_RECONCILE' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- Internal helper. Callers must already hold the order row lock. It validates
-- every structured line and replaces the linked order items in the same tx.
CREATE OR REPLACE FUNCTION public.replace_quote_order_items(
  p_order_id uuid,
  p_line_items jsonb,
  p_subtotal_cents integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_description text;
  v_qty numeric;
  v_unit_price numeric;
  v_line_total numeric;
  v_sum_cents integer := 0;
BEGIN
  IF jsonb_typeof(p_line_items) <> 'array' OR jsonb_array_length(p_line_items) = 0 THEN
    RAISE EXCEPTION 'STRUCTURED_QUOTE_ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_line_items)
  LOOP
    v_description := btrim(COALESCE(v_item->>'description', ''));
    IF v_description = '' OR length(v_description) > 200 OR
       COALESCE(v_item->>'qty', '') !~ '^[0-9]+$' OR
       COALESCE(v_item->>'unitPrice', '') !~ '^([0-9]+)(\.[0-9]{1,2})?$' OR
       COALESCE(v_item->>'taxClass', '') NOT IN ('printed_good', 'design_service', 'rush_service', 'installation_service') THEN
      RAISE EXCEPTION 'INVALID_STRUCTURED_QUOTE_ITEM' USING ERRCODE = 'P0001';
    END IF;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    IF v_qty <= 0 OR v_unit_price < 0 THEN
      RAISE EXCEPTION 'INVALID_STRUCTURED_QUOTE_ITEM' USING ERRCODE = 'P0001';
    END IF;
    v_sum_cents := v_sum_cents + round(v_qty * v_unit_price * 100)::integer;
  END LOOP;

  IF v_sum_cents <> p_subtotal_cents THEN
    RAISE EXCEPTION 'QUOTE_ITEMS_DO_NOT_RECONCILE' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.order_items WHERE order_id = p_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_line_items)
  LOOP
    v_description := btrim(v_item->>'description');
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);
    INSERT INTO public.order_items (
      order_id, category, product_name, qty, sides, addons, is_rush,
      design_status, unit_price, line_total, line_items_json
    ) VALUES (
      p_order_id,
      CASE WHEN v_item->>'taxClass' = 'printed_good' THEN 'MANUAL' ELSE 'SERVICE' END,
      v_description,
      v_qty,
      1,
      ARRAY[]::text[],
      v_item->>'taxClass' = 'rush_service',
      CASE WHEN v_item->>'taxClass' = 'design_service' THEN 'FULL_DESIGN' ELSE 'PRINT_READY' END,
      round(v_unit_price, 2),
      v_line_total,
      v_item
    );
  END LOOP;
END;
$$;

-- Transactionally stores a structured quote revision. When a linked order is
-- still unpaid/pending it is repriced and its item rows repaired atomically.
-- Paid or progressed orders are immutable and make the entire revision fail.
CREATE OR REPLACE FUNCTION public.set_structured_quote_pricing(
  p_quote_id uuid,
  p_total_cents integer,
  p_subtotal_cents integer,
  p_gst_cents integer,
  p_pst_cents integer,
  p_description text,
  p_line_items jsonb
)
RETURNS TABLE (converted_order_id uuid, order_repriced boolean, quote_revision integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote record;
  v_order_id uuid;
  v_order_paid_at timestamptz;
  v_order_status text;
  v_order_payment_reference text;
  v_revision integer;
  v_gst_rate numeric(8,6);
  v_pst_rate numeric(8,6);
  v_expected_gst integer;
  v_expected_pst integer;
  v_is_rush boolean;
BEGIN
  IF p_total_cents <= 0 OR p_subtotal_cents < 0 OR p_gst_cents < 0 OR p_pst_cents < 0 OR
     p_total_cents <> p_subtotal_cents + p_gst_cents + p_pst_cents OR
     btrim(COALESCE(p_description, '')) = '' OR length(p_description) > 200 THEN
    RAISE EXCEPTION 'QUOTE_TOTALS_DO_NOT_RECONCILE' USING ERRCODE = 'P0001';
  END IF;
  PERFORM public.validate_structured_quote_items(p_line_items, p_subtotal_cents);
  -- Preserve structured service semantics when a revision repairs an unpaid order.
  v_is_rush := EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)
    WHERE item->>'taxClass' = 'rush_service'
  );
  SELECT gst_rate, pst_rate INTO v_gst_rate, v_pst_rate
  FROM public.truecolor_tax_config WHERE id = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_TAX_CONFIG_MISSING' USING ERRCODE = 'P0001'; END IF;
  v_expected_gst := round(p_subtotal_cents * v_gst_rate)::integer;
  v_expected_pst := round(public.structured_quote_pst_base_cents(p_line_items) * v_pst_rate)::integer;
  IF p_gst_cents <> v_expected_gst OR p_pst_cents <> v_expected_pst THEN
    RAISE EXCEPTION 'QUOTE_TAX_FORMULA_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  SELECT q.id, q.quote_revision, q.converted_order_id INTO v_quote
  FROM public.quote_requests q WHERE q.id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  v_revision := v_quote.quote_revision + 1;

  -- Find either side of the linkage so this call can repair a one-sided write.
  SELECT o.id, o.paid_at, o.status, o.payment_reference
  INTO v_order_id, v_order_paid_at, v_order_status, v_order_payment_reference
  FROM public.orders o
   WHERE o.quote_request_id = p_quote_id OR o.id = v_quote.converted_order_id
   ORDER BY (o.quote_request_id = p_quote_id) DESC
   LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_order_paid_at IS NOT NULL OR v_order_status <> 'pending_payment' THEN
      RAISE EXCEPTION 'PAID_QUOTE_IMMUTABLE' USING ERRCODE = 'P0001';
    END IF;
    IF v_order_payment_reference IS NOT NULL OR EXISTS (
      SELECT 1 FROM public.payment_attempts pa WHERE pa.order_id = v_order_id
    ) THEN
      RAISE EXCEPTION 'QUOTE_CHECKOUT_ALREADY_OPENED' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.orders SET
      quote_request_id = p_quote_id,
      is_rush = v_is_rush,
      subtotal = p_subtotal_cents / 100.0,
      gst = p_gst_cents / 100.0,
      pst = p_pst_cents / 100.0,
      total = p_total_cents / 100.0,
      conversion_type = 'quote_won',
      conversion_key = 'quote_won:' || p_quote_id::text,
      quote_revision = v_revision
    WHERE id = v_order_id;
    PERFORM public.replace_quote_order_items(v_order_id, p_line_items, p_subtotal_cents);
  END IF;

  UPDATE public.quote_requests SET
    quote_total_cents = p_total_cents,
    quote_subtotal_cents = p_subtotal_cents,
    quote_gst_cents = p_gst_cents,
    quote_pst_cents = p_pst_cents,
    quote_total_description = left(p_description, 200),
    quote_line_items = p_line_items,
    quote_gst_rate = v_gst_rate,
    quote_pst_rate = v_pst_rate,
    quote_revision = v_revision,
    converted_order_id = COALESCE(v_order_id, quote_requests.converted_order_id)
  WHERE id = p_quote_id
  RETURNING quote_requests.quote_revision INTO v_revision;

  RETURN QUERY SELECT v_order_id, v_order_id IS NOT NULL, v_revision;
END;
$$;

-- Materializes exactly one order for a quote under row locks. Duplicate POSTs
-- reuse and repair the same pending order; no client-side insert/link sequence.
CREATE OR REPLACE FUNCTION public.materialize_quote_order(
  p_quote_id uuid,
  p_signed_amount_cents integer,
  p_signed_quote_revision integer
)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  order_status text,
  total_cents integer,
  checkout_action text,
  checkout_reservation_id uuid,
  checkout_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote record;
  v_order record;
  v_customer_id uuid;
  v_order_number text;
  v_order_id uuid;
  v_next integer;
  v_item_count integer;
  v_item_sum_cents integer;
  v_checkout_action text := 'wait';
  v_checkout_reservation_id uuid;
  v_checkout_url text;
  v_is_rush boolean;
BEGIN
  SELECT
    q.id, q.is_archived, q.lifecycle_status, q.quote_total_cents,
    q.quote_subtotal_cents, q.quote_gst_cents, q.quote_pst_cents,
    q.quote_line_items, q.quote_gst_rate, q.quote_pst_rate, q.quote_revision, q.converted_order_id,
    q.email, q.name, q.phone,
    q.utm_source, q.utm_medium, q.utm_campaign, q.utm_content, q.utm_term,
    q.gclid, q.gbraid, q.wbraid, q.google_keyword, q.google_matchtype,
    q.google_device, q.google_loc_physical_ms, q.google_loc_interest_ms,
    q.google_adgroup_id, q.google_creative_id, q.google_campaign_id, q.google_network,
    q.latest_paid_utm_source, q.latest_paid_utm_medium, q.latest_paid_utm_campaign,
    q.latest_paid_utm_content, q.latest_paid_utm_term, q.latest_paid_gclid,
    q.latest_paid_gbraid, q.latest_paid_wbraid, q.latest_paid_google_keyword,
    q.latest_paid_google_matchtype, q.latest_paid_google_device,
    q.latest_paid_google_loc_physical_ms, q.latest_paid_google_loc_interest_ms,
    q.latest_paid_google_adgroup_id, q.latest_paid_google_creative_id,
    q.latest_paid_google_campaign_id, q.latest_paid_google_network,
    q.latest_paid_touch_captured_at
  INTO v_quote
  FROM public.quote_requests q WHERE q.id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF v_quote.is_archived OR v_quote.lifecycle_status IN ('archived', 'lost') THEN
    RAISE EXCEPTION 'QUOTE_NOT_PAYABLE' USING ERRCODE = 'P0001';
  END IF;
  IF v_quote.quote_total_cents IS NULL OR v_quote.quote_subtotal_cents IS NULL OR
     v_quote.quote_gst_cents IS NULL OR v_quote.quote_pst_cents IS NULL OR
     v_quote.quote_line_items IS NULL OR v_quote.quote_gst_rate IS NULL OR v_quote.quote_pst_rate IS NULL OR
     v_quote.quote_total_cents <> v_quote.quote_subtotal_cents + v_quote.quote_gst_cents + v_quote.quote_pst_cents OR
     v_quote.quote_gst_cents <> round(v_quote.quote_subtotal_cents * v_quote.quote_gst_rate)::integer OR
     v_quote.quote_pst_cents <> round(public.structured_quote_pst_base_cents(v_quote.quote_line_items) * v_quote.quote_pst_rate)::integer THEN
    RAISE EXCEPTION 'STRUCTURED_QUOTE_PRICING_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF v_quote.quote_total_cents <> p_signed_amount_cents THEN
    RAISE EXCEPTION 'STALE_QUOTE_PAYMENT_LINK' USING ERRCODE = 'P0001';
  END IF;
  IF p_signed_quote_revision <= 0 OR v_quote.quote_revision <> p_signed_quote_revision THEN
    RAISE EXCEPTION 'STALE_QUOTE_REVISION' USING ERRCODE = 'P0001';
  END IF;
  -- The order-level rush flag is derived from the stored structured revision,
  -- never from payment input or free-form descriptions.
  v_is_rush := EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_quote.quote_line_items) AS lines(item)
    WHERE item->>'taxClass' = 'rush_service'
  );

  SELECT o.id, o.order_number, o.status, o.total, o.paid_at, o.payment_reference,
    o.quote_revision, o.quote_checkout_state, o.quote_checkout_reservation_id,
    o.quote_checkout_expires_at, o.quote_checkout_url
  INTO v_order FROM public.orders o
   WHERE o.quote_request_id = p_quote_id OR o.id = v_quote.converted_order_id
   ORDER BY (o.quote_request_id = p_quote_id) DESC
   LIMIT 1 FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.customers (email, name, phone)
      VALUES (lower(btrim(v_quote.email)), btrim(v_quote.name), v_quote.phone)
      ON CONFLICT DO NOTHING;
    SELECT id INTO v_customer_id FROM public.customers
      WHERE lower(email) = lower(btrim(v_quote.email));
    IF v_customer_id IS NULL THEN RAISE EXCEPTION 'QUOTE_CUSTOMER_CREATE_FAILED' USING ERRCODE = 'P0001'; END IF;

    PERFORM pg_advisory_xact_lock(hashtext('truecolor-order-number-' || extract(year FROM now())::text));
    SELECT COALESCE(max(split_part(o.order_number, '-', 3)::integer), 0) + 1
      INTO v_next FROM public.orders o
      WHERE o.order_number ~ ('^TC-' || extract(year FROM now())::integer::text || '-[0-9]+$');
    v_order_number := 'TC-' || extract(year FROM now())::integer::text || '-' || lpad(v_next::text, 4, '0');
    v_order_id := gen_random_uuid();

    INSERT INTO public.orders (
      id, order_number, customer_id, status, is_rush, subtotal, gst, pst, total,
      payment_method, quote_request_id, conversion_type, conversion_key, quote_revision, notes,
      payment_reference, quote_checkout_state, quote_checkout_reservation_id,
      quote_checkout_reserved_at, quote_checkout_expires_at,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      gclid, gbraid, wbraid, google_keyword, google_matchtype, google_device,
      google_loc_physical_ms, google_loc_interest_ms, google_adgroup_id,
      google_creative_id, google_campaign_id, google_network,
      latest_paid_utm_source, latest_paid_utm_medium, latest_paid_utm_campaign,
      latest_paid_utm_content, latest_paid_utm_term, latest_paid_gclid,
      latest_paid_gbraid, latest_paid_wbraid, latest_paid_google_keyword,
      latest_paid_google_matchtype, latest_paid_google_device,
      latest_paid_google_loc_physical_ms, latest_paid_google_loc_interest_ms,
      latest_paid_google_adgroup_id, latest_paid_google_creative_id,
      latest_paid_google_campaign_id, latest_paid_google_network,
      latest_paid_touch_captured_at
    ) VALUES (
      v_order_id, v_order_number, v_customer_id, 'pending_payment', v_is_rush,
      v_quote.quote_subtotal_cents / 100.0, v_quote.quote_gst_cents / 100.0,
      v_quote.quote_pst_cents / 100.0, v_quote.quote_total_cents / 100.0,
      'clover_card', p_quote_id, 'quote_won', 'quote_won:' || p_quote_id::text, v_quote.quote_revision,
      'Converted from website quote ' || upper(left(p_quote_id::text, 8)),
      v_order_id::text, 'creating', gen_random_uuid(), now(), now() + interval '16 minutes',
      v_quote.utm_source, v_quote.utm_medium, v_quote.utm_campaign, v_quote.utm_content, v_quote.utm_term,
      v_quote.gclid, v_quote.gbraid, v_quote.wbraid, v_quote.google_keyword, v_quote.google_matchtype,
      v_quote.google_device, v_quote.google_loc_physical_ms, v_quote.google_loc_interest_ms,
      v_quote.google_adgroup_id, v_quote.google_creative_id, v_quote.google_campaign_id, v_quote.google_network,
      v_quote.latest_paid_utm_source, v_quote.latest_paid_utm_medium, v_quote.latest_paid_utm_campaign,
      v_quote.latest_paid_utm_content, v_quote.latest_paid_utm_term, v_quote.latest_paid_gclid,
      v_quote.latest_paid_gbraid, v_quote.latest_paid_wbraid, v_quote.latest_paid_google_keyword,
      v_quote.latest_paid_google_matchtype, v_quote.latest_paid_google_device,
      v_quote.latest_paid_google_loc_physical_ms, v_quote.latest_paid_google_loc_interest_ms,
      v_quote.latest_paid_google_adgroup_id, v_quote.latest_paid_google_creative_id,
      v_quote.latest_paid_google_campaign_id, v_quote.latest_paid_google_network,
      v_quote.latest_paid_touch_captured_at
    ) RETURNING
      orders.id, orders.order_number, orders.status, orders.total, orders.paid_at,
      orders.payment_reference, orders.quote_revision, orders.quote_checkout_state,
      orders.quote_checkout_reservation_id, orders.quote_checkout_expires_at,
      orders.quote_checkout_url
    INTO v_order;
    v_checkout_action := 'create';
    v_checkout_reservation_id := v_order.quote_checkout_reservation_id;
  ELSIF v_order.paid_at IS NULL AND v_order.status = 'pending_payment' THEN
    UPDATE public.orders SET
      quote_request_id = p_quote_id,
      is_rush = v_is_rush,
      subtotal = v_quote.quote_subtotal_cents / 100.0,
      gst = v_quote.quote_gst_cents / 100.0,
      pst = v_quote.quote_pst_cents / 100.0,
      total = v_quote.quote_total_cents / 100.0,
      conversion_type = 'quote_won',
      conversion_key = 'quote_won:' || p_quote_id::text
    WHERE id = v_order.id
    RETURNING
      orders.id, orders.order_number, orders.status, orders.total, orders.paid_at,
      orders.payment_reference, orders.quote_revision, orders.quote_checkout_state,
      orders.quote_checkout_reservation_id, orders.quote_checkout_expires_at,
      orders.quote_checkout_url
    INTO v_order;

    IF v_order.quote_checkout_state = 'ready' AND v_order.quote_checkout_url IS NOT NULL AND
       v_order.quote_checkout_expires_at > now() THEN
      v_checkout_action := 'resume';
      v_checkout_url := v_order.quote_checkout_url;
    ELSIF v_order.quote_checkout_state IN ('creating', 'ambiguous') AND
          v_order.quote_checkout_expires_at > now() THEN
      v_checkout_action := 'wait';
    ELSE
      v_checkout_reservation_id := gen_random_uuid();
      UPDATE public.orders SET
        payment_reference = v_order.id::text,
        quote_checkout_state = 'creating',
        quote_checkout_reservation_id = v_checkout_reservation_id,
        quote_checkout_reserved_at = now(),
        quote_checkout_expires_at = now() + interval '16 minutes',
        quote_checkout_url = NULL,
        quote_checkout_session_id = NULL,
        quote_checkout_last_error = NULL
      WHERE id = v_order.id
      RETURNING
        orders.id, orders.order_number, orders.status, orders.total, orders.paid_at,
        orders.payment_reference, orders.quote_revision, orders.quote_checkout_state,
        orders.quote_checkout_reservation_id, orders.quote_checkout_expires_at,
        orders.quote_checkout_url
      INTO v_order;
      v_checkout_action := 'create';
    END IF;
  ELSIF NOT (
    v_order.paid_at IS NOT NULL AND
    v_order.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
  ) THEN
    RAISE EXCEPTION 'QUOTE_ORDER_NOT_PAYABLE' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.paid_at IS NULL AND v_order.status = 'pending_payment' THEN
    SELECT count(*)::integer, COALESCE(sum(round(oi.line_total * 100)::integer), 0)::integer
      INTO v_item_count, v_item_sum_cents
      FROM public.order_items oi WHERE oi.order_id = v_order.id;
    IF v_order.quote_revision IS DISTINCT FROM v_quote.quote_revision OR
       v_item_count = 0 OR v_item_sum_cents <> v_quote.quote_subtotal_cents THEN
      PERFORM public.replace_quote_order_items(v_order.id, v_quote.quote_line_items, v_quote.quote_subtotal_cents);
    END IF;
    UPDATE public.orders SET quote_revision = v_quote.quote_revision WHERE id = v_order.id;
  END IF;

  UPDATE public.quote_requests SET
    converted_order_id = v_order.id,
    lifecycle_status = CASE
      WHEN v_order.paid_at IS NOT NULL AND v_order.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete') THEN 'won'
      ELSE 'checkout_started'
    END,
    checkout_started_at = COALESCE(quote_requests.checkout_started_at, now()),
    won_at = CASE WHEN v_order.paid_at IS NOT NULL THEN COALESCE(quote_requests.won_at, v_order.paid_at) ELSE quote_requests.won_at END,
    converted_at = CASE WHEN v_order.paid_at IS NOT NULL THEN COALESCE(quote_requests.converted_at, v_order.paid_at) ELSE quote_requests.converted_at END
  WHERE id = p_quote_id;

  RETURN QUERY SELECT v_order.id, v_order.order_number, v_order.status::text,
    round(v_order.total * 100)::integer, v_checkout_action,
    v_checkout_reservation_id, v_checkout_url;
END;
$$;

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
  UPDATE public.orders SET
    quote_checkout_state = 'ready',
    quote_checkout_url = p_checkout_url,
    quote_checkout_session_id = NULLIF(p_session_id, ''),
    quote_checkout_expires_at = p_expires_at,
    quote_checkout_last_error = NULL
  WHERE id = p_order_id AND status = 'pending_payment'
    AND quote_checkout_state = 'creating'
    AND quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_quote_checkout_reservation(
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
  UPDATE public.orders SET
    quote_checkout_state = CASE WHEN p_ambiguous THEN 'ambiguous' ELSE 'failed' END,
    quote_checkout_last_error = left(COALESCE(p_error, 'Checkout creation failed'), 1000),
    payment_reference = CASE WHEN p_ambiguous THEN orders.payment_reference ELSE NULL END,
    quote_checkout_expires_at = CASE WHEN p_ambiguous
      THEN GREATEST(COALESCE(orders.quote_checkout_expires_at, now()), now() + interval '16 minutes')
      ELSE now()
    END
  WHERE id = p_order_id AND status = 'pending_payment'
    AND quote_checkout_state = 'creating'
    AND quote_checkout_reservation_id = p_reservation_id;
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.mark_quote_sent(uuid, text);

CREATE OR REPLACE FUNCTION public.mark_quote_sent(
  p_quote_id uuid,
  p_reply_body text,
  p_qualifies boolean DEFAULT false
)
RETURNS TABLE (lifecycle_status text, replied_at timestamptz, qualification_created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_quote record;
BEGIN
  SELECT q.qualified_at, q.lifecycle_status INTO v_quote
  FROM public.quote_requests q WHERE q.id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  qualification_created := p_qualifies AND v_quote.qualified_at IS NULL AND
    v_quote.lifecycle_status IN ('requested', 'quoted');
  UPDATE public.quote_requests SET
    replied_at = now(),
    reply_body = p_reply_body,
    quoted_at = COALESCE(quote_requests.quoted_at, now()),
    qualified_at = CASE
      WHEN qualification_created THEN now()
      ELSE quote_requests.qualified_at
    END,
    lifecycle_status = CASE
      WHEN quote_requests.lifecycle_status IN ('won', 'archived', 'lost') THEN quote_requests.lifecycle_status
      WHEN quote_requests.converted_order_id IS NOT NULL THEN 'checkout_started'
      ELSE 'quoted'
    END
  WHERE id = p_quote_id
  RETURNING quote_requests.lifecycle_status, quote_requests.replied_at
  INTO lifecycle_status, replied_at;
  IF qualification_created THEN
    INSERT INTO public.quote_measurement_event_outbox (quote_id, event_name)
    VALUES (p_quote_id, 'quote_qualified')
    ON CONFLICT (quote_id, event_name) DO NOTHING;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_quote_measurement_events(p_limit integer DEFAULT 20)
RETURNS TABLE (id uuid, quote_id uuid, event_name text, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT q.id FROM public.quote_measurement_event_outbox q
    WHERE (q.status IN ('pending', 'retry') AND q.next_attempt_at <= now())
       OR (q.status = 'processing' AND q.processing_started_at < now() - interval '15 minutes')
    ORDER BY q.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  UPDATE public.quote_measurement_event_outbox q SET
    status = 'processing', attempt_count = q.attempt_count + 1,
    processing_started_at = now(), updated_at = now()
  FROM candidates c WHERE q.id = c.id
  RETURNING q.id, q.quote_id, q.event_name, q.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_quote_lifecycle_from_order_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.quote_request_id IS NOT NULL AND NEW.paid_at IS NOT NULL AND
     NEW.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete') AND
     (OLD.paid_at IS NULL OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.quote_requests SET lifecycle_status = 'won',
      won_at = COALESCE(won_at, NEW.paid_at),
      converted_at = COALESCE(converted_at, NEW.paid_at),
      converted_order_id = NEW.id
      WHERE id = NEW.quote_request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_quote_archive_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_archived AND NEW.lifecycle_status <> 'won' THEN
    NEW.lifecycle_status := 'archived';
  ELSIF OLD.is_archived AND NOT NEW.is_archived AND NEW.lifecycle_status = 'archived' THEN
    NEW.lifecycle_status := CASE
      WHEN NEW.converted_order_id IS NOT NULL THEN 'checkout_started'
      WHEN NEW.replied_at IS NOT NULL THEN 'quoted'
      ELSE 'requested'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_quote_lifecycle_on_payment ON public.orders;
CREATE TRIGGER orders_sync_quote_lifecycle_on_payment
AFTER UPDATE OF status, paid_at ON public.orders FOR EACH ROW
EXECUTE FUNCTION public.sync_quote_lifecycle_from_order_payment();

DROP TRIGGER IF EXISTS quote_requests_sync_archive_lifecycle ON public.quote_requests;
CREATE TRIGGER quote_requests_sync_archive_lifecycle
BEFORE UPDATE OF is_archived ON public.quote_requests FOR EACH ROW
EXECUTE FUNCTION public.sync_quote_archive_lifecycle();

-- Safe lifecycle backfill. Paid wins over archival; otherwise archived rows are
-- explicit, replied rows become quoted, and quoted_at uses the real reply time.
UPDATE public.quote_requests q SET
  lifecycle_status = CASE
    WHEN EXISTS (
      SELECT 1 FROM public.orders o WHERE (o.id = q.converted_order_id OR o.quote_request_id = q.id)
      AND o.paid_at IS NOT NULL AND o.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
    ) THEN 'won'
    WHEN q.is_archived THEN 'archived'
    WHEN q.converted_order_id IS NOT NULL THEN 'checkout_started'
    WHEN q.replied_at IS NOT NULL THEN 'quoted'
    ELSE 'requested'
  END,
  quoted_at = CASE WHEN q.replied_at IS NOT NULL THEN COALESCE(q.quoted_at, q.replied_at) ELSE q.quoted_at END,
  won_at = COALESCE(q.won_at, (
    SELECT o.paid_at FROM public.orders o
    WHERE (o.id = q.converted_order_id OR o.quote_request_id = q.id) AND o.paid_at IS NOT NULL
      AND o.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
    ORDER BY o.paid_at ASC LIMIT 1
  )),
  converted_at = COALESCE(q.converted_at, (
    SELECT o.paid_at FROM public.orders o
    WHERE (o.id = q.converted_order_id OR o.quote_request_id = q.id) AND o.paid_at IS NOT NULL
      AND o.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
    ORDER BY o.paid_at ASC LIMIT 1
  ));

ALTER TABLE public.orders VALIDATE CONSTRAINT orders_conversion_type_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_lifecycle_status_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_quote_amounts_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_quote_totals_reconcile_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_tax_formula_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_quote_checkout_state_check;

REVOKE ALL ON FUNCTION public.replace_quote_order_items(uuid, jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_structured_quote_items(jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.structured_quote_pst_base_cents(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_quote_submit_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_structured_quote_pricing(uuid, integer, integer, integer, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.materialize_quote_order(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_quote_sent(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_quote_checkout_reservation(uuid, uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_quote_checkout_reservation(uuid, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_quote_measurement_events(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.truecolor_tax_config FROM anon, authenticated;
REVOKE ALL ON TABLE public.quote_measurement_event_outbox FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.truecolor_tax_config TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.quote_measurement_event_outbox TO service_role;
GRANT EXECUTE ON FUNCTION public.set_structured_quote_pricing(uuid, integer, integer, integer, integer, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.materialize_quote_order(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_quote_sent(uuid, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_quote_checkout_reservation(uuid, uuid, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_quote_checkout_reservation(uuid, uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_quote_measurement_events(integer) TO service_role;

COMMENT ON COLUMN public.orders.conversion_type IS 'Revenue path: purchase_online or quote_won; NULL for unclassified/manual legacy orders.';
COMMENT ON COLUMN public.orders.conversion_key IS 'Stable per-conversion Google Ads transaction deduplication key.';
COMMENT ON COLUMN public.quote_requests.lifecycle_status IS 'requested -> quoted -> checkout_started -> won; lost/archived are explicit terminal handling states.';
COMMENT ON COLUMN public.quote_requests.converted_at IS 'Canonical paid quote conversion timestamp; won_at remains as lifecycle compatibility.';
