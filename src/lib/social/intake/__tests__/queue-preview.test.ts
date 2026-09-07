import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ links: [] as Record<string, string>[], intakes: [] as Record<string, string>[], from: vi.fn(), eq: vi.fn(), inside: vi.fn(), signed: vi.fn(), client: vi.fn(), error: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: mock.client }));
import { decorateIntakeQueuePosts } from '../queue-preview';
import type { SocialPost } from '@/lib/types/social';
const a = '00000000-0000-4000-8000-000000000001';
const b = '00000000-0000-4000-8000-000000000002';
const intake = '10000000-0000-4000-8000-000000000001';
const p1 = '20000000-0000-4000-8000-000000000001';
const p2 = '20000000-0000-4000-8000-000000000002';
const mediaHash = 'a'.repeat(64);
function post(id = p1, businessId = a) { return { id, business_id: businessId, image_url: 'https://example.invalid/canonical.jpg', status: 'draft', approval_hash: 'unchanged-approval' } as SocialPost; }
beforeEach(() => {
  vi.stubEnv('SOCIAL_INTAKE_ENABLED', 'true'); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true');
  mock.links = [p1,p2].map(id => ({ business_id: a, intake_id: intake, post_id: id }));
  mock.intakes = [{ id: intake, business_id: a, media_sha256: mediaHash }]; mock.error = null;
  mock.from.mockImplementation((table: string) => {
    const query = { select: () => query, eq: (...args: unknown[]) => { mock.eq(...args); return query; }, in: (...args: unknown[]) => { mock.inside(...args); return query; }, limit: async () => ({ data: table === 'social_intake_posts' ? mock.links : mock.intakes, error: mock.error }) };
    return query;
  });
  mock.signed.mockImplementation(async (paths: string[]) => ({ data: paths.map(path => ({ path, signedUrl: `https://private.invalid/${path}?token=temporary`, error: null })), error: null }));
  mock.client.mockReturnValue({ from: mock.from, storage: { from: () => ({ createSignedUrls: mock.signed }) } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('authenticated private queue thumbnails', () => {
  it('adds display-only fields and signs a shared photo once for the two destinations', async () => {
    const rows = [post(p1),post(p2)]; const original = structuredClone(rows);
    const result = await decorateIntakeQueuePosts(rows, a);
    expect(mock.signed).toHaveBeenCalledTimes(1);
    expect(mock.signed).toHaveBeenCalledWith([`${a}/${intake}/prepared-${mediaHash}.jpg`], 900);
    expect(result[0].preview_image_url).toContain('https://private.invalid/'); expect(result[1].intake_id).toBe(intake);
    expect(result[0].image_url).toBe(original[0].image_url); expect(result[0].approval_hash).toBe(original[0].approval_hash); expect(rows).toEqual(original);
    expect(mock.eq).toHaveBeenCalledWith('business_id', a);
  });
  it('does no new reads or signing while feature flags are off', async () => {
    vi.stubEnv('SOCIAL_INTAKE_ENABLED', 'false'); const rows = [post()];
    expect(await decorateIntakeQueuePosts(rows, a)).toBe(rows);
    expect(mock.client).not.toHaveBeenCalled();
  });
  it('rejects cross-business rows even if returned by an incorrect upstream query', async () => {
    const rows = [post(p1,b)]; expect(await decorateIntakeQueuePosts(rows,a)).toBe(rows);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('rejects cross-business association and request data before signing', async () => {
    mock.intakes[0].business_id = b;
    const result = await decorateIntakeQueuePosts([post()],a);
    expect(result[0].preview_image_url).toBeUndefined(); expect(mock.signed).not.toHaveBeenCalled();
    mock.links[0].business_id = b;
    await decorateIntakeQueuePosts([post()],a);
    expect(mock.signed).not.toHaveBeenCalled();
  });
  it('retains canonical image fallback if storage signing fails without propagating secrets', async () => {
    mock.signed.mockRejectedValue(new Error('secret internal URL'));
    const result = await decorateIntakeQueuePosts([post()],a);
    expect(result[0].image_url).toBe(post().image_url); expect(result[0].preview_image_url).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('preserves the full queue on migration failure', async () => {
    mock.error = new Error('table unavailable'); const rows = [post()];
    expect(await decorateIntakeQueuePosts(rows,a)).toBe(rows);
  });
  it('bounds association lookups to one thousand candidates', async () => {
    const rows = Array.from({ length: 1001 }, (_, i) => post(`20000000-0000-4000-8000-${String(i).padStart(12,'0')}`));
    const result = await decorateIntakeQueuePosts(rows,a);
    expect(mock.inside.mock.calls[0][1]).toHaveLength(1000); expect(result).toHaveLength(1001);
  });
});
