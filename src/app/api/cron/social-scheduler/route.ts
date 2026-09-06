/** Only explicitly approved single-destination Instagram or Facebook pilots dispatch. Uncertain deliveries require manual reconciliation. */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { dispatchApprovedPost, publishingEnabled } from '@/lib/social/approval';
import { recordCronRun } from '@/lib/cron/heartbeat';
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Scheduler not configured' }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get('Authorization') || '');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!publishingEnabled()) return NextResponse.json({ ok: true, skipped: true, reason: 'Publishing is paused' });
  const db = createServiceClient();
  const { data, error } = await db.from('social_posts').select('*').eq('status', 'ready').not('approval_hash', 'is', null).lte('schedule_time', new Date().toISOString()).gte('schedule_time', new Date(Date.now() - 60 * 60 * 1000).toISOString()).order('schedule_time', { ascending: true }).limit(10);
  if (error) return NextResponse.json({ error: 'Approval queue unavailable; scheduler held' }, { status: 503 });
  let dispatched = 0;
  let held = 0;
  for (const post of data ?? []) {
    const result = await dispatchApprovedPost(db, post);
    if (result.status === 200) dispatched++; else held++;
  }
  await recordCronRun('social-scheduler', true, `dispatched=${dispatched} held=${held}; automatic reconciliation disabled`);
  return NextResponse.json({ ok: true, dispatched, held });
}
