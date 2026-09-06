import type { SupabaseClient } from "@supabase/supabase-js";
import type { SocialPost } from "@/lib/types/social";
import type { PlatformPublishResult } from "@/lib/social/meta";
import { socialBusinessScopingEnabled } from "@/lib/social/business";
import { connectionRequest, GbpApiError, type GbpRequest, localPostName, locationParent, readGbpConnection } from "./client";
import { expectedGbpIdentity, verifyGbpLocation } from "./discovery";
import { GBP_SCOPE, gbpConfigured } from "./oauth";

export interface GbpDate { year: number; month: number; day: number }
export interface GbpTime { hours: number; minutes: number; seconds?: number; nanos?: number }
export interface GbpPostPayload {
  topicType: "STANDARD" | "OFFER";
  languageCode?: string;
  callToAction?: { actionType: "LEARN_MORE"; url: string };
  event?: { title: string; schedule: { startDate: GbpDate; endDate: GbpDate; startTime?: GbpTime; endTime?: GbpTime } };
  offer?: { couponCode?: string; redeemOnlineUrl?: string; termsConditions?: string };
}
export type GbpPublishPost = SocialPost & { business_id?: string | null; caption_gbp?: string | null; gbp_payload?: GbpPostPayload | null };
export type GoogleLocalPost = { name?: string; topicType?: string; summary?: string; createTime?: string; updateTime?: string; state?: string; media?: unknown[]; searchUrl?: string; event?: unknown; offer?: unknown };

function httpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Google posts require HTTPS URLs");
  return value;
}
function validDate(value: GbpDate) {
  if (!value || !Number.isInteger(value.year) || value.year < 2000 || value.year > 9999 || !Number.isInteger(value.month) || !Number.isInteger(value.day)) throw new Error("Offer needs real start and end dates");
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  if (date.getUTCFullYear() !== value.year || date.getUTCMonth() + 1 !== value.month || date.getUTCDate() !== value.day) throw new Error("Offer date is invalid");
  return date.getTime();
}
function validTime(value: GbpTime | undefined, end: boolean): GbpTime {
  const time = value ?? { hours: end ? 23 : 0, minutes: end ? 59 : 0, seconds: end ? 59 : 0 };
  if (!Number.isInteger(time.hours) || !Number.isInteger(time.minutes)) throw new Error("Offer time requires hours and minutes");
  for (const [key, max] of [["hours", 23], ["minutes", 59], ["seconds", 59], ["nanos", 999999999]] as const) {
    const n = time[key] ?? 0;
    if (!Number.isInteger(n) || n < 0 || n > max) throw new Error("Offer time is invalid");
  }
  return time;
}
function seconds(time: GbpTime) { return time.hours * 3600 + time.minutes * 60 + (time.seconds ?? 0); }

/** All figures and terms are already reviewed data. No AI or inferred discount/expiry. */
export function buildGbpPost(post: GbpPublishPost) {
  const payload = post.gbp_payload ?? { topicType: "STANDARD" as const };
  const summary = (post.caption_gbp || post.caption_raw || "").trim();
  if (!summary || summary.length > 1500) throw new Error("Google post requires a caption of at most 1,500 characters");
  const urls = post.image_urls?.length ? post.image_urls : post.image_url ? [post.image_url] : [];
  if (urls.length !== 1) throw new Error("Google approval requires exactly one reviewed photo");
  if (/\.(mp4|mov|webm|m4v)(?:[?#]|$)/i.test(urls[0])) throw new Error("Google publishing currently supports a reviewed photo only");
  const base = { topicType: payload.topicType, languageCode: payload.languageCode || "en-CA", summary, media: [{ mediaFormat: "PHOTO", sourceUrl: httpsUrl(urls[0]) }] };
  if (payload.topicType === "STANDARD") {
    if (payload.event || payload.offer) throw new Error("Ordinary promotions must not include invented offer dates or terms");
    if (payload.callToAction && payload.callToAction.actionType !== "LEARN_MORE") throw new Error("Unsupported Google call to action");
    return { ...base, ...(payload.callToAction ? { callToAction: { actionType: "LEARN_MORE", url: httpsUrl(payload.callToAction.url) } } : {}) };
  }
  if (payload.topicType !== "OFFER" || !payload.event?.title?.trim() || !payload.event.schedule || !payload.offer?.redeemOnlineUrl || !payload.offer.termsConditions?.trim()) throw new Error("Google OFFER needs a title, real dates, redemption URL and reviewed terms");
  if (payload.callToAction) throw new Error("Google OFFER uses offer redemption fields, not a generic call to action");
  const schedule = payload.event.schedule;
  const start = validDate(schedule.startDate), end = validDate(schedule.endDate);
  const startTime = validTime(schedule.startTime, false), endTime = validTime(schedule.endTime, true);
  if (end + seconds(endTime) * 1000 < start + seconds(startTime) * 1000) throw new Error("Offer end precedes its start");
  return { ...base, event: { title: payload.event.title.trim(), schedule: { startDate: schedule.startDate, startTime, endDate: schedule.endDate, endTime } }, offer: { ...payload.offer, redeemOnlineUrl: httpsUrl(payload.offer.redeemOnlineUrl) } };
}

export async function getGbpTarget(db: SupabaseClient, businessId: string) {
  if (!socialBusinessScopingEnabled() || !gbpConfigured()) return null;
  const connection = await readGbpConnection(db, businessId);
  if (!connection || connection.token_key_version !== 2 || !connection.scopes.includes(GBP_SCOPE)) return null;
  return { platform: "gbp" as const, accountId: connection.google_account_name, pageId: locationParent(connection.google_account_name, connection.location_name) };
}

export function resultFromGbpPost(parent: string, result: GoogleLocalPost): PlatformPublishResult {
  let name: string | undefined;
  try { if (result.name) name = localPostName(parent, result.name); } catch { /* A mismatched receipt is uncertain, never success. */ }
  if (!name) return { platform: "gbp", status: "in-progress", errorMessage: "Google response omitted a valid post ID; manually reconcile before any retry" };
  if (result.state === "LIVE") return { platform: "gbp", status: "published", submissionId: name, publicUrl: result.searchUrl };
  if (result.state === "REJECTED") return { platform: "gbp", status: "failed", submissionId: name, errorMessage: "Google rejected this post; review the existing provider post before changing content" };
  return { platform: "gbp", status: "in-progress", submissionId: name, errorMessage: `Google post is ${result.state || "unconfirmed"}; hold for read-only reconciliation, do not create another post` };
}

/** Deliberately exactly one create call. Caller holds all uncertain outcomes. */
export async function dispatchGbpPost(request: GbpRequest, parent: string, payload: ReturnType<typeof buildGbpPost>): Promise<PlatformPublishResult> {
  try {
    const result = await request<GoogleLocalPost>(`https://mybusiness.googleapis.com/v4/${parent}/localPosts`, { method: "POST", body: payload });
    return resultFromGbpPost(parent, result);
  } catch (error) {
    if (error instanceof GbpApiError && error.status !== null && error.status >= 400 && error.status < 500 && ![408, 409, 429].includes(error.status)) return { platform: "gbp", status: "failed", errorMessage: `Google rejected the request (HTTP ${error.status}); review configuration or content` };
    return { platform: "gbp", status: "in-progress", errorMessage: "Google create outcome is uncertain; inspect live history before any retry" };
  }
}

export async function publishGbpPost(db: SupabaseClient, post: GbpPublishPost): Promise<PlatformPublishResult> {
  try {
    if (!socialBusinessScopingEnabled() || !post.business_id) throw new Error("Business-scoped Google publishing is not enabled");
    const payload = buildGbpPost(post);
    const target = await getGbpTarget(db, post.business_id);
    if (!target || !post.approval_target || post.approval_target.platform !== "gbp" || post.approval_target.accountId !== target.accountId || post.approval_target.pageId !== target.pageId) throw new Error("Google target is missing or differs from the approved target");
    const connection = await readGbpConnection(db, post.business_id);
    if (!connection) throw new Error("Google connection missing");
    const request = await connectionRequest(connection);
    await verifyGbpLocation(request, target.pageId, await expectedGbpIdentity(db, post.business_id));
    return await dispatchGbpPost(request, target.pageId, payload);
  } catch (error) {
    return { platform: "gbp", status: "failed", errorMessage: error instanceof GbpApiError ? error.message : error instanceof Error ? error.message : "Google preflight failed" };
  }
}

/** Read an already-created provider post. This helper cannot publish or retry it. */
export async function reconcileGbpPost(db: SupabaseClient, businessId: string, providerPostId: string): Promise<PlatformPublishResult> {
  const held: PlatformPublishResult = { platform: "gbp", status: "in-progress", submissionId: providerPostId, errorMessage: "Google existing-post read could not confirm the outcome; retain the hold, do not create again" };
  if (!socialBusinessScopingEnabled()) return held;
  try {
    const connection = await readGbpConnection(db, businessId);
    if (!connection) return held;
    const parent = locationParent(connection.google_account_name, connection.location_name);
    const name = localPostName(parent, providerPostId);
    const request = await connectionRequest(connection);
    const result = await request<GoogleLocalPost>(`https://mybusiness.googleapis.com/v4/${name}`);
    return resultFromGbpPost(parent, result);
  } catch { return held; }
}
