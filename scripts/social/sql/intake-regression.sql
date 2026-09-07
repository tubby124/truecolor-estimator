\set ON_ERROR_STOP on
-- LOCAL EMPTY DISPOSABLE DATABASE ONLY. Synthetic tenants, no external effects.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.social_posts') IS NOT NULL THEN RAISE EXCEPTION 'Use empty disposable database'; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
ALTER ROLE service_role BYPASSRLS;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE social_businesses(id uuid PRIMARY KEY,is_active boolean DEFAULT true);
CREATE TABLE social_business_members(business_id uuid,user_id uuid,role text);
CREATE TABLE social_posts(id uuid PRIMARY KEY,business_id uuid,creative_id uuid,caption_raw text,caption_instagram text,caption_facebook text,image_url text,image_urls text[],platforms text[],schedule_time timestamptz,use_next_free_slot boolean,status text,source text,approval_version integer,generation_job_id uuid,alt_text text,approval_hash text,approved_media_sha256 text,approved_at timestamptz,approved_by uuid,approved_rights boolean,approval_target jsonb,updated_at timestamptz DEFAULT now(),UNIQUE(business_id,id));
\ir ../../../supabase/migrations/20260907180000_social_photo_intake.sql
\ir ../../../supabase/migrations/20260907180000_social_photo_intake.sql
DO $$
DECLARE a uuid=gen_random_uuid(); b uuid=gen_random_uuid(); owner_id uuid=gen_random_uuid(); request_id uuid=gen_random_uuid(); p1 uuid=gen_random_uuid(); p2 uuid=gen_random_uuid(); payload jsonb; first jsonb; replay jsonb; versions jsonb; reviews jsonb; blocked boolean; collision_id uuid=gen_random_uuid(); second_request uuid=gen_random_uuid();
BEGIN
 INSERT INTO social_businesses(id) VALUES(a),(b);
 INSERT INTO social_business_members VALUES(a,owner_id,'operator');
 first=claim_social_intake(a,request_id,repeat('a',64),owner_id);
 replay=claim_social_intake(a,request_id,repeat('a',64),owner_id);
 IF first->>'claimed'<>'true' OR replay->>'claimed'<>'false' OR first->'intake'<>replay->'intake' THEN RAISE EXCEPTION 'Intake replay not deduplicated'; END IF;
 blocked=false; BEGIN PERFORM claim_social_intake(a,request_id,repeat('b',64),owner_id); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Changed request accepted'; END IF;
 blocked=false; BEGIN PERFORM claim_social_intake(b,gen_random_uuid(),repeat('b',64),owner_id); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-business operator accepted'; END IF;
 payload=jsonb_build_array(jsonb_build_object('id',p1,'platform','instagram','caption','Photo showcase','scheduleTime','2099-01-02T16:00:00Z','generationJobId',gen_random_uuid()),jsonb_build_object('id',p2,'platform','facebook','caption','Photo showcase','scheduleTime','2099-01-02T16:00:00Z','generationJobId',gen_random_uuid()));
 PERFORM save_social_intake(a,request_id,'https://example.invalid/photo.jpg','private-original',repeat('c',64),repeat('d',64),payload);
 IF (SELECT count(*) FROM social_posts WHERE status='draft')<>2 OR EXISTS(SELECT FROM social_scheduler_enrollments) THEN RAISE EXCEPTION 'Draft intake enrolled before approval'; END IF;
 PERFORM claim_social_intake(a,second_request,repeat('b',64),owner_id);
 blocked=false; BEGIN PERFORM save_social_intake(a,second_request,'https://example.invalid/second.jpg','private-second',repeat('c',64),repeat('d',64),jsonb_set(jsonb_set(payload,'{0,id}',to_jsonb(gen_random_uuid())),'{1,id}',to_jsonb(gen_random_uuid()))); EXCEPTION WHEN exclusion_violation THEN blocked=true; END;
 IF NOT blocked OR (SELECT count(*) FROM social_posts)<>2 THEN RAISE EXCEPTION 'Concurrent same-day intake left mutually blocking drafts'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'updated_at',updated_at)) INTO versions FROM social_posts WHERE business_id=a;
 PERFORM revise_social_intake(a,request_id,repeat('d',64),repeat('e',64),'2099-01-03T16:00:00Z','Revised Instagram','Revised Facebook',now()+interval '48 hours',versions);
 blocked=false; BEGIN PERFORM revise_social_intake(a,request_id,repeat('d',64),repeat('f',64),'2099-01-03T16:00:00Z','Stale Instagram','Stale Facebook',now()+interval '48 hours',versions); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked OR (SELECT revision FROM social_intake_requests WHERE id=request_id)<>2 THEN RAISE EXCEPTION 'Concurrent stale revision accepted'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'updated_at',updated_at,'fingerprint',repeat('f',64),'media_hash',repeat('c',64),'target',jsonb_build_object('platform',platforms[1],'accountId','synthetic','pageId','synthetic'))) INTO reviews FROM social_posts WHERE business_id=a;
 -- A partial CAS must roll back the first changed destination and all enrollment.
 blocked=false; BEGIN PERFORM approve_social_intake(a,request_id,owner_id,repeat('e',64),jsonb_set(reviews,'{1,updated_at}',to_jsonb('2000-01-01T00:00:00Z'::text))); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked OR (SELECT count(*) FROM social_posts WHERE status='draft')<>2 OR EXISTS(SELECT FROM social_scheduler_enrollments) THEN RAISE EXCEPTION 'Partial approval escaped transaction'; END IF;
 INSERT INTO social_posts(id,business_id,status,schedule_time) VALUES(collision_id,a,'ready','2099-01-03T20:00:00Z');
 blocked=false; BEGIN PERFORM approve_social_intake(a,request_id,owner_id,repeat('e',64),reviews); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Occupied local day accepted'; END IF;
 DELETE FROM social_posts WHERE id=collision_id;
 first=approve_social_intake(a,request_id,owner_id,repeat('e',64),reviews);
 replay=approve_social_intake(a,request_id,owner_id,repeat('e',64),reviews);
 IF first<>replay OR (SELECT count(*) FROM social_scheduler_enrollments)<>2 OR (SELECT count(*) FROM social_posts WHERE status='ready')<>2 THEN RAISE EXCEPTION 'Approval replay duplicated enrollment or lost atomic pair'; END IF;
 blocked=false; BEGIN PERFORM revise_social_intake_image(a,request_id,repeat('e',64),repeat('a',64),'https://example.invalid/new.jpg',repeat('b',64),'cleaned',now()+interval '48 hours',versions); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Approved image was replaceable'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'updated_at',updated_at)) INTO versions FROM social_posts WHERE business_id=a;
 PERFORM revise_social_intake(a,request_id,repeat('e',64),repeat('a',64),'2099-01-04T16:00:00Z','Rescheduled Instagram','Rescheduled Facebook',now()+interval '48 hours',versions);
 IF (SELECT count(*) FROM social_posts WHERE status='draft' AND approval_hash IS NULL)<>2 OR EXISTS(SELECT FROM social_scheduler_enrollments) OR (SELECT status FROM social_intake_requests WHERE id=request_id)<>'review' THEN RAISE EXCEPTION 'Unattempted approved pair could not be reopened atomically'; END IF;
 UPDATE social_posts SET status='posting' WHERE id=p1;
 blocked=false; BEGIN PERFORM revise_social_intake(a,request_id,repeat('a',64),repeat('b',64),'2099-01-05T16:00:00Z','Unsafe Instagram','Unsafe Facebook',now()+interval '48 hours',versions); EXCEPTION WHEN OTHERS THEN blocked=true; END;
 IF NOT blocked OR (SELECT status FROM social_posts WHERE id=p1)<>'posting' THEN RAISE EXCEPTION 'Attempted delivery was reset by revision'; END IF;
 blocked=false; BEGIN INSERT INTO social_scheduler_enrollments VALUES(b,p1,repeat('a',64),now()); EXCEPTION WHEN foreign_key_violation THEN blocked=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-business enrollment accepted'; END IF;
 IF has_table_privilege('authenticated','social_intake_requests','SELECT') OR has_table_privilege('anon','social_scheduler_enrollments','INSERT') OR has_function_privilege('authenticated','approve_social_intake(uuid,uuid,uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Public intake privileges exposed'; END IF;
 IF (SELECT public FROM storage.buckets WHERE id='social-originals') THEN RAISE EXCEPTION 'Originals bucket is public'; END IF;
END $$;
ROLLBACK;
\echo 'Intake idempotence, CAS rollback, schedule collision, business isolation, image approval and ACL regressions passed (rolled back).'
