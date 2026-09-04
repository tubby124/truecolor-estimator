-- Preserve the browser-issued GA4 identity that actually observed a website
-- checkout/quote. Server payment confirmation can then join the same visitor
-- instead of fabricating a client ID and polluting revenue as Unassigned.
-- Historical rows deliberately stay null: attribution must never be guessed.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ga_client_id text,
  ADD COLUMN IF NOT EXISTS ga_session_id text,
  ADD COLUMN IF NOT EXISTS ga_session_number text,
  ADD COLUMN IF NOT EXISTS ga_context_captured_at timestamptz;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS ga_client_id text,
  ADD COLUMN IF NOT EXISTS ga_session_id text,
  ADD COLUMN IF NOT EXISTS ga_session_number text,
  ADD COLUMN IF NOT EXISTS ga_context_captured_at timestamptz;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_ga_client_id_check CHECK (
    ga_client_id IS NULL OR ga_client_id ~ '^[0-9]{1,20}\.[0-9]{1,20}$'
  ) NOT VALID,
  ADD CONSTRAINT orders_ga_session_id_check CHECK (
    ga_session_id IS NULL OR ga_session_id ~ '^[0-9]{1,20}$'
  ) NOT VALID,
  ADD CONSTRAINT orders_ga_session_number_check CHECK (
    ga_session_number IS NULL OR ga_session_number ~ '^[0-9]{1,20}$'
  ) NOT VALID;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_ga_client_id_check CHECK (
    ga_client_id IS NULL OR ga_client_id ~ '^[0-9]{1,20}\.[0-9]{1,20}$'
  ) NOT VALID,
  ADD CONSTRAINT quote_requests_ga_session_id_check CHECK (
    ga_session_id IS NULL OR ga_session_id ~ '^[0-9]{1,20}$'
  ) NOT VALID,
  ADD CONSTRAINT quote_requests_ga_session_number_check CHECK (
    ga_session_number IS NULL OR ga_session_number ~ '^[0-9]{1,20}$'
  ) NOT VALID;

ALTER TABLE public.orders VALIDATE CONSTRAINT orders_ga_client_id_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_ga_session_id_check;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_ga_session_number_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_ga_client_id_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_ga_session_id_check;
ALTER TABLE public.quote_requests VALIDATE CONSTRAINT quote_requests_ga_session_number_check;

COMMENT ON COLUMN public.orders.ga_client_id IS
  'Pseudonymous GA4 browser client ID captured at website checkout; null for legacy/manual orders.';
COMMENT ON COLUMN public.orders.ga_session_id IS
  'Pseudonymous GA4 session ID captured with ga_client_id; used only while fresh for Measurement Protocol session attribution.';
COMMENT ON COLUMN public.quote_requests.ga_client_id IS
  'Pseudonymous GA4 browser client ID captured at website quote submission; copied to the resulting linked order.';

-- Keep quote-originated orders on the same browser context in every materialization
-- path, including the SQL Pay Now flow and staff/manual quote linkage.
CREATE OR REPLACE FUNCTION public.inherit_quote_ga4_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote record;
BEGIN
  IF NEW.quote_request_id IS NULL THEN RETURN NEW; END IF;

  SELECT q.ga_client_id, q.ga_session_id, q.ga_session_number, q.ga_context_captured_at
    INTO v_quote
    FROM public.quote_requests q
   WHERE q.id = NEW.quote_request_id;

  IF FOUND THEN
    NEW.ga_client_id := COALESCE(NEW.ga_client_id, v_quote.ga_client_id);
    NEW.ga_session_id := COALESCE(NEW.ga_session_id, v_quote.ga_session_id);
    NEW.ga_session_number := COALESCE(NEW.ga_session_number, v_quote.ga_session_number);
    NEW.ga_context_captured_at := COALESCE(NEW.ga_context_captured_at, v_quote.ga_context_captured_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_inherit_quote_ga4_context ON public.orders;
CREATE TRIGGER orders_inherit_quote_ga4_context
BEFORE INSERT OR UPDATE OF quote_request_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.inherit_quote_ga4_context();

REVOKE ALL ON FUNCTION public.inherit_quote_ga4_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inherit_quote_ga4_context() TO service_role;
