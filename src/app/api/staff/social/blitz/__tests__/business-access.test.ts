import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), service: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/social/business', () => ({ requireSocialBusiness: mocks.auth, DEFAULT_SOCIAL_BUSINESS_ID: '00000000-0000-4000-8000-000000000001' }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: mocks.service }));
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const request = (business = A) => new NextRequest('https://app.example/blitz', { method: 'POST', headers: { 'X-Social-Business-Id': business, 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: A }) });
async function routes() {
  const [stats, trigger, outreach, leads, sync] = await Promise.all([import('../route'), import('../trigger/route'), import('../outreach/route'), import('../[niche]/leads/route'), import('../sync-brevo-lists/route')]);
  return [
    { name: 'stats', call: (req: NextRequest) => stats.GET(req) },
    { name: 'trigger', call: (req: NextRequest) => trigger.POST(req) },
    { name: 'outreach', call: (req: NextRequest) => outreach.PATCH(req) },
    { name: 'leads', call: (req: NextRequest) => leads.GET(req, { params: Promise.resolve({ niche: 'construction' }) }) },
    { name: 'sync', call: (req: NextRequest) => sync.POST(req) },
  ];
}
describe('legacy Blitz business boundary', () => {
  beforeEach(() => {
    vi.resetModules(); vi.resetAllMocks();
    vi.stubEnv('N8N_BLITZ_WEBHOOK_URL', 'https://example.test/mock-webhook');
    vi.stubEnv('BREVO_API_KEY', 'test-only-key');
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.fetch.mockImplementation(async () => Response.json({ contacts: [] }));
    mocks.auth.mockResolvedValue({ businessId: A, user: { id: 'operator' } });
    const result = { data: [], count: 0, error: null };
    const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), contains: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve) };
    mocks.service.mockReturnValue({ from: () => q });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it.each([401, 403])('propagates returned authorization denial (%s) before any DB or provider action', async status => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: 'Denied' }, { status }));
    for (const route of await routes()) {
      const req = request();
      expect((await route.call(req)).status, route.name).toBe(status);
      expect(mocks.auth).toHaveBeenLastCalledWith(req);
    }
    expect(mocks.service).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('denies an otherwise authorized second business before any True Color read, update, or trigger', async () => {
    mocks.auth.mockResolvedValue({ businessId: B, user: { id: 'other-operator' } });
    for (const route of await routes()) {
      const req = request(B);
      expect((await route.call(req)).status, route.name).toBe(403);
      expect(mocks.auth).toHaveBeenLastCalledWith(req);
    }
    expect(mocks.service).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('retains default business capability using only mocked database and providers', async () => {
    for (const route of await routes()) expect((await route.call(request())).status, route.name).toBe(200);
    expect(mocks.service).toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledWith('https://example.test/mock-webhook', expect.objectContaining({ method: 'POST' }));
  });
});
