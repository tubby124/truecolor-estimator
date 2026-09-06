import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), enabled: vi.fn(), facts: vi.fn(), generate: vi.fn(),
  store: vi.fn(), job: vi.fn(), provider: vi.fn(),
}));
vi.mock('@/lib/social/business', () => ({
  requireSocialBusiness: mocks.auth, socialBusinessScopingEnabled: mocks.enabled,
  DEFAULT_SOCIAL_BUSINESS_ID: '00000000-0000-4000-8000-000000000001',
}));
vi.mock('@/lib/pricing/product-facts', () => ({ resolveProductFacts: mocks.facts }));
vi.mock('@/lib/social/generation/service', () => ({
  generate: mocks.generate,
  GenerationError: class GenerationError extends Error {
    constructor(public status: number, message: string) { super(message); }
  },
}));
vi.mock('@/lib/social/generation/store', () => ({ generationStore: mocks.store }));
vi.mock('@/lib/social/generation/provider', () => ({ callProvider: mocks.provider }));
import { GET, POST } from '../route';
import { GenerationError } from '@/lib/social/generation/service';

const businessId = '00000000-0000-4000-8000-000000000001';
const otherBusiness = '00000000-0000-4000-8000-000000000002';
const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const request = (body: unknown) => new Request('https://example.test/api/staff/social/captions', {
  method: 'POST', body: JSON.stringify(body),
});
const valid = (changes = {}) => ({ requestId, selectedChannels: ['instagram'], topic: 'Visible sign lettering', ...changes });
const read = (id: string = requestId) => new Request(`https://example.test/api/staff/social/captions?requestId=${id}&businessId=${otherBusiness}`);
const store = { job: mocks.job };

describe('caption routes authorize, validate and bind generation inputs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ businessId, user: { id: 'authorized-staff' } });
    mocks.enabled.mockReturnValue(true);
    mocks.store.mockReturnValue(store);
    mocks.generate.mockResolvedValue({ jobId: requestId, status: 'completed', drafts: { instagram: 'Visible sign lettering.' } });
    mocks.job.mockResolvedValue({ status: 'partial', result: { drafts: { instagram: 'Saved wording.' } } });
  });

  it.each([401, 403])('returns authorization %i before parsing or performing work', async status => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: 'Access denied' }, { status }));
    const response = await POST(new Request('https://example.test', { method: 'POST', body: 'not JSON' }));
    expect(response.status).toBe(status);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
    expect(mocks.facts).not.toHaveBeenCalled();
  });

  it('denies a business without its own configured voice and catalogue', async () => {
    mocks.auth.mockResolvedValue({ businessId: otherBusiness, user: { id: 'authorized-staff' } });
    const response = await POST(request(valid()));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('has not been onboarded');
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('requires durable migrations for a new resumable request', async () => {
    mocks.enabled.mockReturnValue(false);
    const response = await POST(request(valid()));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('generation_migration_required');
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('adapts existing price-free legacy callers with supported channels and a generated request ID', async () => {
    mocks.enabled.mockReturnValue(false);
    const response = await POST(request({ caption_raw: 'Existing staff wording' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.durability).toBe('legacy');
    expect(body.compatibility).toContain('X captions are no longer generated');
    expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({
      requestId: expect.stringMatching(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/),
      selectedChannels: ['facebook', 'instagram'], caption_raw: 'Existing staff wording', includePrice: false,
    }), businessId, null, store, mocks.provider, false);
  });

  it('does not permit legacy price copy before source binding is enabled', async () => {
    mocks.enabled.mockReturnValue(false);
    const response = await POST(request({ productSlug: 'photo-posters', includePrice: true }));
    expect(response.status).toBe(503);
    expect(mocks.facts).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it.each([
    null,
    valid({ requestId: 'bad-id' }),
    valid({ selectedChannels: ['twitter'] }),
    valid({ selectedChannels: [] }),
    valid({ selectedChannels: ['gbp', 'gbp'] }),
    valid({ includePrice: true }),
    valid({ image_base64: '!!!', image_type: 'image/jpeg' }),
    valid({ image_base64: 'aGVsbG8=', image_type: 'image/svg+xml' }),
    valid({ configuration: { qty: 25 } }),
  ])('rejects invalid request before provider or storage work: %j', async input => {
    expect((await POST(request(input))).status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON and an oversized body before provider work', async () => {
    expect((await POST(new Request('https://example.test', { method: 'POST', body: '{broken' }))).status).toBe(400);
    expect((await POST(new Request('https://example.test', { method: 'POST', body: 'x'.repeat(3_000_001) }))).status).toBe(413);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('passes current resolver facts, requested configuration and only the selected channel', async () => {
    const currentFacts = { productSlug: 'photo-posters', sourceFingerprint: 'current-source-fingerprint', rawSubtotal: 15 };
    const configuration = { qty: 1, width_in: 24, height_in: 36 };
    mocks.facts.mockReturnValue(currentFacts);
    const response = await POST(request(valid({
      selectedChannels: ['gbp'], productSlug: 'photo-posters', configuration, includePrice: true,
      facts: { sourceFingerprint: 'stale-client-claim', rawSubtotal: 1 }, businessId: otherBusiness,
    })));
    expect(response.status).toBe(200);
    expect((await response.json()).durability).toBe('durable');
    expect(mocks.facts).toHaveBeenCalledExactlyOnceWith({ productSlug: 'photo-posters', configuration });
    const [input, resolvedBusiness, facts] = mocks.generate.mock.calls[0];
    expect(input.selectedChannels).toEqual(['gbp']);
    expect(input.facts).toBeUndefined();
    expect(resolvedBusiness).toBe(businessId);
    expect(facts).toBe(currentFacts);
    expect(mocks.generate.mock.calls[0].slice(3)).toEqual([store, mocks.provider, true]);
  });

  it('rejects unverifiable catalogue configurations without generating', async () => {
    mocks.facts.mockImplementation(() => { throw new Error('No matching catalogue row'); });
    expect((await POST(request(valid({ productSlug: 'retired-product' })))).status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('preserves a bounded generation error and hides unexpected backend details', async () => {
    mocks.generate.mockRejectedValueOnce(new GenerationError(429, 'Daily generation ceiling reached.'));
    const stopped = await POST(request(valid()));
    expect(stopped.status).toBe(429);
    expect((await stopped.json()).error).toBe('Daily generation ceiling reached.');
    mocks.generate.mockRejectedValueOnce(new Error('sensitive internal backend detail'));
    const unavailable = await POST(request(valid()));
    expect(unavailable.status).toBe(503);
    expect((await unavailable.json()).error).not.toContain('sensitive');
    expect(mocks.generate).toHaveBeenCalledTimes(2);
  });

  it('requires authorization and the migration before reading durable jobs', async () => {
    mocks.auth.mockResolvedValueOnce(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    expect((await GET(read())).status).toBe(403);
    mocks.enabled.mockReturnValue(false);
    expect((await GET(read())).status).toBe(503);
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it('reads only the authorized business job, ignoring a query-string business override', async () => {
    const response = await GET(read());
    expect(response.status).toBe(200);
    expect(mocks.job).toHaveBeenCalledExactlyOnceWith(businessId, requestId);
    expect(await response.json()).toEqual({ jobId: requestId, status: 'partial', result: { drafts: { instagram: 'Saved wording.' } } });
  });

  it('returns 400, 404 and fail-closed 503 for invalid, absent and unavailable jobs', async () => {
    expect((await GET(read('invalid'))).status).toBe(400);
    expect(mocks.job).not.toHaveBeenCalled();
    mocks.job.mockResolvedValueOnce(null);
    expect((await GET(read())).status).toBe(404);
    mocks.job.mockRejectedValueOnce(new Error('Database unavailable'));
    expect((await GET(read())).status).toBe(503);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
});
