import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireSocialBusiness, socialBusinessScopingEnabled } from '@/lib/social/business';
export const dynamic = 'force-dynamic';
/** Save a dated monthly/on-demand research package; never calls a research or AI provider. */
export async function POST(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: 'Generation migration required.' }, { status: 503 });
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid research package.' }, { status: 400 }); }
  const safeSource = (v: unknown) => { try { const u = new URL(v as string); return typeof v === 'string' && v.length <= 1000 && u.protocol === 'https:' && !u.username && !u.password && !u.search; } catch { return false; } };
  if (!b || typeof b.productSlug !== 'string' || b.productSlug.length > 100 || !Array.isArray(b.candidates) || !b.candidates.length || b.candidates.length > 30 || b.candidates.some((v: unknown) => typeof v !== 'string' || !/^#[\p{L}\p{N}_]{1,60}$/u.test(v)) || !Array.isArray(b.sources) || !b.sources.length || b.sources.length > 10 || !b.sources.every(safeSource) || typeof b.researchedAt !== 'string' || !Number.isFinite(Date.parse(b.researchedAt)) || Date.parse(b.researchedAt) > Date.now() || Date.now() - Date.parse(b.researchedAt) > 31 * 86400000) return NextResponse.json({ error: 'Provide dated research from the past month, hashtag candidates, and HTTPS source links.' }, { status: 400 });
  try {
    const { error } = await createServiceClient().from('social_generation_hashtag_candidates').insert({ business_id: auth.businessId, product_slug: b.productSlug, candidates: b.candidates, sources: b.sources, provenance: 'researched', researched_at: b.researchedAt, expires_at: new Date(Date.parse(b.researchedAt) + 31 * 86400000).toISOString() });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: 'Research package could not be saved.' }, { status: 503 }); }
}
