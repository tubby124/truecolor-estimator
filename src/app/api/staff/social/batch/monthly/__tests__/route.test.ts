import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const { auth, rpc, enabled, from } = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn(), enabled: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/social/business', () => ({ requireSocialBusiness: auth, socialBusinessScopingEnabled: enabled }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({ rpc, from }) }));
import { POST, GET } from '../route';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const creative = { creative_id: id(3), caption_raw: 'Review me', caption_instagram: 'Instagram copy', caption_facebook: 'Facebook copy', caption_gbp: 'Google copy', platforms: ['instagram', 'gbp'], image_url: 'https://example.test/p.jpg', schedule_time: '2030-01-02T15:00:00Z' };
const input = { batchId: id(1), requestId: id(2), month: '2030-01', posts: [creative] };
const req = (body: unknown = input) => new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) });
describe('monthly chunk saves', () => {
 beforeEach(() => { vi.clearAllMocks(); auth.mockResolvedValue({ businessId: id(8), user: { id: id(9) } }); enabled.mockReturnValue(true); rpc.mockResolvedValue({ data: [{ id: id(4) }, { id: id(5) }], error: null }); });
 it('saves selected destinations with business supplied only by auth and stable request hash', async () => {
  expect((await POST(req({ ...input, businessId: id(77) }))).status).toBe(200);
  const first = rpc.mock.calls[0][1];
  expect(first).toMatchObject({ p_business_id: id(8), p_batch_id: id(1), p_request_id: id(2) });
  expect(first.p_posts[0].gbp_payload).toEqual({ topicType: 'STANDARD' });
  expect(first.p_posts[1].gbp_payload).toBeNull();
  expect(first.p_posts.map((p: {platforms: string[]}) => p.platforms)).toEqual([['gbp'], ['instagram']]);
  await POST(req());
  expect(rpc.mock.calls[1][1].p_payload_hash).toBe(first.p_payload_hash);
 });
 it('retains exact generated product configuration and fingerprint', async () => {
  await POST(req({ ...input, posts: [{ ...creative, product_slug: 'vinyl-banners', product_configuration: { qty: 2, width_in: 36 }, fact_fingerprint: 'a'.repeat(64), generation_job_id: id(6) }] }));
  expect(rpc.mock.calls[0][1].p_posts[0]).toMatchObject({ product_configuration: { qty: 2, width_in: 36 }, fact_fingerprint: 'a'.repeat(64), generation_job_id: id(6) });
 });
 it('changed copy changes request hash; RPC rejects replay mismatch visibly', async () => {
  await POST(req()); const hash = rpc.mock.calls[0][1].p_payload_hash;
  rpc.mockResolvedValue({ error: { code: '22023' } });
  expect((await POST(req({ ...input, posts: [{ ...creative, caption_gbp: 'Changed' }] }))).status).toBe(409);
  expect(rpc.mock.calls[1][1].p_payload_hash).not.toBe(hash);
 });
 it('requires destination captions and Regina month match; bounds chunks', async () => {
  for (const posts of [[{ ...creative, caption_gbp: '' }], [{ ...creative, schedule_time: '2030-02-01T06:00:00Z' }], Array(11).fill(creative), [{ ...creative, creative_id: 'bad' }], [{ ...creative, platforms: ['twitter'] }]]) expect((await POST(req({ ...input, posts }))).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });
 it('fails closed before DB when feature disabled or auth rejected', async () => {
  enabled.mockReturnValue(false); expect((await POST(req())).status).toBe(503);
  auth.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 })); expect((await POST(req())).status).toBe(403);
  expect(rpc).not.toHaveBeenCalled();
 });
 it('paginates exact review IDs with authenticated business filter', async () => {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [], count: 40, error: null }) }; from.mockReturnValue(q);
  const response = await GET(new Request(`https://example.test?batchId=${id(1)}&page=2`));
  expect(q.eq).toHaveBeenCalledWith('business_id', id(8)); expect(q.range).toHaveBeenCalledWith(18, 26); expect(await response.json()).toMatchObject({ total: 40, hasMore: true });
 });
});
