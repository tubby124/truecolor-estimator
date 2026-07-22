import { NextResponse } from "next/server";
import { constantTimeSecretEqual } from "@/lib/webhooks/shared-secret";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase/server";
import type { N8nWebhookPayload } from "@/lib/types/social";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/n8n
 *
 * Called by n8n after posting to a platform via Blotato. This machine-to-
 * machine endpoint intentionally lives outside /api/staff because it uses a
 * fail-closed shared secret instead of a staff browser session.
 *
 * n8n must send: x-n8n-secret: process.env.N8N_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[n8n-webhook] N8N_WEBHOOK_SECRET not configured — rejecting");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (!constantTimeSecretEqual(req.headers.get("x-n8n-secret"), secret)) {
    console.warn("[n8n-webhook] Invalid or missing shared secret — rejecting");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authenticate first so unauthenticated traffic cannot exhaust n8n's bucket.
  if (!rateLimit(`n8n-webhook:${getClientIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: N8nWebhookPayload;
  try {
    body = await req.json() as N8nWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { post_id, platform, status, public_url, error_message, blotato_submission_id } = body;

  if (!post_id || !platform || !["published", "failed"].includes(status)) {
    return NextResponse.json(
      { error: "post_id, platform, and a valid status are required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { error: resultError } = await supabase
    .from("social_post_results")
    .upsert(
      {
        post_id,
        platform,
        status,
        public_url: public_url ?? null,
        error_message: error_message ?? null,
        blotato_submission_id: blotato_submission_id ?? null,
        posted_at: status === "published" ? new Date().toISOString() : null,
      },
      { onConflict: "post_id,platform" },
    );

  if (resultError) {
    console.error("[n8n-webhook] result upsert failed", resultError);
    return NextResponse.json({ error: "Unable to record post result" }, { status: 500 });
  }

  const { data: post } = await supabase
    .from("social_posts")
    .select("platforms, status")
    .eq("id", post_id)
    .single();

  if (post) {
    const { data: results } = await supabase
      .from("social_post_results")
      .select("platform, status")
      .eq("post_id", post_id);

    const resultsByPlatform = new Set((results ?? []).map((result: { platform: string }) => result.platform));
    const allPlatforms = post.platforms as string[];
    const allHandled = allPlatforms.every((postPlatform) => resultsByPlatform.has(postPlatform));

    if (allHandled) {
      const anyFailed = (results ?? []).some((result: { status: string }) => result.status === "failed");

      const { error: postUpdateError } = await supabase
        .from("social_posts")
        .update({
          status: anyFailed ? "failed" : "posted",
          posted_at: !anyFailed ? new Date().toISOString() : null,
          error_message: anyFailed ? "One or more platforms failed — check results" : null,
        })
        .eq("id", post_id);

      if (postUpdateError) {
        console.error("[n8n-webhook] aggregate post update failed", postUpdateError);
        return NextResponse.json({ error: "Unable to update aggregate post status" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
