import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ staff: vi.fn(), service: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ requireStaffUser: mocks.staff, createServiceClient: mocks.service }));
import { DEFAULT_SOCIAL_BUSINESS_ID as A, requireSocialBusiness, scopeSocialQuery, socialBusinessFields, socialAssetPrefix } from '../business';
const B = '00000000-0000-4000-8000-000000000002';
let memberships: { business_id: string; user_id: string; role: string; 'business.is_active': boolean }[];
const request = (id: string) => new Request('https://app.example', { headers: { 'X-Social-Business-Id': id } });
describe('social business authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true');
    mocks.staff.mockResolvedValue({ id: 'a-user' });
    memberships = [
      { business_id: A, user_id: 'a-user', role: 'operator', 'business.is_active': true },
      { business_id: B, user_id: 'b-user', role: 'operator', 'business.is_active': true },
    ];
    mocks.service.mockImplementation(() => ({ from: () => {
      const filters: [string, unknown][] = [];
      const q = { select: () => q, eq: (key: string, value: unknown) => { filters.push([key, value]); return q; }, maybeSingle: async () => ({ data: memberships.find(m => filters.every(([key, val]) => m[key as keyof typeof m] === val)) ?? null, error: null }) };
      return q;
    } }));
  });
  afterEach(() => vi.unstubAllEnvs());
  it('authorizes only the matching business and authenticated user pair', async () => {
    expect(await requireSocialBusiness()).toMatchObject({ businessId: A, user: { id: 'a-user' } });
    expect((await requireSocialBusiness(request(B)) as NextResponse).status).toBe(403);
    mocks.staff.mockResolvedValue({ id: 'b-user' });
    expect(await requireSocialBusiness(request(B))).toMatchObject({ businessId: B });
    expect((await requireSocialBusiness() as NextResponse).status).toBe(403);
  });
  it('fails closed when default membership is missing, business inactive, role read-only', async () => {
    memberships = []; expect((await requireSocialBusiness() as NextResponse).status).toBe(403);
    memberships = [{ business_id: A, user_id: 'a-user', role: 'operator', 'business.is_active': false }];
    expect((await requireSocialBusiness() as NextResponse).status).toBe(403);
    memberships[0]['business.is_active'] = true; memberships[0].role = 'viewer';
    expect((await requireSocialBusiness() as NextResponse).status).toBe(403);
  });
  it('requires staff and validates the context before membership lookup', async () => {
    expect((await requireSocialBusiness(request('not-a-uuid')) as NextResponse).status).toBe(400);
    expect(mocks.service).not.toHaveBeenCalled();
    mocks.staff.mockResolvedValue(NextResponse.json({ error: 'Denied' }, { status: 401 }));
    expect((await requireSocialBusiness() as NextResponse).status).toBe(401);
  });
  it('preserves only legacy default access when gate off, without issuing missing-schema queries', async () => {
    vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'false');
    expect(await requireSocialBusiness()).toMatchObject({ businessId: A });
    expect((await requireSocialBusiness(request(B)) as NextResponse).status).toBe(403);
    expect(mocks.service).not.toHaveBeenCalled();
    const q = { eq: vi.fn() };
    expect(scopeSocialQuery(q, A)).toBe(q); expect(q.eq).not.toHaveBeenCalled();
    expect(socialBusinessFields(A)).toEqual({});
    expect(() => scopeSocialQuery(q, B)).toThrow(); expect(() => socialBusinessFields(B)).toThrow();
  });
  it('scopes query and insert identity and keeps legacy default assets separate', () => {
    const q = { eq: vi.fn().mockReturnThis() };
    expect(scopeSocialQuery(q, B)).toBe(q); expect(q.eq).toHaveBeenCalledWith('business_id', B);
    expect(socialBusinessFields(B)).toEqual({ business_id: B });
    expect(socialAssetPrefix(A)).toBe('social'); expect(socialAssetPrefix(B)).toBe(`businesses/${B}/social`);
  });
});
