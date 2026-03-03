import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/staff/social/posts/[id]/publish
 *
 * Marks a post as "ready" for n8n to pick up.
 * If BLOTATO_API_KEY is set, can also trigger immediate posting (future).
 * For now: validates the post, flips status to "ready".
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

  // If already posted or posting, reject
  if (post.status === 'posted' || post.status === 'posting') {
    return NextResponse.json({ error: `Post is already ${post.status}` }, { status: 409 });
  }

  // Blotato not yet connected — mark as ready for n8n to pick up
  const blotatoKey = process.env.BLOTATO_API_KEY;
  if (!blotatoKey) {
    // Mark as ready — n8n will pick this up on next 15-min cycle
    const { data, error } = await supabase
      .from("social_posts")
      .update({ status: 'ready' })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ...data,
      _message: "Post marked as ready. Connect Blotato API key to enable direct publishing.",
    });
  }

  // === BLOTATO DIRECT PUBLISH (when API key is set) ===
  // TODO: implement when owner provides BLOTATO_API_KEY
  // For now: mark ready and let n8n handle it
  const { data, error } = await supabase
    .from("social_posts")
    .update({ status: 'ready' })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
