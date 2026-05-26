-- Brokerage portal support: identify quote_requests submitted via a branded
-- portal page (e.g. /portal/people-1st-realty) and capture the agent's
-- shipping address since portal orders ship across Saskatchewan rather than
-- being picked up at the Saskatoon shop.
--
-- brokerage_slug   matches a file in src/lib/data/brokerages/*.json. NULL for
--                  ordinary website quote requests.
-- shipping_address freeform single-line text — entered by the agent in the
--                  portal form. Used by staff for label printing + shipping
--                  cost quoting. NULL for pickup / non-portal orders.
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS brokerage_slug    text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_address  text    DEFAULT NULL;

-- Fast lookup for "all orders from this brokerage" in the staff portal.
CREATE INDEX IF NOT EXISTS idx_quote_requests_brokerage_slug
  ON quote_requests (brokerage_slug, created_at DESC)
  WHERE brokerage_slug IS NOT NULL;
