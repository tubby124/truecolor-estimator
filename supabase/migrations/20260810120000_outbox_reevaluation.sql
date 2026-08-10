-- Make the Google Ads paid-revenue outbox re-evaluable so a missed conversion
-- can still be repaired after the fact.
--
-- WHY: three independent locks made a missed conversion permanently
-- unrecoverable. Together they leaked 95 of 98 paid orders in a 90-day window
-- without raising a single alert.
--
--   1. ONE-SHOT TRIGGER. orders_enqueue_google_ads_conversion fired only on
--      INSERT OR UPDATE OF status, paid_at. /api/staff/manual-order inserted
--      orders with conversion_type NULL, so the function's NULL guard returned
--      early; later filling conversion_type or a click-ID column never
--      re-fired the trigger, and no outbox row was ever created.
--   2. ON CONFLICT (order_id) DO NOTHING. Once any row existed for an order,
--      no later evaluation could correct it.
--   3. TERMINAL not_attributable. An order that became paid before its click
--      ID landed (late Clover webhook, late quote attribution, staff-confirmed
--      payment) was parked in not_attributable forever, even once the click ID
--      arrived.
--
-- The lifecycle dashboard only alerted on outbox rows that EXISTED, so the 95
-- silent misses read as healthy the entire time.
--
-- This migration removes all three locks:
--   * the trigger also fires when conversion_type or any first-touch/latest-paid
--     click-ID column changes;
--   * ON CONFLICT promotes the existing row back to 'pending' with fresh
--     attribution ONLY when it is currently 'not_attributable' AND the new
--     evaluation resolves exactly one click ID.
--
-- Rows already in pending/processing/retry/submitted/sent/dead are never
-- touched, so an in-flight or already-delivered upload cannot be reset,
-- re-claimed, or double-counted. Attribution-selection semantics are unchanged:
-- the latest-paid group is chosen atomically, then first-touch wholesale.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
BEGIN
  IF to_regclass('public.google_ads_conversion_outbox') IS NULL THEN
    RAISE EXCEPTION 'outbox re-evaluation preflight failed: google_ads_conversion_outbox is missing';
  END IF;
  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION 'outbox re-evaluation preflight failed: orders is missing';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.enqueue_paid_google_ads_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Choose the latest paid click as one atomic identifier group. Falling back
  -- column-by-column can incorrectly let an old first-touch GCLID suppress a
  -- newer GBRAID/WBRAID.
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
  ON CONFLICT (order_id) DO UPDATE SET
    conversion_type = EXCLUDED.conversion_type,
    gclid = EXCLUDED.gclid,
    gbraid = EXCLUDED.gbraid,
    wbraid = EXCLUDED.wbraid,
    conversion_value = EXCLUDED.conversion_value,
    conversion_time = EXCLUDED.conversion_time,
    status = 'pending',
    attempt_count = 0,
    next_attempt_at = now(),
    processing_started_at = NULL,
    last_error = NULL,
    google_job_id = NULL,
    uploaded_at = NULL,
    data_manager_request_id = NULL,
    submitted_at = NULL,
    next_diagnostic_at = NULL,
    diagnostic_attempt_count = 0,
    diagnostic_claimed_at = NULL,
    diagnostics_checked_at = NULL,
    diagnostic_status = NULL,
    diagnostic_warning = NULL,
    updated_at = now()
  WHERE google_ads_conversion_outbox.status = 'not_attributable'
    AND num_nonnulls(EXCLUDED.gclid, EXCLUDED.gbraid, EXCLUDED.wbraid) = 1;

  RETURN NEW;
END;
$$;

-- Re-evaluate whenever the classification or ANY click-ID column changes, not
-- just on the payment transition. status and paid_at stay in the list so the
-- original paid-transition enqueue is preserved exactly.
DROP TRIGGER IF EXISTS orders_enqueue_google_ads_conversion ON public.orders;
CREATE TRIGGER orders_enqueue_google_ads_conversion
AFTER INSERT OR UPDATE OF
  status,
  paid_at,
  conversion_type,
  gclid,
  gbraid,
  wbraid,
  latest_paid_gclid,
  latest_paid_gbraid,
  latest_paid_wbraid
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_paid_google_ads_conversion();

-- CREATE OR REPLACE preserves the existing ACL, but re-assert it so this file
-- is safe to apply to an environment that never ran the ACL repair migration.
REVOKE ALL ON FUNCTION public.enqueue_paid_google_ads_conversion()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.enqueue_paid_google_ads_conversion() IS
  'Enqueues paid revenue for Google Ads. Re-evaluable: promotes a not_attributable row back to pending once a click ID arrives; never mutates pending/processing/retry/submitted/sent/dead rows.';
