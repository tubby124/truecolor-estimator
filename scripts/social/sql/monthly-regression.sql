\set ON_ERROR_STOP on
-- LOCAL EMPTY DISPOSABLE DATABASE ONLY. Synthetic tenants; all changes roll back.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.social_posts') IS NOT NULL THEN RAISE EXCEPTION 'Use empty disposable database'; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
ALTER ROLE service_role BYPASSRLS;
CREATE TABLE public.social_businesses(id uuid PRIMARY KEY);
CREATE TABLE public.social_posts(id uuid PRIMARY KEY,business_id uuid,batch_id uuid,creative_id uuid,caption_raw text,caption_instagram text,caption_facebook text,caption_gbp text,hashtags text,image_url text,platforms text[],schedule_time timestamptz,fact_fingerprint text,product_slug text,product_configuration jsonb,generation_job_id uuid,offer_id uuid,gbp_payload jsonb,approval_version smallint,status text,source text,post_number integer,created_at timestamptz DEFAULT now());
\ir ../../../supabase/migrations/20260906130000_social_monthly_batches.sql
\ir ../../../supabase/migrations/20260906130000_social_monthly_batches.sql
INSERT INTO public.social_businesses VALUES ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
DO $$
DECLARE a uuid='00000000-0000-4000-8000-000000000001'; b uuid='00000000-0000-4000-8000-000000000002'; batch uuid=gen_random_uuid(); request uuid=gen_random_uuid(); creator uuid=gen_random_uuid(); payload jsonb; first jsonb; replay jsonb;
BEGIN
 payload=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'creative_id',gen_random_uuid(),'platforms',jsonb_build_array('gbp'),'caption_raw','Synthetic review','caption_gbp','Synthetic Google draft','gbp_payload',jsonb_build_object('topicType','STANDARD'),'product_configuration',jsonb_build_object('qty',1),'fact_fingerprint','synthetic-fingerprint','schedule_time','2030-01-02T15:00:00Z','status','ready','approval_hash','fake'));
 first=public.save_social_batch_chunk(a,batch,'2030-01',creator,request,repeat('a',64),payload);
 replay=public.save_social_batch_chunk(a,batch,'2030-01',creator,request,repeat('a',64),payload);
 IF first->0->'gbp_payload'->>'topicType'<>'STANDARD' OR first->0->'product_configuration'->>'qty'<>'1' OR first->0->>'fact_fingerprint'<>'synthetic-fingerprint' THEN RAISE EXCEPTION 'Source snapshot or Google metadata lost'; END IF;
 IF first<>replay OR (SELECT count(*) FROM public.social_posts)<>1 THEN RAISE EXCEPTION 'Retry duplicated destination'; END IF;
 IF first->0->>'status'<>'draft' OR first->0->>'approval_version'<>'2' THEN RAISE EXCEPTION 'Chunk bypassed approval'; END IF;
 BEGIN
  PERFORM public.save_social_batch_chunk(a,batch,'2030-01',creator,request,repeat('b',64),payload);
  RAISE EXCEPTION 'Changed request accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.save_social_batch_chunk(b,batch,'2030-01',creator,request,repeat('a',64),payload);
  RAISE EXCEPTION 'Other business reused batch';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 payload=jsonb_set(payload,'{0,id}',to_jsonb(gen_random_uuid()));
 PERFORM public.save_social_batch_chunk(b,gen_random_uuid(),'2030-01',creator,request,repeat('b',64),payload);
 IF (SELECT count(*) FROM public.social_posts WHERE business_id=a)<>1 OR (SELECT count(*) FROM public.social_posts WHERE business_id=b)<>1 THEN RAISE EXCEPTION 'Business isolation failed'; END IF;
 IF has_function_privilege('authenticated','public.save_social_batch_chunk(uuid,uuid,text,uuid,uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Browser has write access'; END IF;
 BEGIN
  PERFORM public.save_social_batch_chunk(a,batch,'2030-01',creator,gen_random_uuid(),repeat('c',64),payload);
  RAISE EXCEPTION 'Duplicate creative destination accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (SELECT count(*) FROM public.social_batch_chunks)<>2 THEN RAISE EXCEPTION 'Failed request left receipt'; END IF;
END $$;
ROLLBACK;
\echo 'Monthly idempotency and synthetic business isolation regression passed (rolled back).'
