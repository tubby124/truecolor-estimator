import { requireSocialBusiness, scopeSocialQuery, socialBusinessScopingEnabled } from "@/lib/social/business";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { approvalReset, invalidDraftFields } from "@/lib/social/approval";
import type { CreatePostBody } from "@/lib/types/social";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await scopeSocialQuery(supabase
    .from("social_posts")
    .select(`
      *,
      campaign:social_campaigns (*),
      results:social_post_results (*)
    `)
    .eq("id", id), auth.businessId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null) as Partial<CreatePostBody & { status: string; gbp_post_done: boolean }> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  if (invalidDraftFields(body as Record<string, unknown>)) return NextResponse.json({ error: 'Invalid field types' }, { status: 400 });
  if (body.status && !['draft', 'skip'].includes(body.status)) return NextResponse.json({ error: 'Use explicit approval to schedule a post' }, { status: 400 });

  // Whitelist updatable fields
  const allowed = [
    'caption_raw', 'caption_instagram', 'caption_facebook', 'caption_twitter',
    'hashtags', 'image_url', 'image_urls', 'alt_text', 'platforms', 'schedule_date', 'schedule_time',
    'use_next_free_slot', 'status', 'post_type', 'post_number', 'notes',
    'gbp_post_done', 'error_message',
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = (body as Record<string, unknown>)[key];
    }
  }

  if (socialBusinessScopingEnabled()) {
    for (const key of ['caption_gbp', 'fact_fingerprint', 'product_slug', 'product_configuration', 'offer_id', 'generation_job_id', 'gbp_payload'] as const) {
      if (key in body) updates[key] = body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Any edited legacy draft must pass current approval checks; untouched approvals stay intact.
  if (socialBusinessScopingEnabled()) updates.approval_version = 2;
  const supabase = createServiceClient();
  const { data, error } = await scopeSocialQuery(supabase
    .from("social_posts")
    .update({ ...updates, ...approvalReset, status: body.status === 'skip' ? 'skip' : 'draft' })
    .eq("id", id)
    .in("status", ["draft", "ready", "skip"]), auth.businessId)
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

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: deleted, error } = await scopeSocialQuery(supabase
    .from("social_posts")
    .delete()
    .eq("id", id)
    .in("status", ["draft", "ready", "skip"]), auth.businessId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!deleted?.length) return NextResponse.json({ error: "Post unavailable or delivery already attempted" }, { status: 409 });
  return new NextResponse(null, { status: 204 });
}
