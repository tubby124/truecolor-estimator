/** Approved dispatch only; scoped checks never write or call providers. */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { approvalIntegrityBlocker, dispatchApprovedPost, publishingEnabled, approvalReset } from '@/lib/social/approval';
import { recordCronRun } from '@/lib/cron/heartbeat';
import type { SocialPost } from '@/lib/types/social';

export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  if (!uuid.test(businessId) || [...params.keys()].some(key => !['runner', 'businessId', 'mode'].includes(key) || params.getAll(key).length !== 1) || (params.has('mode') && !check)) return NextResponse.json({ error: 'Invalid ongoing scope' }, { status: 400 });
  if (process.env.SOCIAL_BUSINESS_SCOPING_ENABLED !== 'true' || process.env.SOCIAL_ONGOING_SCHEDULER_ENABLED !== 'true' || process.env.SOCIAL_ONGOING_BUSINESS_ID !== businessId) return NextResponse.json({ error: 'Ongoing scheduling is not activated for this business' }, { status: 503 });
  const db = createServiceClient();
  const cutoff = new Date(Date.now() - 3600000).toISOString();
  const scope = () => db.from('social_posts').select('*').eq('business_id', businessId);
  const pending = await scope().in('status', ['posting', 'failed']).limit(1);
  const stale = await scope().eq('status', 'ready').lt('schedule_time', cutoff).limit(1);
  const due = await scope().eq('status', 'ready').not('approval_hash', 'is', null).lte('schedule_time', new Date().toISOString()).gte('schedule_time', cutoff).order('schedule_time').order('id').limit(26);
  if (pending.error || stale.error || due.error) return NextResponse.json({ error: 'Ongoing queue unavailable; held' }, { status: 503 });
  const initialHeld = Boolean(pending.data?.length || stale.data?.length);
  if (check || !publishingEnabled()) return NextResponse.json({ ok: true, runner: 'ongoing', businessId, publishingEnabled: publishingEnabled(), held: initialHeld, due: due.data?.length ?? 0, backlog: (due.data?.length ?? 0) > 25, stale: Boolean(stale.data?.length), pending: Boolean(pending.data?.length) });
  // Do not move a claimed or posted delivery. Expired schedules return visibly to review.
  const expired = await db.from('social_posts').update({ ...approvalReset, status: 'draft', error_message: 'Schedule missed by more than one hour; choose a new time and approve again.' }).eq('business_id', businessId).eq('status', 'ready').lt('schedule_time', cutoff).select('id');
  if (expired.error) return NextResponse.json({ error: 'Stale schedule hold could not be saved' }, { status: 503 });
  let dispatched = 0;
  let held = expired.data?.length ?? 0;
  // Each dispatch atomically claims its existing approval. No generation, receipt replay or retry.
  for (const post of (due.data ?? []).slice(0, 25)) {
    const result = await dispatchApprovedPost(db, post);
    if (result.status === 200 && 'post' in result && result.post?.status === 'posted') dispatched++;
    else held++;
  }
  await recordCronRun('social-scheduler', held === 0 && !pending.data?.length, `ongoing dispatched=${dispatched} held=${held}`);
  return NextResponse.json({ ok: true, runner: 'ongoing', businessId, publishingEnabled: publishingEnabled(), dispatched, held: held > 0 || Boolean(pending.data?.length), heldCount: held, backlog: (due.data?.length ?? 0) > 25 });
}
