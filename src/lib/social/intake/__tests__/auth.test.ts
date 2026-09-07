import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ result: { data: { business_id: 'business' }, error: null } as { data: unknown; error: unknown }, query: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({ from: mock.query }) }));
import { requireIntakeAccess } from '../auth';
const businessId = '00000000-0000-4000-8000-000000000001';
const operatorId = 'a0000000-0000-4000-8000-000000000001';
const draft = 'draft-only-secret'.repeat(3);
const approval = 'owner-approval-secret'.repeat(3);
beforeEach(() => {
  vi.stubEnv('SOCIAL_INTAKE_ENABLED', 'true'); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true');
  vi.stubEnv('SOCIAL_INTAKE_BUSINESS_ID', businessId); vi.stubEnv('SOCIAL_INTAKE_OPERATOR_ID', operatorId);
  vi.stubEnv('SOCIAL_INTAKE_SECRET', draft); vi.stubEnv('SOCIAL_INTAKE_APPROVAL_SECRET', approval);
  mock.result = { data: { business_id: businessId }, error: null };
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: async () => mock.result };
  mock.query.mockReturnValue(query);
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const request = (secret: string) => new Request('https://example.invalid/api/integrations/social/intake', { headers: { authorization: `Bearer ${secret}` } });
describe('separate owner approval capability', () => {
  it('draft capability cannot approve', async () => {
    await expect(requireIntakeAccess(request(draft), true)).rejects.toMatchObject({ status: 401 });
    expect(mock.query).not.toHaveBeenCalled();
  });
  it('approval capability cannot be used for draft routes', async () => {
    await expect(requireIntakeAccess(request(approval))).rejects.toMatchObject({ status: 401 });
  });
  it('does not activate on configuration alone', async () => {
    vi.stubEnv('SOCIAL_INTAKE_ENABLED', 'false');
    await expect(requireIntakeAccess(request(draft))).rejects.toMatchObject({ status: 503 });
  });
  it('rejects a shared draft and approval secret', async () => {
    vi.stubEnv('SOCIAL_INTAKE_APPROVAL_SECRET', draft);
    await expect(requireIntakeAccess(request(draft), true)).rejects.toMatchObject({ status: 503 });
  });
  it('rejects inactive or removed business operators', async () => {
    mock.result = { data: null, error: null };
    await expect(requireIntakeAccess(request(approval), true)).rejects.toMatchObject({ status: 403 });
  });
  it('binds a valid capability to configured membership rather than caller business headers', async () => {
    const req = request(draft); req.headers.set('X-Social-Business-Id', 'other-business');
    expect(await requireIntakeAccess(req)).toEqual({ businessId, operatorId });
  });
});
