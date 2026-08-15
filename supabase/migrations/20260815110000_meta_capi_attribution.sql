-- Store Meta browser identifiers only when the visitor chose marketing tracking.
-- This lets a later payment webhook report the verified purchase with the same
-- first-party browser context, without sending tracking data for non-consenting users.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meta_tracking_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_fbp text,
  ADD COLUMN IF NOT EXISTS meta_fbc text;

CREATE INDEX IF NOT EXISTS orders_meta_fbc_idx
  ON public.orders (meta_fbc)
  WHERE meta_fbc IS NOT NULL;

COMMENT ON COLUMN public.orders.meta_tracking_consent IS
  'True only when the browser opted in to Meta marketing measurement at order creation.';
COMMENT ON COLUMN public.orders.meta_fbp IS
  'Meta first-party browser identifier, retained only with marketing consent.';
COMMENT ON COLUMN public.orders.meta_fbc IS
  'Meta click identifier, retained only with marketing consent.';
