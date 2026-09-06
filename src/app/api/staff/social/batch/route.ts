import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

import { invalidDraftFields } from "@/lib/social/approval";

export const dynamic = "force-dynamic";

interface BatchPostInput {
  caption_raw: string;
  caption_instagram: string;
  caption_facebook: string;
  caption_twitter: string;
  hashtags: string;
  image_url: string;
  platforms: string[];
  schedule_time: string;
}

/**
 * POST /api/staff/social/batch
 * Creates logical posts as separate destination drafts in one atomic insert.
 * body: { posts: BatchPostInput[] }
 */
export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  let body: { posts: BatchPostInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const posts = body?.posts;
  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: "posts array is required" }, { status: 400 });
  }
  if (posts.length > 14) {
    return NextResponse.json({ error: "Max 14 posts per batch" }, { status: 400 });
  }

  if (posts.some(p => !p || invalidDraftFields(p as unknown as Record<string, unknown>) || typeof p.caption_raw !== 'string' || typeof p.image_url !== 'string' || !Array.isArray(p.platforms) || p.platforms.length === 0 || p.platforms.some(v => !['instagram', 'facebook'].includes(v)) || typeof p.schedule_time !== 'string')) {
    return NextResponse.json({ error: 'Invalid post fields' }, { status: 400 });
  }
  // Keep approval and delivery receipts independent for each destination.
  const expanded = posts.flatMap(p => [...new Set(p.platforms)].map(platform => ({ ...p, platform })));
  if (expanded.length > 14) {
    return NextResponse.json({ error: "Max 14 destination drafts per batch" }, { status: 400 });
  }
  const supabase = createServiceClient();

  const rows = expanded.map((p) => ({
    caption_raw: p.caption_raw || "",
    caption_instagram: p.caption_instagram || null,
    // Facebook publishes this field verbatim. Preserve staff wording and append
    // only shared hashtags not already present; Instagram appends them at dispatch.
    caption_facebook: facebookCaption(p.caption_facebook || p.caption_raw || "", p.hashtags || ""),
    caption_twitter: p.caption_twitter || null,
    hashtags: p.hashtags || null,
    image_url: p.image_url || null,
    platforms: [p.platform],
    schedule_time: p.schedule_time || null,
    status: "draft",
    source: "batch",
    post_type: null,
    post_number: 1,
    campaign_id: null,
  }));

  const { data, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: data.length, logicalPosts: posts.length, posts: data });
}

/** Materialize Facebook's final caption before staff review and fingerprinting. */
function facebookCaption(caption: string, hashtags: string): string {
  const seen = new Set((caption.match(/#[\p{L}\p{N}_]+/gu) || []).map(tag => tag.toLowerCase()));
  const missing = (hashtags.match(/#[\p{L}\p{N}_]+/gu) || []).filter(tag => {
    const normalized = tag.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  return missing.length ? `${caption}${caption.trim() ? "\n\n" : ""}${missing.join(" ")}` : caption;
}
