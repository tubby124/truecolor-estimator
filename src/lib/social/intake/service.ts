import { createHash, createHmac, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createServiceClient } from '@/lib/supabase/server';
import { socialAssetPrefix } from '@/lib/social/business';
import { prepareMonthlyMedia } from '@/lib/social/prepare-media';
import { verifiedReviewPost } from '@/lib/social/approval';
import { generate } from '@/lib/social/generation/service';
import { generationStore } from '@/lib/social/generation/store';
import { callProvider } from '@/lib/social/generation/provider';
import { stableJson, validateBoundCaption } from '@/lib/social/generation/validation';
import { reginaDate } from '@/lib/social/schedule';
import type { SocialPost } from '@/lib/types/social';
import { IntakeError, UUID, equalSecret, intakeConfig } from './auth';

type Context = { businessId: string; operatorId: string };
interface IntakeRow {
  id: string; business_id: string; status: 'preparing' | 'review' | 'approved' | 'held';
  revision: number; post_ids: string[]; image_url: string; media_sha256: string;
  preview_hash: string; preview_expires_at: string; media_treatment: string;
}
export interface IntakePreview {
  intakeId: string; businessName: string; imageUrl: string;
  captions: { instagram: string; facebook: string }; scheduleTime: string;
  status: string; revision: number; mediaTreatment: string; expiresAt: string;
  fingerprint: string; postIds: string[];
}
export interface IntakeResponse extends IntakePreview { previewUrl: string }
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
function signingKey() {
  const key = process.env.SOCIAL_INTAKE_PREVIEW_SECRET ?? '';
  if (key.length < 32) throw new IntakeError(503, 'Private preview signing is not configured.');
  return key;
}
function fingerprint(row: Pick<IntakeRow, 'id'|'business_id'|'revision'|'image_url'|'media_sha256'|'preview_expires_at'>, captions: IntakePreview['captions'], scheduleTime: string) {
  return createHmac('sha256', signingKey()).update(stableJson({ intakeId: row.id, businessId: row.business_id, revision: row.revision, imageUrl: row.image_url, mediaHash: row.media_sha256, expiresAt: new Date(row.preview_expires_at).toISOString(), captions, scheduleTime: new Date(scheduleTime).toISOString() })).digest('hex');
}
function previewToken(row: IntakeRow) {
  const expires = Math.floor(Date.parse(row.preview_expires_at) / 1000);
  const signature = createHmac('sha256', signingKey()).update(`${row.id}:${row.business_id}:${row.revision}:${expires}`).digest('hex');
  return `${row.revision}.${expires}.${signature}`;
}
function verifyToken(row: IntakeRow, token: string) {
  if (!/^\d+\.\d+\.[a-f0-9]{64}$/.test(token) || Date.parse(row.preview_expires_at) <= Date.now() || !equalSecret(token, previewToken(row))) throw new IntakeError(410, 'This preview expired or changed. Ask for a fresh preview.');
}
async function readIntake(id: string, businessId: string) {
  if (!UUID.test(id)) throw new IntakeError(404, 'Photo request unavailable.');
  const db = createServiceClient();
  const result = await db.from('social_intake_requests').select('*').eq('business_id', businessId).eq('id', id).maybeSingle();
  if (result.error) throw new IntakeError(503, 'Photo request storage is unavailable.');
  if (!result.data) throw new IntakeError(404, 'Photo request unavailable.');
  return result.data as IntakeRow;
}
async function readPosts(row: IntakeRow) {
  if (row.post_ids.length !== 2) throw new IntakeError(409, row.status === 'preparing' ? 'This photo is still being prepared. Resume the same request.' : 'This photo needs manual review before a preview is available.', { intakeId: row.id, status: row.status });
  const { data, error } = await createServiceClient().from('social_posts').select('*').eq('business_id', row.business_id).in('id', row.post_ids);
  if (error || data?.length !== 2) throw new IntakeError(503, 'Drafts are unavailable.');
  const posts = data as SocialPost[];
  if (posts.some(p => p.platforms.length !== 1) || new Set(posts.map(p => p.platforms[0])).size !== 2 || !posts.some(p => p.platforms[0] === 'instagram') || !posts.some(p => p.platforms[0] === 'facebook')) throw new IntakeError(409, 'Draft destinations changed. Prepare a new review.');
  return posts;
}
function previewFrom(row: IntakeRow, posts: SocialPost[]): IntakePreview {
  const instagram = posts.find(p => p.platforms[0] === 'instagram')!;
  const facebook = posts.find(p => p.platforms[0] === 'facebook')!;
  const captions = { instagram: instagram.caption_instagram ?? instagram.caption_raw, facebook: facebook.caption_facebook ?? facebook.caption_raw };
  const scheduleTime = instagram.schedule_time ?? '';
  if (!scheduleTime || facebook.schedule_time !== scheduleTime || posts.some(p => p.image_url !== row.image_url || (p.hashtags ?? '') !== '' || p.image_urls.length !== 1 || p.image_urls[0] !== row.image_url)) throw new IntakeError(409, 'Draft content changed. Prepare a new review.');
  if (fingerprint(row, captions, scheduleTime) !== row.preview_hash) throw new IntakeError(409, 'Draft content changed. Prepare a new review.');
  const status = posts.every(p => p.status === 'posted') ? 'posted' : posts.some(p => ['posting','failed'].includes(p.status)) || (row.status === 'approved' && posts.some(p => p.status !== 'ready' || !p.approval_hash || Date.parse(p.schedule_time ?? '') < Date.now() - 3600_000)) ? 'needs_review' : row.status;
  return { intakeId: row.id, businessName: 'True Color Display Printing', imageUrl: row.image_url, captions, scheduleTime, status, revision: row.revision, mediaTreatment: row.media_treatment, expiresAt: row.preview_expires_at, fingerprint: row.preview_hash, postIds: row.post_ids };
}
async function response(row: IntakeRow, posts: SocialPost[]): Promise<IntakeResponse> {
  const preview = previewFrom(row, posts);
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://truecolorprinting.ca';
  const url = new URL(`/social-preview/${row.id}`, base);
  url.searchParams.set('token', previewToken(row));
  return { ...preview, imageUrl: await privatePreparedUrl(row), previewUrl: url.href };
}
/** Read-only bearer preview. Tokens cannot approve, revise or publish. */
export async function getIntakePreview(id: string, token: string): Promise<IntakePreview> {
  const { businessId } = intakeConfig();
  const row = await readIntake(id, businessId);
  verifyToken(row, token);
  return { ...previewFrom(row, await readPosts(row)), imageUrl: await privatePreparedUrl(row) };
}
export async function getIntake(context: Context, id: string): Promise<IntakeResponse> {
  const row = await readIntake(id, context.businessId);
  return response(row, await readPosts(row));
}
export function parseSchedule(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) <= Date.now()) throw new IntakeError(400, 'Choose a future time with an explicit timezone.');
  return new Date(value).toISOString();
}
export async function proposeSchedule(context: Context, requested: string | null, ownIds: string[] = []) {
  const db = createServiceClient();
  const day = reginaDate();
  const end = new Date(`${day}T16:00:00Z`); end.setUTCDate(end.getUTCDate() + 370);
  const { data, error } = await db.from('social_posts').select('id,schedule_time,status').eq('business_id', context.businessId).in('status', ['draft','ready','posting','posted']).gte('schedule_time', `${day}T00:00:00-06:00`).lte('schedule_time', end.toISOString()).order('schedule_time').limit(2000);
  if (error || (data?.length ?? 0) >= 2000) throw new IntakeError(503, 'Schedule is unavailable.');
  const occupied = new Set((data ?? []).filter(p => !ownIds.includes(p.id)).map(p => reginaDate(new Date(p.schedule_time))));
  const alternatives: string[] = [];
  const cursor = new Date(`${day}T16:00:00Z`);
  for (let index = 0; index < 365 && alternatives.length < 3; index++) {
    if (cursor.getTime() > Date.now() && !occupied.has(reginaDate(cursor))) alternatives.push(cursor.toISOString());
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (!alternatives.length) throw new IntakeError(409, 'No open dates are available in the next year.');
  if (requested && (Date.parse(requested) > end.getTime() || occupied.has(reginaDate(new Date(requested))))) throw new IntakeError(409, 'That date already has a post or is beyond the scheduling window. Choose an open date.', { alternatives });
  return requested ?? alternatives[0];
}
export async function createIntake(context: Context, input: { requestId: string; context: string; scheduleTime?: string; bytes: Buffer; contentType: string }): Promise<IntakeResponse> {
  if (!UUID.test(input.requestId) || typeof input.context !== 'string' || input.context.length > 2000 || !input.bytes.length || input.bytes.length > 12 * 1024 * 1024 || !['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(input.contentType)) throw new IntakeError(400, 'Provide a request UUID and a supported image up to 12 MiB.');
  signingKey();
  const requested = parseSchedule(input.scheduleTime);
  const inputHash = digest(stableJson({ media: digest(input.bytes), context: input.context, schedule: requested, type: input.contentType }));
  const db = createServiceClient();
  const claim = await db.rpc('claim_social_intake', { p_business_id: context.businessId, p_request_id: input.requestId, p_input_hash: inputHash, p_operator_id: context.operatorId });
  if (claim.error || !claim.data?.intake) throw new IntakeError(409, 'This request could not be reserved, or its content changed. Resume the same content and request ID.');
  const row = claim.data.intake as IntakeRow;
  if (!claim.data.claimed) return response(row, await readPosts(row));
  try {
    let scheduleTime = await proposeSchedule(context, requested);
    const prepared = await prepareMonthlyMedia(input.bytes);
    const vision = await sharp(prepared.buffer).resize({ width: 1000, height: 1000, fit: 'inside' }).jpeg({ quality: 75 }).toBuffer();
    const originalPath = `${context.businessId}/${input.requestId}/original`;
    const original = await db.storage.from('social-originals').upload(originalPath, input.bytes, { contentType: input.contentType, upsert: false });
    if (original.error) throw new IntakeError(503, 'Original photo could not be preserved.');
    const preserved = await db.from('social_intake_requests').update({ original_path: originalPath }).eq('business_id', context.businessId).eq('id', row.id).eq('status', 'preparing').select('id').maybeSingle();
    if (preserved.error || !preserved.data) throw new IntakeError(503, 'Original photo record could not be saved.');
    const generation = await generate({ requestId: input.requestId, selectedChannels: ['instagram','facebook'], includePrice: false, caption_raw: input.context || undefined, image_base64: vision.toString('base64'), image_type: 'image/jpeg' }, context.businessId, null, generationStore(db), callProvider, true);
    if (generation.status !== 'completed' || !generation.drafts.instagram || !generation.drafts.facebook) throw new IntakeError(409, 'Caption preparation needs review. No post was scheduled.', { intakeId: row.id, generationStatus: generation.status });
    const mediaPath = `${socialAssetPrefix(context.businessId)}/${new Date().getFullYear()}/${randomUUID()}.jpg`;
    const mediaHash = digest(prepared.buffer);
    const upload = await db.storage.from('social-originals').upload(preparedPath({ ...row, media_sha256: mediaHash }), prepared.buffer, { contentType: 'image/jpeg', upsert: false });
    if (upload.error) throw new IntakeError(503, 'Prepared image could not be saved.');
    const imageUrl = db.storage.from('social-images').getPublicUrl(mediaPath).data.publicUrl;
    const captions = { instagram: generation.drafts.instagram, facebook: generation.drafts.facebook };
    for (let attempt = 0; attempt < 3; attempt++) {
      const reviewHash = fingerprint({ ...row, image_url: imageUrl, media_sha256: mediaHash }, captions, scheduleTime);
      const posts = (['instagram','facebook'] as const).map(platform => ({ id: randomUUID(), platform, caption: captions[platform], scheduleTime, generationJobId: generation.jobId, altText: generation.alt_text }));
      const saved = await db.rpc('save_social_intake', { p_business_id: context.businessId, p_intake_id: row.id, p_image_url: imageUrl, p_original_path: originalPath, p_media_hash: mediaHash, p_fingerprint: reviewHash, p_posts: posts });
      if (!saved.error && saved.data) return response(saved.data as IntakeRow, await readPosts(saved.data as IntakeRow));
      if (saved.error?.code !== '23P01') throw new IntakeError(503, 'Draft save is uncertain. Resume the same request ID.');
      scheduleTime = await proposeSchedule(context, requested);
    }
    throw new IntakeError(409, 'The schedule changed during preparation. Choose another date.');
  } catch (error) {
    // Never replay an uncertain generation or storage mutation. An existing saved review wins.
    await db.from('social_intake_requests').update({ status: 'held' }).eq('business_id', context.businessId).eq('id', row.id).eq('status', 'preparing');
    throw error;
  }
}
export async function reviseIntake(context: Context, id: string, body: Record<string, unknown>) {
  const row = await readIntake(id, context.businessId);
  const posts = await readPosts(row);
  const before = previewFrom(row, posts);
  if (!['review','approved'].includes(row.status) || posts.some(p => !['draft','ready'].includes(p.status)) || body.fingerprint !== before.fingerprint) throw new IntakeError(409, 'Review changed. Reload before editing.');
  const instagram = body.captionInstagram ?? before.captions.instagram;
  const facebook = body.captionFacebook ?? before.captions.facebook;
  if (typeof instagram !== 'string' || typeof facebook !== 'string' || instagram.length > 2200 || facebook.length > 2200 || validateBoundCaption(instagram, 'instagram', null) || validateBoundCaption(facebook, 'facebook', null)) throw new IntakeError(400, 'Captions contain unsupported claims or exceed the publishing limit.');
  const scheduleTime = await proposeSchedule(context, parseSchedule(body.scheduleTime ?? before.scheduleTime), row.post_ids);
  const updated = { ...row, revision: row.revision + 1, preview_expires_at: new Date(Date.now() + 48 * 3600_000).toISOString() };
  const reviewHash = fingerprint(updated, { instagram, facebook }, scheduleTime);
  const result = await createServiceClient().rpc('revise_social_intake', { p_business_id: context.businessId, p_intake_id: id, p_expected_fingerprint: before.fingerprint, p_fingerprint: reviewHash, p_schedule: scheduleTime, p_instagram: instagram, p_facebook: facebook, p_expires_at: updated.preview_expires_at, p_versions: posts.map(p => ({ id: p.id, updated_at: p.updated_at })) });
  if (result.error || !result.data) throw new IntakeError(409, 'Draft or schedule changed. Reload the review.');
  return response(result.data as IntakeRow, await readPosts(result.data as IntakeRow));
}
export async function approveIntake(context: Context, id: string, body: Record<string, unknown>) {
  if (body.rightsConfirmed !== true || typeof body.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(body.fingerprint)) throw new IntakeError(400, 'Confirm photo rights and the exact reviewed fingerprint.');
  const row = await readIntake(id, context.businessId);
  const posts = await readPosts(row);
  const preview = previewFrom(row, posts);
  if (preview.fingerprint !== body.fingerprint) throw new IntakeError(409, 'Review changed. Open the latest preview.');
  if (row.status === 'approved') {
    if (posts.some(p => !['ready','posted'].includes(p.status) || !p.approval_hash)) throw new IntakeError(409, 'This approval was reset. Choose a new schedule and revise the review.');
    return response(row, posts);
  }
  if (row.status !== 'review' || Date.parse(row.preview_expires_at) <= Date.now()) throw new IntakeError(409, 'Review expired. Refresh it before approval.');
  await proposeSchedule(context, parseSchedule(preview.scheduleTime), row.post_ids);
  const db = createServiceClient();
  await promoteApprovedMedia(row);
  const reviews = await Promise.all(posts.map(post => verifiedReviewPost(post, db)));
  if (reviews.some(review => review.blockers.length || review.media?.sha256 !== row.media_sha256)) throw new IntakeError(409, 'Approval checks failed. Review the image, captions, schedule and destination.', { blockers: [...new Set(reviews.flatMap(review => review.blockers))] });
  const result = await db.rpc('approve_social_intake', { p_business_id: context.businessId, p_intake_id: id, p_operator_id: context.operatorId, p_fingerprint: body.fingerprint, p_reviews: reviews.map(review => ({ id: review.post.id, updated_at: review.post.updated_at, fingerprint: review.fingerprint, media_hash: review.media!.sha256, target: review.target })) });
  if (result.error || !result.data) throw new IntakeError(409, 'Approval or schedule changed. Reload before approving.');
  return response(result.data as IntakeRow, await readPosts(result.data as IntakeRow));
}

/** Authenticated worker access only; never included in a bearer preview page. */
export async function getIntakeOriginal(context: Context, id: string) {
  const row = await readIntake(id, context.businessId) as IntakeRow & { original_path?: string };
  if (!row.original_path || !row.original_path.startsWith(`${context.businessId}/${id}/`)) throw new IntakeError(404, 'Original photo unavailable.');
  const { data, error } = await createServiceClient().storage.from('social-originals').createSignedUrl(row.original_path, 300);
  if (error || !data?.signedUrl) throw new IntakeError(503, 'Original photo access is unavailable.');
  return { originalUrl: data.signedUrl, originalExpiresAt: new Date(Date.now() + 300_000).toISOString() };
}
/** An enhancement adapter supplies edited bytes; this service does not claim to edit backgrounds. */
export async function reviseIntakeImage(context: Context, id: string, input: { fingerprint: string; mediaTreatment: string; bytes: Buffer; contentType: string }) {
  const treatments: Record<string, string> = {
    background_removed: 'Background removal supplied by the image worker; review lettering, artwork and edges. Orientation corrected, resized and padded where needed.',
    cleaned: 'Image cleanup supplied by the image worker; review lettering, artwork and colours. Orientation corrected, resized and padded where needed.',
  };
  if (!Object.hasOwn(treatments, input.mediaTreatment) || !input.bytes.length || input.bytes.length > 12 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(input.contentType)) throw new IntakeError(400, 'Provide a supported edited photo and background_removed or cleaned treatment.');
  const row = await readIntake(id, context.businessId);
  const posts = await readPosts(row);
  const before = previewFrom(row, posts);
  if (row.status !== 'review' || posts.some(p => p.status !== 'draft') || input.fingerprint !== before.fingerprint) throw new IntakeError(409, 'Review changed. Approved or attempted posts cannot be replaced.');
  const prepared = await prepareMonthlyMedia(input.bytes);
  const db = createServiceClient();
  const mediaPath = `${socialAssetPrefix(context.businessId)}/${new Date().getFullYear()}/${randomUUID()}.jpg`;
  const mediaHash = digest(prepared.buffer);
  const upload = await db.storage.from('social-originals').upload(preparedPath({ ...row, media_sha256: mediaHash }), prepared.buffer, { contentType: 'image/jpeg', upsert: false });
  if (upload.error) throw new IntakeError(503, 'Edited photo could not be saved.');
  const imageUrl = db.storage.from('social-images').getPublicUrl(mediaPath).data.publicUrl;
  const updated = { ...row, revision: row.revision + 1, image_url: imageUrl, media_sha256: mediaHash, preview_expires_at: new Date(Date.now() + 48 * 3600_000).toISOString() };
  const reviewHash = fingerprint(updated, before.captions, before.scheduleTime);
  const result = await db.rpc('revise_social_intake_image', { p_business_id: context.businessId, p_intake_id: id, p_expected_fingerprint: before.fingerprint, p_fingerprint: reviewHash, p_image_url: imageUrl, p_media_hash: mediaHash, p_media_treatment: treatments[input.mediaTreatment], p_expires_at: updated.preview_expires_at, p_versions: posts.map(p => ({ id: p.id, updated_at: p.updated_at })) });
  if (result.error || !result.data) throw new IntakeError(409, 'Review changed during image preparation. Reload it before editing again.');
  return response(result.data as IntakeRow, await readPosts(result.data as IntakeRow));
}

function preparedPath(row: Pick<IntakeRow, 'business_id'|'id'|'media_sha256'>) {
  return `${row.business_id}/${row.id}/prepared-${row.media_sha256}.jpg`;
}
async function privatePreparedUrl(row: IntakeRow) {
  // Public GET already rejects expired tokens; authorized integration GET still needs
  // its snapshot to explicitly revise an expired review.
  const ttl = Math.max(60, Math.min(3600, Math.floor((Date.parse(row.preview_expires_at) - Date.now()) / 1000)));
  const { data, error } = await createServiceClient().storage.from('social-originals').createSignedUrl(preparedPath(row), ttl);
  if (error || !data?.signedUrl) throw new IntakeError(503, 'Private prepared photo is unavailable.');
  return data.signedUrl;
}
async function promoteApprovedMedia(row: IntakeRow) {
  const db = createServiceClient();
  const source = await db.storage.from('social-originals').download(preparedPath(row));
  if (source.error || !source.data) throw new IntakeError(503, 'Prepared photo is unavailable.');
  const bytes = Buffer.from(await source.data.arrayBuffer());
  if (digest(bytes) !== row.media_sha256) throw new IntakeError(409, 'Prepared image bytes changed. Prepare a new review.');
  const url = new URL(row.image_url);
  const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dczbgraekmzirxknjvwe.supabase.co').origin;
  const prefix = '/storage/v1/object/public/social-images/';
  if (url.origin !== origin || !url.pathname.startsWith(prefix) || url.search || url.hash) throw new IntakeError(409, 'Publishing media destination changed.');
  const path = url.pathname.slice(prefix.length);
  if (!path.startsWith(`${socialAssetPrefix(row.business_id)}/`)) throw new IntakeError(409, 'Publishing media destination changed.');
  const uploaded = await db.storage.from('social-images').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (uploaded.error) {
    // Recover a lost upload ACK, without overwriting immutable approved media.
    const existing = await db.storage.from('social-images').download(path);
    if (existing.error || !existing.data || digest(Buffer.from(await existing.data.arrayBuffer())) !== row.media_sha256) throw new IntakeError(503, 'Approved media promotion is unavailable. Resume the same approval.');
  }
}
