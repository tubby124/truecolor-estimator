\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.social_posts') IS NOT NULL THEN RAISE EXCEPTION 'Empty disposable database required'; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
ALTER ROLE service_role BYPASSRLS;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
INSERT INTO auth.users VALUES('10000000-0000-4000-8000-000000000001'),('20000000-0000-4000-8000-000000000001');
CREATE TABLE public.social_campaigns(id uuid PRIMARY KEY);
CREATE TABLE public.social_accounts(id uuid PRIMARY KEY);
CREATE TABLE public.social_posts(id uuid PRIMARY KEY,campaign_id uuid REFERENCES public.social_campaigns(id),status text,approval_hash text,updated_at timestamptz,schedule_time timestamptz);
CREATE TABLE public.social_post_results(id uuid PRIMARY KEY,post_id uuid REFERENCES public.social_posts(id));
GRANT ALL ON public.social_posts,public.social_campaigns,public.social_accounts,public.social_post_results TO anon,authenticated,service_role;
GRANT SELECT(approval_hash), UPDATE(status) ON public.social_posts TO authenticated;
INSERT INTO public.social_posts VALUES('a0000000-0000-4000-8000-000000000001',null,'ready','approved-exact-legacy-hash','2026-09-06T06:00Z','2026-09-07T01:00Z');
SET LOCAL app.social_owner_user_id='10000000-0000-4000-8000-000000000001';
\ir ../../../supabase/migrations/20260906120000_social_business_channels.sql
\ir ../../../supabase/migrations/20260906120000_social_business_channels.sql
INSERT INTO public.social_businesses(id,name) VALUES('00000000-0000-4000-8000-000000000002','Synthetic B');
INSERT INTO public.social_business_members VALUES('00000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','operator');
INSERT INTO public.social_campaigns(id,business_id) VALUES('b0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
DO $$ DECLARE t text; r text; BEGIN
 IF (SELECT count(*) FROM pg_constraint WHERE conrelid='public.social_posts'::regclass AND confrelid='public.social_campaigns'::regclass AND contype='f')<>1 THEN RAISE EXCEPTION 'Ambiguous campaign relationship'; END IF;
 IF (SELECT count(*) FROM pg_constraint WHERE conrelid='public.social_post_results'::regclass AND confrelid='public.social_posts'::regclass AND contype='f')<>1 THEN RAISE EXCEPTION 'Ambiguous receipt relationship'; END IF;
 IF NOT EXISTS(SELECT FROM public.social_posts WHERE id='a0000000-0000-4000-8000-000000000001' AND status='ready' AND approval_hash='approved-exact-legacy-hash' AND updated_at='2026-09-06T06:00Z' AND schedule_time='2026-09-07T01:00Z' AND approval_version IS NULL) THEN RAISE EXCEPTION 'Legacy approval changed'; END IF;
 IF NOT EXISTS(SELECT FROM public.social_business_members WHERE business_id='00000000-0000-4000-8000-000000000001' AND user_id='10000000-0000-4000-8000-000000000001') THEN RAISE EXCEPTION 'Owner bootstrap absent'; END IF;
 BEGIN
  UPDATE public.social_posts SET campaign_id='b0000000-0000-4000-8000-000000000001' WHERE id='a0000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'Cross business campaign accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.social_post_results(id,post_id,business_id) VALUES(gen_random_uuid(),'a0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
  RAISE EXCEPTION 'Cross business receipt accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 FOREACH t IN ARRAY ARRAY['social_posts','social_campaigns','social_accounts','social_post_results','social_businesses','social_business_members','social_channel_credentials','social_offers','social_gbp_connections','social_gbp_history'] LOOP
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(r,'public.'||t,'SELECT') OR has_any_column_privilege(r,'public.'||t,'SELECT') OR has_any_column_privilege(r,'public.'||t,'UPDATE') THEN RAISE EXCEPTION 'Browser data grant remains % %',r,t; END IF;
  END LOOP;
 END LOOP;
END $$;
ROLLBACK;
\echo 'Business isolation and legacy approval preservation passed (rolled back)'
