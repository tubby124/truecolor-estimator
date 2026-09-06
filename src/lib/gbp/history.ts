import type { SupabaseClient } from "@supabase/supabase-js";
import { type GbpRequest, localPostName } from "./client";
import type { GoogleLocalPost } from "./publisher";

export async function fetchGbpHistoryPage(request: GbpRequest, parent: string, cursor?: string | null) {
  const url = new URL(`https://mybusiness.googleapis.com/v4/${parent}/localPosts`);
  url.searchParams.set("pageSize", "100");
  if (cursor) url.searchParams.set("pageToken", cursor);
  const response = await request<{ localPosts?: GoogleLocalPost[]; nextPageToken?: string }>(url.toString());
  if (response.nextPageToken && response.nextPageToken === cursor) throw new Error("Google repeated the history pagination cursor");
  return { posts: response.localPosts ?? [], nextPageToken: response.nextPageToken || null };
}

export function historyRow(businessId: string, parent: string, post: GoogleLocalPost, readAt: string) {
  if (!post.name) throw new Error("Google history post has no provider ID");
  return {
    business_id: businessId, provider_post_id: localPostName(parent, post.name), location_name: parent,
    topic_type: post.topicType || "UNKNOWN", summary: post.summary || "", provider_created_at: post.createTime || null,
    provider_updated_at: post.updateTime || null, provider_state: post.state || "UNKNOWN", media: post.media ?? [],
    event: post.event ?? null, offer: post.offer ?? null, public_url: post.searchUrl ?? null, read_at: readAt,
  };
}

export interface InsightResult { status: "available" | "unavailable"; values: unknown[] | null; error: string | null }
/** Google sunset the post-insights endpoint on 2023-02-20 with no replacement.
 * Reference: https://developers.google.com/my-business/content/sunset-dates
 * Do not call the retired API or substitute business-level metrics for post performance.
 */
export async function fetchGbpInsights(_request: GbpRequest, parent: string, names: string[]): Promise<Map<string, InsightResult>> {
  const outcomes = new Map<string, InsightResult>();
  for (const name of names) {
    localPostName(parent, name);
    outcomes.set(name, { status: "unavailable", values: null, error: "Google discontinued per-post insights on 2023-02-20 with no replacement. Unavailable is not zero or evidence of failure." });
  }
  return outcomes;
}

export async function refreshRecentOfferInsights(db: SupabaseClient, request: GbpRequest, businessId: string, parent: string) {
  const { data, error } = await db.from("social_gbp_history").select("provider_post_id").eq("business_id", businessId).eq("location_name", parent).eq("topic_type", "OFFER").order("provider_created_at", { ascending: false, nullsFirst: false }).order("provider_post_id").limit(20);
  if (error) throw new Error("Unable to read recent Google offers");
  const now = new Date();
  const outcomes = await fetchGbpInsights(request, parent, (data ?? []).map(row => row.provider_post_id));
  for (const [name, result] of outcomes) {
    const { error: saveError } = await db.from("social_gbp_history").update({ insights: result.values, insights_status: result.status, insights_error: result.error, insights_read_at: now.toISOString() }).eq("business_id", businessId).eq("provider_post_id", name);
    if (saveError) throw new Error("Unable to store Google insight availability");
  }
  return { checked: outcomes.size, available: [...outcomes.values()].filter(result => result.status === "available").length };
}
