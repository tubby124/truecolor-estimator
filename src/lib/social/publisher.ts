/**
 * True Color Social — Shared publishing engine.
 *
 * Used by BOTH the staff publish route and the cron social-scheduler so the
 * two paths can never drift apart in behavior.
 *
 * Dispatch rules (per platform):
 *   instagram / facebook  → Meta Graph API directly when META_* env is set
 *   twitter / tiktok      → Blotato (legacy) when BLOTATO_API_KEY is set
 *   anything unmatched    → failed result with a clear reason
 *
 * If neither Meta nor Blotato is configured at all, callers should not invoke
 * this engine (the staff route marks the post "ready" with a hint instead).
 */

import {
  getMetaConfig,
  publishInstagram,
  publishFacebook,
  type MetaConfig,
  type PlatformPublishResult,
  type PostContent,
} from "./meta";
import type { SocialPost, Platform } from "@/lib/types/social";

const BLOTATO_BASE = "https://backend.blotato.com";

export interface PublishOutcome {
  results: PlatformPublishResult[];
  /** True when at least one platform was actually dispatched. */
  attempted: boolean;
  /** True when the Meta transport is active (IG/FB will post via Graph API). */
  metaActive: boolean;
}

const META_PLATFORMS: Platform[] = ["instagram", "facebook"];

/**
 * Build the caption + media payload for one platform.
 * - IG and FB each have their own caption column (fall back to caption_raw).
 * - Hashtags ride in the caption text for IG (no extra comment permission needed).
 * - Relative image URLs are normalized to absolute by the Meta lib.
 */
export function buildContent(post: SocialPost, platform: Platform): PostContent {
  let caption = post.caption_raw || "";
  if (platform === "instagram" && post.caption_instagram) caption = post.caption_instagram;
  if (platform === "facebook" && post.caption_facebook) caption = post.caption_facebook;
  if (platform === "instagram" && post.hashtags) {
    caption = caption.trim() ? `${caption.trim()}\n\n${post.hashtags}` : post.hashtags;
  }
  const imageUrls = post.image_urls?.length
    ? post.image_urls
    : post.image_url
      ? [post.image_url]
      : [];
  return { caption, imageUrls, videoUrl: post.image_url?.match(/\.(mp4|mov|webm|m4v)$/i) ? post.image_url : null };
}

export async function publishSocialPost(post: SocialPost): Promise<PublishOutcome> {
  const meta: MetaConfig | null = getMetaConfig();
  const blotatoKey = process.env.BLOTATO_API_KEY;
  const hasAnyPublisher = !!meta || !!blotatoKey;
  const results: PlatformPublishResult[] = [];

  for (const platform of (post.platforms ?? []) as Platform[]) {
    const isMetaPlatform = META_PLATFORMS.includes(platform);

    if (isMetaPlatform && meta) {
      const content = buildContent(post, platform);
      results.push(
        platform === "instagram"
          ? await publishInstagram(meta, content)
          : await publishFacebook(meta, content)
      );
      continue;
    }

    if (blotatoKey) {
      results.push(await publishViaBlotato(post, platform, blotatoKey));
      continue;
    }

    results.push({
      platform,
      status: "failed",
      errorMessage: isMetaPlatform
        ? "No Meta publisher configured (set META_PAGE_ID / META_IG_USER_ID / META_PAGE_ACCESS_TOKEN)."
        : `${platform} publishing requires BLOTATO_API_KEY.`,
    });
  }

  // attempted = a publisher exists. When NO publisher exists the caller should
  // leave the post 'ready' instead of failing it (the results carry the hints).
  return { results, attempted: hasAnyPublisher, metaActive: !!meta };
}

// ── Legacy Blotato transport (twitter/tiktok, or pre-Meta IG/FB) ─────────────

async function pollBlotatoSubmission(
  submissionId: string,
  apiKey: string
): Promise<{ status: "published" | "failed"; publicUrl?: string; errorMessage?: string }> {
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`${BLOTATO_BASE}/v2/posts/${submissionId}`, {
        headers: { "blotato-api-key": apiKey },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        status?: string;
        publicUrl?: string;
        errorMessage?: string;
      };
      if (data.status === "published") return { status: "published", publicUrl: data.publicUrl };
      if (data.status === "failed") return { status: "failed", errorMessage: data.errorMessage };
    } catch {
      /* keep polling */
    }
  }
  return { status: "failed", errorMessage: "Timed out waiting for Blotato confirmation" };
}

export async function publishViaBlotato(
  post: SocialPost,
  platform: Platform,
  blotatoKey: string
): Promise<PlatformPublishResult> {
  const base = { platform };
  const isVideo = (post.image_url ?? "").match(/\.(mp4|mov|webm)$/i);

  // Blotato target — preserved verbatim from the original publish route.
  let target: Record<string, unknown> = { targetType: platform };
  if (platform === "facebook" && post.blotato_submission_id) {
    // NOTE: the original route read account.blotato_page_id from social_accounts;
    // the legacy path is deprecated and only exercised for twitter/tiktok now.
    target = { targetType: "facebook", ...(isVideo ? { mediaType: "reel" } : {}) };
  } else if (platform === "instagram") {
    target = { targetType: "instagram", ...(isVideo ? { mediaType: "reel" } : {}) };
  } else if (platform === "tiktok") {
    target = {
      targetType: "tiktok",
      privacyLevel: "PUBLIC_TO_EVERYONE",
      disabledComments: false,
      disabledDuet: false,
      disabledStitch: false,
      isBrandedContent: false,
      isYourBrand: false,
      isAiGenerated: true,
    };
  }

  const payload: Record<string, unknown> = {
    post: {
      accountId: post.blotato_submission_id ?? undefined,
      content: {
        text: post.caption_raw || "",
        mediaUrls: post.image_urls?.length ? post.image_urls : post.image_url ? [post.image_url] : [],
        platform,
      },
      target,
    },
    useNextFreeSlot: false,
  };

  if (platform === "instagram" && post.hashtags) {
    (payload.post as Record<string, unknown>).firstComment = post.hashtags;
  }

  try {
    const res = await fetch(`${BLOTATO_BASE}/v2/posts`, {
      method: "POST",
      headers: {
        "blotato-api-key": blotatoKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ...base, status: "failed", errorMessage: `Blotato ${res.status}: ${errText.slice(0, 200)}` };
    }

    const result = (await res.json()) as { postSubmissionId?: string };
    if (!result.postSubmissionId) {
      return { ...base, status: "failed", errorMessage: "Blotato returned no submission id" };
    }

    const polled = await pollBlotatoSubmission(result.postSubmissionId, blotatoKey);
    return {
      ...base,
      status: polled.status,
      submissionId: result.postSubmissionId,
      publicUrl: polled.publicUrl,
      errorMessage: polled.errorMessage,
    };
  } catch (err) {
    return {
      ...base,
      status: "failed",
      errorMessage: err instanceof Error ? `Blotato: ${err.message}` : "Blotato network error",
    };
  }
}
