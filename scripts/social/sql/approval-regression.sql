\set ON_ERROR_STOP on
-- LOCAL DISPOSABLE DATABASE ONLY: fixture creates public tables and test roles.
-- Run as local database superuser: psql -X -f scripts/social/sql/approval-regression.sql "$TEST_DB_URL"
-- Everything, including newly created roles, rolls back at the end.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.social_posts') IS NOT NULL OR to_regclass('public.social_post_results') IS NOT NULL THEN
    RAISE EXCEPTION 'Use an empty disposable database; social tables already exist';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
CREATE TABLE public.social_posts (id integer PRIMARY KEY, status text NOT NULL, caption_raw text, updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE public.social_post_results (id integer PRIMARY KEY, post_id integer, status text);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts, public.social_post_results TO anon, authenticated, service_role;
GRANT UPDATE (status), INSERT (status) ON public.social_posts TO authenticated;
GRANT UPDATE (status), INSERT (status) ON public.social_post_results TO anon;
INSERT INTO public.social_posts VALUES (1, 'ready', 'historical unapproved row', clock_timestamp());
\ir ../../../migrations/20260906_social_explicit_approval.sql
-- Repeat to prove migration is idempotent.
\ir ../../../migrations/20260906_social_explicit_approval.sql
DO $$
DECLARE old_version timestamptz; new_version timestamptz; role_name text; table_name text;
BEGIN
  IF EXISTS (SELECT FROM public.social_posts WHERE approval_hash IS NOT NULL OR approved_at IS NOT NULL OR approved_by IS NOT NULL OR approval_target IS NOT NULL OR approved_rights IS NOT NULL OR approved_media_sha256 IS NOT NULL) THEN
    RAISE EXCEPTION 'Migration approved a historical row';
  END IF;
  SELECT updated_at INTO old_version FROM public.social_posts WHERE id=1;
  UPDATE public.social_posts SET caption_raw='edited', updated_at='2000-01-01' WHERE id=1;
  SELECT updated_at INTO new_version FROM public.social_posts WHERE id=1;
  IF new_version <= old_version THEN RAISE EXCEPTION 'Version did not advance'; END IF;
  UPDATE public.social_posts SET status='posting' WHERE id=1 AND updated_at=old_version;
  IF FOUND THEN RAISE EXCEPTION 'Stale version won CAS'; END IF;
  UPDATE public.social_posts SET caption_raw='edited again', updated_at=new_version WHERE id=1;
  IF (SELECT updated_at <= new_version FROM public.social_posts WHERE id=1) THEN RAISE EXCEPTION 'Second write did not advance version'; END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH table_name IN ARRAY ARRAY['social_posts','social_post_results'] LOOP
      IF has_table_privilege(role_name,'public.'||table_name,'INSERT') OR has_table_privilege(role_name,'public.'||table_name,'UPDATE') OR has_table_privilege(role_name,'public.'||table_name,'DELETE')
        OR has_any_column_privilege(role_name,'public.'||table_name,'INSERT') OR has_any_column_privilege(role_name,'public.'||table_name,'UPDATE') THEN
        RAISE EXCEPTION 'Browser write grant remains: % %', role_name, table_name;
      END IF;
      IF NOT has_table_privilege(role_name,'public.'||table_name,'SELECT') THEN RAISE EXCEPTION 'SELECT grant was removed'; END IF;
    END LOOP;
  END LOOP;
  IF NOT has_table_privilege('service_role','public.social_posts','UPDATE') THEN RAISE EXCEPTION 'Service writer grant lost'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    UPDATE public.social_posts SET status='ready' WHERE id=1;
    RAISE EXCEPTION 'Authenticated status replay unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
\echo 'Social approval SQL regression passed (rolled back).'
