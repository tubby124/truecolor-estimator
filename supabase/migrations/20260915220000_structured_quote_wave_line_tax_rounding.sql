-- Wave computes GST/PST at each emitted invoice line. Preserve aggregate-tax
-- historic quotes exactly, and enable per-line rounding only for new, explicitly
-- versioned quote revisions. This migration never updates existing quote/order
-- money fields, quote revisions, or provider documents.
BEGIN;

ALTER TABLE public.truecolor_tax_config
  ADD COLUMN IF NOT EXISTS structured_tax_rounding_version text;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS quote_tax_rounding_version text NOT NULL DEFAULT 'aggregate_v1';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_requests'::regclass
      AND conname = 'quote_requests_tax_rounding_version_check'
  ) THEN
    ALTER TABLE public.quote_requests
      ADD CONSTRAINT quote_requests_tax_rounding_version_check CHECK (
        quote_tax_rounding_version IN ('aggregate_v1', 'wave_per_line_v1')
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.quote_requests
  VALIDATE CONSTRAINT quote_requests_tax_rounding_version_check;

-- Returns the same aggregate calculation used by the legacy RPC unless the
-- saved revision explicitly opts into Wave's per-invoice-line behavior.
CREATE OR REPLACE FUNCTION public.structured_quote_tax_components_v3(
  p_line_items jsonb,
  p_gst_rate numeric,
  p_pst_rate numeric,
  p_pst_exempt boolean,
  p_rounding_version text
)
RETURNS TABLE (gst_cents integer, pst_cents integer)
LANGUAGE plpgsql
STABLE
STRICT
SET search_path = ''
AS $$
DECLARE
  v_subtotal integer;
  v_printed boolean;
  v_pst20 boolean;
BEGIN
  IF jsonb_typeof(p_line_items) <> 'array' OR jsonb_array_length(p_line_items) = 0 OR
     p_rounding_version NOT IN ('aggregate_v1', 'wave_per_line_v1') THEN
    RAISE EXCEPTION 'QUOTE_TAX_ROUNDING_VERSION_INVALID' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(sum(round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer), 0),
         coalesce(bool_or(item->>'taxClass' = 'printed_good'), false),
         coalesce(bool_or(item->>'taxPolicyVersion' = 'pst20_20260906'), false)
  INTO v_subtotal, v_printed, v_pst20
  FROM jsonb_array_elements(p_line_items) AS lines(item);

  IF p_rounding_version = 'aggregate_v1' THEN
    gst_cents := round(v_subtotal * p_gst_rate)::integer;
    pst_cents := CASE WHEN p_pst_exempt THEN 0
      ELSE round(public.structured_quote_pst_base_cents(p_line_items) * p_pst_rate)::integer END;
    RETURN NEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)
    WHERE item->>'taxRoundingVersion' IS DISTINCT FROM 'wave_per_line_v1'
  ) THEN
    RAISE EXCEPTION 'QUOTE_TAX_ROUNDING_VERSION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;
  IF v_pst20 AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)
    WHERE item->>'taxPolicyVersion' IS DISTINCT FROM 'pst20_20260906'
  ) THEN
    RAISE EXCEPTION 'QUOTE_TAX_POLICY_VERSION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    coalesce(sum(round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100 * p_gst_rate)::integer), 0),
    CASE WHEN p_pst_exempt THEN 0 ELSE coalesce(sum(
      round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100 * p_pst_rate)::integer
    ) FILTER (WHERE
      (v_pst20 AND v_printed) OR item->>'taxClass' NOT IN ('design_service', 'rush_service')
    ), 0) END
  INTO gst_cents, pst_cents
  FROM jsonb_array_elements(p_line_items) AS lines(item);
  RETURN NEXT;
END;
$$;

-- Reuse the production function bodies, but fail closed if their known tax
-- guard has changed. This prevents a blind migration from rewriting lifecycle
-- logic while changing only the explicitly versioned tax branch.
DO $$
DECLARE
  v_definition text;
  v_old text;
  v_new text;
BEGIN
  v_definition := pg_get_functiondef(
    'public.set_structured_quote_pricing(uuid,integer,integer,integer,integer,text,jsonb)'::regprocedure
  );
  v_old := E'  v_is_rush boolean;\nBEGIN';
  v_new := E'  v_is_rush boolean;\n  v_rounding_version text;\nBEGIN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: pricing RPC declaration changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);

  v_old := E'  v_expected_gst := round(p_subtotal_cents * v_gst_rate)::integer;\n  v_expected_pst := round(public.structured_quote_pst_base_cents(p_line_items) * v_pst_rate)::integer;\n  IF p_gst_cents <> v_expected_gst OR p_pst_cents <> v_expected_pst THEN';
  v_new := E'  v_rounding_version := CASE WHEN NOT EXISTS (\n    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)\n    WHERE item->>''taxRoundingVersion'' IS DISTINCT FROM ''wave_per_line_v1''\n  ) THEN ''wave_per_line_v1'' ELSE ''aggregate_v1'' END;\n  SELECT gst_cents, pst_cents INTO v_expected_gst, v_expected_pst\n  FROM public.structured_quote_tax_components_v3(\n    p_line_items, v_gst_rate, v_pst_rate,\n    coalesce((SELECT bool_and(item->>''pstExempt'' = ''true'')\n      FROM jsonb_array_elements(p_line_items) AS lines(item)), false),\n    v_rounding_version\n  );\n  IF p_gst_cents <> v_expected_gst OR p_pst_cents <> v_expected_pst THEN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: pricing tax guard changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);

  v_old := E'    quote_pst_rate = v_pst_rate,\n    quote_revision = v_revision,';
  v_new := E'    quote_pst_rate = v_pst_rate,\n    quote_tax_rounding_version = v_rounding_version,\n    quote_revision = v_revision,';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: pricing persistence changed';
  END IF;
  EXECUTE replace(v_definition, v_old, v_new);
END $$;

-- The staff-send wrapper validates before it delegates to the base RPC, so it
-- needs the same versioned calculation rather than rejecting a valid Wave
-- per-line amount as an aggregate-tax mismatch.
DO $$
DECLARE
  v_definition text;
  v_old text;
  v_new text;
BEGIN
  v_definition := pg_get_functiondef(
    'public.set_structured_quote_pricing_v2(uuid,integer,integer,integer,integer,text,jsonb)'::regprocedure
  );
  v_old := E'  v_pricing record;\nBEGIN';
  v_new := E'  v_pricing record;\n  v_expected_gst integer;\n  v_expected_pst integer;\n  v_rounding_version text;\nBEGIN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: pricing v2 declaration changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);
  v_old := E'  IF p_gst_cents <> round(p_subtotal_cents * v_gst_rate)::integer OR\n     p_pst_cents <> round(\n       public.structured_quote_pst_base_cents_v2(p_line_items) * v_pst_rate\n     )::integer THEN';
  v_new := E'  v_rounding_version := CASE WHEN NOT EXISTS (\n    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)\n    WHERE item->>''taxRoundingVersion'' IS DISTINCT FROM ''wave_per_line_v1''\n  ) THEN ''wave_per_line_v1'' ELSE ''aggregate_v1'' END;\n  SELECT gst_cents, pst_cents INTO v_expected_gst, v_expected_pst\n  FROM public.structured_quote_tax_components_v3(\n    p_line_items, v_gst_rate, v_pst_rate,\n    coalesce((SELECT bool_and(item->>''pstExempt'' = ''true'')\n      FROM jsonb_array_elements(p_line_items) AS lines(item)), false),\n    v_rounding_version\n  );\n  IF p_gst_cents <> v_expected_gst OR p_pst_cents <> v_expected_pst THEN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: pricing v2 tax guard changed';
  END IF;
  EXECUTE replace(v_definition, v_old, v_new);
END $$;

DO $$
DECLARE
  v_definition text;
  v_old text;
  v_new text;
BEGIN
  v_definition := pg_get_functiondef(
    'public.materialize_quote_order(uuid,integer,integer)'::regprocedure
  );
  v_old := E'  v_is_rush boolean;\nBEGIN';
  v_new := E'  v_is_rush boolean;\n  v_expected_gst integer;\n  v_expected_pst integer;\nBEGIN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: materialization declaration changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);

  v_old := E'    q.quote_line_items, q.quote_gst_rate, q.quote_pst_rate, q.quote_revision, q.converted_order_id,';
  v_new := E'    q.quote_line_items, q.quote_gst_rate, q.quote_pst_rate, q.quote_tax_rounding_version, q.pst_exempt, q.quote_revision, q.converted_order_id,';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: materialization select changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);

  v_old := E'  IF v_quote.quote_total_cents IS NULL OR v_quote.quote_subtotal_cents IS NULL OR\n     v_quote.quote_gst_cents IS NULL OR v_quote.quote_pst_cents IS NULL OR\n     v_quote.quote_line_items IS NULL OR v_quote.quote_gst_rate IS NULL OR v_quote.quote_pst_rate IS NULL OR\n     v_quote.quote_total_cents <> v_quote.quote_subtotal_cents + v_quote.quote_gst_cents + v_quote.quote_pst_cents OR\n     v_quote.quote_gst_cents <> round(v_quote.quote_subtotal_cents * v_quote.quote_gst_rate)::integer OR\n     v_quote.quote_pst_cents <> round(public.structured_quote_pst_base_cents(v_quote.quote_line_items) * v_quote.quote_pst_rate)::integer THEN';
  v_new := E'  SELECT gst_cents, pst_cents INTO v_expected_gst, v_expected_pst\n  FROM public.structured_quote_tax_components_v3(\n    v_quote.quote_line_items, v_quote.quote_gst_rate, v_quote.quote_pst_rate,\n    coalesce(v_quote.pst_exempt, false), coalesce(v_quote.quote_tax_rounding_version, ''aggregate_v1'')\n  );\n  IF v_quote.quote_total_cents IS NULL OR v_quote.quote_subtotal_cents IS NULL OR\n     v_quote.quote_gst_cents IS NULL OR v_quote.quote_pst_cents IS NULL OR\n     v_quote.quote_line_items IS NULL OR v_quote.quote_gst_rate IS NULL OR v_quote.quote_pst_rate IS NULL OR\n     v_quote.quote_total_cents <> v_quote.quote_subtotal_cents + v_quote.quote_gst_cents + v_quote.quote_pst_cents OR\n     v_quote.quote_gst_cents <> v_expected_gst OR\n     v_quote.quote_pst_cents <> v_expected_pst THEN';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: materialization tax guard changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);
  v_old := E'''clover_card'', p_quote_id, ''quote_won''';
  v_new := E'''wave'', p_quote_id, ''quote_won''';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: materialization payment method changed';
  END IF;
  v_definition := replace(v_definition, v_old, v_new);
  v_old := E'      conversion_type = ''quote_won'',\n      conversion_key = ''quote_won:'' || p_quote_id::text\n    WHERE id = v_order.id';
  v_new := E'      conversion_type = ''quote_won'',\n      conversion_key = ''quote_won:'' || p_quote_id::text,\n      payment_method = CASE\n        WHEN v_order.quote_checkout_state IS NULL\n          OR v_order.quote_checkout_state NOT IN (''creating'', ''ready'', ''ambiguous'')\n          OR (v_order.quote_checkout_expires_at IS NOT NULL\n              AND v_order.quote_checkout_expires_at <= now())\n        THEN ''wave'' ELSE orders.payment_method END\n    WHERE id = v_order.id';
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'structured quote rounding preflight failed: existing-order payment transition changed';
  END IF;
  EXECUTE replace(v_definition, v_old, v_new);
END $$;

-- The capability is written only after both guarded RPC replacements exist.
UPDATE public.truecolor_tax_config
SET structured_tax_rounding_version = 'wave_per_line_v1'
WHERE id = true;

REVOKE ALL ON FUNCTION public.structured_quote_tax_components_v3(jsonb, numeric, numeric, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.structured_quote_tax_components_v3(jsonb, numeric, numeric, boolean, text)
  TO service_role;

COMMIT;
