import { requireSocialBusiness, scopeSocialQuery, socialBusinessFields, socialBusinessScopingEnabled } from "@/lib/social/business";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { decorateIntakeQueuePosts } from "@/lib/social/intake/queue-preview";
import { invalidDraftFields } from "@/lib/social/approval";
import type { CreatePostBody } from "@/lib/types/social";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");       // comma-separated e.g. "draft,ready"
  const campaignId = searchParams.get("campaign_id");
  const from = searchParams.get("from");           // YYYY-MM-DD
  const to = searchParams.get("to");               // YYYY-MM-DD
  const platform = searchParams.get("platform");
  const limit = Number(searchParams.get("limit") ?? 200);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) return NextResponse.json({ error: "Invalid page size" }, { status: 400 });

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

  query = scopeSocialQuery(query, auth.businessId);

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

  const { data, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await decorateIntakeQueuePosts(data ?? [], auth.businessId, supabase), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null) as CreatePostBody | null;

  if (!body || typeof body.caption_raw !== "string" || invalidDraftFields(body as unknown as Record<string, unknown>)) {
    return NextResponse.json({ error: "caption_raw is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (body.campaign_id) {
    const campaign = await scopeSocialQuery(supabase.from("social_campaigns").select("id").eq("id", body.campaign_id), auth.businessId).maybeSingle();
    if (campaign.error || !campaign.data) return NextResponse.json({ error: "Campaign unavailable" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      ...socialBusinessFields(auth.businessId),
      ...(socialBusinessScopingEnabled() ? { approval_version: 2, caption_gbp: body.caption_gbp ?? null, fact_fingerprint: body.fact_fingerprint ?? null, product_slug: body.product_slug ?? null, product_configuration: body.product_configuration ?? null, offer_id: body.offer_id ?? null, generation_job_id: body.generation_job_id ?? null, gbp_payload: body.gbp_payload ?? null } : {}),
      campaign_id: body.campaign_id ?? null,
      caption_raw: body.caption_raw,
      caption_instagram: body.caption_instagram ?? null,
      caption_facebook: body.caption_facebook ?? null,
      caption_twitter: body.caption_twitter ?? null,
      hashtags: body.hashtags ?? null,
      image_url: body.image_url ?? (body.image_urls?.[0] ?? null),
      image_urls: body.image_urls ?? [],
      source: body.source ?? 'manual',
      alt_text: body.alt_text ?? null,
      platforms: body.platforms ?? ['instagram', 'facebook'],
      schedule_date: body.schedule_date ?? null,
      schedule_time: body.schedule_time ?? null,
      use_next_free_slot: body.use_next_free_slot ?? false,
      status: 'draft',
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
