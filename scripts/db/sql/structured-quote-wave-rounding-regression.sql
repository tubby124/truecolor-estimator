-- Disposable PostgreSQL regression for the exact Wave per-line rounding helper.
DO $$
DECLARE
  v_gst integer;
  v_pst integer;
  v_lines jsonb := '[
    {"qty":"1","unitPrice":"0.50","taxClass":"printed_good","taxRoundingVersion":"wave_per_line_v1"},
    {"qty":"1","unitPrice":"0.50","taxClass":"printed_good","taxRoundingVersion":"wave_per_line_v1"}
  ]';
BEGIN
  SELECT gst_cents, pst_cents INTO v_gst, v_pst
  FROM public.structured_quote_tax_components_v3(v_lines, 0.05, 0.06, false, 'wave_per_line_v1');
  IF v_gst <> 6 OR v_pst <> 6 THEN
    RAISE EXCEPTION 'Wave two-line half-cent case changed: GST %, PST %', v_gst, v_pst;
  END IF;

  SELECT gst_cents, pst_cents INTO v_gst, v_pst
  FROM public.structured_quote_tax_components_v3(v_lines, 0.05, 0.06, true, 'wave_per_line_v1');
  IF v_gst <> 6 OR v_pst <> 0 THEN
    RAISE EXCEPTION 'PST exemption changed: GST %, PST %', v_gst, v_pst;
  END IF;

  BEGIN
    PERFORM public.structured_quote_tax_components_v3(
      '[{"qty":"1","unitPrice":"0.50","taxClass":"printed_good"}]',
      0.05, 0.06, false, 'wave_per_line_v1'
    );
    RAISE EXCEPTION 'Unmarked Wave line was accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'QUOTE_TAX_ROUNDING_VERSION_MISMATCH' THEN RAISE; END IF;
  END;
END
$$;
