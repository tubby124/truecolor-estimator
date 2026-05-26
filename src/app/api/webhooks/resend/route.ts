/**
 * POST /api/webhooks/resend
 *
 * Resend Webhooks → updates email_log rows with delivery outcomes.
 * Captures: delivered / opened / clicked / bounced / complained / delivery_delayed.
 *
 * Auth: Svix HMAC-SHA256 (Resend's native signing mechanism).
 *   RESEND_WEBHOOK_SECRET = the whsec_... value from Resend dashboard.
 *   Verifies svix-id / svix-timestamp / svix-signature headers.
 *   Rejects payloads older than 5 minutes (replay protection).
 *
 * Fail-closed: missing env var → 503. Bad signature → 401.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
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

function verifySvixSignature(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Svix verification: HMAC-SHA256(msgId.timestamp.body, base64decoded(secret))
  const rawSecret = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "base64");

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const expected = createHmac("sha256", rawSecret).update(signedContent).digest("base64");

  // svix-signature may contain multiple sigs: "v1,<b64> v1,<b64>"
  const sigs = svixSignature.split(" ").filter((s) => s.startsWith("v1,")).map((s) => s.slice(3));
  return sigs.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, "base64");
      const expBuf = Buffer.from(expected, "base64");
      return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 401 });
  }

  // Replay protection: reject payloads older than 5 minutes
  const tsMs = parseInt(svixTimestamp, 10) * 1000;
  if (isNaN(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Timestamp out of tolerance" }, { status: 401 });
  }

  if (!verifySvixSignature(bodyText, svixId, svixTimestamp, svixSignature, secret)) {
    console.warn("[resend-webhook] Invalid Svix signature — possible spoofing attempt");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(bodyText) as ResendWebhookEvent;
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
