-- TC-10: track when a pending-payment follow-up email was sent
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;

-- TC-9: capture checkout sessions when a valid email is entered but order never placed
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  followup_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS checkout_sessions_email_idx ON checkout_sessions (email);
CREATE INDEX IF NOT EXISTS checkout_sessions_created_at_idx ON checkout_sessions (created_at);
