-- Staff must be able to say "we do not know" rather than guess and pollute
-- commercial-source reporting or imply Google Ads credit without proof.
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
      'other',
      'unknown'
    )
  );