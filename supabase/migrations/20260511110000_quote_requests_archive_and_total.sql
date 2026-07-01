-- Staff Quotes cleanup + price-in-reply support.
--
-- is_archived / archived_at: soft-delete column so staff can remove test
--                             submissions and resolved-elsewhere quotes
--                             without losing the audit trail. Default
--                             list view filters is_archived = false.
--
-- quote_total / quote_total_includes_tax: when staff send a reply with a
--                             negotiated price, store it so the email
--                             template can render a "Pay Now" button
--                             backed by the existing /pay/[token] gateway
--                             (HMAC-signed token, same as order flow).
--                             NULL = no price set, no Pay Now button.

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS is_archived              boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at              timestamptz  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_total_cents        integer      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quote_total_description  text         DEFAULT NULL;

-- Default staff-portal list query only shows active quotes.
CREATE INDEX IF NOT EXISTS idx_quote_requests_active
  ON quote_requests (created_at DESC)
  WHERE is_archived = false;
