/**
 * POST /api/webhooks/resend
 *
 * Resend Webhooks → updates email_log rows with delivery outcomes.
 * Captures: delivered / opened / clicked / bounced / complained / delivery_delayed.
 *
 * Today email_log only knows status="sent" because we log on POST success. The
 * webhook closes the loop — bounces, blocks, complaints, opens, clicks all
 * become visible on /staff/lifecycle.
 *
 * Auth: Resend signs webhooks with a shared secret via the Svix headers
 *   (svix-id, svix-timestamp, svix-signature). For simplicity v1 we verify a
 *   simple Bearer token via Authorization header (Resend supports custom
 *   headers on webhook config). Set RESEND_WEBHOOK_SECRET in Railway, then
 *   configure the matching header in Resend dashboard.
 *
 * Fail-closed: missing env var → 503. Bad token → 401.
 *
 * Wire-up:
 *   Resend Dashboard → Webhooks → Add Endpoint
 *     URL:       https://truecolorprinting.ca/api/webhooks/resend
 *     Events:    email.delivered, email.opened, email.clicked,
 *                email.bounced, email.complained, email.delivery_delayed
 *     Headers:   Authorization: Bearer <RESEND_WEBHOOK_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    bounce?: { type?: string; message?: string };
    click?: { link?: string };
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = (await req.json()) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageId = event.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ ok: true, skipped: "no email_id" });
  }

  // Map event.type → email_log column + status
  const supabase = createServiceClient();
  const at = event.created_at ?? new Date().toISOString();
  const detail =
    event.type === "email.bounced"
      ? `${event.data?.bounce?.type ?? "bounce"}: ${(event.data?.bounce?.message ?? "").slice(0, 200)}`
      : event.type === "email.clicked"
      ? `clicked: ${(event.data?.click?.link ?? "").slice(0, 200)}`
      : null;

  const updates: Record<string, unknown> = { last_event_detail: detail ?? event.type };
  let newStatus: string | null = null;
  switch (event.type) {
    case "email.delivered":         updates.delivered_at = at; newStatus = "delivered"; break;
    case "email.opened":            updates.opened_at = at; break;
    case "email.clicked":           updates.clicked_at = at; break;
    case "email.bounced":           updates.bounced_at = at; newStatus = "bounced"; break;
    case "email.complained":        updates.complained_at = at; newStatus = "complained"; break;
    case "email.delivery_delayed":  updates.delivery_delayed_at = at; newStatus = "delivery_delayed"; break;
    default:
      return NextResponse.json({ ok: true, skipped: `unhandled type: ${event.type}` });
  }
  if (newStatus) updates.status = newStatus;

  const { error } = await supabase
    .from("email_log")
    .update(updates)
    .eq("provider_message_id", messageId);

  if (error) {
    console.error("[resend-webhook] update failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type: event.type, messageId });
}
