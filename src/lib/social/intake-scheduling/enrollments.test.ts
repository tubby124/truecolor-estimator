import {describe,it,expect,vi} from 'vitest';
vi.mock('@/lib/supabase/server',()=>({createServiceClient:vi.fn()}));
import {enrolledApprovals} from './enrollments';
const business='00000000-0000-4000-8000-000000000001', post='00000000-0000-4000-8000-000000000002';
function database(data:unknown[],error:unknown=null){const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),in:vi.fn().mockReturnThis(),gte:vi.fn().mockReturnThis(),lte:vi.fn().mockReturnThis(),gt:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockResolvedValue({data,error})};return {db:{from:vi.fn().mockReturnValue(q)},q};}
describe('intake enrollment boundary',()=>{
 it('reads exact business and retains approval hash',async()=>{const {db,q}=database([{business_id:business,post_id:post,approval_hash:'a'.repeat(64)}]);expect(await enrolledApprovals(business,db as never)).toEqual(new Map([[post,'a'.repeat(64)]]));expect(q.eq).toHaveBeenCalledWith('business_id',business);expect(q.in).toHaveBeenCalledWith('post.status',['ready','posting','failed']);});
 it('paginates historical receipts independently of active scope',async()=>{const{db,q}=database([]);await enrolledApprovals(business,db as never,{since:'2030-01-01T00:00:00.000Z',after:post});expect(q.gt).toHaveBeenCalledWith('post_id',post);expect(q.limit).toHaveBeenCalledWith(101);expect(q.in).toHaveBeenCalledWith('post.status',['posted','posting','failed']);});
 it('rejects foreign, duplicate, malformed and unavailable scope',async()=>{for(const rows of [[{business_id:post,post_id:post,approval_hash:'a'.repeat(64)}],[{business_id:business,post_id:post,approval_hash:'bad'}],Array(2).fill({business_id:business,post_id:post,approval_hash:'a'.repeat(64)})]){const {db}=database(rows);await expect(enrolledApprovals(business,db as never)).rejects.toThrow();}const{db}=database([],{});await expect(enrolledApprovals(business,db as never)).rejects.toThrow();});
});
