-- Repair the paid-conversion trigger that was applied while the Google Ads
-- rollout was still on a draft branch. In PostgreSQL, NULL NOT IN (...) is
-- NULL rather than TRUE, so legacy orders with no conversion classification
-- fell through to an INSERT that violated the outbox NOT NULL constraint.
--
-- Keep this migration safe on environments where the draft Ads migration was
-- never applied. The source Ads migration carries the same null guard, so an
-- environment that records this no-op before the Ads rollout remains safe.

DO $repair_block$
BEGIN
  IF to_regprocedure('public.enqueue_paid_google_ads_conversion()') IS NULL THEN
    RAISE NOTICE 'Google Ads conversion trigger is not installed; skipping null-guard repair';
    RETURN;
  END IF;

  EXECUTE $function_sql$
    CREATE OR REPLACE FUNCTION public.enqueue_paid_google_ads_conversion()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $function_body$
    DECLARE
      v_gclid text;
      v_gbraid text;
      v_wbraid text;
      v_status text;
      v_value numeric(12,2);
    BEGIN
      IF NEW.paid_at IS NULL
         OR NEW.status NOT IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete')
         OR NEW.conversion_type IS NULL
         OR NEW.conversion_type NOT IN ('purchase_online', 'quote_won') THEN
        RETURN NEW;
      END IF;

      v_gclid := NULLIF(NEW.latest_paid_gclid, '');
      v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.latest_paid_gbraid, '') END;
      v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.latest_paid_wbraid, '') END;
      IF v_gclid IS NULL AND v_gbraid IS NULL AND v_wbraid IS NULL THEN
        v_gclid := NULLIF(NEW.gclid, '');
        v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.gbraid, '') END;
        v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.wbraid, '') END;
      END IF;

      v_status := CASE
        WHEN num_nonnulls(v_gclid, v_gbraid, v_wbraid) = 1 THEN 'pending'
        ELSE 'not_attributable'
      END;
      v_value := ROUND(GREATEST(
        COALESCE(NEW.total, 0) - COALESCE(NEW.gst, 0) - COALESCE(NEW.pst, 0),
        0
      )::numeric, 2);

      INSERT INTO public.google_ads_conversion_outbox (
        order_id, order_number, conversion_type, gclid, gbraid, wbraid,
        conversion_value, conversion_time, status
      ) VALUES (
        NEW.id, NEW.order_number, NEW.conversion_type, v_gclid, v_gbraid, v_wbraid,
        v_value, NEW.paid_at, v_status
      )
      ON CONFLICT (order_id) DO NOTHING;

      RETURN NEW;
    END;
    $function_body$;
  $function_sql$;
END;
$repair_block$;
