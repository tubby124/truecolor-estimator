import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import type { CreatePostBody } from "@/lib/types/social";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");       // comma-separated e.g. "draft,ready"
  const campaignId = searchParams.get("campaign_id");
  const from = searchParams.get("from");           // YYYY-MM-DD
  const to = searchParams.get("to");               // YYYY-MM-DD
  const platform = searchParams.get("platform");

  const supabase = createServiceClient();

  let query = supabase
    .from("social_posts")
    .select(`
      *,
      campaign:social_campaigns (
        id, slug, name, campaign_color, event_date, status
      ),
      results:social_post_results (
        id, platform, status, public_url, posted_at
      )
    `)
    .order("schedule_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) {
    const statuses = status.split(",");
    query = query.in("status", statuses);
  }
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }
  if (from) {
    query = query.gte("schedule_date", from);
  }
  if (to) {
    query = query.lte("schedule_date", to);
  }
  if (platform) {
    query = query.contains("platforms", [platform]);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as CreatePostBody;

  if (!body.caption_raw && body.caption_raw !== "") {
    return NextResponse.json({ error: "caption_raw is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      campaign_id: body.campaign_id ?? null,
      caption_raw: body.caption_raw,
      caption_instagram: body.caption_instagram ?? null,
      caption_facebook: body.caption_facebook ?? null,
      caption_twitter: body.caption_twitter ?? null,
      hashtags: body.hashtags ?? null,
      image_url: body.image_url ?? null,
      platforms: body.platforms ?? ['instagram', 'facebook'],
      schedule_date: body.schedule_date ?? null,
      schedule_time: body.schedule_time ?? null,
      use_next_free_slot: body.use_next_free_slot ?? false,
      status: body.status ?? 'draft',
      post_type: body.post_type ?? null,
      post_number: body.post_number ?? null,
      notes: body.notes ?? null,
    })
    .select(`
      *,
      campaign:social_campaigns (
        id, slug, name, campaign_color
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
