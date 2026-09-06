import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), service: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ requireStaffUser: mocks.auth, createServiceClient: mocks.service }));
import { GET as posts, POST as createPost } from '../posts/route';
import { GET as post, PATCH as editPost, DELETE as deletePost } from '../posts/[id]/route';
import { GET as campaigns, POST as createCampaign } from '../campaigns/route';
import { GET as accounts } from '../accounts/route';
import { GET as images } from '../images/route';
import { GET as library } from '../library/route';
import { POST as upload } from '../upload/route';
import { DEFAULT_SOCIAL_BUSINESS_ID as A } from '@/lib/social/business';
const B = '00000000-0000-4000-8000-000000000002';
const C = '00000000-0000-4000-8000-000000000003';
type Row = Record<string, unknown>;
let rows: Record<string, Row[]>;
let operations: { table: string; filters: [string, unknown][]; insert?: Row }[];
function query(table: string) {
  const filters: [string, unknown][] = [];
  const op: typeof operations[number] = { table, filters };
  operations.push(op);
  let update: Row | undefined;
  let remove = false;
  const run = () => {
    const matches = (rows[table] ?? []).filter(row => filters.every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value));
    if (op.insert) { rows[table].push(op.insert); return { data: [op.insert], error: null }; }
    if (update) matches.forEach(row => Object.assign(row, update));
    if (remove) rows[table] = rows[table].filter(row => !matches.includes(row));
    return { data: matches, error: null };
  };
  const q = {
    select: () => q, order: () => q, limit: () => q,
    eq: (key: string, value: unknown) => { filters.push([key, value]); return q; },
    in: (key: string, value: unknown[]) => { filters.push([key, value]); return q; },
    insert: (value: Row) => { op.insert = value; return q; },
    update: (value: Row) => { update = value; return q; },
    delete: () => { remove = true; return q; },
    single: async () => { const r = run(); return r.data[0] ? { data: r.data[0], error: null } : { data: null, error: { code: 'PGRST116' } }; },
    maybeSingle: async () => { const r = run(); return { data: r.data[0] ?? null, error: null }; },
    then: (resolve: (result: ReturnType<typeof run>) => unknown) => Promise.resolve(run()).then(resolve),
  };
  return q;
}
const request = (businessId = B, body?: Row) => new Request('https://app.example/api/staff/social/posts', {
  headers: { 'X-Social-Business-Id': businessId, 'Content-Type': 'application/json' },
  ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
});
const params = { params: Promise.resolve({ id: 'a-post' }) };
describe('social business boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'true');
    operations = [];
    rows = {
      social_business_members: [A, B].map(business_id => ({ business_id, user_id: 'operator', role: 'operator', 'business.is_active': true })),
      social_posts: [{ id: 'a-post', business_id: A, caption_raw: 'A', status: 'draft' }, { id: 'b-post', business_id: B, caption_raw: 'B', status: 'draft' }],
      social_campaigns: [{ id: 'a-campaign', business_id: A }, { id: 'b-campaign', business_id: B }],
      social_accounts: [{ id: 'a-account', business_id: A }, { id: 'b-account', business_id: B }],
    };
    mocks.auth.mockResolvedValue({ id: 'operator' });
    mocks.service.mockReturnValue({ from: query });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('reads only the authorized business records', async () => {
    expect((await (await posts(request())).json()).map((p: Row) => p.id)).toEqual(['b-post']);
    expect((await (await campaigns(request())).json()).map((p: Row) => p.id)).toEqual(['b-campaign']);
    const body = await (await accounts(request())).json();
    expect(body.accounts.map((p: Row) => p.id)).toEqual(['b-account']);
    expect(body.meta.configured).toBe(false);
    expect((await post(request(), params)).status).toBe(404);
  });
  it('cannot edit or delete another business post by ID', async () => {
    await editPost(request(B, { caption_raw: 'attempted override' }), params);
    expect((await deletePost(request(), params)).status).toBe(409);
    expect(rows.social_posts[0].caption_raw).toBe('A');
    expect(rows.social_posts).toHaveLength(2);
  });
  it('inserts authorized business identity and version regardless of a forged body', async () => {
    expect((await createPost(request(B, { caption_raw: 'draft', business_id: A }))).status).toBe(201);
    expect(rows.social_posts.at(-1)).toMatchObject({ business_id: B, approval_version: 2, status: 'draft' });
    expect((await createCampaign(request(B, { slug: 'new', name: 'New', business_id: A }))).status).toBe(201);
    expect(rows.social_campaigns.at(-1)?.business_id).toBe(B);
  });
  it('upgrades a caption-only edit of a legacy approval to v2 without touching other approvals', async () => {
    Object.assign(rows.social_posts[0], { approval_version: 1, status: 'ready', approval_hash: 'old-approval' });
    Object.assign(rows.social_posts[1], { approval_version: 1, status: 'ready', approval_hash: 'untouched-approval' });
    const untouched = { ...rows.social_posts[1] };
    const response = await editPost(request(A, { caption_raw: 'Updated copy' }), params);
    expect(response.status).toBe(200);
    expect(rows.social_posts[0]).toMatchObject({ caption_raw: 'Updated copy', approval_version: 2, status: 'draft', approval_hash: null });
    expect(rows.social_posts[1]).toEqual(untouched);
  });
  it('does not upgrade a legacy row for an empty edit or when the migration gate is disabled', async () => {
    Object.assign(rows.social_posts[0], { approval_version: 1, status: 'ready', approval_hash: 'old-approval' });
    expect((await editPost(request(A, { business_id: B }), params)).status).toBe(400);
    expect(rows.social_posts[0]).toMatchObject({ approval_version: 1, approval_hash: 'old-approval' });
    vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'false');
    expect((await editPost(request(A, { caption_raw: 'Legacy edit' }), params)).status).toBe(200);
    expect(rows.social_posts[0].approval_version).toBe(1);
  });
  it('rejects a cross-business campaign reference before draft creation', async () => {
    expect((await createPost(request(B, { caption_raw: 'draft', campaign_id: 'a-campaign' }))).status).toBe(400);
    expect(rows.social_posts).toHaveLength(2);
  });
  it('rejects every API for an unassigned business before data or storage reads', async () => {
    const calls = [posts(request(C)), createPost(request(C, { caption_raw: 'draft' })), post(request(C), params), editPost(request(C, { caption_raw: 'x' }), params), deletePost(request(C), params), campaigns(request(C)), createCampaign(request(C, { slug: 'new', name: 'New' })), accounts(request(C)), images(request(C)), library(request(C)), upload(request(C))];
    expect((await Promise.all(calls)).map(r => r.status)).toEqual(Array(calls.length).fill(403));
    expect(operations.every(op => op.table === 'social_business_members')).toBe(true);
  });
  it('keeps legacy default inserts schema compatible and rejects other scopes when disabled', async () => {
    vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED', 'false');
    expect((await createPost(request(A, { caption_raw: 'pilot', caption_gbp: 'not installed' }))).status).toBe(201);
    expect(rows.social_posts.at(-1)).not.toHaveProperty('business_id');
    expect(rows.social_posts.at(-1)).not.toHaveProperty('approval_version');
    expect(rows.social_posts.at(-1)).not.toHaveProperty('caption_gbp');
    expect((await posts(request(B))).status).toBe(403);
  });
  it('requires staff even for default business', async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: 'Denied' }, { status: 401 }));
    expect((await posts(request(A))).status).toBe(401);
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it('lists only tenant image year paths', async () => {
    const list = vi.fn().mockResolvedValueOnce({ data: [{ name: '2026', id: null }, { name: '../social', id: null }] }).mockResolvedValueOnce({ data: [{ name: 'photo.jpg', id: 'photo', created_at: '2026-09-06' }] });
    mocks.service.mockReturnValue({ from: query, storage: { from: () => ({ list, getPublicUrl: (path: string) => ({ data: { publicUrl: path } }) }) } });
    const body = await (await images(request())).json();
    expect(list.mock.calls.map(c => c[0])).toEqual([`businesses/${B}/social`, `businesses/${B}/social/2026`]);
    expect(body.images[0].url).toBe(`businesses/${B}/social/2026/photo.jpg`);
  });
  it('writes uploads only under the authorized tenant, ignoring supplied form identity', async () => {
    const write = vi.fn().mockResolvedValue({ error: null });
    mocks.service.mockReturnValue({ from: query, storage: {
      createBucket: vi.fn().mockResolvedValue({ error: null }),
      from: () => ({ upload: write, getPublicUrl: (path: string) => ({ data: { publicUrl: path } }) }),
    } });
    const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
    const form = new FormData();
    form.set('file', new File([new Uint8Array(buffer)], 'sample.png', { type: 'image/png' }));
    form.set('business_id', A);
    const response = await upload(new Request('https://app.example/upload', { method: 'POST', headers: { 'X-Social-Business-Id': B }, body: form }));
    expect(response.status).toBe(200);
    expect(write.mock.calls[0][0]).toMatch(new RegExp(`^businesses/${B}/social/\\d{4}/[a-f0-9-]+\\.png$`));
  });
  it('returns only safe default Meta target status without calling providers', async () => {
    vi.stubEnv('META_PAGE_ID', 'page-id'); vi.stubEnv('META_IG_USER_ID', 'ig-id'); vi.stubEnv('META_PAGE_ACCESS_TOKEN', 'secret-token');
    vi.stubEnv('BLOTATO_API_KEY', 'secret-blotato');
    const provider = vi.spyOn(globalThis, 'fetch');
    const response = await accounts(request(A));
    const body = await response.json();
    expect(body.meta).toEqual({ configured: true, facebook: { accountId: 'page-id' }, instagram: { accountId: 'ig-id', pageId: 'page-id' } });
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(provider).not.toHaveBeenCalled(); provider.mockRestore();
  });
  it('reads only the tenant catalog and refuses a mismatched catalog without signing', async () => {
    const download = vi.fn().mockResolvedValue({ data: new Blob([JSON.stringify({ schemaVersion: 1, businessId: 'truecolor', collectedAt: '2026-09-06', assets: [] })]) });
    const createSignedUrls = vi.fn();
    mocks.service.mockReturnValue({ from: query, storage: { getBucket: async () => ({ data: { public: false } }), from: () => ({ download, createSignedUrls }) } });
    expect((await library(request())).status).toBe(503);
    expect(download).toHaveBeenCalledWith(`businesses/${B}/catalogs/website-v1.json`);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });
});
