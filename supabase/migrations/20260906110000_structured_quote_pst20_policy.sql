-- PREPARED ONLY: production application requires explicit True Color DB approval.
-- Source: Saskatchewan Finance PST-20 (July 2024), section A: the total charge
-- for taxable printed material includes design, materials and printing.
-- Existing unmarked/v2 quote revisions remain immutable; only new explicitly
-- marked revisions use this policy. This migration never updates order amounts.
BEGIN;

ALTER TABLE public.truecolor_tax_config
  ADD COLUMN IF NOT EXISTS structured_tax_policy_version text;

CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents_v2(p_line_items jsonb)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
DECLARE
  v_new_policy boolean;
  v_printed boolean;
  v_exempt boolean;
  v_base integer;
BEGIN
  SELECT coalesce(bool_or(item->>'taxPolicyVersion' = 'pst20_20260906'), false),
         coalesce(bool_or(item->>'taxClass' = 'printed_good'), false),
         coalesce(bool_and(item->>'pstExempt' = 'true'), false)
  INTO v_new_policy, v_printed, v_exempt
  FROM jsonb_array_elements(p_line_items) AS lines(item);

  IF v_new_policy AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_line_items) AS lines(item)
    WHERE item->>'taxPolicyVersion' IS DISTINCT FROM 'pst20_20260906'
  ) THEN
    RAISE EXCEPTION 'QUOTE_TAX_POLICY_VERSION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;
  IF v_exempt THEN RETURN 0; END IF;
  SELECT coalesce(sum(round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer), 0)::integer
  INTO v_base
  FROM jsonb_array_elements(p_line_items) AS lines(item)
  WHERE (v_new_policy AND v_printed) OR item->>'taxClass' NOT IN ('design_service', 'rush_service');
  RETURN v_base;
END;
$$;

-- The application only activates its new-policy preview/payload after observing
-- this capability. It must read the row, never write it as a GET side effect.
UPDATE public.truecolor_tax_config
SET structured_tax_policy_version = 'pst20_20260906'
WHERE id = true;

COMMIT;
