import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { SocialPost } from '@/lib/types/social';
import { reviewPost, dispatchBlocker, dispatchApprovedPost } from '../approval';
const publish = vi.hoisted(() => vi.fn());
vi.mock('../publisher', async importOriginal => ({ ...await importOriginal<typeof import('../publisher')>(), publishSocialPost: publish }));
const scheduled = Date.parse('2030-01-01T12:00:00Z');
function draft(platform: 'instagram' | 'facebook' = 'instagram'): SocialPost {
  return { id:'p1', status:'draft', caption_raw:'A print project', caption_instagram:null, hashtags:null, image_url:'https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2026/abcd-1234.jpg', image_urls:[], platforms:[platform], schedule_time:new Date(scheduled).toISOString(), use_next_free_slot:false, approval_hash:null, approved_media_sha256:'a'.repeat(64), updated_at:'2030-01-01T10:00:00Z' } as unknown as SocialPost;
}
function approved(platform: 'instagram' | 'facebook' = 'instagram') {
  const post = draft(platform);
  const review = reviewPost(post, scheduled-1000);
  return { ...post, status:'ready', approval_hash:review.fingerprint, approved_at:'2030-01-01T10:00:00Z', approved_by:'owner', approval_target:review.target, approved_rights:true } as unknown as SocialPost;
}
describe('explicit social approval', () => {
  beforeEach(() => { vi.stubEnv('SUPABASE_SECRET_KEY','test-only-signing-key'); vi.stubEnv('SOCIAL_PUBLISHING_ENABLED','true'); vi.stubEnv('META_IG_USER_ID','ig'); vi.stubEnv('META_PAGE_ID','page'); vi.stubEnv('META_PAGE_ACCESS_TOKEN','test'); publish.mockReset(); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  it('reviews a future single JPEG without provider access', () => { expect(reviewPost(draft(),scheduled-1000).blockers).toEqual([]); expect(publish).not.toHaveBeenCalled(); });
  it('binds Facebook caption and Page and rejects destination changes', () => { const d = {...draft('facebook'), caption_facebook:'Facebook exact caption', caption_instagram:'Different Instagram caption'}; const r = reviewPost(d, scheduled-1000); expect(r.blockers).toEqual([]); expect(r.content.caption).toBe('Facebook exact caption'); expect(r.target).toEqual({platform:'facebook',accountId:'page',pageId:'page'}); const p = {...approved('facebook'), ...d, status:'ready', approval_hash:r.fingerprint} as SocialPost; expect(dispatchBlocker(p,scheduled)).toBeNull(); expect(dispatchBlocker({...p,caption_facebook:'Changed'},scheduled)).toMatch(/changed/); expect(dispatchBlocker({...p,platforms:['instagram']},scheduled)).toMatch(/changed/); vi.stubEnv('META_PAGE_ID','other-page'); expect(dispatchBlocker(p,scheduled)).toMatch(/changed/); });
  it('blocks legacy rows and absent approval', () => { const p=draft(); delete p.approval_hash; expect(reviewPost(p,scheduled-1000).blockers).toContain('Approval migration is not installed'); expect(dispatchBlocker({...p,status:'ready'},scheduled)).toBe('Explicit approval required'); });
  it('defaults paused', () => { vi.stubEnv('SOCIAL_PUBLISHING_ENABLED',''); expect(dispatchBlocker(approved(),scheduled)).toBe('Publishing is paused'); });
  it('binds caption, media, target, and schedule', () => { const p=approved(); expect(dispatchBlocker(p,scheduled)).toBeNull(); expect(dispatchBlocker({...p,approved_media_sha256:'b'.repeat(64)},scheduled)).toBe('Approved content or destination changed'); expect(dispatchBlocker({...p,caption_raw:'Changed'},scheduled)).toBe('Approved content or destination changed'); expect(dispatchBlocker({...p,schedule_time:new Date(scheduled-1000).toISOString()},scheduled)).toBe('Approved content or destination changed'); vi.stubEnv('META_IG_USER_ID','other'); expect(dispatchBlocker(p,scheduled)).toBe('Approved content or destination changed'); });
  it('holds late and early posts and attempted deliveries', () => { expect(dispatchBlocker(approved(),scheduled+3600001)).toMatch(/expired/); expect(dispatchBlocker(approved(),scheduled-1)).toBe('Post is not due'); expect(dispatchBlocker({...approved(),status:'posting'},scheduled)).toBe('Post is not ready'); });
  it('blocks platforms, non JPEGs, catalog assets and naive timestamps', () => { for (const delta of [{platforms:['instagram','facebook']},{platforms:['twitter']},{image_url:'/images/catalog.jpg'},{image_url:draft().image_url!.replace('.jpg','.png')},{schedule_time:'2030-01-01T12:00:00'}]) expect(reviewPost({...draft(),...delta} as SocialPost,scheduled-1000).blockers.length).toBeGreaterThan(0); });
  it('does not dispatch after losing atomic claim', async () => { vi.useFakeTimers(); vi.setSystemTime(scheduled); const chain = { update:vi.fn().mockReturnThis(), eq:vi.fn().mockReturnThis(), select:vi.fn().mockReturnThis(), maybeSingle:vi.fn().mockResolvedValue({data:null,error:null}) }; const db={from:()=>chain}; const result=await dispatchApprovedPost(db as never,approved()); expect(result.status).toBe(409); expect(chain.eq).toHaveBeenCalledWith('approval_hash',approved().approval_hash); expect(chain.eq).toHaveBeenCalledWith('updated_at',approved().updated_at); expect(publish).not.toHaveBeenCalled(); vi.useRealTimers(); });
});


/** Small stateful database double enforces the route's actual CAS predicates. */
function deliveryDb(initial: SocialPost, receiptFails = false) {
  let row = { ...initial };
  const events: string[] = [];
  const receipts: unknown[] = [];
  return {
    events, receipts,
    row: () => ({ ...row }),
    from(table: string) {
      let updates: Partial<SocialPost> = {};
      const conditions: [string, unknown][] = [];
      const chain = {
        update(value: Partial<SocialPost>) { updates = value; return chain; },
        eq(key: string, value: unknown) { conditions.push([key, value]); return chain; },
        select() { return chain; },
        async maybeSingle() {
          if (table !== 'social_posts') throw new Error('Unexpected table');
          if (!conditions.every(([key, value]) => (row as unknown as Record<string, unknown>)[key] === value)) return { data: null, error: null };
          row = { ...row, ...updates };
          events.push(row.status);
          return { data: { ...row }, error: null };
        },
        async insert(receipt: unknown) { receipts.push(receipt); events.push('receipt'); return { error: receiptFails ? {message:'receipt failed'} : null }; },
      };
      return chain;
    },
  };
}

describe('approved delivery positive path', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-only-signing-key');
    vi.stubEnv('SOCIAL_PUBLISHING_ENABLED', 'true');
    vi.stubEnv('META_IG_USER_ID', 'ig'); vi.stubEnv('META_PAGE_ID', 'page'); vi.stubEnv('META_PAGE_ACCESS_TOKEN', 'test');
    vi.useFakeTimers(); vi.setSystemTime(scheduled); publish.mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  it.each(['instagram', 'facebook'] as const)('claims %s once, persists receipt, and rejects duplicate delivery', async (platform) => {
    const bytes = await sharp({ create: { width: 1080, height: 1080, channels: 3, background: '#fff' } }).jpeg().toBuffer();
    const post = { ...approved(platform), approved_media_sha256: createHash('sha256').update(bytes).digest('hex') };
    post.approval_hash = reviewPost({ ...post, status: 'draft' }, scheduled - 1000).fingerprint;
    const db = deliveryDb(post);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bytes)));
    publish.mockImplementation(async () => {
      expect(db.row().status).toBe('posting');
      db.events.push('provider');
      return { attempted: true, results: [{ platform, status: 'published', submissionId: 'synthetic-media', publicUrl: 'https://example.test/synthetic-post' }] };
    });
    const result = await dispatchApprovedPost(db as never, post);
    expect(result.status).toBe(200);
    expect(db.events).toEqual(['posting', 'provider', 'receipt', 'posted']);
    expect(db.receipts).toEqual([expect.objectContaining({ post_id: post.id, platform, status: 'published', blotato_submission_id: 'synthetic-media', public_url: 'https://example.test/synthetic-post' })]);
    expect(db.row().status).toBe('posted');
    expect((await dispatchApprovedPost(db as never, post)).status).toBe(409); // stale ready snapshot loses CAS
    expect((await dispatchApprovedPost(db as never, db.row())).status).toBe(409);
    expect(publish).toHaveBeenCalledTimes(1);
  });
  it.each(['failed', 'in-progress', 'receipt-error'] as const)('never retries a %s Facebook attempt', async (outcome) => {
    const bytes = await sharp({create:{width:1080,height:1080,channels:3,background:'#fff'}}).jpeg().toBuffer();
    const post = {...approved('facebook'), approved_media_sha256:createHash('sha256').update(bytes).digest('hex')};
    post.approval_hash = reviewPost({...post,status:'draft'},scheduled-1000).fingerprint;
    const db = deliveryDb(post, outcome === 'receipt-error');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(bytes)));
    publish.mockResolvedValue({attempted:true,results:[{platform:'facebook',status:outcome === 'receipt-error' ? 'published' : outcome}]});
    await dispatchApprovedPost(db as never,post);
    if (outcome === 'receipt-error') expect(db.row().error_message).toMatch(/receipt could not be saved after provider dispatch/);
    expect(db.row().status).toBe('posting');
    expect((await dispatchApprovedPost(db as never,post)).status).toBe(409);
    expect((await dispatchApprovedPost(db as never,db.row())).status).toBe(409);
    expect(publish).toHaveBeenCalledTimes(1);
  });
  it.each(['TimeoutError', 'Error'])('records safe %s media preflight failure without dispatch', async (name) => {
    const post = approved();
    const db = deliveryDb(post);
    const error = new Error('secret-token-must-not-be-persisted');
    error.name = name;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    const result = await dispatchApprovedPost(db as never, post);
    expect(result.status).toBe(503);
    expect(result.error).toContain(name === 'TimeoutError' ? 'Media preflight timed out' : 'Media preflight failed');
    expect(db.row().error_message).toBe(result.error);
    expect(db.row().error_message).not.toContain('secret-token');
    expect(db.row().status).toBe('posting');
    expect(db.receipts).toEqual([]);
    expect(publish).not.toHaveBeenCalled();
  });
  it('holds a claimed post without provider activity when approved bytes changed', async () => {
    const changedBytes = await sharp({ create: { width: 1080, height: 1080, channels: 3, background: '#000' } }).jpeg().toBuffer();
    const post = approved(); // approval binds a different digest
    const db = deliveryDb(post);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(changedBytes)));
    const result = await dispatchApprovedPost(db as never, post);
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/bytes changed/);
    expect(db.row().error_message).toBe(result.error);
    expect(db.row().status).toBe('posting');
    expect(db.receipts).toEqual([]);
    expect((await dispatchApprovedPost(db as never, db.row())).status).toBe(409);
    expect(publish).not.toHaveBeenCalled();
  });
});
