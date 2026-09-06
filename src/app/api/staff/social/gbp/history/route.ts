import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSocialBusiness, socialBusinessScopingEnabled } from "@/lib/social/business";
import { connectionRequest, locationParent, readGbpConnection } from "@/lib/gbp/client";
import { expectedGbpIdentity, verifyGbpLocation } from "@/lib/gbp/discovery";
import { fetchGbpHistoryPage, historyRow, refreshRecentOfferInsights } from "@/lib/gbp/history";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: "Google history awaits migration activation" }, { status: 503 });
  const url = new URL(req.url);
  const offset = Number(url.searchParams.get("offset") || 0);
  if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ error: "Invalid history offset" }, { status: 400 });
  const db = createServiceClient();
  const { data: progress, error: progressError } = await db.from("social_gbp_connections").select("history_complete,history_last_read_at,history_next_page_token,location_name").eq("business_id", auth.businessId).maybeSingle();
  if (progressError) return NextResponse.json({ error: "Unable to read Google history progress" }, { status: 500 });
  let query = db.from("social_gbp_history").select("*", { count: "exact" }).eq("business_id", auth.businessId);
  if (progress?.location_name) query = query.eq("location_name", progress.location_name);
  if (url.searchParams.get("offers") !== "false") query = query.eq("topic_type", "OFFER");
  const { data, error, count } = await query.order("provider_created_at", { ascending: false, nullsFirst: false }).order("provider_post_id").range(offset, offset + 19);
  if (error) return NextResponse.json({ error: "Unable to read imported Google history" }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], total: count ?? 0, offset, nextOffset: offset + 20 < (count ?? 0) ? offset + 20 : null, complete: progress?.history_complete ?? false, importedAt: progress?.history_last_read_at ?? null, resumable: !!progress?.history_next_page_token, source: "google-provider-history" });
}

/** One durable page per request, safe to resume after a closed browser or network interruption. */
export async function POST(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: "Google history awaits migration activation" }, { status: 503 });
  try {
    const db = createServiceClient();
    const connection = await readGbpConnection(db, auth.businessId);
    if (!connection) return NextResponse.json({ error: "Connect this business to Google first" }, { status: 409 });
    const parent = locationParent(connection.google_account_name, connection.location_name);
    const request = await connectionRequest(connection);
    await verifyGbpLocation(request, parent, await expectedGbpIdentity(db, auth.businessId));
    const { data: progress, error: progressError } = await db.from("social_gbp_connections").select("history_next_page_token,history_complete").eq("business_id", auth.businessId).single();
    if (progressError) throw new Error("Unable to read import progress");
    const cursor = progress.history_next_page_token as string | null;
    const page = await fetchGbpHistoryPage(request, parent, cursor);
    const now = new Date().toISOString();
    if (page.posts.length) {
      const { error } = await db.from("social_gbp_history").upsert(page.posts.map(post => historyRow(auth.businessId, parent, post, now)), { onConflict: "business_id,provider_post_id" });
      if (error) throw new Error("Unable to persist imported Google posts");
    }
    // CAS prevents concurrent page reads from moving the persisted cursor backwards.
    let save = db.from("social_gbp_connections").update({ history_next_page_token: page.nextPageToken, history_complete: !page.nextPageToken, history_last_read_at: now }).eq("business_id", auth.businessId).eq("location_name", parent);
    save = cursor ? save.eq("history_next_page_token", cursor) : save.is("history_next_page_token", null);
    const { data: saved, error: saveError } = await save.select("business_id");
    if (saveError || !saved?.length) throw new Error("Import progress changed; resume from saved state");
    let insights: { checked: number; available: number } | null = null;
    let warning: string | null = null;
    if (!page.nextPageToken) {
      try { insights = await refreshRecentOfferInsights(db, request, auth.businessId, parent); }
      catch { warning = "History imported; insight availability could not be saved. Outcomes remain unverified."; }
    }
    return NextResponse.json({ imported: page.posts.length, complete: !page.nextPageToken, insights, warning });
  } catch { return NextResponse.json({ error: "Google history import stopped. Saved pages are retained; check connection/API access and resume." }, { status: 502 }); }
}
