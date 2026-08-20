-- Staff-recorded commercial source. This is intentionally not a substitute for
-- Google click attribution: it lets True Color measure phone/walk-in demand
-- without falsely uploading an unproven sale as an Ads conversion.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS acquisition_source text;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_acquisition_source_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_acquisition_source_check CHECK (
    acquisition_source IS NULL OR acquisition_source IN (
      'website_quote',
      'google_ads_call',
      'google_organic_call',
      'repeat_customer',
      'referral',
      'walk_in',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS orders_acquisition_source_created_at_idx
  ON public.orders (acquisition_source, created_at DESC)
  WHERE acquisition_source IS NOT NULL;

COMMENT ON COLUMN public.orders.acquisition_source IS
  'Staff-recorded commercial source. Never used alone to claim Google Ads attribution.';