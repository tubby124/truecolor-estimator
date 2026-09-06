import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const from = vi.hoisted(() => vi.fn());
const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server',()=>({createServiceClient:()=>({from})}));
vi.mock('@/lib/social/approval',()=>({approvalReset:{approval_hash:null},approvalIntegrityBlocker:(post: {approved_rights?: boolean})=>post.approved_rights === false ? 'Explicit approval required' : null,publishingEnabled:()=>process.env.SOCIAL_PUBLISHING_ENABLED==='true', dispatchApprovedPost:dispatch}));
vi.mock('@/lib/cron/heartbeat',()=>({recordCronRun:vi.fn()}));
import { GET } from '../route';
const req=(token='secret')=>new NextRequest('https://example.test/api/cron/social-scheduler',{headers:{Authorization:`Bearer ${token}`}});
describe('approval scheduler',()=>{
 beforeEach(()=>{vi.stubEnv('CRON_SECRET','secret');vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','true');from.mockReset();dispatch.mockReset();});
 afterEach(()=>vi.unstubAllEnvs());
 it('rejects unauthorized requests before DB/provider work',async()=>{expect((await GET(req('bad'))).status).toBe(401);expect(from).not.toHaveBeenCalled();});
 it('pause prevents both dispatch and legacy reconciliation',async()=>{vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','');expect(await (await GET(req())).json()).toMatchObject({skipped:true});expect(from).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();});
 it('unscoped cron cannot silently widen the pilot',async()=>{expect(await (await GET(req())).json()).toMatchObject({skipped:true});expect(dispatch).not.toHaveBeenCalled();});
});

const ids = ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'];
const scoped = (query = `ids=${ids.join(',')}&mode=check`) => new NextRequest(`https://example.test/api/cron/social-scheduler?${query}`, { headers: { Authorization: 'Bearer secret' } });
describe('scoped VPS scheduler', () => {
 beforeEach(() => { vi.stubEnv('CRON_SECRET','secret'); vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','true'); from.mockReset(); dispatch.mockReset(); });
 afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
 const row = (id: string, status = 'ready') => ({ id, status, approval_hash: 'approved', schedule_time: new Date(Date.now() + 600000).toISOString() });
 function mockRead(data: unknown[]) {
   const scope = vi.fn().mockResolvedValue({ data, error: null });
   from.mockReturnValue({ select: vi.fn().mockReturnValue({ in: scope }) });
   return scope;
 }
 it('rejects unknown, duplicate, malformed and unscoped check parameters', async () => {
   for (const query of ['mode=check', 'ids=bad', `ids=${ids[0]},${ids[0]}`, `ids=${ids[0]}&force=true`, `ids=${ids[0]}&mode=run`, `ids=${ids[0]}&ids=${ids[1]}`]) expect((await GET(scoped(query))).status).toBe(400);
   expect(from).not.toHaveBeenCalled();
 });
 it('checks only explicit IDs while paused with no dispatch or heartbeat write', async () => {
   vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','false');
   const scope = mockRead(ids.map(id => row(id)));
   const result = await (await GET(scoped())).json();
   expect(scope).toHaveBeenCalledWith('id', ids);
   expect(result).toMatchObject({ total: 2, held: false, complete: false, publishingEnabled: false, counts: { ready: 2 } });
   expect(dispatch).not.toHaveBeenCalled();
 });
 it('holds missing, draft, posting and overdue members before any dispatch', async () => {
   for (const data of [[row(ids[0])], [row(ids[0]), row(ids[1], 'draft')], [row(ids[0]), row(ids[1], 'posting')], [row(ids[0]), {...row(ids[1]), schedule_time: new Date(Date.now()-7200000).toISOString()}]]) {
     mockRead(data);
     expect(await (await GET(scoped(`ids=${ids.join(',')}`))).json()).toMatchObject({ held: true });
   }
   expect(dispatch).not.toHaveBeenCalled();
 });
 it('holds HTTP 200 dispatch outcomes still posting and stops remaining attempts', async () => {
   const data = ids.map(id => ({...row(id), schedule_time: new Date(Date.now()-1000).toISOString()}));
   mockRead(data);
   dispatch.mockResolvedValue({ status: 200, post: {...data[0], status: 'posting'} });
   expect(await (await GET(scoped(`ids=${ids.join(',')}`))).json()).toMatchObject({ held: true, dispatched: 0 });
   expect(dispatch).toHaveBeenCalledTimes(1);
 });
 it('returns completion only when every scoped destination is posted', async () => {
   mockRead(ids.map(id => row(id, 'posted')));
   expect(await (await GET(scoped())).json()).toMatchObject({ complete: true, held: false, counts: { posted: 2 } });
   expect(dispatch).not.toHaveBeenCalled();
 });
 it('rejects malformed deadlines and refuses an expired scoped mutation', async () => {
   for (const expires of ['bad', '2030-02-30T12:00:00Z', '2030-01-01T12:00:00+00:00']) expect((await GET(scoped(`ids=${ids.join(',')}&expiresAt=${encodeURIComponent(expires)}`))).status).toBe(400);
   mockRead(ids.map(id => row(id)));
   expect(await (await GET(scoped(`ids=${ids.join(',')}&expiresAt=2000-01-01T00:00:00Z`))).json()).toMatchObject({expired: true});
   expect(dispatch).not.toHaveBeenCalled();
 });
 it('rechecks deadline between posts when the first provider call crosses expiry', async () => {
   vi.useFakeTimers(); vi.setSystemTime('2030-01-01T12:00:00Z');
   mockRead(ids.map(id => ({...row(id), schedule_time: '2030-01-01T12:00:00Z'})));
   dispatch.mockImplementation(async () => { vi.setSystemTime('2030-01-01T12:01:00Z'); return {status: 200, post: {status: 'posted'}}; });
   expect(await (await GET(scoped(`ids=${ids.join(',')}&expiresAt=2030-01-01T12:00:30Z`))).json()).toMatchObject({expired: true, dispatched: 1});
   expect(dispatch).toHaveBeenCalledTimes(1);
 });
 it('holds the entire scope when approval integrity fails on any future member', async () => {
   mockRead([row(ids[0]), {...row(ids[1]), approved_rights: false}]);
   expect(await (await GET(scoped(`ids=${ids.join(',')}`))).json()).toMatchObject({held: true});
   expect(dispatch).not.toHaveBeenCalled();
 });

 it('returns only stored posted public links on the matching platform hostname', async () => {
   mockRead([{...row(ids[0], 'posted'), platforms:['facebook'], post_public_url:'https://www.facebook.com/123_456'}, {...row(ids[1], 'posting'), platforms:['instagram'], post_public_url:'https://www.instagram.com/p/unconfirmed/'}]);
   const result = await (await GET(scoped())).json();
   expect(result.receipts).toEqual([expect.objectContaining({id: ids[0], platform: 'facebook', publicUrl:'https://www.facebook.com/123_456'}), expect.objectContaining({id: ids[1], publicUrl:null})]);
   for (const link of ['https://example.test/?token=secret', 'https://www.facebook.com/123?access_token=secret', 'https://user:secret@www.facebook.com/123']) {
     mockRead([{...row(ids[0], 'posted'), platforms:['facebook'], post_public_url:link}, row(ids[1])]);
     expect((await (await GET(scoped())).json()).receipts[0].publicUrl).toBeNull();
   }
 });

});

const ongoing = (check = false, business = ids[0]) => scoped(`runner=ongoing&businessId=${business}${check ? '&mode=check' : ''}`);
describe('ongoing scheduler activation and stale holds', () => {
 beforeEach(() => { vi.stubEnv('CRON_SECRET', 'secret'); vi.stubEnv('SOCIAL_PUBLISHING_ENABLED', 'true'); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true'); vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', 'true'); vi.stubEnv('SOCIAL_ONGOING_BUSINESS_ID', ids[0]); from.mockReset(); dispatch.mockReset(); });
 afterEach(() => vi.unstubAllEnvs());
 function queue(reads: { data?: unknown[]; error?: unknown }[]) {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn() };
  reads.forEach(read => q.limit.mockResolvedValueOnce({ error: null, data: [], ...read }));
  from.mockReturnValue(q); return q;
 }
 it('requires independent explicit activation and one configured business', async () => {
  vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', ''); expect((await GET(ongoing())).status).toBe(503);
  vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', 'true'); expect((await GET(ongoing(false, ids[1]))).status).toBe(503);
  expect(from).not.toHaveBeenCalled();
 });
 it('check scopes every read and exposes stale/provider holds without mutations', async () => {
  const q = queue([{ data: [{ status: 'posting' }] }, { data: [{ status: 'ready' }] }, { data: [] }]);
  expect(await (await GET(ongoing(true))).json()).toMatchObject({ held: true, pending: true, stale: true });
  expect(q.eq.mock.calls.filter(c => c[0] === 'business_id')).toEqual(Array(3).fill(['business_id', ids[0]])); expect(dispatch).not.toHaveBeenCalled();
 });
 it('does not dispatch if any queue read failed', async () => {
  queue([{ error: { code: '42703' } }, {}, {}]); expect((await GET(ongoing())).status).toBe(503); expect(dispatch).not.toHaveBeenCalled();
 });
 it('holds expired schedules visibly before dispatching a bounded due page', async () => {
  const rows = Array.from({ length: 26 }, (_, i) => ({ id: String(i), status: 'ready' }));
  const q = queue([{}, { data: [{ id: 'stale' }] }, { data: rows }]);
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), select: vi.fn().mockResolvedValue({ data: [{ id: 'stale' }], error: null }) });
  from.mockReturnValueOnce(q).mockReturnValueOnce(q).mockReturnValueOnce(q).mockReturnValueOnce({ update });
  dispatch.mockResolvedValue({ status: 200, post: { status: 'posted' } });
  expect(await (await GET(ongoing())).json()).toMatchObject({ dispatched: 25, held: true, backlog: true });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', approval_hash: null, error_message: expect.stringContaining('one hour') })); expect(dispatch).toHaveBeenCalledTimes(25);
 });
});
