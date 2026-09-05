import { NextResponse } from 'next/server';
import { requireStaffUser, createServiceClient } from '@/lib/supabase/server';
import { dispatchApprovedPost, publishingEnabled } from '@/lib/social/approval';
export const dynamic = 'force-dynamic';
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;
  if (!publishingEnabled()) return NextResponse.json({ error: 'Publishing is paused' }, { status: 409 });
  const { id } = await params;
  const db = createServiceClient();
  const { data, error } = await db.from('social_posts').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Post unavailable' }, { status: 404 });
  const outcome = await dispatchApprovedPost(db, data);
  return NextResponse.json(outcome, { status: outcome.status });
}
