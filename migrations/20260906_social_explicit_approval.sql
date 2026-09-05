-- PREPARED ONLY. Production application requires explicit owner approval.
-- Existing rows receive no approval and cannot enter the new publishing path.
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approval_hash text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approval_target jsonb;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approved_rights boolean;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approved_media_sha256 text;

-- Explicit CAS contract: every update advances the server-owned version timestamp,
-- even multiple writes in one transaction or an API caller supplying updated_at.
CREATE OR REPLACE FUNCTION public.social_posts_advance_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at + interval '1 microsecond');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS z_social_posts_advance_version ON public.social_posts;
CREATE TRIGGER z_social_posts_advance_version BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.social_posts_advance_version();

-- Browser sessions must not replay a previously valid approval by resetting status.
-- All application writers use the existing server service-role client. Preserve
-- SELECT/realtime visibility and existing service-role grants; add no new grants.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.social_posts, public.social_post_results
FROM anon, authenticated, PUBLIC;

-- Table REVOKE does not remove pre-existing column-specific INSERT/UPDATE grants.
DO $$
DECLARE
  table_name text;
  column_list text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['social_posts', 'social_post_results'] LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
    INTO column_list
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', table_name)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped;
    EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON TABLE public.%I FROM anon, authenticated, PUBLIC',
      column_list, column_list, table_name);
  END LOOP;
END;
$$;
