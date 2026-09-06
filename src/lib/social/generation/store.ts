import { createServiceClient } from '@/lib/supabase/server';
import type { GenerationObservation } from '../generation-contract';
import { PROFILE_VERSION } from './prompt';
import { GenerationError, type GenerationStore, type Job } from './service';
export function generationStore(db = createServiceClient()): GenerationStore {
  return {
    async claim({ businessId, requestId, inputHash, cacheKey }) {
      const settings = await db.from('social_generation_settings').select('max_cost_per_call_usd').eq('business_id', businessId).maybeSingle();
      if (settings.error) throw new GenerationError(503, 'Generation migration is required. No AI call was made.');
      const { data, error } = await db.rpc('claim_social_generation', { p_business_id: businessId, p_request_id: requestId, p_input_hash: inputHash, p_cache_key: cacheKey, p_reserved_calls: 2, p_reserved_usd: settings.data?.max_cost_per_call_usd == null ? 0 : Number(settings.data.max_cost_per_call_usd) * 2 });
      if (error) throw new GenerationError(503, 'Generation storage is unavailable. No AI call was made.');
      return data;
    },
    async finish(businessId, id, result) {
      const { data, error } = await db.rpc('finish_social_generation', { p_business_id: businessId, p_request_id: id, p_status: result.status, p_result: result, p_usage: result.usage, p_attempts: result.usage.calls, p_actual_calls: result.usage.calls, p_actual_usd: result.usage.costUsd });
      if (error || data?.status !== 'updated') throw new Error('Generation persistence failed');
    },
    async job(businessId, id) {
      const { data, error } = await db.from('social_generation_jobs').select('*').eq('business_id', businessId).eq('id', id).maybeSingle();
      if (error) throw new Error('Generation read failed');
      return data as Job | null;
    },
    async observation(businessId, mediaHash) {
      const { data, error } = await db.from('social_generation_observations').select('observation').eq('business_id', businessId).eq('media_hash', mediaHash).eq('profile_version', PROFILE_VERSION).maybeSingle();
      if (error) throw new Error('Observation read failed');
      return data?.observation as GenerationObservation | null;
    },
    async saveObservation(businessId, mediaHash, observation) {
      const { error } = await db.from('social_generation_observations').upsert({ business_id: businessId, media_hash: mediaHash, profile_version: PROFILE_VERSION, observation }, { onConflict: 'business_id,media_hash,profile_version' });
      if (error) throw new Error('Observation persistence failed');
    },
    async context(businessId, productSlug) {
      const [recent, tags] = await Promise.all([
        db.from('social_posts').select('caption_raw').eq('business_id', businessId).order('created_at', { ascending: false }).limit(4),
        db.from('social_generation_hashtag_candidates').select('*').eq('business_id', businessId).eq('product_slug', productSlug ?? '').eq('provenance', 'researched').gt('expires_at', new Date().toISOString()).order('researched_at', { ascending: false }).limit(1),
      ]);
      if (recent.error || tags.error) throw new Error('Generation context unavailable');
      const row = tags.data?.[0];
      return { recent: (recent.data ?? []).map(r => String(r.caption_raw ?? '').slice(0, 150)).join('\n'), tags: row?.candidates ?? ['#Saskatoon', '#YXE'], evidence: row ? { kind: 'researched', researchedAt: row.researched_at, sources: row.sources } : { kind: 'generic', researchedAt: null, sources: [] } };
    },
  };
}
