import type { ProductFacts } from '@/lib/pricing/product-facts';
import type { GenerationInput, GenerationObservation, GenerationResponse, GenerationUsage } from '../generation-contract';
import { assemblePrompt } from './prompt';
import { generationKeys, validateOutput } from './validation';
import { addUsage, emptyUsage, ProviderFailure } from './provider';
export type Job = { id: string; status: GenerationResponse['status']; input_hash: string; cache_key: string; result: GenerationResponse | null; reserved_calls?: number };
export interface GenerationStore {
  claim(input: { businessId: string; requestId: string; inputHash: string; cacheKey: string }): Promise<{ status: string; job?: Job }>;
  finish(businessId: string, id: string, result: GenerationResponse): Promise<void>;
  job(businessId: string, id: string): Promise<Job | null>;
  observation(businessId: string, mediaHash: string): Promise<GenerationObservation | null>;
  saveObservation(businessId: string, mediaHash: string, observation: GenerationObservation): Promise<void>;
  context(businessId: string, productSlug?: string): Promise<{ recent: string; tags: string[]; evidence: GenerationResponse['hashtagEvidence'] }>;
}
export class GenerationError extends Error { constructor(public status: number, message: string) { super(message); } }
export const emptyResult = (input: GenerationInput, facts: ProductFacts | null): GenerationResponse => ({ jobId: input.requestId, status: 'running', drafts: {}, facts, cacheHit: false, usage: emptyUsage(), errors: [], hashtags: '', hashtagEvidence: { kind: 'generic', researchedAt: null, sources: [] }, instagram: '', facebook: '', gbp: '', twitter: '', alt_text: '', angle: input.angle ?? '' });
export const flattenResult = (r: GenerationResponse) => ({ ...r, instagram: r.drafts.instagram ?? '', facebook: r.drafts.facebook ?? '', gbp: r.drafts.gbp ?? '', twitter: '' as const, alt_text: r.observation?.alt_text ?? '' });
export async function generate(input: GenerationInput, businessId: string, facts: ProductFacts | null, store: GenerationStore, provider: (prompt: { system: string; context: string }, image: { base64: string; type: string } | null) => Promise<{ content: string; usage: GenerationUsage }>, durable = true) {
  const keys = generationKeys(businessId, input, facts);
  let result = emptyResult(input, facts);
  let allowedCalls = durable ? 2 : 1;
  if (durable) {
    const claim = await store.claim({ businessId, requestId: input.requestId, inputHash: keys.inputHash, cacheKey: keys.cacheKey });
    if (claim.status === 'conflict') throw new GenerationError(409, 'Request ID belongs to different content or stale catalogue facts. Start a new request.');
    if (claim.status === 'busy') throw new GenerationError(429, 'Two caption jobs are already running. Resume them before starting another.');
    if (claim.status === 'budget') throw new GenerationError(429, 'Generation ceiling reached. Review usage and owner settings.');
    if (claim.status === 'existing' || claim.status === 'cached') {
      const saved = claim.job?.result ?? result;
      return flattenResult({ ...saved, jobId: claim.job?.id ?? input.requestId, status: claim.job?.status ?? 'running', cacheHit: claim.status === 'cached' || saved.status === 'completed', usage: emptyUsage() });
    }
    allowedCalls = claim.job?.reserved_calls ?? 2;
    if (claim.status !== 'claimed') throw new GenerationError(503, 'Generation storage is unavailable. No AI call was made.');
  }
  try {
    let channels = input.selectedChannels;
    if (input.resumeJobId) {
      const previous = await store.job(businessId, input.resumeJobId);
      if (!previous || previous.input_hash !== keys.inputHash || previous.cache_key !== keys.cacheKey || previous.status !== 'partial') throw new GenerationError(409, 'Only a matching partial job can be resumed. Held outcomes require reconciliation.');
      result.drafts = { ...previous.result?.drafts };
      channels = channels.filter(c => !result.drafts[c]);
    }
    const observation = keys.mediaHash && durable ? await store.observation(businessId, keys.mediaHash) : null;
    if (observation?.readable === false) throw new GenerationError(409, 'This photo has unreadable details. Select a clearer photo or edit manually.');
    const context = durable ? await store.context(businessId, input.productSlug) : { recent: '', tags: ['#Saskatoon', '#YXE'], evidence: { kind: 'generic' as const, researchedAt: null, sources: [] } };
    result.hashtagEvidence = context.evidence;
    const prompt = assemblePrompt({ ...input, selectedChannels: channels }, facts, observation, context.recent, context.tags);
    const image = !observation && input.image_base64 ? { base64: input.image_base64, type: input.image_type! } : null;
    let answer;
    for (let attempt = 0; attempt < allowedCalls; attempt++) {
      try { answer = await provider(prompt, image); result.usage = addUsage(result.usage, answer.usage); break; }
      catch (e) {
        if (!(e instanceof ProviderFailure)) throw e;
        result.usage = addUsage(result.usage, e.usage);
        if (e.kind === 'retryable' && attempt + 1 < allowedCalls) continue;
        result.status = e.kind === 'held' ? 'held' : Object.keys(result.drafts).length ? 'partial' : 'failed'; result.errors.push(e.message); break;
      }
    }
    if (answer) {
      const checked = validateOutput(answer.content, channels, facts, !!input.includePrice);
      result.drafts = { ...result.drafts, ...checked.drafts }; result.errors.push(...checked.errors);
      result.observation = observation ?? checked.observation;
      if (image && !checked.observation) { result.drafts = {}; result.errors.push('Photo observation missing. Review manually.'); }
      if (image && keys.mediaHash && checked.observation && durable) await store.saveObservation(businessId, keys.mediaHash, checked.observation);
      result.status = input.selectedChannels.every(c => !!result.drafts[c]) ? 'completed' : Object.keys(result.drafts).length ? 'partial' : 'failed';
    }
  } catch (e) {
    result.status = result.usage.calls ? 'held' : 'failed';
    result.errors.push(e instanceof GenerationError ? e.message : 'Generation could not complete. Saved successes remain available for review.');
  }
  result = flattenResult(result);
  if (durable) {
    try { await store.finish(businessId, input.requestId, result); }
    catch { throw new GenerationError(503, 'Result persistence is uncertain. Resume this same request ID; do not start a duplicate generation.'); }
  }
  return result;
}
