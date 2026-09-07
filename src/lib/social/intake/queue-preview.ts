/** Authenticated display decoration only. Never change canonical publishing media. */
import { createServiceClient } from '@/lib/supabase/server';
import type { SocialPost } from '@/lib/types/social';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const MAX_ROWS = 1000;
const SIGNING_BATCH = 100;
export async function decorateIntakeQueuePosts<T extends SocialPost>(posts: T[], businessId: string, db?: ReturnType<typeof createServiceClient>): Promise<T[]> {
  if (process.env.SOCIAL_INTAKE_ENABLED !== 'true' || process.env.SOCIAL_BUSINESS_SCOPING_ENABLED !== 'true' || !uuid.test(businessId) || !posts.length) return posts;
  // Scope against both authenticated context and returned rows, even if a caller errs.
  const candidates = posts.filter(post => post.business_id === businessId && uuid.test(post.id)).slice(0, MAX_ROWS);
  if (!candidates.length) return posts;
  try {
    const client = db ?? createServiceClient();
    const ids = new Set(candidates.map(post => post.id));
    const links = await client.from('social_intake_posts').select('business_id,intake_id,post_id').eq('business_id', businessId).in('post_id', [...ids]).limit(MAX_ROWS);
    if (links.error) return posts;
    const associations = (links.data ?? []).filter(link => link.business_id === businessId && ids.has(link.post_id) && uuid.test(link.intake_id));
    const intakeIds = [...new Set(associations.map(link => link.intake_id))];
    if (!intakeIds.length) return posts;
    const requests = await client.from('social_intake_requests').select('id,business_id,media_sha256').eq('business_id', businessId).in('id', intakeIds).limit(MAX_ROWS);
    if (requests.error) return posts;
    const allowedIntakes = new Set(intakeIds);
    const paths = new Map<string, string>();
    for (const row of requests.data ?? []) {
      if (row.business_id === businessId && allowedIntakes.has(row.id) && uuid.test(row.id) && /^[a-f0-9]{64}$/.test(row.media_sha256 ?? '')) paths.set(row.id, `${businessId}/${row.id}/prepared-${row.media_sha256}.jpg`);
    }
    const uniquePaths = [...new Set(paths.values())];
    const signed = new Map<string, string>();
    // Batch storage requests avoid one network call per destination/photo.
    const groups: string[][] = [];
    for (let offset = 0; offset < uniquePaths.length; offset += SIGNING_BATCH) groups.push(uniquePaths.slice(offset, offset + SIGNING_BATCH));
    const results = await Promise.allSettled(groups.map(group => client.storage.from('social-originals').createSignedUrls(group, 900)));
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      if (result.status !== 'fulfilled' || result.value.error) continue;
      const requestedPaths = new Set(groups[index]);
      for (const item of result.value.data ?? []) {
        if (item.path && requestedPaths.has(item.path) && item.signedUrl && !item.error) signed.set(item.path, item.signedUrl);
      }
    }
    const linksByPost = new Map(associations.map(link => [link.post_id, link.intake_id]));
    return posts.map(post => {
      if (post.business_id !== businessId) return post;
      const intakeId = linksByPost.get(post.id);
      if (!intakeId || !paths.has(intakeId)) return post;
      const previewUrl = signed.get(paths.get(intakeId)!);
      return { ...post, intake_id: intakeId, ...(previewUrl ? { preview_image_url: previewUrl } : {}) };
    });
  } catch {
    // Migration/storage outages must not hide the existing queue or leak provider errors.
    return posts;
  }
}
