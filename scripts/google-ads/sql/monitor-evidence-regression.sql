\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  ELSE
    ALTER ROLE service_role BYPASSRLS;
  END IF;
END;
$roles$;

\ir ../../../supabase/migrations/20260526120000_audit_events.sql
GRANT ALL ON TABLE public.audit_events TO service_role;
\ir ../../../supabase/migrations/20260723223000_google_ads_monitor_evidence_acl.sql

DO $regression$
DECLARE
  v_rls_enabled boolean;
  v_index_exists boolean;
BEGIN
  SELECT relrowsecurity
  INTO v_rls_enabled
  FROM pg_class
  WHERE oid = 'public.audit_events'::regclass;

  IF v_rls_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'audit_events RLS is not enabled';
  END IF;

  IF has_table_privilege('anon', 'public.audit_events', 'SELECT')
     OR has_table_privilege('anon', 'public.audit_events', 'INSERT')
     OR has_table_privilege('anon', 'public.audit_events', 'UPDATE')
     OR has_table_privilege('anon', 'public.audit_events', 'DELETE')
     OR has_table_privilege('authenticated', 'public.audit_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.audit_events', 'INSERT')
     OR has_table_privilege('authenticated', 'public.audit_events', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.audit_events', 'DELETE') THEN
    RAISE EXCEPTION 'an API role retains direct audit_events privileges';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.audit_events', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.audit_events', 'INSERT')
     OR has_table_privilege('service_role', 'public.audit_events', 'UPDATE')
     OR has_table_privilege('service_role', 'public.audit_events', 'DELETE')
     OR has_table_privilege('service_role', 'public.audit_events', 'TRUNCATE')
     OR has_table_privilege('service_role', 'public.audit_events', 'REFERENCES')
     OR has_table_privilege('service_role', 'public.audit_events', 'TRIGGER') THEN
    RAISE EXCEPTION 'service_role lacks required audit_events privileges';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'audit_events'
      AND indexname = 'audit_events_google_ads_monitor_heartbeat_uidx'
  ) INTO v_index_exists;

  IF v_index_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'Google Ads heartbeat uniqueness index is missing';
  END IF;
END;
$regression$;

SET ROLE service_role;

INSERT INTO public.audit_events (
  actor_type, actor_id, event_type, entity_type, entity_id, detail
) VALUES (
  'cron',
  'google-ads-monitor',
  'google_ads.monitor.heartbeat',
  'google_ads_account',
  'monitor_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '{"ok":true}'::jsonb
) RETURNING id, at;

DO $service_read$
DECLARE
  v_count bigint;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.audit_events
  WHERE event_type = 'google_ads.monitor.heartbeat'
    AND entity_id = 'monitor_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'service_role could not read its heartbeat receipt';
  END IF;
END;
$service_read$;

DO $uniqueness$
BEGIN
  BEGIN
    INSERT INTO public.audit_events (
      actor_type, actor_id, event_type, entity_type, entity_id, detail
    ) VALUES (
      'cron',
      'google-ads-monitor',
      'google_ads.monitor.heartbeat',
      'google_ads_account',
      'monitor_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '{"ok":true}'::jsonb
    );
    RAISE EXCEPTION 'duplicate Google Ads heartbeat ID was accepted';
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;
END;
$uniqueness$;

RESET ROLE;

SELECT 'google_ads_monitor_evidence_regression_passed' AS result;
