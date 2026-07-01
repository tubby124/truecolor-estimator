-- Add CASL-compliant marketing consent fields to customers table.
-- marketing_consent: explicit opt-in (NULL = unknown/legacy, FALSE = declined, TRUE = consented)
-- consent_at: timestamp of consent event (for CASL 3-year record requirement)
-- consent_ip: IP at time of consent (CASL requires proof of consent source)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_ip TEXT;
