import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireSocialBusiness, socialBusinessScopingEnabled } from '@/lib/social/business';
import { buildGbpPost, type GbpPublishPost } from '@/lib/gbp/publisher';
import { invalidDraftFields } from '@/lib/social/approval';

export const dynamic = 'force-dynamic';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const unavailable = () => NextResponse.json({ error: 'Monthly review requires the business migration and activation' }, { status: 503 });

/** Atomic chunk saves. Replaying the same request returns its durable destination IDs. */
export async function POST(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return unavailable();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { batchId, requestId, month, posts } = body ?? {};
  if (!uuid.test(batchId ?? '') || !uuid.test(requestId ?? '') || !monthPattern.test(month ?? '') || !Array.isArray(posts) || !posts.length || posts.length > 10) return NextResponse.json({ error: 'Choose a month, stable batch/request IDs and 1–10 creatives per chunk' }, { status: 400 });
  const creativeIds = new Set();
  const rows = [];
  for (const p of posts) {
    if (!p || invalidDraftFields(p) || !uuid.test(p.creative_id ?? '') || creativeIds.has(p.creative_id) || typeof p.caption_raw !== 'string' || typeof p.image_url !== 'string' || !Array.isArray(p.platforms) || !p.platforms.length || p.platforms.some((v: string) => !['instagram', 'facebook', 'gbp'].includes(v)) || !Number.isFinite(Date.parse(p.schedule_time)) || !/(Z|[+-]\d{2}:\d{2})$/.test(p.schedule_time)) return NextResponse.json({ error: 'Invalid creative fields' }, { status: 400 });
    // Month means Regina wall time, even when the browser uses a different timezone.
    if (new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Regina', year: 'numeric', month: '2-digit' }).format(new Date(p.schedule_time)) !== month) return NextResponse.json({ error: 'Every creative must be scheduled within the selected month (Regina)' }, { status: 400 });
    if ((p.fact_fingerprint != null && (typeof p.fact_fingerprint !== 'string' || p.fact_fingerprint.length > 128)) || (p.product_slug != null && (typeof p.product_slug !== 'string' || p.product_slug.length > 128)) || (p.product_configuration != null && (typeof p.product_configuration !== 'object' || Array.isArray(p.product_configuration))) || (p.generation_job_id != null && !uuid.test(p.generation_job_id)) || (p.offer_id != null && !uuid.test(p.offer_id)) || (p.caption_gbp != null && typeof p.caption_gbp !== 'string')) return NextResponse.json({ error: 'Invalid source facts' }, { status: 400 });
    creativeIds.add(p.creative_id);
    for (const platform of [...new Set<string>(p.platforms)].sort()) {
      const caption = platform === 'instagram' ? p.caption_instagram : platform === 'facebook' ? p.caption_facebook : p.caption_gbp;
      if (typeof caption !== 'string' || !caption.trim()) return NextResponse.json({ error: `Add a caption for ${platform}` }, { status: 400 });
      if (platform === 'gbp') {
        try { buildGbpPost({ caption_gbp: caption, image_url: p.image_url, image_urls: [], gbp_payload: p.gbp_payload ?? { topicType: 'STANDARD' } } as unknown as GbpPublishPost); }
        catch { return NextResponse.json({ error: 'Invalid Google post details. Review the image, dates, terms and redemption destination.' }, { status: 400 }); }
      }
      rows.push({ creative_id: p.creative_id, caption_raw: p.caption_raw, caption_instagram: p.caption_instagram ?? null, caption_facebook: facebookCaption(p.caption_facebook ?? '', p.hashtags ?? ''), caption_gbp: p.caption_gbp ?? null, hashtags: p.hashtags ?? null, image_url: p.image_url, platforms: [platform], schedule_time: new Date(p.schedule_time).toISOString(), fact_fingerprint: p.fact_fingerprint ?? null, product_slug: p.product_slug ?? null, product_configuration: p.product_configuration ?? null, generation_job_id: p.generation_job_id ?? null, offer_id: p.offer_id ?? null, gbp_payload: platform === 'gbp' ? (p.gbp_payload ?? { topicType: 'STANDARD' }) : null });
    }
  }
  const payloadHash = createHash('sha256').update(JSON.stringify({ batchId, month, rows })).digest('hex');
  const { data, error } = await createServiceClient().rpc('save_social_batch_chunk', { p_business_id: auth.businessId, p_batch_id: batchId, p_month: month, p_created_by: auth.user.id, p_request_id: requestId, p_payload_hash: payloadHash, p_posts: rows.map(row => ({ ...row, id: randomUUID() })) });
  if (error) return NextResponse.json({ error: error.code === '23505' || error.code === '22023' ? 'This saved chunk changed. Resume the batch and edit its saved drafts.' : 'Chunk save unavailable. Retry with the same request ID; saved drafts will not duplicate.' }, { status: error.code === '23505' || error.code === '22023' ? 409 : 503 });
  return NextResponse.json({ batchId, posts: data ?? [], created: data?.length ?? 0, logicalPosts: posts.length });
}

/** Paginated saved batches or exact draft IDs; caller cannot select another business. */
export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return unavailable();
  const params = new URL(req.url).searchParams;
  const batchId = params.get('batchId');
  const progressView = params.get('view') === 'progress';
  const pageText = params.get('page') ?? '0';
  if (!/^\d{1,5}$/.test(pageText) || (batchId && !uuid.test(batchId)) || (progressView && !batchId)) return NextResponse.json({ error: 'Invalid page or batch' }, { status: 400 });
  const page = Number(pageText);
  const db = createServiceClient();
  if (progressView) {
    // One bounded snapshot, including an exact count. Never turn a database row
    // cap or missing count into an apparently complete month summary.
    const { data, error, count } = await db.from('social_posts').select('id,creative_id,platforms,status,schedule_time,error_message,results:social_post_results(platform,status,public_url)', { count: 'exact' }).eq('business_id', auth.businessId).eq('batch_id', batchId!).order('schedule_time').order('id').range(0, 999);
    if (error || count == null || count > 1000 || data?.length !== count) return NextResponse.json({ error: 'Complete batch progress is unavailable. Previous results may be stale; refresh again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ batchId, posts: data, total: count, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (!batchId) {
    const { data, error } = await db.from('social_batches').select('id,month,created_at', { count: 'exact' }).eq('business_id', auth.businessId).order('created_at', { ascending: false }).order('id').range(page * 20, page * 20 + 20);
    if (error) return unavailable();
    return NextResponse.json({ businessId: auth.businessId, batches: (data ?? []).slice(0, 20), hasMore: (data?.length ?? 0) > 20, page });
  }
  const { data, error, count } = await db.from('social_posts').select('id,creative_id,status,schedule_time,error_message', { count: 'exact' }).eq('business_id', auth.businessId).eq('batch_id', batchId).order('created_at').order('id').range(page * 9, page * 9 + 8);
  if (error) return unavailable();
  return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, hasMore: (page + 1) * 9 < (count ?? 0) });
}

function facebookCaption(caption: string, hashtags: string) {
  const seen = new Set((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map(tag => tag.toLowerCase()));
  const missing = (hashtags.match(/#[\p{L}\p{N}_]+/gu) ?? []).filter(tag => { if (seen.has(tag.toLowerCase())) return false; seen.add(tag.toLowerCase()); return true; });
  return missing.length ? `${caption}${caption.trim() ? '\n\n' : ''}${missing.join(' ')}` : caption;
}
