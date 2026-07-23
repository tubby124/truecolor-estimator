-- Trigger functions run through their table trigger and do not need to be
-- executable by API roles. Remove PostgreSQL's default PUBLIC EXECUTE grant so
-- callers cannot attach this SECURITY DEFINER function to attacker-owned data.

DO $acl_repair$
BEGIN
  IF to_regprocedure('public.enqueue_paid_google_ads_conversion()') IS NULL THEN
    RAISE NOTICE 'Google Ads conversion trigger is not installed; skipping function ACL repair';
    RETURN;
  END IF;

  EXECUTE
    'REVOKE ALL ON FUNCTION public.enqueue_paid_google_ads_conversion() FROM PUBLIC, anon, authenticated';
END;
$acl_repair$;
