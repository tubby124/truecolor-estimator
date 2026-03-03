import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { N8nWebhookPayload } from "@/lib/types/social";

export const dynamic = "force-dynamic";

/**
 * POST /api/staff/social/webhooks/n8n
 *
 * Called by n8n after posting to a platform via Blotato.
 * Validates N8N_WEBHOOK_SECRET header, then updates post status.
 *
 * n8n should send: x-n8n-secret: process.env.N8N_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  // Validate webhook secret
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-n8n-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: N8nWebhookPayload;
  try {
    body = await req.json() as N8nWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { post_id, platform, status, public_url, error_message, blotato_submission_id } = body;

  if (!post_id || !platform || !status) {
    return NextResponse.json({ error: "post_id, platform, and status are required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Upsert into social_post_results
  const { error: resultError } = await supabase
    .from("social_post_results")
    .upsert(
      {
        post_id,
        platform,
        status: status === 'published' ? 'published' : 'failed',
        public_url: public_url ?? null,
        error_message: error_message ?? null,
        blotato_submission_id: blotato_submission_id ?? null,
        posted_at: status === 'published' ? new Date().toISOString() : null,
      },
      { onConflict: "post_id,platform" }
    );

  if (resultError) {
    console.error("n8n webhook: result upsert error", resultError);
    return NextResponse.json({ error: resultError.message }, { status: 500 });
  }

  // Check if ALL platforms for this post have been handled
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

    const resultsByPlatform = new Set((results ?? []).map((r: { platform: string }) => r.platform));
    const allPlatforms = post.platforms as string[];
    const allHandled = allPlatforms.every((p) => resultsByPlatform.has(p));

    if (allHandled) {
      const anyFailed = (results ?? []).some((r: { status: string }) => r.status === 'failed');
      const newStatus = anyFailed ? 'failed' : 'posted';

      await supabase
        .from("social_posts")
        .update({
          status: newStatus,
          posted_at: !anyFailed ? new Date().toISOString() : null,
          error_message: anyFailed ? "One or more platforms failed — check results" : null,
        })
        .eq("id", post_id);
    }
  }

  return NextResponse.json({ ok: true });
}
