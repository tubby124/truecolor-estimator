/** Approved dispatch only; scoped checks never write or call providers. */
import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { approvalIntegrityBlocker, dispatchApprovedPost, publishingEnabled, approvalReset } from '@/lib/social/approval';
import { recordCronRun } from '@/lib/cron/heartbeat';
import { enrolledApprovals } from '@/lib/social/intake-scheduling/enrollments';
import type { SocialPost } from '@/lib/types/social';

export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Approval verification and compare-and-swap dispatch require this saved snapshot.
const ongoingColumns = [
  'id', 'business_id', 'status', 'updated_at', 'schedule_time', 'use_next_free_slot',
  'approval_hash', 'approval_version', 'approved_at', 'approved_by', 'approval_target',
  'approved_rights', 'approved_media_sha256', 'caption_raw', 'caption_instagram',
  'caption_facebook', 'caption_twitter', 'caption_gbp', 'hashtags', 'image_url',
  'image_urls', 'alt_text', 'platforms', 'fact_fingerprint', 'product_slug',
  'product_configuration', 'offer_id', 'gbp_payload', 'batch_id', 'creative_id',
  'generation_job_id',
].join(',');
function publicLink(post: SocialPost) {
  if (post.status !== 'posted' || !post.post_public_url) return null;
  try {
    const url = new URL(post.post_public_url);
    const allowed = post.platforms?.[0] === 'instagram' ? ['instagram.com', 'www.instagram.com'] : ['facebook.com', 'www.facebook.com'];
    return url.protocol === 'https:' && allowed.includes(url.hostname) && !url.username && !url.password && !url.search && !url.hash ? url.href : null;
  } catch { return null; }
}
function summary(posts: SocialPost[], expected: number) {
  const counts: Record<string, number> = {};
  let held = posts.length !== expected;
  const upcoming: string[] = [];
  for (const post of posts) {
    counts[post.status] = (counts[post.status] || 0) + 1;
    const time = Date.parse(post.schedule_time || '');
    if (post.status !== 'posted' && (post.status !== 'ready' || approvalIntegrityBlocker(post) !== null || !Number.isFinite(time) || time < Date.now() - 3600000)) held = true;
    if (post.status === 'ready' && Number.isFinite(time)) upcoming.push(new Date(time).toISOString());
  }
  return { receipts: posts.map(post => ({ id: post.id, platform: post.platforms?.[0] ?? 'unknown', status: post.status, scheduleTime: Number.isFinite(Date.parse(post.schedule_time || '')) ? new Date(post.schedule_time!).toISOString() : null, publicUrl: publicLink(post) })), counts, total: posts.length, complete: posts.length === expected && counts.posted === expected, held, nextTimes: [...new Set(upcoming)].sort() };
}
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Scheduler not configured' }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get('Authorization') || '');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = req.nextUrl.searchParams;
  if (params.get('runner') === 'ongoing') return ongoing(req);

  const ids = params.has('ids') ? params.get('ids')!.split(',') : null;
  const expiry = params.get('expiresAt');
  const deadline = expiry ? Date.parse(expiry) : Infinity;
  const validExpiry = expiry !== null && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(expiry) && Number.isFinite(deadline) && new Date(deadline).toISOString() === (expiry.length === 20 ? expiry.replace('Z', '.000Z') : expiry);
  if ((params.has('expiresAt') && (!validExpiry || !ids)) || [...params.keys()].some(key => !['ids', 'mode', 'expiresAt'].includes(key) || params.getAll(key).length !== 1) || (params.has('mode') && params.get('mode') !== 'check') || (ids && (!ids.length || ids.length > 14 || ids.some(id => !uuid.test(id)) || new Set(ids).size !== ids.length)) || (params.get('mode') === 'check' && !ids)) return NextResponse.json({ error: 'Invalid scheduler scope' }, { status: 400 });
  const check = params.get('mode') === 'check';
  if (!ids && !publishingEnabled()) return NextResponse.json({ ok: true, skipped: true, reason: 'Publishing is paused' });
  const db = createServiceClient();
  if (ids) {
    const read = () => db.from('social_posts').select('*').in('id', ids);
    const initial = await read();
    if (initial.error) return NextResponse.json({ error: 'Scoped queue unavailable' }, { status: 503 });
    const before = summary(initial.data ?? [], ids.length);
    if (check || Date.now() >= deadline || before.held || before.complete || !publishingEnabled()) return NextResponse.json({ ok: true, publishingEnabled: publishingEnabled(), expired: Date.now() >= deadline, ...before });
    let dispatched = 0;
    let attemptHeld = false;
    for (const post of initial.data ?? []) {
      // An in-flight provider call can finish after this boundary; never start the next post.
      if (Date.now() >= deadline) break;
      if (post.status !== 'ready' || Date.parse(post.schedule_time || '') > Date.now()) continue;
      const result = await dispatchApprovedPost(db, post);
      if (result.status === 200 && 'post' in result && result.post?.status === 'posted') dispatched++;
      else { attemptHeld = true; break; }
    }
    const after = await read();
    if (after.error) return NextResponse.json({ error: 'Post-dispatch state unavailable; reconcile manually' }, { status: 503 });
    const state = summary(after.data ?? [], ids.length);
    await recordCronRun('social-scheduler', !attemptHeld, `dispatched=${dispatched}; scoped run`);
    return NextResponse.json({ ok: true, publishingEnabled: publishingEnabled(), ...state, expired: Date.now() >= deadline, held: attemptHeld || state.held, dispatched });
  }
  return NextResponse.json({ ok: true, skipped: true, reason: 'Use the explicitly activated ongoing runner; legacy unscoped dispatch is disabled' });
}

/** Separate activation prevents this deployment from widening the approved pilot. */
async function ongoing(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const businessId = params.get('businessId') ?? '';
  const check = params.get('mode') === 'check';
  const receipts = params.get('mode') === 'receipts';
  const allowed = receipts ? ['runner', 'businessId', 'scope', 'mode', 'since', 'after', 'intake'] : ['runner', 'businessId', 'scope', 'mode', 'intake'];
  if (!uuid.test(businessId) || [...params.keys()].some(key => !allowed.includes(key) || params.getAll(key).length !== 1) || (params.has('mode') && !check && !receipts)) return NextResponse.json({ error: 'Invalid ongoing scope' }, { status: 400 });
  if (process.env.SOCIAL_BUSINESS_SCOPING_ENABLED !== 'true' || process.env.SOCIAL_ONGOING_SCHEDULER_ENABLED !== 'true' || process.env.SOCIAL_ONGOING_BUSINESS_ID !== businessId) return NextResponse.json({ error: 'Ongoing scheduling is not activated for this business' }, { status: 503 });
  const baseIds = ongoingIds(params.get('scope'));
  const includeIntake = params.get('intake') === '1';
  if (params.has('intake') && (!includeIntake || process.env.SOCIAL_INTAKE_SCHEDULER_ENABLED !== 'true')) return NextResponse.json({ error: 'Intake scheduling is not activated' }, { status: 503 });
  let enrollments = new Map<string, string>();
  if (includeIntake && baseIds && !receipts) {
    try { enrollments = await enrolledApprovals(businessId); }
    catch { return NextResponse.json({ error: 'Approved intake queue unavailable' }, { status: 503 }); }
  }
  const ids = baseIds ? [...new Set([...baseIds, ...enrollments.keys()])].sort() : null;
  if (!ids) return NextResponse.json({ error: 'Exact ongoing destination scope is not activated' }, { status: 503 });
  if (receipts) return ongoingReceipts(businessId, ids, params, includeIntake);
  const db = createServiceClient();
  const cutoff = new Date(Date.now() - 3600000).toISOString();
  const read = await db.from('social_posts').select(ongoingColumns).eq('business_id', businessId).in('id', ids).returns<SocialPost[]>().limit(501);
  if (read.error || read.data?.length !== ids.length || read.data.some(post => !ids.includes(post.id))) return NextResponse.json({ error: 'Exact ongoing scope is incomplete or unavailable; held' }, { status: 503 });
  // Editing/cancelling an intake withdraws that approval without stopping unrelated work.
  const eligible = read.data.filter(post => baseIds!.includes(post.id) || post.approval_hash === enrollments.get(post.id));
  const pending = eligible.some(post => ['posting', 'failed'].includes(post.status));
  const ready = eligible.filter(post => post.status === 'ready').sort((a, b) => Date.parse(a.schedule_time ?? '') - Date.parse(b.schedule_time ?? '') || a.id.localeCompare(b.id));
  const stale = ready.some(post => Date.parse(post.schedule_time ?? '') < Date.parse(cutoff));
  const due = ready.filter(post => post.approval_hash && Date.parse(post.schedule_time ?? '') <= Date.now() && Date.parse(post.schedule_time ?? '') >= Date.parse(cutoff));
  const oldestDueAt = ready.find(post => Date.parse(post.schedule_time ?? '') <= Date.now())?.schedule_time ?? null;
  if (check || !publishingEnabled() || pending) return NextResponse.json({ ok: true, runner: 'ongoing', businessId, publishingEnabled: publishingEnabled(), held: pending || stale, due: due.length, oldestDueAt, backlog: due.length > 25, stale, pending });
  // Do not move a claimed or posted delivery. Expired schedules return visibly to review.
  const expired = await db.from('social_posts').update({ ...approvalReset, status: 'draft', error_message: 'Schedule missed by more than one hour; choose a new time and approve again.' }).eq('business_id', businessId).in('id', eligible.map(post => post.id)).eq('status', 'ready').lt('schedule_time', cutoff).select('id');
  if (expired.error) return NextResponse.json({ error: 'Stale schedule hold could not be saved' }, { status: 503 });
  let dispatched = 0;
  let held = expired.data?.length ?? 0;
  // Each dispatch atomically claims its existing approval. No generation, receipt replay or retry.
  for (const post of due.slice(0, 25)) {
    const result = await dispatchApprovedPost(db, post);
    if (result.status === 200 && 'post' in result && result.post?.status === 'posted') dispatched++;
    else held++;
  }
  await recordCronRun('social-scheduler', held === 0, `ongoing dispatched=${dispatched} held=${held}`);
  return NextResponse.json({ ok: true, runner: 'ongoing', businessId, publishingEnabled: publishingEnabled(), dispatched, held: held > 0, heldCount: held, backlog: due.length > 25 });
}

/** Repeated scans recover delivery evidence after lost ACKs; never dispatch or write. */
async function ongoingReceipts(businessId: string, ids: string[], params: URLSearchParams, includeIntake = false) {
  const since = params.get('since') ?? '';
  const after = params.get('after');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(since) || !Number.isFinite(Date.parse(since)) || new Date(since).toISOString() !== since || (after !== null && !uuid.test(after))) {
    return NextResponse.json({ error: 'Invalid receipt scope' }, { status: 400 });
  }
  if (includeIntake) {
    try { ids = [...new Set([...ids, ...(await enrolledApprovals(businessId, createServiceClient(), {since,after})).keys()])].sort(); }
    catch { return NextResponse.json({ error: 'Approved intake receipt scope unavailable' }, { status: 503 }); }
  }
  let query = createServiceClient().from('social_posts')
    .select('id,status,platforms,schedule_time,post_public_url')
    .eq('business_id', businessId).in('id', ids).gte('schedule_time', since)
    .lte('schedule_time', new Date().toISOString())
    .in('status', ['posted', 'posting', 'failed']).order('id').limit(101);
  if (after) query = query.gt('id', after);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Delivery evidence unavailable' }, { status: 503 });
  const page = (data ?? []).slice(0, 100);
  return NextResponse.json({ ok: true, runner: 'ongoing', businessId, ...(includeIntake ? { authorizedIds: ids } : {}), receipts: page.map(post => ({
    id: post.id, platform: post.platforms?.[0] ?? 'unknown', status: post.status,
    scheduleTime: Number.isFinite(Date.parse(post.schedule_time ?? '')) ? new Date(post.schedule_time!).toISOString() : null, publicUrl: publicLink(post as SocialPost),
  })), nextAfter: (data?.length ?? 0) > 100 ? page[99].id : null });
}

function ongoingIds(scope: string | null): string[] | null {
  const ids = (process.env.SOCIAL_ONGOING_POST_IDS ?? '').split(',');
  if (!ids.length || ids.length > 100 || ids.some(id => !/^[0-9a-f-]+$/.test(id) || !uuid.test(id)) || new Set(ids).size !== ids.length) return null;
  ids.sort();
  const expected = createHash('sha256').update(ids.join(',')).digest('hex');
  return scope === expected ? ids : null;
}
