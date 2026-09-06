-- Local regression only, after quote prerequisites + the prepared migration.
BEGIN;
DO $$
DECLARE
  v_legacy jsonb := '[{"qty":"1","unitPrice":"100","taxClass":"printed_good","taxFormulaVersion":"sk_print_only_v2"},{"qty":"1","unitPrice":"40","taxClass":"rush_service","taxFormulaVersion":"sk_print_only_v2"}]';
  v_current jsonb;
  v_exempt jsonb;
BEGIN
  SELECT jsonb_agg(item || '{"taxPolicyVersion":"pst20_20260906"}') INTO v_current FROM jsonb_array_elements(v_legacy) AS lines(item);
  SELECT jsonb_agg(item || '{"pstExempt":true}') INTO v_exempt FROM jsonb_array_elements(v_current) AS lines(item);
  IF public.structured_quote_pst_base_cents(v_legacy) <> 10000 THEN RAISE EXCEPTION 'Historical revision changed'; END IF;
  IF public.structured_quote_pst_base_cents(v_current) <> 14000 THEN RAISE EXCEPTION 'Bundled rush omitted'; END IF;
  IF public.structured_quote_pst_base_cents(v_exempt) <> 0 THEN RAISE EXCEPTION 'Resale exemption changed'; END IF;
  IF public.structured_quote_pst_base_cents_v2('[{"qty":"1","unitPrice":"35","taxClass":"design_service","taxPolicyVersion":"pst20_20260906"}]') <> 0 THEN RAISE EXCEPTION 'Standalone design changed'; END IF;
  BEGIN
    PERFORM public.structured_quote_pst_base_cents_v2(jsonb_build_array(v_current->0, v_legacy->1));
    RAISE EXCEPTION 'Mixed policy version accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'QUOTE_TAX_POLICY_VERSION_MISMATCH' THEN RAISE; END IF;
  END;
END $$;
ROLLBACK;
