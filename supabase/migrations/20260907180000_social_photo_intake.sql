-- Additive photo intake. Applying production SQL requires owner approval.
CREATE TABLE IF NOT EXISTS public.social_intake_requests (
 id uuid PRIMARY KEY,
 business_id uuid NOT NULL REFERENCES public.social_businesses(id),
 request_key uuid NOT NULL,
 input_hash text NOT NULL CHECK(input_hash ~ '^[a-f0-9]{64}$'),
 status text NOT NULL DEFAULT 'preparing' CHECK(status IN ('preparing','review','approved','held')),
 created_by uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision > 0),
 post_ids uuid[] NOT NULL DEFAULT '{}',
 image_url text,
 original_path text,
 media_sha256 text,
 media_treatment text NOT NULL DEFAULT 'Orientation corrected, resized and padded where needed. No background removal or artwork changes.',
 preview_hash text,
 preview_expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,request_key), UNIQUE(business_id,id)
);
CREATE TABLE IF NOT EXISTS public.social_scheduler_enrollments (
 business_id uuid NOT NULL,
 post_id uuid NOT NULL,
 approval_hash text NOT NULL CHECK(approval_hash ~ '^[a-f0-9]{64}$'),
 enrolled_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,post_id),
 FOREIGN KEY(business_id,post_id) REFERENCES public.social_posts(business_id,id)
);
CREATE TABLE IF NOT EXISTS public.social_intake_posts (
 business_id uuid NOT NULL, intake_id uuid NOT NULL, post_id uuid NOT NULL,
 PRIMARY KEY(business_id,intake_id,post_id), UNIQUE(business_id,post_id),
 FOREIGN KEY(business_id,intake_id) REFERENCES public.social_intake_requests(business_id,id),
 FOREIGN KEY(business_id,post_id) REFERENCES public.social_posts(business_id,id)
);
ALTER TABLE public.social_intake_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scheduler_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_intake_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_intake_requests,public.social_scheduler_enrollments,public.social_intake_posts FROM anon,authenticated;
GRANT ALL ON public.social_intake_requests,public.social_scheduler_enrollments,public.social_intake_posts TO service_role;

CREATE OR REPLACE FUNCTION public.claim_social_intake(p_business_id uuid,p_request_id uuid,p_input_hash text,p_operator_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE row public.social_intake_requests%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM social_business_members m JOIN social_businesses b ON b.id=m.business_id WHERE m.business_id=p_business_id AND m.user_id=p_operator_id AND m.role='operator' AND b.is_active) THEN RAISE EXCEPTION 'Operator unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::text||p_request_id::text,0));
 SELECT * INTO row FROM social_intake_requests WHERE business_id=p_business_id AND request_key=p_request_id;
 IF FOUND THEN
  IF row.input_hash<>p_input_hash THEN RAISE EXCEPTION 'Request content changed'; END IF;
  RETURN jsonb_build_object('claimed',false,'intake',to_jsonb(row));
 END IF;
 INSERT INTO social_intake_requests(id,business_id,request_key,input_hash,created_by) VALUES(p_request_id,p_business_id,p_request_id,p_input_hash,p_operator_id) RETURNING * INTO row;
 RETURN jsonb_build_object('claimed',true,'intake',to_jsonb(row));
END $$;

CREATE OR REPLACE FUNCTION public.save_social_intake(p_business_id uuid,p_intake_id uuid,p_image_url text,p_original_path text,p_media_hash text,p_fingerprint text,p_posts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE row public.social_intake_requests%ROWTYPE; ids uuid[]; scheduled timestamptz;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('social-schedule:'||p_business_id::text,0));
 SELECT * INTO row FROM social_intake_requests WHERE business_id=p_business_id AND id=p_intake_id FOR UPDATE;
 IF NOT FOUND OR row.status<>'preparing' THEN RAISE EXCEPTION 'Intake changed'; END IF;
 IF jsonb_array_length(p_posts)<>2 OR (SELECT count(DISTINCT x->>'platform') FROM jsonb_array_elements(p_posts) x WHERE x->>'platform' IN ('instagram','facebook'))<>2 THEN RAISE EXCEPTION 'One draft per destination required'; END IF;
 SELECT min((x->>'scheduleTime')::timestamptz) INTO scheduled FROM jsonb_array_elements(p_posts) x;
 IF scheduled IS NULL OR scheduled<=now() OR (SELECT count(DISTINCT (x->>'scheduleTime')::timestamptz) FROM jsonb_array_elements(p_posts) x)<>1 THEN RAISE EXCEPTION 'Matching future schedule required'; END IF;
 IF EXISTS(SELECT 1 FROM social_posts WHERE business_id=p_business_id AND status IN ('draft','ready','posting','posted') AND (schedule_time AT TIME ZONE 'America/Regina')::date=(scheduled AT TIME ZONE 'America/Regina')::date) THEN RAISE EXCEPTION 'Schedule occupied' USING ERRCODE='23P01'; END IF;
 WITH inserted AS (
 INSERT INTO social_posts(id,business_id,creative_id,caption_raw,caption_instagram,caption_facebook,image_url,image_urls,platforms,schedule_time,use_next_free_slot,status,source,approval_version,generation_job_id,alt_text)
 SELECT (x->>'id')::uuid,p_business_id,p_intake_id,x->>'caption',CASE WHEN x->>'platform'='instagram' THEN x->>'caption' END,CASE WHEN x->>'platform'='facebook' THEN x->>'caption' END,p_image_url,ARRAY[p_image_url],ARRAY[x->>'platform'],(x->>'scheduleTime')::timestamptz,false,'draft','manual',2,(x->>'generationJobId')::uuid,x->>'altText' FROM jsonb_array_elements(p_posts) x RETURNING id
 ) SELECT array_agg(id ORDER BY id) INTO ids FROM inserted;
 INSERT INTO social_intake_posts SELECT p_business_id,p_intake_id,unnest(ids);
 UPDATE social_intake_requests SET status='review',post_ids=ids,image_url=p_image_url,original_path=p_original_path,media_sha256=p_media_hash,preview_hash=p_fingerprint,updated_at=now() WHERE id=p_intake_id AND business_id=p_business_id RETURNING * INTO row;
 RETURN to_jsonb(row);
END $$;

CREATE OR REPLACE FUNCTION public.revise_social_intake(p_business_id uuid,p_intake_id uuid,p_expected_fingerprint text,p_fingerprint text,p_schedule timestamptz,p_instagram text,p_facebook text,p_expires_at timestamptz,p_versions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE row public.social_intake_requests%ROWTYPE; changed integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('social-schedule:'||p_business_id::text,0));
 SELECT * INTO row FROM social_intake_requests WHERE business_id=p_business_id AND id=p_intake_id FOR UPDATE;
 IF NOT FOUND OR row.status NOT IN ('review','approved') OR row.preview_hash IS DISTINCT FROM p_expected_fingerprint THEN RAISE EXCEPTION 'Review changed'; END IF;
 IF p_schedule<=now() THEN RAISE EXCEPTION 'Future schedule required'; END IF;
 IF EXISTS(SELECT 1 FROM social_posts WHERE business_id=p_business_id AND NOT(id=ANY(row.post_ids)) AND status IN ('draft','ready','posting','posted') AND (schedule_time AT TIME ZONE 'America/Regina')::date=(p_schedule AT TIME ZONE 'America/Regina')::date) THEN RAISE EXCEPTION 'Schedule occupied'; END IF;
 IF jsonb_array_length(p_versions)<>2 THEN RAISE EXCEPTION 'Draft versions required'; END IF;
 UPDATE social_posts p SET status='draft',caption_raw=CASE WHEN platforms[1]='instagram' THEN p_instagram ELSE p_facebook END,caption_instagram=CASE WHEN platforms[1]='instagram' THEN p_instagram END,caption_facebook=CASE WHEN platforms[1]='facebook' THEN p_facebook END,schedule_time=p_schedule,approval_hash=NULL,approved_media_sha256=NULL,approved_at=NULL,approved_by=NULL,approved_rights=NULL,approval_target=NULL,updated_at=now()
 FROM jsonb_to_recordset(p_versions) v(id uuid,updated_at timestamptz)
 WHERE p.business_id=p_business_id AND p.id=ANY(row.post_ids) AND p.id=v.id AND p.updated_at=v.updated_at AND p.status IN ('draft','ready');
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>2 THEN RAISE EXCEPTION 'Draft changed'; END IF;
 DELETE FROM social_scheduler_enrollments WHERE business_id=p_business_id AND post_id=ANY(row.post_ids);
 UPDATE social_intake_requests SET status='review',revision=revision+1,preview_hash=p_fingerprint,preview_expires_at=p_expires_at,updated_at=now() WHERE business_id=p_business_id AND id=p_intake_id RETURNING * INTO row;
 RETURN to_jsonb(row);
END $$;

CREATE OR REPLACE FUNCTION public.approve_social_intake(p_business_id uuid,p_intake_id uuid,p_operator_id uuid,p_fingerprint text,p_reviews jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE row public.social_intake_requests%ROWTYPE; changed integer; scheduled timestamptz;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('social-schedule:'||p_business_id::text,0));
 SELECT * INTO row FROM social_intake_requests WHERE business_id=p_business_id AND id=p_intake_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM social_business_members m JOIN social_businesses b ON b.id=m.business_id WHERE m.business_id=p_business_id AND m.user_id=p_operator_id AND m.role='operator' AND b.is_active) THEN RAISE EXCEPTION 'Operator unavailable'; END IF;
 IF NOT FOUND OR row.preview_hash IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'Review changed'; END IF;
 IF row.status='approved' THEN RETURN to_jsonb(row); END IF;
 IF row.status<>'review' OR row.preview_expires_at<=now() OR cardinality(row.post_ids)<>2 OR jsonb_array_length(p_reviews)<>2 THEN RAISE EXCEPTION 'Review unavailable'; END IF;
 PERFORM 1 FROM social_posts WHERE business_id=p_business_id AND id=ANY(row.post_ids) ORDER BY id FOR UPDATE;
 SELECT min(schedule_time) INTO scheduled FROM social_posts WHERE business_id=p_business_id AND id=ANY(row.post_ids);
 IF scheduled<=now() OR scheduled IS NULL OR (SELECT count(DISTINCT schedule_time) FROM social_posts WHERE business_id=p_business_id AND id=ANY(row.post_ids))<>1 THEN RAISE EXCEPTION 'Future matching schedule required'; END IF;
 IF EXISTS(SELECT 1 FROM social_posts WHERE business_id=p_business_id AND NOT(id=ANY(row.post_ids)) AND status IN ('draft','ready','posting','posted') AND (schedule_time AT TIME ZONE 'America/Regina')::date=(scheduled AT TIME ZONE 'America/Regina')::date) THEN RAISE EXCEPTION 'Schedule occupied'; END IF;
 UPDATE social_posts p SET status='ready',approval_version=2,approval_hash=v.fingerprint,approved_media_sha256=v.media_hash,approved_at=now(),approved_by=p_operator_id,approved_rights=true,approval_target=v.target,updated_at=now()
 FROM jsonb_to_recordset(p_reviews) v(id uuid,updated_at timestamptz,fingerprint text,media_hash text,target jsonb)
 WHERE p.business_id=p_business_id AND p.id=ANY(row.post_ids) AND p.id=v.id AND p.updated_at=v.updated_at AND p.status='draft' AND v.fingerprint ~ '^[a-f0-9]{64}$' AND v.media_hash=row.media_sha256 AND v.target->>'platform'=p.platforms[1];
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>2 THEN RAISE EXCEPTION 'Draft changed'; END IF;
 INSERT INTO social_scheduler_enrollments(business_id,post_id,approval_hash) SELECT business_id,id,approval_hash FROM social_posts WHERE business_id=p_business_id AND id=ANY(row.post_ids);
 UPDATE social_intake_requests SET status='approved',updated_at=now() WHERE business_id=p_business_id AND id=p_intake_id RETURNING * INTO row;
 RETURN to_jsonb(row);
END $$;
REVOKE ALL ON FUNCTION public.claim_social_intake(uuid,uuid,text,uuid),public.save_social_intake(uuid,uuid,text,text,text,text,jsonb),public.revise_social_intake(uuid,uuid,text,text,timestamptz,text,text,timestamptz,jsonb),public.approve_social_intake(uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_social_intake(uuid,uuid,text,uuid),public.save_social_intake(uuid,uuid,text,text,text,text,jsonb),public.revise_social_intake(uuid,uuid,text,text,timestamptz,text,text,timestamptz,jsonb),public.approve_social_intake(uuid,uuid,uuid,text,jsonb) TO service_role;
-- Originals stay private. Prepared publishable JPEGs use the existing social-images bucket.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('social-originals','social-originals',false,12582912,ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='social-originals' AND public) THEN RAISE EXCEPTION 'social-originals must be private before intake activation'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.revise_social_intake_image(p_business_id uuid,p_intake_id uuid,p_expected_fingerprint text,p_fingerprint text,p_image_url text,p_media_hash text,p_media_treatment text,p_expires_at timestamptz,p_versions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE row public.social_intake_requests%ROWTYPE; changed integer;
BEGIN
 SELECT * INTO row FROM social_intake_requests WHERE business_id=p_business_id AND id=p_intake_id FOR UPDATE;
 IF NOT FOUND OR row.status<>'review' OR row.preview_hash IS DISTINCT FROM p_expected_fingerprint THEN RAISE EXCEPTION 'Review changed'; END IF;
 IF jsonb_array_length(p_versions)<>2 OR p_media_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Draft versions required'; END IF;
 UPDATE social_posts p SET image_url=p_image_url,image_urls=ARRAY[p_image_url],approval_hash=NULL,approved_media_sha256=NULL,approved_at=NULL,approved_by=NULL,approved_rights=NULL,approval_target=NULL,updated_at=now()
 FROM jsonb_to_recordset(p_versions) v(id uuid,updated_at timestamptz)
 WHERE p.business_id=p_business_id AND p.id=ANY(row.post_ids) AND p.id=v.id AND p.updated_at=v.updated_at AND p.status='draft';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>2 THEN RAISE EXCEPTION 'Draft changed'; END IF;
 UPDATE social_intake_requests SET revision=revision+1,image_url=p_image_url,media_sha256=p_media_hash,media_treatment=p_media_treatment,preview_hash=p_fingerprint,preview_expires_at=p_expires_at,updated_at=now() WHERE business_id=p_business_id AND id=p_intake_id RETURNING * INTO row;
 RETURN to_jsonb(row);
END $$;
REVOKE ALL ON FUNCTION public.revise_social_intake_image(uuid,uuid,text,text,text,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revise_social_intake_image(uuid,uuid,text,text,text,text,text,timestamptz,jsonb) TO service_role;
