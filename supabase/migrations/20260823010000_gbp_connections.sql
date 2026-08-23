-- Google Business Profile refresh token storage. Tokens are AES-256-GCM encrypted
-- by the application before persistence and are never exposed to browser clients.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.gbp_connections (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id),
  google_account_name text NOT NULL,
  location_name text NOT NULL,
  location_title text NOT NULL,
  refresh_token_ciphertext text NOT NULL,
  refresh_token_iv text NOT NULL,
  refresh_token_auth_tag text NOT NULL,
  token_key_version smallint NOT NULL DEFAULT 1,
  scopes text[] NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz,
  last_error text
);

ALTER TABLE public.gbp_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gbp_connections FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.gbp_connections FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.gbp_connections TO service_role;
