/** Server-only approval and dispatch policy. No provider calls during review. */
import { createHmac, createHash } from 'node:crypto';
import sharp from 'sharp';
import { buildGbpPost } from '@/lib/gbp/publisher';
import { getMetaConfig } from './meta';
import { buildContent, publishSocialPost } from './publisher';
import { DEFAULT_SOCIAL_BUSINESS_ID, scopeSocialQuery, socialBusinessFields, socialBusinessScopingEnabled, socialAssetPrefix } from './business';
import { getBusinessMetaConfig } from './credentials';
import type { SocialPost } from '@/lib/types/social';
import { createServiceClient } from '@/lib/supabase/server';

export const publishingEnabled = () => process.env.SOCIAL_PUBLISHING_ENABLED === 'true';
type PilotPlatform = 'instagram' | 'facebook' | 'gbp';
type ApprovalTarget = NonNullable<SocialPost['approval_target']>;
const pilotPlatform = (post: SocialPost): PilotPlatform | null => post.platforms?.length === 1 && (post.platforms[0] === 'instagram' || post.platforms[0] === 'facebook' || post.platforms[0] === 'gbp') ? post.platforms[0] : null;
export const currentTarget = (platform: PilotPlatform) => {
  if (platform === 'gbp') return null;
  const config = getMetaConfig();
  return config ? { platform, accountId: platform === 'instagram' ? config.igUserId : config.pageId, pageId: config.pageId } : null;
};
export const approvalReset = { approval_hash: null, approved_at: null, approved_by: null, approval_target: null, approved_rights: null, approved_media_sha256: null };
export function reviewPost(post: SocialPost, now = Date.now(), resolvedTarget?: ApprovalTarget | null) {
  const platform = pilotPlatform(post);
  const target = resolvedTarget !== undefined ? resolvedTarget : platform && (!post.business_id || post.business_id === DEFAULT_SOCIAL_BUSINESS_ID) ? currentTarget(platform) : null;
  const content = buildContent(post, platform ?? 'instagram');
  const blockers: string[] = [];
  if (!process.env.SUPABASE_SECRET_KEY) blockers.push('Approval signing is not configured');
  if (!Object.prototype.hasOwnProperty.call(post, 'approval_hash')) blockers.push('Approval migration is not installed');
  if (post.status !== 'draft') blockers.push('Only unattempted drafts may be approved');
  if (platform && !target) blockers.push(`${platform === 'instagram' ? 'Instagram' : platform === 'gbp' ? 'Google' : 'Facebook'} target credentials are not configured`);
  if (!platform) blockers.push('Choose one Instagram, Facebook or Google destination per draft');
  if ((platform === 'gbp' || post.approval_version === 2) && !socialBusinessScopingEnabled()) blockers.push('Business channels migration is not enabled');
  if (platform === 'gbp' && post.approval_version !== 2) blockers.push('Google requires a business-bound approval');
  if (post.business_id && post.business_id !== DEFAULT_SOCIAL_BUSINESS_ID && post.approval_version !== 2) blockers.push('Business approval version required');
  if (post.product_slug && (!post.fact_fingerprint || !post.product_configuration)) blockers.push('Verified product facts required');
  if (post.fact_fingerprint && !post.product_slug) blockers.push('Product source required');
  if (platform === 'gbp' && post.gbp_payload?.topicType === 'OFFER' && !post.offer_id) blockers.push('Google offers require a source-bound shared offer');
  if (platform === 'gbp') { try { buildGbpPost(post); } catch { blockers.push('Google post fields or offer dates are invalid'); } }
  if (platform === 'gbp' && (!post.gbp_payload || !['STANDARD','OFFER'].includes(post.gbp_payload.topicType))) blockers.push('Choose a valid Google post type');
  if (!content.caption.trim() || content.caption.length > (platform === 'gbp' ? 1500 : 2200)) blockers.push('Caption must contain 1–2200 characters including hashtags');
  if (content.imageUrls.length !== 1 || content.videoUrl) blockers.push('Pilot requires exactly one image');
  const media = content.imageUrls[0] || '';
  if (!/^https:\/\//.test(media) && !/^\/images\//.test(media)) blockers.push('Image must use HTTPS or a local /images/ asset');
  let eligibleUpload = false;
  try {
    const url = new URL(media);
    const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dczbgraekmzirxknjvwe.supabase.co').origin;
    eligibleUpload = url.origin === origin && isBusinessMediaPath(url.pathname, post.business_id || DEFAULT_SOCIAL_BUSINESS_ID) && !url.search;
  } catch { /* Invalid URL remains blocked. */ }
  if (!eligibleUpload) blockers.push('Pilot requires a newly uploaded social JPEG; catalog images are not cleared for reuse');
  if (!post.schedule_time || !/(Z|[+-]\d{2}:\d{2})$/.test(post.schedule_time) || !Number.isFinite(Date.parse(post.schedule_time)) || Date.parse(post.schedule_time) <= now) blockers.push('Choose a future schedule with an explicit timezone');
  if (post.use_next_free_slot) blockers.push('Choose an exact schedule');
  const fingerprint = createHmac('sha256', process.env.SUPABASE_SECRET_KEY || '').update(JSON.stringify({ id: post.id, content, caption_raw: post.caption_raw, caption_instagram: post.caption_instagram, caption_facebook: post.caption_facebook, hashtags: post.hashtags, image_url: post.image_url, image_urls: post.image_urls, alt_text: post.alt_text, platforms: post.platforms, schedule_time: post.schedule_time ? new Date(post.schedule_time).toJSON() : null, use_next_free_slot: post.use_next_free_slot, target, mediaSha256: post.approved_media_sha256 ?? null, ...(post.approval_version === 2 ? { version:2, businessId:post.business_id || DEFAULT_SOCIAL_BUSINESS_ID, caption_gbp:post.caption_gbp ?? null, fact_fingerprint:post.fact_fingerprint ?? null, product_slug:post.product_slug ?? null, product_configuration:post.product_configuration ?? null, offer_id:post.offer_id ?? null, gbp_payload:post.gbp_payload ?? null, batch_id:post.batch_id ?? null, creative_id:post.creative_id ?? null, generation_job_id:post.generation_job_id ?? null } : {}) })).digest('hex');
  return { post, content, fingerprint, target, blockers, publishingEnabled: publishingEnabled() };
}
/** Pure approval integrity check: independent of publishing pause and whether time is due. */
export function approvalIntegrityBlocker(post: SocialPost, resolvedTarget?: ApprovalTarget | null): string | null {
  if (!post.approval_hash || !post.approved_at || !post.approved_by || !post.approval_target || post.approved_rights !== true || !/^[a-f0-9]{64}$/.test(post.approved_media_sha256 || '')) return 'Explicit approval required';
  if (post.status !== 'ready') return 'Post is not ready';
  const scheduled = Date.parse(post.schedule_time || '');
  if (!Number.isFinite(scheduled)) return 'Post is not due';
  // Review as a draft immediately before its schedule to reuse all content checks.
  const review = reviewPost({ ...post, status: 'draft' }, scheduled - 1, resolvedTarget);
  if (review.blockers.length || review.fingerprint !== post.approval_hash || review.target?.accountId !== post.approval_target.accountId || review.target?.pageId !== post.approval_target.pageId || review.target?.platform !== post.approval_target.platform) return 'Approved content or destination changed';
  return null;
}
export function dispatchBlocker(post: SocialPost, now = Date.now(), resolvedTarget?: ApprovalTarget | null): string | null {
  if (!publishingEnabled()) return 'Publishing is paused';
  const integrity = approvalIntegrityBlocker(post, resolvedTarget);
  if (integrity) return integrity;
  const scheduled = Date.parse(post.schedule_time!);
  if (scheduled > now) return 'Post is not due';
  if (now - scheduled > 60 * 60 * 1000) return 'Schedule expired; hold for owner review';
  return null;
}

/** CAS claim uses content version AND approval; never retry an attempted delivery. */
export async function dispatchApprovedPost(db: ReturnType<typeof createServiceClient>, post: SocialPost) {
  const businessId = post.business_id || DEFAULT_SOCIAL_BUSINESS_ID;
  let target: ApprovalTarget | null;
  try { target = await resolveApprovalTarget(db, post); } catch { return {error:'Destination verification unavailable; no dispatch',status:503}; }
  const blocker = dispatchBlocker(post, Date.now(), target) || await factsBlocker(post, db);
  if (blocker) return { error: blocker, status: 409 };
  const { data: claimed, error } = await scopeSocialQuery(db.from('social_posts').update({ status: 'posting' }), businessId).eq('id', post.id).eq('status', 'ready').eq('updated_at', post.updated_at).eq('approval_hash', post.approval_hash!).select('*').maybeSingle();
  if (error || !claimed) return { error: 'Post changed or was already claimed', status: 409 };
  if (!publishingEnabled()) return { error: 'Publishing paused after claim; manual review required', status: 409 };
  const hold = async (message: string, status: number) => {
    // Only fixed, safe classifications are persisted; raw exceptions can contain credentials.
    try {
      const { data: diagnostic, error: diagnosticError } = await scopeSocialQuery(db.from('social_posts').update({ error_message: message }), businessId).eq('id', post.id).eq('status', 'posting').select('*').maybeSingle();
      if (diagnosticError || !diagnostic) return { error: `${message}; diagnostic could not be saved`, status };
    } catch { return { error: `${message}; diagnostic could not be saved`, status }; }
    return { error: message, status };
  };
  try {
    let media: Awaited<ReturnType<typeof inspectApprovedMedia>>;
    try {
      media = await inspectApprovedMedia(buildContent(claimed, claimed.approval_target!.platform).imageUrls[0], businessId);
    } catch (error) {
      const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      return await hold(timeout
        ? 'Media preflight timed out before provider dispatch; manual review required'
        : 'Media preflight failed before provider dispatch (unavailable or invalid image); manual review required', 503);
    }
    if (media.sha256 !== claimed.approved_media_sha256) return await hold('Approved image bytes changed before provider dispatch; manual review required', 409);
    if (!publishingEnabled()) return { error: 'Publishing paused; manual review required', status: 409 };
    const { results, attempted } = await publishSocialPost(claimed, db);
    // CAS permits one dispatch; append receipts without requiring a database unique index.
    for (const result of results) {
      const { error: receiptError } = await db.from('social_post_results').insert({ ...socialBusinessFields(businessId), post_id: post.id, platform: result.platform, blotato_submission_id: result.submissionId ?? null, status: result.status, public_url: result.publicUrl ?? null, error_message: result.errorMessage ?? null, posted_at: result.status === 'published' ? new Date().toISOString() : null });
      if (receiptError) return await hold('Delivery receipt could not be saved after provider dispatch; manual reconciliation required', 503);
    }
    const published = attempted && results.length === 1 && results[0].status === 'published' && results[0].platform === claimed.approval_target!.platform;
    const { data, error: saveError } = await scopeSocialQuery(db.from('social_posts').update({ status: published ? 'posted' : 'posting', posted_at: published ? new Date().toISOString() : null, post_public_url: published ? results[0].publicUrl ?? null : null, error_message: published ? null : 'Delivery needs manual reconciliation; automatic retries disabled' }), businessId).eq('id', post.id).eq('status', 'posting').select('*').maybeSingle();
    if (saveError || !data) return { error: 'Delivery state uncertain; manual reconciliation required', status: 503 };
    return { post: data, results, status: 200 };
  } catch {
    return { error: 'Delivery state uncertain; manual reconciliation required', status: 503 };
  }
}

/** Narrow validation shared by draft writers; approval metadata never accepted here. */
export function invalidDraftFields(body: Record<string, unknown>): boolean {
  const strings = ['caption_gbp','fact_fingerprint','product_slug','offer_id','generation_job_id','caption_raw','caption_instagram','caption_facebook','caption_twitter','hashtags','image_url','alt_text','schedule_date','schedule_time','notes','campaign_id','source','post_type','error_message'];
  if (strings.some(key => body[key] != null && (typeof body[key] !== 'string' || (body[key] as string).length > 10000))) return true;
  if (body.image_urls != null && (!Array.isArray(body.image_urls) || body.image_urls.length > 10 || body.image_urls.some(v => typeof v !== 'string' || v.length > 2048))) return true;
  if (body.platforms != null && (!Array.isArray(body.platforms) || body.platforms.length > 4 || body.platforms.some(v => !['instagram','facebook','twitter','tiktok','gbp'].includes(v)))) return true;
  if (body.use_next_free_slot != null && typeof body.use_next_free_slot !== 'boolean') return true;
  if (body.gbp_post_done != null && typeof body.gbp_post_done !== 'boolean') return true;
  if (body.post_number != null && (!Number.isInteger(body.post_number) || Number(body.post_number) < 0)) return true;
  if (body.product_configuration != null && (typeof body.product_configuration !== 'object' || Array.isArray(body.product_configuration) || JSON.stringify(body.product_configuration).length > 5000)) return true;
  if (body.gbp_payload != null && (typeof body.gbp_payload !== 'object' || Array.isArray(body.gbp_payload) || JSON.stringify(body.gbp_payload).length > 10000)) return true;
  return false;
}

/** Strict storage-only, bounded byte validation. Never follow redirects to another host. */
export async function inspectApprovedMedia(media: string, businessId = DEFAULT_SOCIAL_BUSINESS_ID) {
  const url = new URL(media);
  const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dczbgraekmzirxknjvwe.supabase.co').origin;
  if (url.origin !== origin || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !isBusinessMediaPath(url.pathname, businessId)) throw new Error('Image source is not eligible');
  const response = await fetch(url.href, { redirect: 'error', signal: AbortSignal.timeout(10_000), cache: 'no-store' });
  const maxBytes = 8 * 1024 * 1024;
  if (!response.ok || !response.body) throw new Error('Image unavailable');
  if (Number(response.headers.get('content-length')) > maxBytes) { await response.body.cancel(); throw new Error('Image exceeds 8 MiB'); }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maxBytes) throw new Error('Image exceeds 8 MiB');
      chunks.push(result.value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning' });
  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (metadata.format !== 'jpeg' || !width || !height || width < 320 || width > 1440 || width / height < 0.8 || width / height > 1.91 || (metadata.orientation && metadata.orientation !== 1)) throw new Error('Image must be a decoded JPEG, 320–1440px wide, aspect ratio 4:5–1.91:1, with normalized orientation');
  await image.raw().toBuffer(); // Decode all pixels; metadata alone accepts truncated files.
  return { sha256: createHash('sha256').update(bytes).digest('hex'), width, height, bytes: size };
}

export async function verifiedReviewPost(post: SocialPost, db = createServiceClient()) {
  // Only already-approved legacy deliveries are grandfathered. Old unapproved drafts
  // receive today's source/claim checks when requesting a new approval.
  if (socialBusinessScopingEnabled() && post.status === 'draft') post = {...post,approval_version:2};
  const target = await resolveApprovalTarget(db, post);
  const base = reviewPost(post, Date.now(), target);

  try {
    const media = await inspectApprovedMedia(base.content.imageUrls[0] || '', post.business_id || DEFAULT_SOCIAL_BUSINESS_ID);
    const reviewed = reviewPost({ ...post, approved_media_sha256: media.sha256 }, Date.now(), target);
    const stale = await factsBlocker({...post,approved_media_sha256:media.sha256}, db);
    if (stale) reviewed.blockers.push(stale);
    return { ...reviewed, post, media };
  } catch {
    return { ...base, media: null, blockers: [...base.blockers, 'Image byte validation failed: use a valid uploaded JPEG, 320–1440px wide, aspect ratio 4:5–1.91:1, at most 8 MiB'] };
  }
}

/** Legacy True Color upload bytes keep their exact approved URL. Other businesses cannot use them. */
export function isBusinessMediaPath(pathname: string, businessId: string) {
  const prefix = `/storage/v1/object/public/social-images/${socialAssetPrefix(businessId)}/`;
  return pathname.startsWith(prefix) && /^\d{4}\/[a-f0-9-]+\.jpe?g$/.test(pathname.slice(prefix.length));
}
export async function resolveApprovalTarget(db: ReturnType<typeof createServiceClient>, post: SocialPost): Promise<ApprovalTarget|null> {
  const platform = pilotPlatform(post);
  if (!platform) return null;
  const businessId = post.business_id || DEFAULT_SOCIAL_BUSINESS_ID;
  if (platform === 'gbp') {
    const { getGbpTarget } = await import('@/lib/gbp/publisher');
    return getGbpTarget(db, businessId);
  }
  const config = await getBusinessMetaConfig(db, businessId);
  return config ? {platform,accountId:platform === 'instagram' ? config.igUserId : config.pageId,pageId:config.pageId} : null;
}
export async function factsBlocker(post: SocialPost, db: ReturnType<typeof createServiceClient>): Promise<string|null> {
  if (post.approval_version !== 2) return post.product_slug || post.fact_fingerprint || post.generation_job_id || post.offer_id ? 'Verified product source required' : null;
  const platform = pilotPlatform(post);
  if (!platform) return 'Choose one destination';
  const content = buildContent(post, platform).caption;
  const businessId=post.business_id || DEFAULT_SOCIAL_BUSINESS_ID;
  try {
    const { resolveProductFacts } = await import('@/lib/pricing/product-facts');
    if (businessId !== DEFAULT_SOCIAL_BUSINESS_ID && (post.product_slug || post.fact_fingerprint)) return 'Configure this business catalogue before using price offers';
    const current=post.product_slug ? resolveProductFacts({productSlug:post.product_slug,configuration:post.product_configuration as Parameters<typeof resolveProductFacts>[0]['configuration']}) : null;
    if (post.fact_fingerprint !== current?.sourceFingerprint && (post.fact_fingerprint || current)) return 'Product facts changed; regenerate and review';
    if(post.offer_id){
      const {data:offer,error}=await db.from('social_offers').select('*').eq('business_id',businessId).eq('id',post.offer_id).maybeSingle();
      if(error || !offer || !current || offer.fact_fingerprint!==current.sourceFingerprint || offer.image_url!==post.image_url || offer.image_sha256!==post.approved_media_sha256) return 'Shared offer changed; prepare and review again';
      const {renderOffer}=await import('./offers');
      const rendered=renderOffer(offer);
      const expected=platform==='gbp'?rendered.caption_gbp:platform==='instagram'?rendered.caption_instagram:rendered.caption_facebook;
      if(content!==expected || (platform==='gbp' && JSON.stringify(post.gbp_payload)!==JSON.stringify(rendered.gbp_payload))) return 'Shared offer text changed; prepare a new offer for exact review';
      if(offer.starts_on && offer.ends_on){
        const scheduled=new Date(post.schedule_time || '').toLocaleDateString('en-CA',{timeZone:'America/Regina'});
        if(scheduled<offer.starts_on || scheduled>offer.ends_on)return 'Schedule must fall within the real offer dates';
      }
      return null;
    }
    const {validateBoundCaption}=await import('./generation/validation');
    const invalid=validateBoundCaption(content,platform,current);
    if(invalid)return invalid;
    if(post.generation_job_id){
      const {data:job,error}=await db.from('social_generation_jobs').select('status,result').eq('business_id',businessId).eq('id',post.generation_job_id).maybeSingle();
      if(error||!job||!['completed','partial'].includes(job.status)||!job.result?.drafts?.[platform]) return 'Completed generation source for this destination required';
      if((job.result.facts?.sourceFingerprint ?? null)!==(post.fact_fingerprint ?? null))return 'Generation source facts do not match';
    }
    return null;
  } catch { return 'Product or generation facts unavailable; review required'; }
}
