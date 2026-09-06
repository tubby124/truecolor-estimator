import { describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { resolveProductFacts } from '@/lib/pricing/product-facts';
import type { GenerationInput, GenerationObservation, GenerationResponse } from '../../generation-contract';
import { generate, type GenerationStore, type Job } from '../service';
import { generationKeys, parseGenerationInput, validateDraft, validateOutput } from '../validation';
import { callProvider, emptyUsage, ProviderFailure } from '../provider';
const input = (extra: Partial<GenerationInput> = {}): GenerationInput => ({ requestId: randomUUID(), selectedChannels: ['instagram', 'facebook'], topic: 'print showcase', ...extra });
const usage = { ...emptyUsage(), calls: 1, promptTokens: 100, completionTokens: 40, costUsd: 0.01 };
const good = { drafts: { instagram: 'Bright banners bring a pop of colour to Saskatoon.', facebook: 'A fresh look for your next event in Saskatoon.', gbp: 'Explore colourful print ideas in Saskatoon.' }, observation: { description: 'A colourful printed banner.', alt_text: 'Colourful banner on a wall', readable: true } };
const provider = () => vi.fn().mockResolvedValue({ content: JSON.stringify(good), usage });
function memoryStore() {
  const jobs = new Map<string, Job>(); const cache = new Map<string, GenerationResponse>(); const observations = new Map<string, GenerationObservation>();
  let claimsAllowed = true;
  const store: GenerationStore = {
    async claim(a) {
      const id = `${a.businessId}:${a.requestId}`, old = jobs.get(id);
      if (old) return { status: old.input_hash === a.inputHash && old.cache_key === a.cacheKey ? 'existing' : 'conflict', job: old };
      const hit = cache.get(`${a.businessId}:${a.cacheKey}`);
      if (hit) { const job: Job = { id: a.requestId, status: 'completed', result: hit, input_hash: a.inputHash, cache_key: a.cacheKey }; jobs.set(id, job); return { status: 'cached', job }; }
      if (!claimsAllowed) return { status: 'budget' };
      const job: Job = { id: a.requestId, status: 'running', result: null, input_hash: a.inputHash, cache_key: a.cacheKey, reserved_calls: 2 }; jobs.set(id, job); return { status: 'claimed', job };
    },
    async finish(b, id, result) { const job = jobs.get(`${b}:${id}`)!; job.result = result; job.status = result.status; if (result.status === 'completed') cache.set(`${b}:${job.cache_key}`, result); },
    async job(b, id) { return jobs.get(`${b}:${id}`) ?? null; },
    async observation(b, h) { return observations.get(`${b}:${h}`) ?? null; },
    async saveObservation(b, h, o) { observations.set(`${b}:${h}`, o); },
    async context() { return { recent: '', tags: ['#Saskatoon'], evidence: { kind: 'generic', researchedAt: null, sources: [] } }; },
  };
  return { store, jobs, observations, stop: () => { claimsAllowed = false; } };
}
describe('durable catalogue caption generation (mocked provider)', () => {
  it('unchanged rerun, new ID exact reuse, and schedule-only edits make zero additional calls', async () => {
    const { store } = memoryStore(), p = provider(), a = input();
    await generate(a, 'one', null, store, p);
    expect((await generate(a, 'one', null, store, p)).usage.calls).toBe(0);
    const changedSchedule = parseGenerationInput({ ...a, requestId: randomUUID(), schedule_time: '2030-01-01' }).input;
    expect((await generate(changedSchedule, 'one', null, store, p)).cacheHit).toBe(true);
    expect(p).toHaveBeenCalledTimes(1);
  });
  it('editing one item does not regenerate another item', async () => {
    const { store } = memoryStore(), p = provider(), a = input(), b = input({ topic: 'window showcase' });
    await generate(a, 'one', null, store, p); await generate(b, 'one', null, store, p);
    await generate(input({ topic: 'new banner angle' }), 'one', null, store, p); await generate(b, 'one', null, store, p);
    expect(p).toHaveBeenCalledTimes(3);
  });
  it('same ID edited content conflicts, same cache cannot cross tenants', async () => {
    const { store } = memoryStore(), p = provider(), a = input();
    await generate(a, 'one', null, store, p);
    await expect(generate({ ...a, topic: 'changed' }, 'one', null, store, p)).rejects.toThrow('different content');
    await generate(a, 'two', null, store, p); expect(p).toHaveBeenCalledTimes(2);
  });
  it('price changes invalidate copy but retain photo observations', async () => {
    const { store } = memoryStore(), p = provider(); const facts = resolveProductFacts({ productSlug: 'retractable-banners' });
    const a = input({ image_base64: 'aW1hZ2U=', image_type: 'image/jpeg', productSlug: facts.productSlug });
    await generate(a, 'one', facts, store, p);
    await generate({ ...a, requestId: randomUUID() }, 'one', { ...facts, sourceFingerprint: 'changed' }, store, p);
    expect(p).toHaveBeenCalledTimes(2); expect(p.mock.calls[0][1]).not.toBeNull(); expect(p.mock.calls[1][1]).toBeNull();
  });
  it('saves partial successes and only requests missing channels during explicit resume', async () => {
    const { store } = memoryStore(), p = provider(), a = input();
    p.mockResolvedValueOnce({ content: JSON.stringify({ ...good, drafts: { ...good.drafts, facebook: 'Only $99!' } }), usage });
    const partial = await generate(a, 'one', null, store, p); expect(partial.status).toBe('partial');
    const done = await generate({ ...a, requestId: randomUUID(), resumeJobId: a.requestId }, 'one', null, store, p);
    expect(done.status).toBe('completed'); expect(done.drafts.instagram).toBe(good.drafts.instagram);
    expect(JSON.parse(p.mock.calls[1][0].context).channels).toEqual(['facebook']);
  });
  it('stops before provider when budget is exhausted', async () => {
    const m = memoryStore(), p = provider(); m.stop();
    await expect(generate(input(), 'one', null, m.store, p)).rejects.toThrow('ceiling'); expect(p).not.toHaveBeenCalled();
  });
  it('retries explicit429 once, never retries ambiguous timeout or repairs JSON', async () => {
    const { store } = memoryStore(), p = provider();
    p.mockRejectedValueOnce(new ProviderFailure('retryable', usage, 'HTTP429'));
    expect((await generate(input(), 'one', null, store, p)).usage.calls).toBe(2);
    p.mockRejectedValue(new ProviderFailure('held', usage, 'uncertain timeout'));
    expect((await generate(input({ topic: 'other' }), 'one', null, store, p)).status).toBe('held'); expect(p).toHaveBeenCalledTimes(3);
    p.mockResolvedValue({ content: 'not json', usage });
    expect((await generate(input({ topic: 'invalid' }), 'one', null, store, p)).status).toBe('failed'); expect(p).toHaveBeenCalledTimes(4);
  });
  it('honors one remaining call without performing a retry', async () => {
    const m = memoryStore(), claim = m.store.claim;
    m.store.claim = async a => { const c = await claim(a); if (c.job) c.job.reserved_calls = 1; return c; };
    const p = provider().mockRejectedValue(new ProviderFailure('retryable', usage, 'HTTP429'));
    expect((await generate(input(), 'one', null, m.store, p)).usage.calls).toBe(1); expect(p).toHaveBeenCalledTimes(1);
  });
  it('cached unreadable observation remains held without another call', async () => {
    const { store } = memoryStore(), p = provider(), a = input({ image_base64: 'aW1hZ2U=', image_type: 'image/jpeg' });
    p.mockResolvedValueOnce({ content: JSON.stringify({ ...good, observation: { ...good.observation, readable: false } }), usage });
    expect((await generate(a, 'one', null, store, p)).status).toBe('failed');
    const next = await generate({ ...a, requestId: randomUUID(), angle: 'different' }, 'one', null, store, p);
    expect(next.status).toBe('failed'); expect(p).toHaveBeenCalledTimes(1);
  });
  it('never regenerates concurrent duplicate request while running', async () => {
    const { store } = memoryStore(), a = input(), p = provider();
    const k = generationKeys('one', a, null); await store.claim({ businessId: 'one', requestId: a.requestId, ...k });
    expect((await generate(a, 'one', null, store, p)).status).toBe('running'); expect(p).not.toHaveBeenCalled();
  });
});
describe('deterministic request and output validation', () => {
  it('legacy defaults IG/FB, rejects X and invalid inputs', () => {
    expect(parseGenerationInput({ topic: 'hello' }).input.selectedChannels).toEqual(['facebook', 'instagram']);
    expect(() => parseGenerationInput({ ...input(), selectedChannels: ['twitter'] })).toThrow();
    expect(() => parseGenerationInput({ ...input(), includePrice: true })).toThrow();
    expect(() => parseGenerationInput({ ...input(), image_base64: '!bad', image_type: 'text/html' })).toThrow();
  });
  it.each(['Just $99.', 'Lifetime warranty and two-day delivery.', 'Half price banners for everyone.', 'Buy two get one on every banner.', 'Free same-day rush.', 'Our client loved this.', 'Only 20 available.'])('holds unsupported claim %s', text => expect(validateDraft(text, 'facebook')).not.toBeNull());
  it('renders source-bound price/minimum outside model and only selected channels', () => {
    const facts = resolveProductFacts({ productSlug: 'photo-posters' });
    const result = validateOutput(JSON.stringify(good), ['instagram'], facts, true);
    expect(Object.keys(result.drafts)).toEqual(['instagram']); expect(result.drafts.instagram).toContain(facts.rawSubtotal.toFixed(2)); expect(result.drafts.instagram).toContain(facts.minimumDisclosure!);
  });
  it('enforces channel limits and missing observation shape', () => {
    expect(validateDraft('a'.repeat(1501), 'gbp')).not.toBeNull(); expect(validateDraft('#Saskatoon print ideas', 'gbp')).not.toBeNull();
  });
});
describe('OpenRouter adapter metadata without real calls', () => {
  it('requests current model only once and records unknown costs as null', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-placeholder');
    const f = vi.fn().mockResolvedValue(Response.json({ id: 'mock-provider', choices: [{ message: { content: '{}' } }], usage: { prompt_tokens: 17 } }));
    const r = await callProvider({ system: 'voice', context: 'context' }, null, f);
    expect(r.usage.costUsd).toBeNull(); expect(r.usage.promptTokens).toBe(17); expect(r.usage.providerRequestIds).toEqual(['mock-provider']);
    expect(JSON.parse(f.mock.calls[0][1].body).model).toBe('anthropic/claude-sonnet-4-6'); vi.unstubAllEnvs();
  });
});
