-- PREPARED ONLY: explicit True Color production DB approval required.
-- Install before monthly batches and generation jobs; enable app feature flag only after checks.
SET lock_timeout = '5s';
SET statement_timeout = '30s';
CREATE TABLE IF NOT EXISTS public.social_businesses (
 id uuid PRIMARY KEY, name text NOT NULL, is_active boolean NOT NULL DEFAULT true, gbp_expected_identity jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.social_businesses(id,name,gbp_expected_identity) VALUES
 ('00000000-0000-4000-8000-000000000001','True Color Display Printing Ltd.',
 '{"title":"True Color Display Printing Ltd.","addressLines":["216 33rd St W"],"locality":"Saskatoon","administrativeArea":"SK","postalCode":"S7L 0V1","regionCode":"CA"}')
ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.social_business_members (
 business_id uuid NOT NULL REFERENCES public.social_businesses(id),
 user_id uuid NOT NULL REFERENCES auth.users(id), role text NOT NULL CHECK(role='operator'),
 PRIMARY KEY(business_id,user_id)
);
-- Set app.social_owner_user_id to the verified owner UUID in the approved migration session.
-- No guessed email/identity bootstrap: absent setting leaves access closed until provisioned.
INSERT INTO public.social_business_members(business_id,user_id,role)
SELECT '00000000-0000-4000-8000-000000000001', id, 'operator' FROM auth.users
WHERE id::text = nullif(current_setting('app.social_owner_user_id',true),'')
ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.social_channel_credentials (
 business_id uuid NOT NULL REFERENCES public.social_businesses(id),
 provider text NOT NULL CHECK(provider='meta'),
 ciphertext text NOT NULL, iv text NOT NULL, auth_tag text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(business_id,provider)
);
CREATE TABLE IF NOT EXISTS public.social_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES public.social_businesses(id),
 product_slug text NOT NULL, product_configuration jsonb NOT NULL, fact_fingerprint text NOT NULL,
 facts jsonb NOT NULL, title text NOT NULL, image_url text NOT NULL, image_sha256 text,
 terms text NOT NULL DEFAULT '', starts_on date, ends_on date, destination_url text NOT NULL,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((starts_on IS NULL AND ends_on IS NULL) OR (starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on>=starts_on)),
 UNIQUE(business_id,id)
);
CREATE TABLE IF NOT EXISTS public.social_gbp_connections (
 business_id uuid PRIMARY KEY REFERENCES public.social_businesses(id), owner_user_id uuid NOT NULL REFERENCES auth.users(id),
 google_account_name text NOT NULL, location_name text NOT NULL, location_title text NOT NULL, location_address jsonb,
 refresh_token_ciphertext text NOT NULL, refresh_token_iv text NOT NULL, refresh_token_auth_tag text NOT NULL,
 token_key_version smallint NOT NULL DEFAULT 2, scopes text[] NOT NULL,
 connected_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 history_next_page_token text, history_last_read_at timestamptz, history_complete boolean NOT NULL DEFAULT false,
 last_verified_at timestamptz, last_error text
);
CREATE TABLE IF NOT EXISTS public.social_gbp_history (
 business_id uuid NOT NULL REFERENCES public.social_businesses(id), provider_post_id text NOT NULL,
 location_name text NOT NULL, topic_type text NOT NULL, summary text NOT NULL DEFAULT '',
 provider_created_at timestamptz, provider_updated_at timestamptz, provider_state text,
 media jsonb NOT NULL DEFAULT '[]', event jsonb, offer jsonb, public_url text, read_at timestamptz NOT NULL,
 insights jsonb, insights_status text NOT NULL DEFAULT 'not_requested' CHECK(insights_status IN('available','unavailable','not_requested')),
 insights_error text, insights_read_at timestamptz, PRIMARY KEY(business_id,provider_post_id)
);
-- A constant default backfills without UPDATE: existing approval hashes and versions remain intact.
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS business_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.social_businesses(id);
ALTER TABLE public.social_campaigns ADD COLUMN IF NOT EXISTS business_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.social_businesses(id);
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS business_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.social_businesses(id);
ALTER TABLE public.social_post_results ADD COLUMN IF NOT EXISTS business_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.social_businesses(id);
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS approval_version smallint;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS caption_gbp text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS fact_fingerprint text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS product_slug text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS product_configuration jsonb;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS offer_id uuid;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS batch_id uuid;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS creative_id uuid;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS generation_job_id uuid;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS gbp_payload jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_business_id_id_idx ON public.social_posts(business_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS social_campaigns_business_id_id_idx ON public.social_campaigns(business_id,id);
CREATE INDEX IF NOT EXISTS social_posts_business_due_idx ON public.social_posts(business_id,status,schedule_time,id);
-- Replace single-column relationships so PostgREST embeds remain unambiguous.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname,conrelid::regclass AS relation FROM pg_constraint
 WHERE contype='f' AND ((conrelid='public.social_posts'::regclass AND confrelid='public.social_campaigns'::regclass AND array_length(conkey,1)=1)
 OR (conrelid='public.social_post_results'::regclass AND confrelid='public.social_posts'::regclass AND array_length(conkey,1)=1)) LOOP
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',c.relation,c.conname);
 END LOOP;
 IF NOT EXISTS(SELECT FROM pg_constraint WHERE conname='social_posts_business_campaign_fk') THEN
  ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_business_campaign_fk FOREIGN KEY(business_id,campaign_id) REFERENCES public.social_campaigns(business_id,id) ON DELETE SET NULL (campaign_id);
 END IF;
 IF NOT EXISTS(SELECT FROM pg_constraint WHERE conname='social_posts_business_offer_fk') THEN
  ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_business_offer_fk FOREIGN KEY(business_id,offer_id) REFERENCES public.social_offers(business_id,id);
 END IF;
 IF NOT EXISTS(SELECT FROM pg_constraint WHERE conname='social_results_business_post_fk') THEN
  ALTER TABLE public.social_post_results ADD CONSTRAINT social_results_business_post_fk FOREIGN KEY(business_id,post_id) REFERENCES public.social_posts(business_id,id) ON DELETE CASCADE;
 END IF;
END $$;
-- RLS is defense in depth. APIs still authorize and scope every service-role request.
DO $$ DECLARE t text; p record; BEGIN
 FOREACH t IN ARRAY ARRAY['social_businesses','social_business_members','social_channel_credentials','social_offers','social_gbp_connections','social_gbp_history','social_posts','social_campaigns','social_accounts','social_post_results'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
  -- Remove old permissive policies before tenant policies. Table grants alone do not revoke column grants.
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
   EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
  END LOOP;
  FOR p IN SELECT attname FROM pg_attribute WHERE attrelid=format('public.%I',t)::regclass AND attnum>0 AND NOT attisdropped LOOP
   EXECUTE format('REVOKE SELECT (%I), INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.%I FROM PUBLIC,anon,authenticated',p.attname,p.attname,p.attname,p.attname,t);
  END LOOP;
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;
-- Browser direct reads/realtime intentionally receive no rows; authenticated staff APIs are authoritative.
-- Never grant token tables to browser roles. New client onboarding uses a reviewed service-side membership insert.
-- Preserve any legacy encrypted connection for recovery, but require reconnect for business-bound encryption.
DO $$ BEGIN
 IF to_regclass('public.gbp_connections') IS NOT NULL THEN
  INSERT INTO public.social_gbp_connections(business_id,owner_user_id,google_account_name,location_name,location_title,refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag,token_key_version,scopes,connected_at,updated_at,last_error)
  SELECT '00000000-0000-4000-8000-000000000001',owner_user_id,google_account_name,location_name,location_title,refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag,1,scopes,connected_at,updated_at,'Reconnect required for business-bound encryption'
  FROM public.gbp_connections ON CONFLICT(business_id) DO NOTHING;
 END IF;
END $$;

-- Public cleared media can still be downloaded by providers, but browser users must
-- not enumerate another business's objects or read private originals directly.
DO $$ BEGIN
 IF to_regclass('storage.objects') IS NOT NULL THEN
  EXECUTE 'DROP POLICY IF EXISTS social_business_storage_no_browser_access ON storage.objects';
  EXECUTE $policy$CREATE POLICY social_business_storage_no_browser_access ON storage.objects AS RESTRICTIVE
    FOR ALL TO anon,authenticated USING (bucket_id NOT IN ('social-images','social-library'))
    WITH CHECK (bucket_id NOT IN ('social-images','social-library'))$policy$;
 END IF;
END $$;
