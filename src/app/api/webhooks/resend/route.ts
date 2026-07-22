/**
 * POST /api/webhooks/resend
 *
 * Resend Webhooks → updates email_log and order_messages delivery outcomes.
 * Captures: sent / delivered / opened / clicked / bounced / complained /
 * delivery_delayed / failed / suppressed.
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

type ResendWebhookTags =
  | Record<string, string>
  | Array<{ name?: string; value?: string }>;

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
    failed?: { reason?: string };
    suppressed?: { type?: string; message?: string };
    tags?: ResendWebhookTags;
  };
}

interface EventUpdates {
  emailLog: Record<string, unknown>;
  orderMessage: Record<string, unknown>;
  allowedStatuses?: string[];
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

  // Status transitions are guarded in the update query so an older webhook
  // cannot overwrite a terminal state that arrived first.
  const supabase = createServiceClient();
  const at = event.created_at ?? new Date().toISOString();
  const detail =
    event.type === "email.bounced"
      ? `${event.data?.bounce?.type ?? "bounce"}: ${(event.data?.bounce?.message ?? "").slice(0, 200)}`
      : event.type === "email.clicked"
      ? `clicked: ${(event.data?.click?.link ?? "").slice(0, 200)}`
      : event.type === "email.failed"
      ? `failed: ${(event.data?.failed?.reason ?? "unknown reason").slice(0, 200)}`
      : event.type === "email.suppressed"
      ? `${event.data?.suppressed?.type ?? "suppressed"}: ${(event.data?.suppressed?.message ?? "").slice(0, 200)}`
      : null;

  const updates = mapEventUpdates(event.type, at, detail ?? event.type);
  if (!updates) {
    return NextResponse.json({ ok: true, skipped: `unhandled type: ${event.type}` });
  }

  let emailLogQuery = supabase
    .from("email_log")
    .update(updates.emailLog)
    .eq("provider_message_id", messageId);
  const taggedOrderMessageId = getOrderMessageId(event.data?.tags);
  let orderMessageQuery = supabase
    .from("order_messages")
    .update({
      ...updates.orderMessage,
      ...(taggedOrderMessageId ? { provider_message_id: messageId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq(taggedOrderMessageId ? "id" : "provider_message_id", taggedOrderMessageId ?? messageId);

  if (updates.allowedStatuses) {
    emailLogQuery = emailLogQuery.in("status", updates.allowedStatuses);
    orderMessageQuery = orderMessageQuery.in("status", updates.allowedStatuses);
  }

  const [{ error: emailLogError }, { error: orderMessageError }] = await Promise.all([
    emailLogQuery,
    orderMessageQuery,
  ]);

  if (emailLogError || orderMessageError) {
    console.error(
      "[resend-webhook] update failed:",
      emailLogError?.message ?? orderMessageError?.message
    );
    return NextResponse.json(
      { ok: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, type: event.type, messageId });
}

function getOrderMessageId(tags: ResendWebhookTags | undefined): string | undefined {
  if (Array.isArray(tags)) {
    return tags.find(
      (tag) => tag.name === "order_message_id" && typeof tag.value === "string"
    )?.value;
  }
  return tags?.order_message_id;
}

export function mapEventUpdates(
  type: string,
  at: string,
  detail: string
): EventUpdates | null {
  const base = { last_event_detail: detail };

  switch (type) {
    case "email.sent":
      return {
        emailLog: { ...base, status: "sent" },
        orderMessage: { ...base, status: "sent", sent_at: at },
        allowedStatuses: ["sending", "pending_confirmation", "sent"],
      };
    case "email.delivered":
      return {
        emailLog: { ...base, status: "delivered", delivered_at: at },
        orderMessage: { ...base, status: "delivered", delivered_at: at },
        allowedStatuses: [
          "sending",
          "pending_confirmation",
          "sent",
          "delivery_delayed",
          "delivered",
        ],
      };
    case "email.opened":
      return {
        emailLog: { ...base, opened_at: at },
        orderMessage: { ...base, opened_at: at },
      };
    case "email.clicked":
      return {
        emailLog: { ...base, clicked_at: at },
        orderMessage: base,
      };
    case "email.bounced":
      return {
        emailLog: { ...base, status: "bounced", bounced_at: at },
        orderMessage: { ...base, status: "bounced", bounced_at: at },
        allowedStatuses: [
          "sending",
          "pending_confirmation",
          "sent",
          "delivery_delayed",
          "bounced",
        ],
      };
    case "email.complained":
      return {
        emailLog: { ...base, status: "complained", complained_at: at },
        orderMessage: { ...base, status: "complained", complained_at: at },
        allowedStatuses: [
          "sending",
          "pending_confirmation",
          "sent",
          "delivery_delayed",
          "delivered",
          "complained",
        ],
      };
    case "email.delivery_delayed":
      return {
        emailLog: { ...base, status: "delivery_delayed", delivery_delayed_at: at },
        orderMessage: { ...base, status: "delivery_delayed", delivery_delayed_at: at },
        allowedStatuses: ["sending", "pending_confirmation", "sent", "delivery_delayed"],
      };
    case "email.failed":
    case "email.suppressed":
      return {
        emailLog: { ...base, status: "failed" },
        orderMessage: { ...base, status: "failed" },
        allowedStatuses: [
          "sending",
          "pending_confirmation",
          "sent",
          "delivery_delayed",
          "failed",
        ],
      };
    default:
      return null;
  }
}
