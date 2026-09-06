import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), enabled: vi.fn(), client: vi.fn(), from: vi.fn(), upsert: vi.fn(),
  settings: { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() },
  usage: { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() },
}));
vi.mock('@/lib/social/business', () => ({ requireSocialBusiness: mocks.auth, socialBusinessScopingEnabled: mocks.enabled }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: mocks.client }));
import { GET, PATCH } from '../route';

const businessId = '00000000-0000-4000-8000-000000000002';
const url = 'https://example.test/api/staff/social/generation/settings';
const request = (body: unknown) => new Request(url, { method: 'PATCH', body: JSON.stringify(body) });
const valid = (changes = {}) => ({ dailyCallLimit: 20, dailyUsdLimit: 1, maxCostPerCallUsd: 0.1, ...changes });

describe('generation settings authorization, limits and readiness', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('OPENROUTER_API_KEY', 'mock-provider-readiness-only');
    mocks.auth.mockResolvedValue({ businessId, user: { id: 'authorized-operator' } });
    mocks.enabled.mockReturnValue(true);
    mocks.client.mockReturnValue({ from: mocks.from });
    for (const query of [mocks.settings, mocks.usage]) {
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      query.maybeSingle.mockResolvedValue({ data: null, error: null });
    }
    mocks.from.mockImplementation((table: string) => table === 'social_generation_settings'
      ? { ...mocks.settings, upsert: mocks.upsert } : mocks.usage);
    mocks.upsert.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([401, 403])('requires authorization (%i) for both reads and settings writes', async status => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: 'Denied' }, { status }));
    expect((await GET(new Request(url))).status).toBe(status);
    expect((await PATCH(request(valid()))).status).toBe(status);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('reports legacy readiness without touching unmigrated storage, and gates settings changes', async () => {
    mocks.enabled.mockReturnValue(false);
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      configured: false, legacyAvailable: true, providerReady: true, model: 'anthropic/claude-sonnet-4-6',
    });
    expect((await PATCH(request(valid()))).status).toBe(503);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('reads the authorized business and UTC usage day with preserved reservations', async () => {
    mocks.settings.maybeSingle.mockResolvedValue({ data: { daily_call_limit: 20, daily_usd_limit: 1, max_cost_per_call_usd: 0.1 }, error: null });
    mocks.usage.maybeSingle.mockResolvedValue({ data: { used_calls: 3, reserved_calls: 2, used_usd: 0.08, reserved_usd: 0.2 }, error: null });
    const response = await GET(new Request(`${url}?businessId=attacker-supplied-business`));
    expect(await response.json()).toMatchObject({ configured: true, dailyCallLimit: 20, dailyUsdLimit: 1, maxCostPerCallUsd: 0.1, usedCalls: 3, reservedCalls: 2, usedUsd: 0.08, reservedUsd: 0.2 });
    expect(mocks.settings.eq).toHaveBeenCalledExactlyOnceWith('business_id', businessId);
    expect(mocks.usage.eq).toHaveBeenCalledWith('business_id', businessId);
    expect(mocks.usage.eq).toHaveBeenCalledWith('usage_day', new Date().toISOString().slice(0, 10));
  });

  it('returns zero paid allowance for absent settings and reports missing provider configuration', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const response = await GET(new Request(url));
    expect(await response.json()).toMatchObject({ providerReady: false, dailyCallLimit: 0, dailyUsdLimit: null, maxCostPerCallUsd: null, usedCalls: 0, reservedCalls: 0 });
  });

  it.each(['settings', 'usage'] as const)('fails closed when %s read reports an error', async query => {
    mocks[query].maybeSingle.mockResolvedValue({ data: null, error: { message: 'relation unavailable' } });
    const response = await GET(new Request(url));
    expect(response.status).toBe(503);
    expect((await response.json()).dailyCallLimit).toBeUndefined();
  });

  it('fails closed on an unexpected storage-client exception', async () => {
    mocks.client.mockImplementation(() => { throw new Error('internal configuration detail'); });
    expect((await GET(new Request(url))).status).toBe(503);
    expect((await PATCH(request(valid()))).status).toBe(503);
  });

  it.each([
    null, {}, valid({ dailyCallLimit: -1 }), valid({ dailyCallLimit: 1001 }),
    valid({ dailyCallLimit: 1.5 }), valid({ dailyCallLimit: '20' }),
    valid({ dailyUsdLimit: 0 }), valid({ dailyUsdLimit: -1 }), valid({ dailyUsdLimit: 1001 }),
    valid({ dailyUsdLimit: '1' }), valid({ maxCostPerCallUsd: null }),
    valid({ maxCostPerCallUsd: 0 }), valid({ maxCostPerCallUsd: -1 }),
    valid({ maxCostPerCallUsd: 1001 }), valid({ maxCostPerCallUsd: '0.1' }),
  ])('rejects invalid ceiling settings before storage: %j', async body => {
    expect((await PATCH(request(body))).status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before storage', async () => {
    expect((await PATCH(new Request(url, { method: 'PATCH', body: '{broken' }))).status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it.each([
    valid(),
    valid({ dailyCallLimit: 0, dailyUsdLimit: null, maxCostPerCallUsd: null }),
    valid({ dailyCallLimit: 1000, dailyUsdLimit: 1000, maxCostPerCallUsd: 1000 }),
  ])('saves valid operator limits only under the authorized business: %j', async body => {
    const response = await PATCH(request({ ...body, business_id: 'untrusted-id', businessId: 'untrusted-id' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true });
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('social_generation_settings');
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      business_id: businessId, daily_call_limit: body.dailyCallLimit,
      daily_usd_limit: body.dailyUsdLimit, max_cost_per_call_usd: body.maxCostPerCallUsd,
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    }, { onConflict: 'business_id' });
  });

  it('does not report success when persistence fails and does not retry the write', async () => {
    mocks.upsert.mockResolvedValue({ error: { message: 'backend persistence failed' } });
    const response = await PATCH(request(valid()));
    expect(response.status).toBe(503);
    expect((await response.json()).saved).toBeUndefined();
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });
});
