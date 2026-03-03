import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BLOTATO_BASE = "https://backend.blotato.com";

// Poll a Blotato submission until published/failed (max ~16s)
async function pollSubmission(
  submissionId: string,
  apiKey: string,
): Promise<{ status: "published" | "failed"; publicUrl?: string; errorMessage?: string }> {
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`${BLOTATO_BASE}/v2/posts/${submissionId}`, {
        headers: { "blotato-api-key": apiKey },
      });
      if (!res.ok) continue;
      const data = await res.json() as {
        status?: string;
        publicUrl?: string;
        errorMessage?: string;
      };
      if (data.status === "published") {
        return { status: "published", publicUrl: data.publicUrl };
      }
      if (data.status === "failed") {
        return { status: "failed", errorMessage: data.errorMessage };
      }
    } catch { /* keep polling */ }
  }
  // Timed out — treat as in-progress
  return { status: "failed", errorMessage: "Timed out waiting for Blotato confirmation" };
}

/**
 * POST /api/staff/social/posts/[id]/publish
 *
 * If BLOTATO_API_KEY is set:
 *   → Fires real Blotato API calls per platform, polls for result, updates post status
 * If not set:
 *   → Marks post as "ready" (n8n fallback)
 */
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch the post
  const { data: post, error: fetchError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Validate required fields
  if (!post.caption_raw && !post.caption_instagram) {
    return NextResponse.json({ error: "Post needs a caption before it can be published" }, { status: 400 });
  }
  if (!post.image_url) {
    return NextResponse.json({ error: "Post needs an image URL before it can be published" }, { status: 400 });
  }
  if (!post.platforms || post.platforms.length === 0) {
    return NextResponse.json({ error: "Post needs at least one platform selected" }, { status: 400 });
  }
  if (post.status === "posted" || post.status === "posting") {
    return NextResponse.json({ error: `Post is already ${post.status}` }, { status: 409 });
  }

  const blotatoKey = process.env.BLOTATO_API_KEY;

  // No Blotato key — mark as ready for n8n fallback
  if (!blotatoKey) {
    const { data, error } = await supabase
      .from("social_posts")
      .update({ status: "ready" })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      ...data,
      _message: "Post marked as ready. Add BLOTATO_API_KEY in Railway to enable direct publishing.",
    });
  }

  // === BLOTATO DIRECT PUBLISH ===

  // Get connected accounts for this post's platforms
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("is_active", true)
    .in("platform", post.platforms);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json(
      { error: "No connected Blotato accounts found. Go to Settings and click 'Refresh from Blotato'." },
      { status: 400 }
    );
  }

  // Mark as "posting" immediately
  await supabase
    .from("social_posts")
    .update({ status: "posting" })
    .eq("id", id);

  // Determine if this is a scheduled future post
  const now = new Date();
  const scheduleTime = post.schedule_time ? new Date(post.schedule_time) : null;
  const isFuture = scheduleTime && scheduleTime > now;

  // Caption map per platform
  const captionMap: Record<string, string> = {
    instagram: post.caption_instagram || post.caption_raw || "",
    facebook: post.caption_facebook || post.caption_raw || "",
    twitter: post.caption_twitter || post.caption_raw || "",
    tiktok: post.caption_instagram || post.caption_raw || "",
  };

  // Fire one Blotato call per platform
  const submissions: Array<{
    platform: string;
    submissionId?: string;
    error?: string;
  }> = [];

  for (const platform of post.platforms as string[]) {
    const account = accounts.find((a: { platform: string }) => a.platform === platform);
    if (!account) {
      submissions.push({ platform, error: `No connected ${platform} account` });
      continue;
    }

    // Build platform-specific target
    let target: Record<string, unknown> = { targetType: platform };
    if (platform === "facebook" && account.blotato_page_id) {
      target = { targetType: "facebook", pageId: account.blotato_page_id, mediaType: "reel" };
    } else if (platform === "instagram") {
      target = { targetType: "instagram", mediaType: "reel" };
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
        accountId: account.blotato_account_id,
        content: {
          text: captionMap[platform] || post.caption_raw,
          mediaUrls: [post.image_url],
          platform,
        },
        target,
      },
      useNextFreeSlot: false,
    };

    if (isFuture && scheduleTime) {
      payload.scheduledTime = scheduleTime.toISOString();
    }

    try {
      const res = await fetch(`${BLOTATO_BASE}/v2/posts`, {
        method: "POST",
        headers: {
          "blotato-api-key": blotatoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        submissions.push({ platform, error: `Blotato ${res.status}: ${errText.slice(0, 200)}` });
        continue;
      }

      const result = await res.json() as { postSubmissionId?: string };
      submissions.push({ platform, submissionId: result.postSubmissionId });
    } catch (e) {
      submissions.push({ platform, error: e instanceof Error ? e.message : "Network error" });
    }
  }

  // Poll successful submissions for final status
  const results = await Promise.all(
    submissions.map(async (sub) => {
      if (!sub.submissionId) {
        return { platform: sub.platform, status: "failed" as const, errorMessage: sub.error };
      }
      // For future-scheduled posts: Blotato queued it, don't poll — just record as in-progress
      if (isFuture) {
        return { platform: sub.platform, status: "in-progress" as const, submissionId: sub.submissionId };
      }
      const polled = await pollSubmission(sub.submissionId, blotatoKey);
      return { platform: sub.platform, submissionId: sub.submissionId, ...polled };
    })
  );

  // Upsert results into social_post_results
  for (const r of results) {
    await supabase.from("social_post_results").upsert(
      {
        post_id: id,
        platform: r.platform,
        blotato_submission_id: r.submissionId ?? null,
        status: r.status === "published" ? "published" : r.status === "in-progress" ? "in-progress" : "failed",
        public_url: "publicUrl" in r ? r.publicUrl ?? null : null,
        error_message: "errorMessage" in r ? r.errorMessage ?? null : null,
        posted_at: r.status === "published" ? new Date().toISOString() : null,
      },
      { onConflict: "post_id,platform" }
    );
  }

  // Determine final post status
  const allPublished = results.every((r) => r.status === "published");
  const anyFailed = results.some((r) => r.status === "failed");
  const allInProgress = results.every((r) => r.status === "in-progress");

  let finalStatus: string;
  let errorMessage: string | null = null;

  if (allPublished) {
    finalStatus = "posted";
  } else if (allInProgress || isFuture) {
    finalStatus = "posting"; // Blotato is handling scheduled post
  } else if (anyFailed && !allPublished) {
    finalStatus = "failed";
    errorMessage = results
      .filter((r) => r.status === "failed" && "errorMessage" in r)
      .map((r) => `${r.platform}: ${"errorMessage" in r ? r.errorMessage : "failed"}`)
      .join(" | ");
  } else {
    finalStatus = "posting";
  }

  const { data: updated, error: updateError } = await supabase
    .from("social_posts")
    .update({
      status: finalStatus,
      posted_at: finalStatus === "posted" ? new Date().toISOString() : null,
      error_message: errorMessage,
      blotato_submission_id: submissions[0]?.submissionId ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    ...updated,
    _results: results,
    _message: allPublished
      ? "Posted successfully to all platforms!"
      : isFuture
      ? `Scheduled with Blotato for ${scheduleTime?.toLocaleString()}`
      : anyFailed
      ? "Some platforms failed — check error_message"
      : "Publishing in progress",
  });
}
