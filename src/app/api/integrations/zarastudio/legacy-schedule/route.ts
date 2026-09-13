/**
 * Read-only calendar overlay for the separate ZARASTUDIO workspace.
 *
 * This deliberately exposes no approval material, provider credentials, private
 * previews, or scheduler controls.  It is not a publishing API.
 */
import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SOCIAL_BUSINESS_ID } from '@/lib/social/business';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HISTORY_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;
const MAX_ROWS = 500;

type LegacyPost = {
  id: string;
  business_id: string | null;
  schedule_time: string | null;
  status: 'ready' | 'posting' | 'posted';
  platforms: string[] | null;
  caption_raw: string | null;
  caption_instagram: string | null;
  caption_facebook: string | null;
  caption_gbp: string | null;
  image_url: string | null;
  post_public_url: string | null;
  posted_at: string | null;
};

function authorized(req: NextRequest) {
  const token = process.env.ZARASTUDIO_LEGACY_EXPORT_TOKEN;
  if (!token) return false;
  const expected = Buffer.from(`Bearer ${token}`);
  const received = Buffer.from(req.headers.get('Authorization') ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function cleanCaption(value: string | null) {
  if (typeof value !== 'string') return null;
  // Social copy is expected to be plain text. Bound output in case a malformed
  // legacy row contains a large accidental payload.
  return value.slice(0, 8_000);
}

/** Only durable public image URLs can cross this integration boundary. */
function safeMediaUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://dczbgraekmzirxknjvwe.supabase.co').origin;
    const publicSocialImage = url.origin === supabaseOrigin
      && /^\/storage\/v1\/object\/public\/social-images\/social\/\d{4}\/[a-f0-9-]+\.jpe?g$/i.test(url.pathname);
    const publicWebsiteImage = ['truecolorprinting.ca', 'www.truecolorprinting.ca'].includes(url.hostname)
      && /^\/[^?#]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && (publicSocialImage || publicWebsiteImage) ? url.href : null;
  } catch {
    return null;
  }
}

function safePublicLink(value: string | null, platforms: string[]) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowedHosts = new Set<string>();
    if (platforms.includes('facebook')) ['facebook.com', 'www.facebook.com'].forEach(host => allowedHosts.add(host));
    if (platforms.includes('instagram')) ['instagram.com', 'www.instagram.com'].forEach(host => allowedHosts.add(host));
    if (platforms.includes('gbp')) ['google.com', 'www.google.com', 'business.google.com'].forEach(host => allowedHosts.add(host));
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && allowedHosts.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function exportPost(post: LegacyPost) {
  const scheduleAt = Date.parse(post.schedule_time ?? '');
  if (!Number.isFinite(scheduleAt)) return null;
  const platforms = Array.isArray(post.platforms) ? post.platforms.filter(platform => ['facebook', 'instagram', 'gbp'].includes(platform)) : [];
  if (!platforms.length) return null;
  return {
    legacyId: `truecolor:${post.id}`,
    tenant: 'true-color-printing',
    scheduleTime: new Date(scheduleAt).toISOString(),
    status: post.status,
    platforms,
    captions: {
      default: cleanCaption(post.caption_raw),
      instagram: cleanCaption(post.caption_instagram),
      facebook: cleanCaption(post.caption_facebook),
      googleBusiness: cleanCaption(post.caption_gbp),
    },
    mediaUrl: safeMediaUrl(post.image_url),
    publicUrl: post.status === 'posted' ? safePublicLink(post.post_public_url, platforms) : null,
    postedAt: post.status === 'posted' && Number.isFinite(Date.parse(post.posted_at ?? '')) ? new Date(post.posted_at!).toISOString() : null,
  };
}

export async function GET(req: NextRequest) {
  if (!process.env.ZARASTUDIO_LEGACY_EXPORT_TOKEN) {
    return NextResponse.json({ error: 'Legacy schedule export is not configured' }, { status: 503 });
  }
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const since = new Date(Date.now() - HISTORY_WINDOW_MS).toISOString();
  try {
    const { data, error } = await createServiceClient().from('social_posts')
      .select('id,business_id,schedule_time,status,platforms,caption_raw,caption_instagram,caption_facebook,caption_gbp,image_url,post_public_url,posted_at')
      .eq('business_id', DEFAULT_SOCIAL_BUSINESS_ID)
      .in('status', ['ready', 'posting', 'posted'])
      .gte('schedule_time', since)
      .order('schedule_time', { ascending: true })
      .limit(MAX_ROWS);
    if (error) return NextResponse.json({ error: 'Legacy schedule is unavailable' }, { status: 503 });
    const posts = (data ?? []).map(row => exportPost(row as LegacyPost)).filter((row): row is NonNullable<typeof row> => row !== null);
    return NextResponse.json({
      tenant: 'true-color-printing',
      generatedAt: new Date().toISOString(),
      historySince: since,
      posts,
      truncated: (data?.length ?? 0) === MAX_ROWS,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Legacy schedule is unavailable' }, { status: 503 });
  }
}
