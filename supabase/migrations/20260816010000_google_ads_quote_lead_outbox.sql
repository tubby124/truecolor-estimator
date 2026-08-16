-- Durable qualified-quote-lead delivery to Google Ads. The owner must create
-- the conversion action in the Google Ads UI and configure Railway before the
-- cron worker uploads anything; this migration only records durable intent.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.google_ads_quote_lead_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  gclid text,
  gbraid text,
  wbraid text,
  conversion_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'not_attributable', 'dead')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  data_manager_request_id text,
  submitted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_ads_quote_lead_outbox_click_id_check CHECK (
    num_nonnulls(gclid, gbraid, wbraid) <= 1
  )
);

ALTER TABLE public.google_ads_quote_lead_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.google_ads_quote_lead_outbox FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.google_ads_quote_lead_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_google_ads_quote_lead()
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
BEGIN
  -- Keep the paid-click group atomic: latest paid touch wins as a group, then
  -- first touch is used only when no latest paid identifier is present.
  v_gclid := NULLIF(NEW.latest_paid_gclid, '');
  v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.latest_paid_gbraid, '') END;
  v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.latest_paid_wbraid, '') END;
  IF v_gclid IS NULL AND v_gbraid IS NULL AND v_wbraid IS NULL THEN
    v_gclid := NULLIF(NEW.gclid, '');
    v_gbraid := CASE WHEN v_gclid IS NULL THEN NULLIF(NEW.gbraid, '') END;
    v_wbraid := CASE WHEN v_gclid IS NULL AND v_gbraid IS NULL THEN NULLIF(NEW.wbraid, '') END;
  END IF;
  v_status := CASE WHEN num_nonnulls(v_gclid, v_gbraid, v_wbraid) = 1 THEN 'pending' ELSE 'not_attributable' END;

  INSERT INTO public.google_ads_quote_lead_outbox (
    quote_request_id, gclid, gbraid, wbraid, conversion_time, status
  ) VALUES (
    NEW.id, v_gclid, v_gbraid, v_wbraid, NEW.created_at, v_status
  )
  ON CONFLICT (quote_request_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_enqueue_google_ads_quote_lead ON public.quote_requests;
CREATE TRIGGER quote_requests_enqueue_google_ads_quote_lead
AFTER INSERT ON public.quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_google_ads_quote_lead();

CREATE OR REPLACE FUNCTION public.claim_google_ads_quote_lead_conversions(p_limit integer DEFAULT 20)
RETURNS SETOF public.google_ads_quote_lead_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.google_ads_quote_lead_outbox
    WHERE status IN ('pending', 'retry')
       OR (status = 'processing' AND updated_at < now() - interval '15 minutes')
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  UPDATE public.google_ads_quote_lead_outbox o
  SET status = 'processing',
      attempt_count = o.attempt_count + 1,
      updated_at = now()
  FROM candidates c
  WHERE o.id = c.id
  RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_google_ads_quote_lead_conversions(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_ads_quote_lead_conversions(integer) TO service_role;

COMMENT ON TABLE public.google_ads_quote_lead_outbox IS
  'Idempotent server-side Google Ads qualified quote lead outbox; one row per quote request.';
