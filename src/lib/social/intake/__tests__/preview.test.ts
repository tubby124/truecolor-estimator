import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ row: {} as Record<string, unknown>, posts: [] as Record<string, unknown>[], rpc: vi.fn(), upload: vi.fn(), signed: vi.fn(), provider: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({
  from: (table: string) => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: mock.row, error: null }), in: async () => ({ data: table === 'social_posts' ? mock.posts : [], error: null }) };
    return query;
  }, rpc: mock.rpc, storage: { from: () => ({ createSignedUrl: mock.signed, upload: mock.upload }) },
}) }));
vi.mock('@/lib/social/generation/provider', () => ({ callProvider: mock.provider }));
import { stableJson } from '@/lib/social/generation/validation';
import { getIntakePreview } from '../service';
const id = '10000000-0000-4000-8000-000000000001';
const businessId = '00000000-0000-4000-8000-000000000001';
const key = 'private-preview-key'.repeat(3);
const scheduleTime = '2099-01-01T16:00:00.000Z';
const expiresAt = '2099-01-01T00:00:00.000Z';
function token() {
  const expires = Date.parse(expiresAt) / 1000;
  return `1.${expires}.${createHmac('sha256', key).update(`${id}:${businessId}:1:${expires}`).digest('hex')}`;
}
beforeEach(() => {
  vi.stubEnv('SOCIAL_INTAKE_ENABLED', 'true'); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true');
  vi.stubEnv('SOCIAL_INTAKE_BUSINESS_ID', businessId); vi.stubEnv('SOCIAL_INTAKE_OPERATOR_ID', id); vi.stubEnv('SOCIAL_INTAKE_PREVIEW_SECRET', key);
  const captions = { instagram: 'Photo preview', facebook: 'Photo preview' };
  const imageUrl = 'https://example.invalid/intended-public-photo.jpg';
  const mediaHash = 'a'.repeat(64);
  const hash = createHmac('sha256', key).update(stableJson({ intakeId: id, businessId, revision: 1, imageUrl, mediaHash, expiresAt, captions, scheduleTime })).digest('hex');
  mock.row = { id, business_id: businessId, revision: 1, status: 'review', image_url: imageUrl, media_sha256: mediaHash, preview_expires_at: expiresAt, preview_hash: hash, post_ids: ['ig','fb'], media_treatment: 'Resized only' };
  mock.posts = ['instagram','facebook'].map(platform => ({ id: platform, platforms: [platform], caption_raw: 'Photo preview', [`caption_${platform}`]: 'Photo preview', image_url: imageUrl, image_urls: [imageUrl], schedule_time: scheduleTime, status: 'draft' }));
  mock.signed.mockResolvedValue({ data: { signedUrl: 'https://private.invalid/temporary-photo' }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('temporary read-only previews', () => {
  it('displays signed private derivative without generating, publishing or approval writes', async () => {
    const preview = await getIntakePreview(id, token());
    expect(preview.imageUrl).toBe('https://private.invalid/temporary-photo');
    expect(preview).not.toHaveProperty('originalUrl');
    expect(mock.rpc).not.toHaveBeenCalled(); expect(mock.upload).not.toHaveBeenCalled(); expect(mock.provider).not.toHaveBeenCalled();
  });
  it('rejects old revision links after editing', async () => {
    mock.row.revision = 2;
    await expect(getIntakePreview(id, token())).rejects.toMatchObject({ status: 410 });
    expect(mock.signed).not.toHaveBeenCalled();
  });
  it('rejects changed caption bytes instead of silently showing an obsolete approval fingerprint', async () => {
    mock.posts[0].caption_instagram = 'Changed after preview';
    await expect(getIntakePreview(id, token())).rejects.toMatchObject({ status: 409 });
  });
  it('shows reset approved drafts as needing review', async () => {
    mock.row.status = 'approved';
    expect((await getIntakePreview(id, token())).status).toBe('needs_review');
  });
});
