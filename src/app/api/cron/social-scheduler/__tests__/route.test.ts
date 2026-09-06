import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
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

const digest = (values = ids) => createHash('sha256').update([...values].sort().join(',')).digest('hex');
const ongoing = (check = false, business = ids[0], values = ids) => scoped(`runner=ongoing&businessId=${business}&scope=${digest(values)}${check ? '&mode=check' : ''}`);
const receiptRequest = (extra = '', business = ids[0]) => scoped(`runner=ongoing&businessId=${business}&scope=${digest()}&mode=receipts&since=2026-09-01T00:00:00.000Z${extra}`);
describe('ongoing exact scope and read-only evidence', () => {
 beforeEach(() => { vi.stubEnv('CRON_SECRET', 'secret'); vi.stubEnv('SOCIAL_PUBLISHING_ENABLED', 'true'); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true'); vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', 'true'); vi.stubEnv('SOCIAL_ONGOING_BUSINESS_ID', ids[0]); vi.stubEnv('SOCIAL_ONGOING_POST_IDS', ids.join(',')); from.mockReset(); dispatch.mockReset(); });
 afterEach(() => vi.unstubAllEnvs());
 const row = (id: string, status = 'ready', age = 1000) => ({ id, business_id: ids[0], status, approval_hash: 'approved', schedule_time: new Date(Date.now() - age).toISOString() });
 function queue(data: unknown[] = ids.map(id => row(id)), error: unknown = null) {
  const q = { select: vi.fn().mockReturnThis(), returns: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data, error }) };
  from.mockReturnValue(q); return q;
 }
 it('requires activation, exact digest and a unique destination allowlist', async () => {
  vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', ''); expect((await GET(ongoing())).status).toBe(503);
  vi.stubEnv('SOCIAL_ONGOING_SCHEDULER_ENABLED', 'true'); expect((await GET(ongoing(false, ids[1]))).status).toBe(503);
  expect((await GET(scoped(`runner=ongoing&businessId=${ids[0]}`))).status).toBe(503);
  for (const configured of ['', 'bad', `${ids[0]},${ids[0]}`, ids[0]]) {
   vi.stubEnv('SOCIAL_ONGOING_POST_IDS', configured); expect((await GET(ongoing())).status).toBe(503);
  }
  expect(from).not.toHaveBeenCalled();
 });
 it('rejects missing or foreign destinations rather than reporting healthy empty scope', async () => {
  for (const rows of [[], [row(ids[0])], [row(ids[0]), row('00000000-0000-0000-0000-000000000009')]]) {
   queue(rows); expect((await GET(ongoing(true))).status).toBe(503);
  }
  expect(dispatch).not.toHaveBeenCalled();
 });
 it('check scopes every read and exposes oldest due without mutations', async () => {
  const q = queue([row(ids[0], 'posting'), row(ids[1], 'ready', 7200000)]);
  const result = await (await GET(ongoing(true))).json();
  expect(result).toMatchObject({ held: true, pending: true, stale: true });
  expect(Date.parse(result.oldestDueAt)).toBeLessThan(Date.now() - 7100000);
  expect(q.eq).toHaveBeenCalledWith('business_id', ids[0]);
  expect(q.in).toHaveBeenCalledWith('id', ids); expect(dispatch).not.toHaveBeenCalled();
 });
 it('direct mutation is held when a scoped delivery is already posting', async () => {
  queue([row(ids[0], 'posting'), row(ids[1])]);
  expect(await (await GET(ongoing())).json()).toMatchObject({ held: true, pending: true });
  expect(dispatch).not.toHaveBeenCalled();
 });
 it('does not dispatch when scope read fails', async () => {
  queue([], { code: '42703' }); expect((await GET(ongoing())).status).toBe(503); expect(dispatch).not.toHaveBeenCalled();
 });
 it('bounds dispatch and stale reset to the exact allowlist', async () => {
  const values = Array.from({ length: 27 }, (_, i) => `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`);
  vi.stubEnv('SOCIAL_ONGOING_POST_IDS', values.join(','));
  const q = queue(values.map((id, i) => row(id, 'ready', i === 0 ? 7200000 : 1000)));
  const updateQuery = { eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), select: vi.fn().mockResolvedValue({ data: [{ id: values[0] }], error: null }) };
  const update = vi.fn().mockReturnValue(updateQuery);
  from.mockReturnValueOnce(q).mockReturnValueOnce({ update });
  dispatch.mockResolvedValue({ status: 200, post: { status: 'posted' } });
  expect(await (await GET(ongoing(false, ids[0], values))).json()).toMatchObject({ dispatched: 25, held: true, backlog: true });
  expect(updateQuery.in).toHaveBeenCalledWith('id', values);
  expect(updateQuery.eq).toHaveBeenCalledWith('business_id', ids[0]);
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', approval_hash: null }));
  expect(dispatch).toHaveBeenCalledTimes(25);
 });
 it('receipt scope rejects extra parameters, invalid cursors and another business', async () => {
  for (const extra of ['&after=bad', '&force=true', '&since=2026-09-02T00:00:00.000Z']) expect((await GET(receiptRequest(extra))).status).toBe(400);
  expect((await GET(receiptRequest('', ids[1]))).status).toBe(503);
  expect(from).not.toHaveBeenCalled();
 });
 it('reads only allowlisted stored statuses and strips unsafe or unconfirmed links', async () => {
  const q = queue([{ ...row(ids[0], 'posted'), platforms: ['facebook'], post_public_url: 'https://www.facebook.com/123_456', schedule_time: '2026-09-07T14:59:00.123456+00:00' }, { ...row(ids[1], 'posting'), platforms: ['instagram'], post_public_url: 'https://www.instagram.com/p/unconfirmed/' }]);
  const result = await (await GET(receiptRequest())).json();
  expect(result.receipts).toEqual([expect.objectContaining({ id: ids[0], status: 'posted', publicUrl: 'https://www.facebook.com/123_456', scheduleTime: '2026-09-07T14:59:00.123Z' }), expect.objectContaining({ id: ids[1], status: 'posting', publicUrl: null })]);
  expect(q.eq).toHaveBeenCalledWith('business_id', ids[0]); expect(q.in).toHaveBeenCalledWith('id', ids);
  expect(q.select).toHaveBeenCalledWith('id,status,platforms,schedule_time,post_public_url');
  expect(q.gte).toHaveBeenCalledWith('schedule_time', '2026-09-01T00:00:00.000Z');
  expect(dispatch).not.toHaveBeenCalled(); expect(result.nextAfter).toBeNull();
  for (const url of ['https://example.test/private', 'https://www.facebook.com/123?access_token=secret', 'https://user:secret@www.facebook.com/123']) {
   queue([{ ...row(ids[0], 'posted'), platforms: ['facebook'], post_public_url: url }]);
   expect((await (await GET(receiptRequest())).json()).receipts[0].publicUrl).toBeNull();
  }
 });
 it('receipt read failures fail closed without dispatch', async () => {
  queue([], { code: 'error' }); expect((await GET(receiptRequest())).status).toBe(503); expect(dispatch).not.toHaveBeenCalled();
 });
});
