-- Multi-source landing-page attribution (2026-08-20).
-- Persist only origin-relative pathnames, never URL query strings. Query strings can
-- contain user-entered values and are unnecessary for page-level paid/organic reporting.
-- Historical rows are deliberately left null: a missing path is more honest than a guessed one.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS latest_paid_landing_path text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS latest_paid_landing_path text;

ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_landing_path_check;
ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_landing_path_check CHECK (
    (landing_path IS NULL OR (landing_path LIKE '/%' AND landing_path NOT LIKE '//%' AND landing_path !~ '[?#]'))
    AND (latest_paid_landing_path IS NULL OR (latest_paid_landing_path LIKE '/%' AND latest_paid_landing_path NOT LIKE '//%' AND latest_paid_landing_path !~ '[?#]'))
  );

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_landing_path_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_landing_path_check CHECK (
    (landing_path IS NULL OR (landing_path LIKE '/%' AND landing_path NOT LIKE '//%' AND landing_path !~ '[?#]'))
    AND (latest_paid_landing_path IS NULL OR (latest_paid_landing_path LIKE '/%' AND latest_paid_landing_path NOT LIKE '//%' AND latest_paid_landing_path !~ '[?#]'))
  );

CREATE INDEX IF NOT EXISTS quote_requests_latest_paid_landing_path_created_at_idx
  ON public.quote_requests (latest_paid_landing_path, created_at DESC)
  WHERE latest_paid_landing_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_latest_paid_landing_path_created_at_idx
  ON public.orders (latest_paid_landing_path, created_at DESC)
  WHERE latest_paid_landing_path IS NOT NULL;

COMMENT ON COLUMN public.quote_requests.landing_path IS
  'Privacy-safe first-touch pathname, without query string; null for historical/unknown paths.';
COMMENT ON COLUMN public.quote_requests.latest_paid_landing_path IS
  'Privacy-safe pathname of the latest paid click; null when no paid click was captured.';
COMMENT ON COLUMN public.orders.landing_path IS
  'Privacy-safe first-touch pathname, copied from linked quote when applicable.';
COMMENT ON COLUMN public.orders.latest_paid_landing_path IS
  'Privacy-safe pathname of the latest paid click, copied from linked quote when applicable.';

-- Every order linked to a website quote inherits the server-stored paths. This
-- covers both the SQL quote-payment materializer and staff manual-order flow,
-- avoiding a fragile second copy of the large materialize_quote_order function.
CREATE OR REPLACE FUNCTION public.inherit_quote_landing_paths()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote record;
BEGIN
  IF NEW.quote_request_id IS NULL THEN RETURN NEW; END IF;

  SELECT q.landing_path, q.latest_paid_landing_path
    INTO v_quote
    FROM public.quote_requests q
   WHERE q.id = NEW.quote_request_id;

  IF FOUND THEN
    NEW.landing_path := COALESCE(NEW.landing_path, v_quote.landing_path);
    NEW.latest_paid_landing_path := COALESCE(
      NEW.latest_paid_landing_path,
      v_quote.latest_paid_landing_path
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_inherit_quote_landing_paths ON public.orders;
CREATE TRIGGER orders_inherit_quote_landing_paths
BEFORE INSERT OR UPDATE OF quote_request_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.inherit_quote_landing_paths();

REVOKE ALL ON FUNCTION public.inherit_quote_landing_paths() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inherit_quote_landing_paths() TO service_role;
