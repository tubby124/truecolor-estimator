-- Migration: add quote_requests table
-- Purpose: persist every /quote-request submission to DB so nothing is
-- lost if the Brevo staff notification email fails.
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS quote_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  name         text        NOT NULL,
  email        text        NOT NULL,
  phone        text,
  items        jsonb       NOT NULL,
  file_links   text[],
  raw_ip       text
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
-- No public policy needed: accessed only via service role in API route.
-- Staff can query via Supabase dashboard with service role key.
