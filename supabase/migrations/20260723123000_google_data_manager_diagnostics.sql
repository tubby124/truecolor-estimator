-- Google Data Manager event ingestion is asynchronous. A successful ingest
-- only returns a request ID; it does not prove that Google Ads accepted the
-- conversion. Keep accepted requests in `submitted` until request diagnostics
-- confirm exactly one delivered record.
--
-- This migration is deliberately additive. It does not replace or recreate
-- enqueue_paid_google_ads_conversion(), preserving the NULL conversion_type
-- guard repaired in 20260722154500_google_ads_outbox_null_guard.sql.
--
-- DEPLOY / ROLLBACK ORDER (the `submitted` state is a coordinated app/schema
-- boundary):
--   1. Apply this migration while the existing conversion cron is paused.
--   2. Deploy the diagnostics-aware worker, then resume the cron.
--   3. Before rolling back to the old worker, pause the cron and run:
--        UPDATE public.google_ads_conversion_outbox
--        SET status = 'retry', next_attempt_at = now(),
--            processing_started_at = NULL, updated_at = now()
--        WHERE status = 'submitted';
--      The stable order_number/transaction ID makes those re-uploads
--      idempotent. Deploy the old worker only after the requeue commits.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
DECLARE
  v_outbox_count bigint;
BEGIN
  IF to_regclass('public.google_ads_conversion_outbox') IS NULL THEN
    RAISE EXCEPTION 'Data Manager diagnostics preflight failed: google_ads_conversion_outbox is missing';
  END IF;
  SELECT count(*) INTO v_outbox_count
  FROM public.google_ads_conversion_outbox;
  IF v_outbox_count > 10000 THEN
    RAISE EXCEPTION
      'Data Manager diagnostics safety gate failed: outbox=% rows; review a non-transactional concurrent index rollout',
      v_outbox_count;
  END IF;
  RAISE NOTICE 'Data Manager diagnostics safety gate: outbox=% rows',
    v_outbox_count;
END;
$preflight$;

ALTER TABLE public.google_ads_conversion_outbox
  ADD COLUMN IF NOT EXISTS data_manager_request_id text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_diagnostic_at timestamptz,
  ADD COLUMN IF NOT EXISTS diagnostic_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diagnostic_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS diagnostics_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS diagnostic_status text,
  ADD COLUMN IF NOT EXISTS diagnostic_warning text;

ALTER TABLE public.google_ads_conversion_outbox
  ADD CONSTRAINT google_ads_conversion_outbox_status_check_v2
    CHECK (status IN (
      'pending',
      'processing',
      'retry',
      'submitted',
      'sent',
      'not_attributable',
      'dead'
    )) NOT VALID,
  ADD CONSTRAINT google_ads_conversion_outbox_diagnostic_attempt_count_check
    CHECK (diagnostic_attempt_count >= 0) NOT VALID;

ALTER TABLE public.google_ads_conversion_outbox
  VALIDATE CONSTRAINT google_ads_conversion_outbox_status_check_v2;
ALTER TABLE public.google_ads_conversion_outbox
  VALIDATE CONSTRAINT google_ads_conversion_outbox_diagnostic_attempt_count_check;

-- The replacement is already validated, leaving only a brief metadata swap
-- under the bounded lock timeout.
ALTER TABLE public.google_ads_conversion_outbox
  DROP CONSTRAINT google_ads_conversion_outbox_status_check;
ALTER TABLE public.google_ads_conversion_outbox
  RENAME CONSTRAINT google_ads_conversion_outbox_status_check_v2
  TO google_ads_conversion_outbox_status_check;

-- Supabase migrations are transactional, so CONCURRENTLY is unavailable. The
-- preflight above refuses this regular partial-index path beyond the reviewed
-- small-table envelope.
CREATE INDEX IF NOT EXISTS google_ads_conversion_outbox_diagnostics_due_idx
  ON public.google_ads_conversion_outbox (next_diagnostic_at, created_at)
  WHERE status = 'submitted';

-- Atomically reserve only due submitted requests. Moving next_diagnostic_at
-- forward provides a 15-minute crash lease while retaining the semantically
-- correct `submitted` state. Concurrent workers skip locked rows and a later
-- worker cannot reclaim a committed lease until it expires.
CREATE OR REPLACE FUNCTION public.claim_google_ads_conversion_diagnostics(
  p_limit integer DEFAULT 20
)
RETURNS SETOF public.google_ads_conversion_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.google_ads_conversion_outbox
    WHERE status = 'submitted'
      AND data_manager_request_id IS NOT NULL
      AND submitted_at IS NOT NULL
      AND next_diagnostic_at IS NOT NULL
      AND next_diagnostic_at <= now()
    ORDER BY next_diagnostic_at, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  UPDATE public.google_ads_conversion_outbox o
  SET diagnostic_attempt_count = o.diagnostic_attempt_count + 1,
      diagnostic_claimed_at = now(),
      next_diagnostic_at = now() + interval '15 minutes',
      updated_at = now()
  FROM candidates c
  WHERE o.id = c.id
    AND o.status = 'submitted'
  RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_google_ads_conversion_diagnostics(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_ads_conversion_diagnostics(integer)
  TO service_role;

COMMENT ON COLUMN public.google_ads_conversion_outbox.data_manager_request_id IS
  'Google Data Manager asynchronous ingest request ID; not a delivery acknowledgement.';
COMMENT ON COLUMN public.google_ads_conversion_outbox.submitted_at IS
  'Time Data Manager accepted the asynchronous ingest request.';
COMMENT ON COLUMN public.google_ads_conversion_outbox.next_diagnostic_at IS
  'Next time the asynchronous request is eligible for diagnostic polling.';
COMMENT ON COLUMN public.google_ads_conversion_outbox.diagnostic_status IS
  'Most recent Data Manager request diagnostic status.';
