import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const from = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({ from }) }));
import { GET } from '../route';

const request = (token = 'export-secret') => new NextRequest('https://example.test/api/integrations/zarastudio/legacy-schedule', { headers: { Authorization: `Bearer ${token}` } });
const chain = (data: unknown[] = [], error: unknown = null) => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data, error }) };
  from.mockReturnValue(query);
  return query;
};

describe('ZARASTUDIO legacy schedule export', () => {
  beforeEach(() => { vi.stubEnv('ZARASTUDIO_LEGACY_EXPORT_TOKEN', 'export-secret'); from.mockReset(); });
  afterEach(() => vi.unstubAllEnvs());

  it('fails closed before querying when its dedicated token is missing or wrong', async () => {
    vi.stubEnv('ZARASTUDIO_LEGACY_EXPORT_TOKEN', '');
    expect((await GET(request())).status).toBe(503);
    vi.stubEnv('ZARASTUDIO_LEGACY_EXPORT_TOKEN', 'export-secret');
    expect((await GET(request('wrong'))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('returns only bounded safe calendar fields for the True Color tenant', async () => {
    const query = chain([{
      id: '00000000-0000-4000-8000-000000000123', business_id: '00000000-0000-4000-8000-000000000001', schedule_time: '2030-01-01T15:00:00.000Z', status: 'posted', platforms: ['facebook', 'instagram'],
      caption_raw: 'Fresh print work.', caption_instagram: 'Instagram copy', caption_facebook: 'Facebook copy', caption_gbp: 'Google copy',
      image_url: 'https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2030/abcd-1234.jpg',
      post_public_url: 'https://www.facebook.com/123_456', posted_at: '2030-01-01T15:01:00.000Z', approval_hash: 'must-not-leak', image_urls: ['https://private.invalid/signed'],
    }]);
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(query.eq).toHaveBeenCalledWith('business_id', '00000000-0000-4000-8000-000000000001');
    expect(query.in).toHaveBeenCalledWith('status', ['ready', 'posting', 'posted']);
    expect(body.posts).toEqual([expect.objectContaining({ legacyId: 'truecolor:00000000-0000-4000-8000-000000000123', tenant: 'true-color-printing', scheduleTime: '2030-01-01T15:00:00.000Z', status: 'posted', platforms: ['facebook', 'instagram'], mediaUrl: 'https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2030/abcd-1234.jpg', publicUrl: 'https://www.facebook.com/123_456', postedAt: '2030-01-01T15:01:00.000Z' })]);
    expect(JSON.stringify(body)).not.toContain('approval_hash');
    expect(JSON.stringify(body)).not.toContain('private.invalid');
  });

  it('removes signed, private, malformed, and cross-platform URLs', async () => {
    chain([
      { id: '00000000-0000-4000-8000-000000000124', schedule_time: '2030-01-01T15:00:00.000Z', status: 'posted', platforms: ['facebook'], caption_raw: 'safe', image_url: 'https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2030/file.jpg?token=private', post_public_url: 'https://www.instagram.com/p/nope/' },
      { id: '00000000-0000-4000-8000-000000000125', schedule_time: null, status: 'ready', platforms: ['facebook'], caption_raw: 'drop', image_url: null, post_public_url: null },
    ]);
    const body = await (await GET(request())).json();
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0]).toMatchObject({ mediaUrl: null, publicUrl: null });
  });
});
