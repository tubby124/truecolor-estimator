-- Paid-search first-touch attribution for orders and quote requests.
-- All fields are nullable because organic/direct traffic has no paid identifiers.
-- URL ValueTrack names are mapped to explicit google_* column names in application code.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS google_keyword text,
  ADD COLUMN IF NOT EXISTS google_matchtype text,
  ADD COLUMN IF NOT EXISTS google_device text,
  ADD COLUMN IF NOT EXISTS google_loc_physical_ms text,
  ADD COLUMN IF NOT EXISTS google_loc_interest_ms text,
  ADD COLUMN IF NOT EXISTS google_adgroup_id text,
  ADD COLUMN IF NOT EXISTS google_creative_id text,
  ADD COLUMN IF NOT EXISTS google_campaign_id text,
  ADD COLUMN IF NOT EXISTS google_network text;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS google_keyword text,
  ADD COLUMN IF NOT EXISTS google_matchtype text,
  ADD COLUMN IF NOT EXISTS google_device text,
  ADD COLUMN IF NOT EXISTS google_loc_physical_ms text,
  ADD COLUMN IF NOT EXISTS google_loc_interest_ms text,
  ADD COLUMN IF NOT EXISTS google_adgroup_id text,
  ADD COLUMN IF NOT EXISTS google_creative_id text,
  ADD COLUMN IF NOT EXISTS google_campaign_id text,
  ADD COLUMN IF NOT EXISTS google_network text;

-- Partial indexes support attribution reporting and later offline conversion export
-- without adding index overhead to organic/direct rows or every ValueTrack field.
CREATE INDEX IF NOT EXISTS orders_gclid_idx ON public.orders (gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_gbraid_idx ON public.orders (gbraid) WHERE gbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_wbraid_idx ON public.orders (wbraid) WHERE wbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_requests_gclid_idx ON public.quote_requests (gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_requests_gbraid_idx ON public.quote_requests (gbraid) WHERE gbraid IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_requests_wbraid_idx ON public.quote_requests (wbraid) WHERE wbraid IS NOT NULL;

COMMENT ON COLUMN public.orders.gclid IS 'Sanitized first-touch Google click ID for reporting/offline conversion import.';
COMMENT ON COLUMN public.orders.gbraid IS 'Sanitized first-touch Google app/web braid click ID.';
COMMENT ON COLUMN public.orders.wbraid IS 'Sanitized first-touch Google web-to-app braid click ID.';
COMMENT ON COLUMN public.quote_requests.gclid IS 'Sanitized first-touch Google click ID retained through quote conversion.';
COMMENT ON COLUMN public.quote_requests.gbraid IS 'Sanitized first-touch Google app/web braid click ID.';
COMMENT ON COLUMN public.quote_requests.wbraid IS 'Sanitized first-touch Google web-to-app braid click ID.';
