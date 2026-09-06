\set ON_ERROR_STOP on
-- EMPTY LOCAL DISPOSABLE DATABASE ONLY. Real migrations, synthetic data, rollback.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.social_posts') IS NOT NULL THEN
    RAISE EXCEPTION 'Use an empty social schema in a disposable database';
  END IF;
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
-- Existing CI fixtures may have created this role without Supabase's bypass.
ALTER ROLE service_role BYPASSRLS;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000099');
SET LOCAL app.social_owner_user_id='00000000-0000-4000-8000-000000000099';
CREATE TABLE public.social_campaigns(id uuid PRIMARY KEY,slug text NOT NULL,name text NOT NULL,
  CONSTRAINT social_campaigns_slug_key UNIQUE(slug));
CREATE TABLE public.social_accounts(id uuid PRIMARY KEY,platform text NOT NULL,blotato_account_id text UNIQUE);
CREATE TABLE public.social_posts(
  id uuid PRIMARY KEY, campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  caption_raw text, caption_instagram text, caption_facebook text, hashtags text,
  image_url text, platforms text[], schedule_time timestamptz,
  source text, post_number integer, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.social_post_results(id uuid PRIMARY KEY,
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,platform text NOT NULL,status text);
CREATE SCHEMA storage;
CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text NOT NULL,name text NOT NULL);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
CREATE POLICY legacy_broad_read ON storage.objects FOR SELECT TO authenticated USING(true);
INSERT INTO storage.objects VALUES
 (gen_random_uuid(),'social-library','businesses/synthetic-a/private.jpg'),
 (gen_random_uuid(),'social-images','businesses/synthetic-b/cleared.jpg'),
 (gen_random_uuid(),'unrelated-bucket','unrelated.jpg');
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
GRANT ALL ON public.social_posts,public.social_post_results TO anon,authenticated,service_role;
\ir ../../../migrations/20260906_social_explicit_approval.sql
INSERT INTO public.social_posts(id,status,caption_raw,platforms,schedule_time,approval_hash,approved_at,approved_by,approved_rights,approved_media_sha256)
VALUES('00000000-0000-4000-8000-000000000100','ready','approved legacy creative',ARRAY['instagram'],'2026-09-07 01:00:00+00',repeat('a',64),now(),'00000000-0000-4000-8000-000000000099',true,repeat('b',64));
CREATE TEMP TABLE legacy_snapshot AS SELECT id,status,approval_hash,updated_at,schedule_time FROM public.social_posts;
\ir ../../../supabase/migrations/20260906120000_social_business_channels.sql
\ir ../../../supabase/migrations/20260906130000_social_monthly_batches.sql
\ir ../../../migrations/20260906_social_generation.sql
\ir ../../../supabase/migrations/20260906150000_social_generation_business_links.sql
\ir ../../../supabase/migrations/20260906150000_social_generation_business_links.sql
CREATE FUNCTION pg_temp.check_that(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',message; END IF; END $$;
SELECT pg_temp.check_that(NOT EXISTS(
  SELECT FROM legacy_snapshot l LEFT JOIN public.social_posts p USING(id)
  WHERE p.id IS NULL OR (p.status,p.approval_hash,p.updated_at,p.schedule_time) IS DISTINCT FROM (l.status,l.approval_hash,l.updated_at,l.schedule_time)
),'Integrated migrations changed an approved legacy delivery');
INSERT INTO public.social_businesses(id,name) VALUES
 ('00000000-0000-4000-8000-000000000002','Synthetic A'),
 ('00000000-0000-4000-8000-000000000003','Synthetic B');
INSERT INTO public.social_generation_settings(business_id,daily_call_limit) VALUES
 ('00000000-0000-4000-8000-000000000002',4),
 ('00000000-0000-4000-8000-000000000003',4);
SET LOCAL ROLE service_role;
DO $$
DECLARE
 a uuid := '00000000-0000-4000-8000-000000000002';
 b uuid := '00000000-0000-4000-8000-000000000003';
 actor uuid := '00000000-0000-4000-8000-000000000099';
 job uuid := '00000000-0000-4000-8000-000000000201';
 batch uuid := '00000000-0000-4000-8000-000000000301';
 request_id uuid := '00000000-0000-4000-8000-000000000401';
 post_id uuid := '00000000-0000-4000-8000-000000000501';
 payload jsonb; saved jsonb; r jsonb;
BEGIN
 r:=public.claim_social_generation(a,job,repeat('c',64),repeat('d',64),2,0);
 PERFORM pg_temp.check_that(r->>'status'='claimed','Integrated generation claim failed');
 r:=public.finish_social_generation(a,job,'completed','{"draft":"synthetic caption"}','{}',1,1,0);
 PERFORM pg_temp.check_that(r->>'status'='updated','Integrated generation completion failed');
 payload:=jsonb_build_array(jsonb_build_object('id',post_id,'creative_id',post_id,'caption_raw','synthetic caption','image_url','https://example.invalid/image.jpg','platforms',jsonb_build_array('instagram'),'schedule_time','2026-09-10T15:00:00Z','generation_job_id',job));
 saved:=public.save_social_batch_chunk(a,batch,'2026-09',actor,request_id,repeat('e',64),payload);
 PERFORM pg_temp.check_that(jsonb_array_length(saved)=1 AND saved->0->>'status'='draft','Monthly save must produce one unapproved draft');
 r:=public.save_social_batch_chunk(a,batch,'2026-09',actor,request_id,repeat('e',64),payload);
 PERFORM pg_temp.check_that(r=saved,'Monthly resume changed durable draft');
 BEGIN
  UPDATE public.social_posts SET business_id=b WHERE id=post_id;
  RAISE EXCEPTION 'Cross-business post/job/batch reference accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.social_posts(id,business_id,caption_raw,generation_job_id)
  VALUES(gen_random_uuid(),b,'cross-business spoof',job);
  RAISE EXCEPTION 'Foreign generation job accepted by another business';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
  PERFORM public.claim_social_generation('00000000-0000-4000-8000-000000000088',gen_random_uuid(),repeat('f',64),repeat('f',64),1,0);
  RAISE EXCEPTION 'Generation accepted nonexistent business';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 PERFORM pg_temp.check_that(NOT EXISTS(SELECT FROM public.social_posts WHERE business_id=b),'Failed cross-business writes left rows');
 PERFORM pg_temp.check_that((SELECT used_calls=1 AND reserved_calls=0 FROM public.social_generation_daily_usage WHERE business_id=a),'Batch replay changed paid generation usage');
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 PERFORM pg_temp.check_that(NOT EXISTS(SELECT FROM storage.objects WHERE bucket_id IN('social-images','social-library')),
   'Broad legacy policy exposed social storage to browser');
 PERFORM pg_temp.check_that((SELECT count(*)=1 FROM storage.objects WHERE bucket_id='unrelated-bucket'),
   'Social storage restriction changed an unrelated bucket');
 BEGIN
  PERFORM * FROM public.social_posts;
  RAISE EXCEPTION 'Browser read integrated social data';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM * FROM public.social_generation_jobs;
  RAISE EXCEPTION 'Browser read integrated generation jobs';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
\echo 'Social integration SQL regression passed (rolled back).'
