import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const from = vi.hoisted(() => vi.fn());
const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server',()=>({createServiceClient:()=>({from})}));
vi.mock('@/lib/social/approval',()=>({publishingEnabled:()=>process.env.SOCIAL_PUBLISHING_ENABLED==='true', dispatchApprovedPost:dispatch}));
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
