import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import type { CreatePostBody } from "@/lib/types/social";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("social_posts")
    .select(`
      *,
      campaign:social_campaigns (*),
      results:social_post_results (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json() as Partial<CreatePostBody & { status: string; gbp_post_done: boolean }>;

  // Whitelist updatable fields
  const allowed = [
    'caption_raw', 'caption_instagram', 'caption_facebook', 'caption_twitter',
    'hashtags', 'image_url', 'platforms', 'schedule_date', 'schedule_time',
    'use_next_free_slot', 'status', 'post_type', 'post_number', 'notes',
    'gbp_post_done', 'error_message',
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = (body as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("social_posts")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      campaign:social_campaigns (id, slug, name, campaign_color)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
