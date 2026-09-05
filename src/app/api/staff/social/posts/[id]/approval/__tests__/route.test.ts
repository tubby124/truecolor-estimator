import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const auth=vi.hoisted(()=>vi.fn());
const from=vi.hoisted(()=>vi.fn());
const review=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/supabase/server',()=>({requireStaffUser:auth,createServiceClient:()=>({from})}));
vi.mock('@/lib/social/approval',()=>({verifiedReviewPost:review}));
import {GET,POST} from '../route';
const params={params:Promise.resolve({id:'one'})};
const request=(body:unknown)=>new Request('https://example.test',{method:'POST',body:JSON.stringify(body)});
describe('staff approval route',()=>{
 beforeEach(()=>{auth.mockReset().mockResolvedValue({id:'owner'});from.mockReset();review.mockReset();});
 it('requires staff on read and approval',async()=>{auth.mockResolvedValue(NextResponse.json({error:'Forbidden'},{status:403}));expect((await GET(request({}),params)).status).toBe(403);expect((await POST(request({}),params)).status).toBe(403);expect(from).not.toHaveBeenCalled();});
 it('requires explicit rights confirmation',async()=>{expect((await POST(request({fingerprint:'a'.repeat(64)}),params)).status).toBe(400);expect(from).not.toHaveBeenCalled();});
 it('rejects changed reviewed fingerprint',async()=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue({data:{id:'one',updated_at:'version'},error:null})};from.mockReturnValue(q);review.mockReturnValue({blockers:[],fingerprint:'b'.repeat(64)});expect((await POST(request({fingerprint:'a'.repeat(64),rightsConfirmed:true}),params)).status).toBe(409);expect(from).toHaveBeenCalledTimes(1);});
 it('rejects a concurrent edit after successful fingerprint comparison',async()=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue({data:{id:'one',updated_at:'version'},error:null}),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null})};from.mockReturnValue(q);review.mockReturnValue({blockers:[],fingerprint:'a'.repeat(64),target:{accountId:'ig'}});expect((await POST(request({fingerprint:'a'.repeat(64),rightsConfirmed:true}),params)).status).toBe(409);expect(q.eq).toHaveBeenCalledWith('updated_at','version');expect(q.eq).toHaveBeenCalledWith('status','draft');});
});
