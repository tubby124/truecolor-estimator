import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifiedReviewPost } from '@/lib/social/approval';
import { requireSocialBusiness, scopeSocialQuery, socialBusinessScopingEnabled } from '@/lib/social/business';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Params) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const { data, error } = await scopeSocialQuery(createServiceClient().from('social_posts').select('*'),auth.businessId).eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Post unavailable' }, { status: 404 });
  return NextResponse.json(await verifiedReviewPost(data), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, { params }: Params) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  if (!body || body.rightsConfirmed !== true || typeof body.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(body.fingerprint)) return NextResponse.json({ error: 'Reviewed fingerprint required' }, { status: 400 });
  const { id } = await params;
  const db = createServiceClient();
  const { data: post, error } = await scopeSocialQuery(db.from('social_posts').select('*'),auth.businessId).eq('id', id).single();
  if (error || !post) return NextResponse.json({ error: 'Post unavailable' }, { status: 404 });
  const review = await verifiedReviewPost(post, db);
  if (review.blockers.length) return NextResponse.json({ error: 'Approval blocked', blockers: review.blockers }, { status: 409 });
  if (review.fingerprint !== body.fingerprint) return NextResponse.json({ error: 'Review changed; reload preview before approving' }, { status: 409 });
  const { data, error: saveError } = await scopeSocialQuery(db.from('social_posts').update({ ...(socialBusinessScopingEnabled() ? {approval_version:2} : {}), approval_hash: review.fingerprint, approved_media_sha256: review.media?.sha256, approved_at: new Date().toISOString(), approved_by: auth.user.id, approved_rights: true, approval_target: review.target, status: 'ready' }),auth.businessId).eq('id', id).eq('status', 'draft').eq('updated_at', post.updated_at).select('*').maybeSingle();
  if (saveError) return NextResponse.json({ error: 'Approval unavailable; verify migration readiness' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Post changed; review again' }, { status: 409 });
  return NextResponse.json({ post: data });
}
