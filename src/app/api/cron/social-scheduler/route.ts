/** Approved dispatch only; scoped checks never write or call providers. */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { approvalIntegrityBlocker, dispatchApprovedPost, publishingEnabled } from '@/lib/social/approval';
import { recordCronRun } from '@/lib/cron/heartbeat';
import type { SocialPost } from '@/lib/types/social';

export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  return { counts, total: posts.length, complete: posts.length === expected && counts.posted === expected, held, nextTimes: [...new Set(upcoming)].sort() };
}
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Scheduler not configured' }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get('Authorization') || '');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = req.nextUrl.searchParams;
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
  const { data, error } = await db.from('social_posts').select('*').eq('status', 'ready').not('approval_hash', 'is', null).lte('schedule_time', new Date().toISOString()).gte('schedule_time', new Date(Date.now() - 3600000).toISOString()).order('schedule_time', { ascending: true }).limit(10);
  if (error) return NextResponse.json({ error: 'Approval queue unavailable; scheduler held' }, { status: 503 });
  let dispatched = 0;
  let held = 0;
  for (const post of data ?? []) {
    const result = await dispatchApprovedPost(db, post);
    if (result.status === 200 && 'post' in result && result.post?.status === 'posted') dispatched++; else held++;
  }
  await recordCronRun('social-scheduler', held === 0, `dispatched=${dispatched} held=${held}; automatic reconciliation disabled`);
  return NextResponse.json({ ok: true, dispatched, held });
}
