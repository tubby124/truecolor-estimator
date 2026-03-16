-- Ensure engagement columns exist on tc_leads
ALTER TABLE tc_leads
  ADD COLUMN IF NOT EXISTS emails_sent    int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_opened  int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_clicked int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;

-- Per-send audit log (permanent record, survives Brevo 30-day retention)
CREATE TABLE IF NOT EXISTS tc_email_sends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        uuid NOT NULL REFERENCES tc_leads(id) ON DELETE CASCADE,
  niche_slug     text NOT NULL,
  step           int4 NOT NULL,
  brevo_template_id int4 NOT NULL,
  brevo_message_id  text,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  opened_at      timestamptz,
  clicked_at     timestamptz,
  status         text NOT NULL DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS tc_email_sends_lead_id_idx  ON tc_email_sends(lead_id);
CREATE INDEX IF NOT EXISTS tc_email_sends_sent_at_idx  ON tc_email_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS tc_email_sends_niche_idx    ON tc_email_sends(niche_slug);

CREATE INDEX IF NOT EXISTS tc_leads_drip_niche_idx ON tc_leads(drip_niche);
