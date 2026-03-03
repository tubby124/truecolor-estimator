import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { SocialCampaign } from "@/lib/types/social";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();

  // Fetch campaigns with post counts via join
  const { data: campaigns, error } = await supabase
    .from("social_campaigns")
    .select(`
      *,
      social_posts (
        id,
        status
      )
    `)
    .order("event_date", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute derived counts
  const enriched = (campaigns ?? []).map((c) => {
    const posts = (c.social_posts as { id: string; status: string }[]) ?? [];
    return {
      ...c,
      social_posts: undefined,
      post_count: posts.length,
      posts_ready: posts.filter((p) => p.status === 'ready').length,
      posts_posted: posts.filter((p) => p.status === 'posted').length,
    } as SocialCampaign & { post_count: number; posts_ready: number; posts_posted: number };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as Partial<SocialCampaign>;

  if (!body.slug || !body.name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("social_campaigns")
    .insert({
      slug: body.slug,
      name: body.name,
      campaign_color: body.campaign_color ?? '#6b7280',
      event_date: body.event_date ?? null,
      build_by: body.build_by ?? null,
      brevo_list_id: body.brevo_list_id ?? null,
      brevo_campaign_ids: body.brevo_campaign_ids ?? [],
      landing_page_slug: body.landing_page_slug ?? null,
      status: body.status ?? 'planned',
      gbp_posts_total: body.gbp_posts_total ?? 2,
      gbp_posts_done: body.gbp_posts_done ?? 0,
      lead_count: body.lead_count ?? 0,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
