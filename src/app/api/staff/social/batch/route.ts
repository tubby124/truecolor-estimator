import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

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
 * Creates multiple social posts in one shot.
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

  const { posts } = body;
  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: "posts array is required" }, { status: 400 });
  }
  if (posts.length > 14) {
    return NextResponse.json({ error: "Max 14 posts per batch" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const rows = posts.map((p) => ({
    caption_raw: p.caption_raw || "",
    caption_instagram: p.caption_instagram || null,
    caption_facebook: p.caption_facebook || null,
    caption_twitter: p.caption_twitter || null,
    hashtags: p.hashtags || null,
    image_url: p.image_url || null,
    platforms: p.platforms ?? ["instagram", "facebook"],
    schedule_time: p.schedule_time || null,
    status: "ready",
    post_type: "batch",
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

  return NextResponse.json({ created: data.length, posts: data });
}
