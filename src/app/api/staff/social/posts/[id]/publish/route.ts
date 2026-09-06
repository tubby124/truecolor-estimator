import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { dispatchApprovedPost, publishingEnabled } from '@/lib/social/approval';
import { requireSocialBusiness, scopeSocialQuery } from '@/lib/social/business';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!publishingEnabled()) return NextResponse.json({ error: 'Publishing is paused' }, { status: 409 });
  const { id } = await params;
  const db = createServiceClient();
  const { data, error } = await scopeSocialQuery(db.from('social_posts').select('*'),auth.businessId).eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Post unavailable' }, { status: 404 });
  const outcome = await dispatchApprovedPost(db, data);
  return NextResponse.json(outcome, { status: outcome.status });
}
