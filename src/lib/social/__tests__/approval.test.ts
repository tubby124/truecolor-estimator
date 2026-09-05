import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SocialPost } from '@/lib/types/social';
import { reviewPost, dispatchBlocker, dispatchApprovedPost } from '../approval';
const publish = vi.hoisted(() => vi.fn());
vi.mock('../publisher', async importOriginal => ({ ...await importOriginal<typeof import('../publisher')>(), publishSocialPost: publish }));
const scheduled = Date.parse('2030-01-01T12:00:00Z');
function draft(): SocialPost {
  return { id:'p1', status:'draft', caption_raw:'A print project', caption_instagram:null, hashtags:null, image_url:'https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2026/abcd-1234.jpg', image_urls:[], platforms:['instagram'], schedule_time:new Date(scheduled).toISOString(), use_next_free_slot:false, approval_hash:null, approved_media_sha256:'a'.repeat(64), updated_at:'2030-01-01T10:00:00Z' } as unknown as SocialPost;
}
function approved() {
  const post = draft();
  const review = reviewPost(post, scheduled-1000);
  return { ...post, status:'ready', approval_hash:review.fingerprint, approved_at:'2030-01-01T10:00:00Z', approved_by:'owner', approval_target:review.target, approved_rights:true } as unknown as SocialPost;
}
describe('explicit social approval', () => {
  beforeEach(() => { vi.stubEnv('SUPABASE_SECRET_KEY','test-only-signing-key'); vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','true'); vi.stubEnv('META_IG_USER_ID','ig'); vi.stubEnv('META_PAGE_ID','page'); vi.stubEnv('META_PAGE_ACCESS_TOKEN','test'); publish.mockReset(); });
  afterEach(() => vi.unstubAllEnvs());
  it('reviews a future single JPEG without provider access', () => { expect(reviewPost(draft(),scheduled-1000).blockers).toEqual([]); expect(publish).not.toHaveBeenCalled(); });
  it('blocks legacy rows and absent approval', () => { const p=draft(); delete p.approval_hash; expect(reviewPost(p,scheduled-1000).blockers).toContain('Approval migration is not installed'); expect(dispatchBlocker({...p,status:'ready'},scheduled)).toBe('Explicit approval required'); });
  it('defaults paused', () => { vi.stubEnv('SOCIAL_PUBLISHING_ENABLED',''); expect(dispatchBlocker(approved(),scheduled)).toBe('Publishing is paused'); });
  it('binds caption, media, target, and schedule', () => { const p=approved(); expect(dispatchBlocker(p,scheduled)).toBeNull(); expect(dispatchBlocker({...p,approved_media_sha256:'b'.repeat(64)},scheduled)).toBe('Approved content or destination changed'); expect(dispatchBlocker({...p,caption_raw:'Changed'},scheduled)).toBe('Approved content or destination changed'); expect(dispatchBlocker({...p,schedule_time:new Date(scheduled-1000).toISOString()},scheduled)).toBe('Approved content or destination changed'); vi.stubEnv('META_IG_USER_ID','other'); expect(dispatchBlocker(p,scheduled)).toBe('Approved content or destination changed'); });
  it('holds late and early posts and attempted deliveries', () => { expect(dispatchBlocker(approved(),scheduled+3600001)).toMatch(/expired/); expect(dispatchBlocker(approved(),scheduled-1)).toBe('Post is not due'); expect(dispatchBlocker({...approved(),status:'posting'},scheduled)).toBe('Post is not ready'); });
  it('blocks platforms, non JPEGs, catalog assets and naive timestamps', () => { for (const delta of [{platforms:['facebook']},{image_url:'/images/catalog.jpg'},{image_url:draft().image_url!.replace('.jpg','.png')},{schedule_time:'2030-01-01T12:00:00'}]) expect(reviewPost({...draft(),...delta} as SocialPost,scheduled-1000).blockers.length).toBeGreaterThan(0); });
  it('does not dispatch after losing atomic claim', async () => { vi.useFakeTimers(); vi.setSystemTime(scheduled); const chain = { update:vi.fn().mockReturnThis(), eq:vi.fn().mockReturnThis(), select:vi.fn().mockReturnThis(), maybeSingle:vi.fn().mockResolvedValue({data:null,error:null}) }; const db={from:()=>chain}; const result=await dispatchApprovedPost(db as never,approved()); expect(result.status).toBe(409); expect(chain.eq).toHaveBeenCalledWith('approval_hash',approved().approval_hash); expect(chain.eq).toHaveBeenCalledWith('updated_at',approved().updated_at); expect(publish).not.toHaveBeenCalled(); vi.useRealTimers(); });
});
