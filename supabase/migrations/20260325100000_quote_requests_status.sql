-- Quote status tracking: when staff replied + optional internal note
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS replied_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS staff_note text DEFAULT NULL;

-- Index for fast "unreplied" queries used by the nav badge
CREATE INDEX IF NOT EXISTS idx_quote_requests_replied_at
  ON quote_requests (replied_at, created_at DESC);
