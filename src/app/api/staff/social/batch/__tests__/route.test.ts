import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const { auth, from, insert, select } = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), insert: vi.fn(), select: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ requireStaffUser: auth, createServiceClient: () => ({ from }) }));
import { POST } from '../route';
const post = (overrides = {}) => ({
  caption_raw: 'Staff wording', caption_instagram: 'Instagram wording', caption_facebook: 'Facebook wording',
  hashtags: '#Saskatoon #Printing', image_url: 'https://example.test/photo.jpg',
  platforms: ['instagram', 'facebook'], schedule_time: '2030-01-01T15:00:00.000Z', ...overrides,
});
const request = (posts: unknown) => new Request('https://example.test', { method: 'POST', body: JSON.stringify({ posts }) });
describe('batch destination drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ id: 'staff' });
    from.mockReturnValue({ insert });
    insert.mockReturnValue({ select });
    select.mockImplementation(async () => ({ data: insert.mock.calls[0][0].map((row: object, i: number) => ({ ...row, id: `id-${i}` })), error: null }));
  });
  it('saves three distinct items as six single destination drafts in one insert', async () => {
    const inputs = [0, 1, 2].map(i => post({ caption_raw: `Item ${i}`, image_url: `https://example.test/${i}.jpg`, schedule_time: `2030-01-01T${15 + i}:00:00.000Z` }));
    const response = await POST(request(inputs));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.created).toBe(6);
    expect(result.logicalPosts).toBe(3);
    expect(insert).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 3; i++) {
      const pair = result.posts.slice(i * 2, i * 2 + 2);
      expect(pair.map((row: { platforms: string[] }) => row.platforms)).toEqual([['instagram'], ['facebook']]);
      for (const row of pair) {
        expect(row).toMatchObject({ caption_raw: inputs[i].caption_raw, caption_instagram: inputs[i].caption_instagram, image_url: inputs[i].image_url, schedule_time: inputs[i].schedule_time, status: 'draft' });
        expect(row.approval_hash).toBeUndefined();
      }
    }
  });
  it('preserves explicit Facebook wording and appends only missing hashtags before review', async () => {
    const response = await POST(request([post({ caption_facebook: 'Keep this exact text. #saskatoon', hashtags: '#Saskatoon #Printing #printing' })]));
    const { posts } = await response.json();
    expect(posts[1].caption_facebook).toBe('Keep this exact text. #saskatoon\n\n#Printing');
    expect(posts[0].caption_instagram).toBe('Instagram wording');
    expect(posts[0].hashtags).toBe('#Saskatoon #Printing #printing');
  });
  it('uses raw Facebook fallback and keeps a caption unchanged when no hashtags are supplied', async () => {
    await POST(request([post({ caption_facebook: '', hashtags: '' })]));
    expect(insert.mock.calls[0][0][1].caption_facebook).toBe('Staff wording');
  });
  it('deduplicates repeated destinations', async () => {
    const response = await POST(request([post({ platforms: ['facebook', 'facebook'] })]));
    expect((await response.json()).created).toBe(1);
  });
  it('rejects more than fourteen expanded drafts before inserting anything', async () => {
    expect((await POST(request(Array.from({ length: 8 }, () => post())))).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
  it.each([[], ['twitter'], ['tiktok'], ['instagram', 'bad'], null])('rejects invalid destinations %j', async platforms => {
    expect((await POST(request([post({ platforms })]))).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
  it('requires staff authorization', async () => {
    auth.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    expect((await POST(request([post()]))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
