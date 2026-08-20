import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { metaEnabled } from "@/lib/social/meta";
import { publishSocialPost } from "@/lib/social/publisher";
import type { PlatformPublishResult } from "@/lib/social/meta";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/staff/social/posts/[id]/publish
 *
 * Publishes a social post to its selected platforms.
 *
 * Transport:
 *   - Instagram / Facebook  → Meta Graph API directly (META_PAGE_ID / META_IG_USER_ID /
 *                             META_PAGE_ACCESS_TOKEN set on Railway)
 *   - Twitter / TikTok      → Blotato (legacy, BLOTATO_API_KEY)
 *   - Neither configured    → post is marked "ready"; nothing is dispatched
 *
 * Future-scheduled posts are NOT dispatched here — the cron social-scheduler
 * fires them when they come due, so there is exactly one publishing path for
 * scheduled content.
 */
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

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
  if (!post.image_url && (!post.image_urls || post.image_urls.length === 0)) {
    return NextResponse.json({ error: "Post needs an image URL before it can be published" }, { status: 400 });
  }
  if (!post.platforms || post.platforms.length === 0) {
    return NextResponse.json({ error: "Post needs at least one platform selected" }, { status: 400 });
  }
  if (post.status === "posted" || post.status === "posting") {
    return NextResponse.json({ error: `Post is already ${post.status}` }, { status: 409 });
  }

  // Future-scheduled: hand off to the cron; never dispatch early (double-publish guard).
  const scheduleTime = post.schedule_time ? new Date(post.schedule_time) : null;
  const isFuture = scheduleTime && scheduleTime > new Date();
  if (isFuture) {
    const { data: updated, error: updateError } = await supabase
      .from("social_posts")
      .update({ status: "ready" })
      .eq("id", id)
      .select()
      .single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({
      ...updated,
      _message: `Scheduled — the cron will publish when it comes due (${scheduleTime?.toLocaleString()}).`,
    });
  }

  // Nothing configured: mark ready with a hint (same contract as the old Blotato fallback).
  const blotatoKey = process.env.BLOTATO_API_KEY;
  if (!metaEnabled() && !blotatoKey) {
    const { data, error } = await supabase
      .from("social_posts")
      .update({ status: "ready" })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      ...data,
      _message: "Post marked as ready. Set META_PAGE_ID / META_IG_USER_ID / META_PAGE_ACCESS_TOKEN in Railway to enable direct IG/FB publishing.",
    });
  }

  // Mark as "posting" immediately (claim before dispatching — the cron uses the
  // same guard to avoid double-firing).
  const { data: claimed, error: claimError } = await supabase
    .from("social_posts")
    .update({ status: "posting" })
    .eq("id", id)
    .eq("status", "ready")
    .select()
    .single();
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  if (!claimed) {
    return NextResponse.json({ error: "Post was already claimed by another publisher" }, { status: 409 });
  }

  const { results, attempted } = await publishSocialPost(claimed);

  if (!attempted) {
    const { data: updated, error: updateError } = await supabase
      .from("social_posts")
      .update({ status: "ready", error_message: null })
      .eq("id", id)
      .select()
      .single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({
      ...updated,
      _message: "No publisher was configured for the selected platforms.",
    });
  }

  // Persist per-platform results
  for (const r of results) {
    await supabase.from("social_post_results").upsert(
      {
        post_id: id,
        platform: r.platform,
        blotato_submission_id: r.submissionId ?? null,
        status: r.status,
        public_url: r.publicUrl ?? null,
        error_message: r.errorMessage ?? null,
        posted_at: r.status === "published" ? new Date().toISOString() : null,
      },
      { onConflict: "post_id,platform" }
    );
  }

  // Final post status
  const allPublished = results.every((r) => r.status === "published");
  const anyFailed = results.some((r) => r.status === "failed");
  const anyInProgress = results.some((r) => r.status === "in-progress");

  let finalStatus: string;
  let errorMessage: string | null = null;

  if (allPublished) {
    finalStatus = "posted";
  } else if (anyInProgress && !anyFailed) {
    finalStatus = "posting";
    errorMessage = "One or more platforms still processing — the cron will reconcile.";
  } else if (anyFailed && !allPublished && !anyInProgress) {
    finalStatus = "failed";
    errorMessage = results
      .filter((r) => r.status === "failed" && r.errorMessage)
      .map((r) => `${r.platform}: ${r.errorMessage}`)
      .join(" | ");
  } else if (anyFailed && anyInProgress) {
    finalStatus = "failed";
    errorMessage = [
      ...results
        .filter((r) => r.status === "failed" && r.errorMessage)
        .map((r) => `${r.platform}: ${r.errorMessage}`),
      ...results.filter((r) => r.status === "in-progress").map((r) => `${r.platform}: processing`),
    ].join(" | ");
  } else {
    finalStatus = "posting";
  }

  const { data: updated, error: updateError } = await supabase
    .from("social_posts")
    .update({
      status: finalStatus,
      posted_at: finalStatus === "posted" ? new Date().toISOString() : null,
      error_message: errorMessage,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Failure email to staff
  if (finalStatus === "failed" && errorMessage) {
    try {
      const { sendEmail } = await import("@/lib/email/smtp");
      const staffEmail = process.env.STAFF_EMAIL;
      if (staffEmail) {
        const captionPreview = (post.caption_raw || post.caption_instagram || "").slice(0, 60);
        await sendEmail({
          to: staffEmail,
          subject: `Social post failed: ${captionPreview || "Untitled"}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px;">
              <h2 style="color: #e63020;">Social Post Failed</h2>
              <p><strong>Platforms:</strong> ${(post.platforms as string[]).join(", ")}</p>
              <p><strong>Error:</strong> ${errorMessage}</p>
              <p><strong>Caption:</strong> ${(post.caption_raw || "").slice(0, 200)}</p>
              <p><a href="https://truecolorprinting.ca/staff/social/queue" style="color: #e63020; font-weight: bold;">View Queue →</a></p>
            </div>
          `,
          text: `Social post failed. Error: ${errorMessage}. View queue: https://truecolorprinting.ca/staff/social/queue`,
        });
      }
    } catch (emailError) {
      console.error("[social-publish] Failed to send failure notification email:", emailError);
    }
  }

  const message = allPublished
    ? "Posted successfully to all platforms!"
    : anyFailed
      ? "Some platforms failed — check error_message"
      : "Publishing in progress";

  return NextResponse.json({ ...updated, _results: results as PlatformPublishResult[], _message: message });
}
