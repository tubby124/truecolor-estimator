/**
 * True Color Social — Direct Meta Graph API publisher (Instagram + Facebook).
 *
 * Replaces Blotato as the platform transport for Instagram/Facebook. The
 * content pipeline (staff compose UI, queue, captions, hashtags, scheduling)
 * is unchanged — only the bottom transport layer swaps.
 *
 * Env (Railway) — all three required for Meta publishing to activate:
 *   META_PAGE_ID            Facebook Page ID (the True Color page)
 *   META_IG_USER_ID         Instagram Business account ID, linked to the Page
 *   META_PAGE_ACCESS_TOKEN  Page access token (System User token preferred — non-expiring)
 *   META_GRAPH_VERSION      optional; defaults to v23.0 (matches CAPI)
 *
 * Token permissions required:
 *   instagram_basic, instagram_content_publish, pages_manage_posts
 *
 * Publishing flows implemented:
 *   Instagram image        → POST /{ig}/media (image_url) → poll → media_publish
 *   Instagram carousel     → children (is_carousel_item) → CAROUSEL container → poll → publish
 *   Instagram reel         → REELS container (video_url, share_to_feed) → poll → publish
 *   Facebook photo         → POST /{page}/photos (url + message)
 *   Facebook multi-photo   → upload each unpublished → POST /{page}/feed with attached_media
 *   Facebook video         → POST /{page}/videos (file_url + description)
 *
 * Edge cases handled:
 *   - Token expired (code 190) / permissions (200) / rate limit (4) → friendly messages
 *   - IG container ERROR / EXPIRED → failed with Meta's message
 *   - IG container still processing after poll window → "in-progress" with the
 *     container id stored as submissionId so the cron can reconcile later
 *   - No image/video → failed with clear message
 *   - Relative image URLs → normalized against NEXT_PUBLIC_SITE_URL (IG requires absolute)
 */

import type { Platform } from "@/lib/types/social";

export const META_DEFAULT_GRAPH_VERSION = "v23.0";
export const IG_POLL_MAX_ATTEMPTS = 8;
export const IG_POLL_INTERVAL_MS = 5000;
const GRAPH_REQUEST_TIMEOUT_MS = 30_000;

/** Poll tuning — env-overridable so tests can avoid real 5s sleeps. */
export function getIgPollConfig(): { maxAttempts: number; intervalMs: number } {
  const maxAttempts = Number(process.env.META_IG_POLL_MAX_ATTEMPTS ?? IG_POLL_MAX_ATTEMPTS);
  const intervalMs = Number(process.env.META_IG_POLL_INTERVAL_MS ?? IG_POLL_INTERVAL_MS);
  return {
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : IG_POLL_MAX_ATTEMPTS,
    intervalMs: Number.isFinite(intervalMs) && intervalMs >= 0 ? intervalMs : IG_POLL_INTERVAL_MS,
  };
}

export interface MetaConfig {
  pageId: string;
  igUserId: string;
  accessToken: string;
  graphVersion: string;
}

export interface PlatformPublishResult {
  platform: Platform;
  status: "published" | "failed" | "in-progress";
  /** IG container/media id, FB media/post id — also used for cron reconciliation. */
  submissionId?: string;
  publicUrl?: string;
  errorMessage?: string;
}

export interface PostContent {
  caption: string;
  imageUrls: string[];
  videoUrl?: string | null;
}

export function getMetaConfig(): MetaConfig | null {
  const pageId = process.env.META_PAGE_ID?.trim();
  const igUserId = process.env.META_IG_USER_ID?.trim();
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  if (!pageId || !igUserId || !accessToken) return null;
  return {
    pageId,
    igUserId,
    accessToken,
    graphVersion: process.env.META_GRAPH_VERSION?.trim() || META_DEFAULT_GRAPH_VERSION,
  };
}

export function metaEnabled(): boolean {
  return getMetaConfig() !== null;
}

export class MetaGraphError extends Error {
  status?: number;
  metaCode?: number;
  subcode?: number;

  constructor(
    message: string,
    opts: { status?: number; metaCode?: number; subcode?: number } = {}
  ) {
    super(message);
    this.name = "MetaGraphError";
    this.status = opts.status;
    this.metaCode = opts.metaCode;
    this.subcode = opts.subcode;
  }
}

/** Human-friendly error text for a thrown Meta failure. */
export function friendlyMetaError(err: unknown): string {
  if (err instanceof MetaGraphError) {
    if (err.metaCode === 190) {
      return "Meta access token expired or invalid — refresh the System User token in Business Manager.";
    }
    if (err.metaCode === 200) {
      return `Meta permission error (subcode ${err.subcode ?? "?"}) — the token is missing a required permission (instagram_basic, instagram_content_publish, pages_manage_posts).`;
    }
    if (err.metaCode === 4) {
      return "Meta rate limit hit — try again later.";
    }
    if (err.metaCode === 100) {
      return `Meta rejected the request: ${err.message}`;
    }
    if (err.metaCode === 10) {
      return `Meta platform error — try again. (${err.message})`;
    }
    return `Meta API ${err.status ?? "error"}: ${err.message}`;
  }
  return err instanceof Error ? err.message : "Unknown Meta error";
}

/** Builds a graph.facebook.com URL — exported for tests. */
export function buildGraphUrl(
  graphVersion: string,
  node: string,
  params: Record<string, string>
): string {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${node}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function graph<T>(
  config: MetaConfig,
  node: string,
  params: Record<string, string> = {},
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const allParams: Record<string, string> = {
    access_token: config.accessToken,
    ...params,
  };
  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/${node}`);

  let res: Response;
  try {
    if (method === "GET") {
      for (const [k, v] of Object.entries(allParams)) url.searchParams.set(k, v);
      res = await fetch(url.toString(), { signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS) });
    } else {
      const body = new URLSearchParams(allParams);
      res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
      });
    }
  } catch (err) {
    throw new MetaGraphError(
      err instanceof Error && err.name === "TimeoutError"
        ? "Meta request timed out"
        : err instanceof Error
          ? err.message
          : "Meta network error"
    );
  }

  if (!res.ok) {
    let metaCode: number | undefined;
    let subcode: number | undefined;
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as {
        error?: { code?: number; error_subcode?: number; message?: string };
      };
      if (body.error) {
        metaCode = body.error.code;
        subcode = body.error.error_subcode;
        message = body.error.message ?? message;
      }
    } catch {
      // Non-JSON error body — keep statusText
    }
    throw new MetaGraphError(message, { status: res.status, metaCode, subcode });
  }

  return (await res.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalize an image URL — IG requires absolute, publicly reachable URLs. */
export function normalizeMediaUrl(url: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${site}${url}`;
  return `${site}/${url}`;
}

// ── Instagram ────────────────────────────────────────────────────────────────

async function createIgContainer(
  config: MetaConfig,
  params: Record<string, string>
): Promise<string> {
  const res = await graph<{ id: string }>(config, `${config.igUserId}/media`, params, "POST");
  return res.id;
}

type WaitResult =
  | { status: "FINISHED" }
  | { status: "ERROR" | "EXPIRED"; errorMessage: string }
  | { status: "TIMED_OUT" };

async function waitForIgContainer(config: MetaConfig, containerId: string): Promise<WaitResult> {
  const { maxAttempts, intervalMs } = getIgPollConfig();
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(intervalMs);
    const res = await graph<{
      status_code?: string;
      error?: { message?: string };
    }>(config, containerId, { fields: "status_code,error" });
    if (res.status_code === "FINISHED") return { status: "FINISHED" };
    if (res.status_code === "ERROR" || res.status_code === "EXPIRED") {
      return {
        status: res.status_code,
        errorMessage: res.error?.message ?? `IG media container ${res.status_code}`,
      };
    }
    // IN_PROGRESS (or absent) → keep polling
  }
  return { status: "TIMED_OUT" };
}

async function publishIgContainer(config: MetaConfig, containerId: string): Promise<string> {
  const res = await graph<{ id: string }>(
    config,
    `${config.igUserId}/media_publish`,
    { creation_id: containerId },
    "POST"
  );
  return res.id;
}

async function igPermalink(config: MetaConfig, mediaId: string): Promise<string | undefined> {
  try {
    const res = await graph<{ permalink?: string }>(config, mediaId, { fields: "permalink" });
    return res.permalink;
  } catch {
    return undefined; // permalink is nice-to-have; never fail the post over it
  }
}

export async function publishInstagram(
  config: MetaConfig,
  content: PostContent
): Promise<PlatformPublishResult> {
  const base = { platform: "instagram" as const };
  try {
    let containerId: string;

    if (content.videoUrl) {
      containerId = await createIgContainer(config, {
        media_type: "REELS",
        video_url: normalizeMediaUrl(content.videoUrl),
        caption: content.caption,
        share_to_feed: "true",
      });
    } else if (content.imageUrls.length === 1) {
      containerId = await createIgContainer(config, {
        image_url: normalizeMediaUrl(content.imageUrls[0]),
        caption: content.caption,
      });
    } else if (content.imageUrls.length > 1) {
      const children: string[] = [];
      for (const url of content.imageUrls) {
        children.push(
          await createIgContainer(config, {
            image_url: normalizeMediaUrl(url),
            is_carousel_item: "true",
          })
        );
      }
      containerId = await createIgContainer(config, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption: content.caption,
      });
    } else {
      return { ...base, status: "failed", errorMessage: "IG post has no image or video" };
    }

    const waited = await waitForIgContainer(config, containerId);
    if (waited.status !== "FINISHED") {
      if (waited.status === "TIMED_OUT") {
        return {
          ...base,
          status: "in-progress",
          submissionId: containerId,
          errorMessage: "IG media still processing — the next cron run will reconcile this post.",
        };
      }
      return { ...base, status: "failed", submissionId: containerId, errorMessage: waited.errorMessage };
    }

    const mediaId = await publishIgContainer(config, containerId);
    const permalink = await igPermalink(config, mediaId);
    return { ...base, status: "published", submissionId: mediaId, publicUrl: permalink };
  } catch (err) {
    return { ...base, status: "failed", errorMessage: friendlyMetaError(err) };
  }
}

/**
 * Reconcile a previously "in-progress" IG container (from an earlier poll
 * timeout). Returns null when the container is still processing — the post
 * stays in-progress and the next cron run checks again. IG containers expire
 * 24h after creation, so repeated timeouts eventually resolve to EXPIRED.
 */
export async function reconcileIgContainer(
  config: MetaConfig,
  containerId: string
): Promise<PlatformPublishResult | null> {
  const base = { platform: "instagram" as const };
  try {
    const waited = await waitForIgContainer(config, containerId);
    if (waited.status === "TIMED_OUT") return null;
    if (waited.status !== "FINISHED") {
      return { ...base, status: "failed", submissionId: containerId, errorMessage: waited.errorMessage };
    }
    const mediaId = await publishIgContainer(config, containerId);
    const permalink = await igPermalink(config, mediaId);
    return { ...base, status: "published", submissionId: mediaId, publicUrl: permalink };
  } catch (err) {
    return { ...base, status: "failed", submissionId: containerId, errorMessage: friendlyMetaError(err) };
  }
}

// ── Facebook ─────────────────────────────────────────────────────────────────

export async function publishFacebook(
  config: MetaConfig,
  content: PostContent
): Promise<PlatformPublishResult> {
  const base = { platform: "facebook" as const };
  try {
    if (content.videoUrl) {
      const res = await graph<{ id: string; post_id?: string }>(
        config,
        `${config.pageId}/videos`,
        {
          file_url: normalizeMediaUrl(content.videoUrl),
          description: content.caption,
        },
        "POST"
      );
      const postId = res.post_id ?? res.id;
      return {
        ...base,
        status: "published",
        submissionId: res.id,
        publicUrl: `https://www.facebook.com/${postId}`,
      };
    }

    if (content.imageUrls.length === 0) {
      return { ...base, status: "failed", errorMessage: "FB post has no image or video" };
    }

    if (content.imageUrls.length === 1) {
      const res = await graph<{ id: string; post_id?: string }>(
        config,
        `${config.pageId}/photos`,
        {
          url: normalizeMediaUrl(content.imageUrls[0]),
          message: content.caption,
        },
        "POST"
      );
      const postId = res.post_id ?? res.id;
      return {
        ...base,
        status: "published",
        submissionId: res.id,
        publicUrl: `https://www.facebook.com/${postId}`,
      };
    }

    // Multi-image: upload each unpublished, then attach them all to one feed post.
    const mediaIds: string[] = [];
    for (const url of content.imageUrls) {
      const up = await graph<{ id: string }>(
        config,
        `${config.pageId}/photos`,
        { url: normalizeMediaUrl(url), published: "false" },
        "POST"
      );
      mediaIds.push(up.id);
    }
    const feed = await graph<{ id: string; post_id?: string }>(
      config,
      `${config.pageId}/feed`,
      {
        message: content.caption,
        attached_media: JSON.stringify(mediaIds.map((id) => ({ media_fbid: id }))),
      },
      "POST"
    );
    const postId = feed.post_id ?? feed.id;
    return {
      ...base,
      status: "published",
      submissionId: feed.id,
      publicUrl: `https://www.facebook.com/${postId}`,
    };
  } catch (err) {
    return { ...base, status: "failed", errorMessage: friendlyMetaError(err) };
  }
}
