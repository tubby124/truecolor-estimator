\set ON_ERROR_STOP on
BEGIN;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  ELSE
    ALTER ROLE service_role BYPASSRLS;
  END IF;
END;
$roles$;

\ir ../../supabase/migrations/20260914100000_shared_estimate_rate_limit.sql

DO $assertions$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.api_rate_limit_buckets'::regclass) THEN
    RAISE EXCEPTION 'rate limit buckets must have RLS enabled';
  END IF;
  IF has_table_privilege('anon', 'public.api_rate_limit_buckets', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     OR has_table_privilege('authenticated', 'public.api_rate_limit_buckets', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     OR has_table_privilege('service_role', 'public.api_rate_limit_buckets', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     OR has_function_privilege('anon', 'public.claim_api_rate_limit(text,text,integer,integer)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.claim_api_rate_limit(text,text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'public API roles retained rate-limit access';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.claim_api_rate_limit(text,text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service role cannot claim a rate-limit bucket';
  END IF;
END;
$assertions$;

COMMIT;
SELECT 'estimate_rate_limit_setup_regression_passed' AS result;
