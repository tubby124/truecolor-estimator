-- Atomic, shared estimate limiter. The application supplies a SHA-256 key
-- derived from a fixed public subject and the service secret; raw client
-- identifiers are never stored. Only the server's service_role may execute the claim RPC.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.api_rate_limit_buckets (
  scope text NOT NULL CHECK (scope <> '' AND length(scope) <= 64),
  key_hash text NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 0),
  PRIMARY KEY (scope, key_hash)
);

ALTER TABLE public.api_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limit_buckets FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_scope IS NULL OR p_scope = '' OR length(p_scope) > 64
    OR p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$'
    OR p_limit < 1 OR p_limit > 100000
    OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit claim';
  END IF;

  INSERT INTO public.api_rate_limit_buckets AS bucket (
    scope, key_hash, window_started_at, request_count
  ) VALUES (p_scope, p_key_hash, clock_timestamp(), 1)
  ON CONFLICT (scope, key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN bucket.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
      THEN clock_timestamp()
      ELSE bucket.window_started_at
    END,
    request_count = CASE
      WHEN bucket.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
      THEN 1
      ELSE bucket.request_count + 1
    END
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_api_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_api_rate_limit(text, text, integer, integer) TO service_role;
