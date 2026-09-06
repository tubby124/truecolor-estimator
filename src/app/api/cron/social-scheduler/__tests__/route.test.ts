import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const from = vi.hoisted(() => vi.fn());
const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server',()=>({createServiceClient:()=>({from})}));
vi.mock('@/lib/social/approval',()=>({approvalIntegrityBlocker:(post: {approved_rights?: boolean})=>post.approved_rights === false ? 'Explicit approval required' : null,publishingEnabled:()=>process.env.SOCIAL_PUBLISHING_ENABLED==='true', dispatchApprovedPost:dispatch}));
vi.mock('@/lib/cron/heartbeat',()=>({recordCronRun:vi.fn()}));
import { GET } from '../route';
const req=(token='secret')=>new NextRequest('https://example.test/api/cron/social-scheduler',{headers:{Authorization:`Bearer ${token}`}});
describe('approval scheduler',()=>{
 beforeEach(()=>{vi.stubEnv('CRON_SECRET','secret');vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','true');from.mockReset();dispatch.mockReset();});
 afterEach(()=>vi.unstubAllEnvs());
 it('rejects unauthorized requests before DB/provider work',async()=>{expect((await GET(req('bad'))).status).toBe(401);expect(from).not.toHaveBeenCalled();});
 it('pause prevents both dispatch and legacy reconciliation',async()=>{vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','');expect(await (await GET(req())).json()).toMatchObject({skipped:true});expect(from).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();});
 it('fails closed with old schema',async()=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),not:vi.fn().mockReturnThis(),lte:vi.fn().mockReturnThis(),gte:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockResolvedValue({data:null,error:{code:'42703'}})};from.mockReturnValue(q);expect((await GET(req())).status).toBe(503);expect(q.not).toHaveBeenCalledWith('approval_hash','is',null);expect(dispatch).not.toHaveBeenCalled();});
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

});
