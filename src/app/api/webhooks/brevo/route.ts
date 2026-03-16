/**
 * POST /api/webhooks/brevo
 *
 * Receives Brevo transactional/campaign email events and updates the blitz
 * observability tables (tc_leads, tc_email_sends) with open/click/bounce/
 * unsubscribe signals.
 *
 * Only processes events tagged "industry-blitz" — all other Brevo emails
 * (order confirmations, review requests, etc.) are silently ignored.
 *
 * Setup: Webhook registered in Brevo with Bearer token auth.
 * URL: https://truecolorprinting.ca/api/webhooks/brevo
 * Events: opened, click, unsubscribed, spam, hardBounce
 *
 * Auth: Bearer token in Authorization header (set via Brevo webhook auth config)
 * Env var: BREVO_WEBHOOK_SECRET — must match token registered in Brevo
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[brevo-webhook] BREVO_WEBHOOK_SECRET not set — rejecting");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let tokenMatch = false;
  try {
    tokenMatch =
      token.length === secret.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    tokenMatch = false;
  }

  if (!tokenMatch) {
    console.warn("[brevo-webhook] Bearer token mismatch — rejecting");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rawBody = await req.text();

  let events: unknown[];
  try {
    const parsed = JSON.parse(rawBody);
    events = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.error("[brevo-webhook] Invalid JSON body");
    return new NextResponse("Bad Request", { status: 400 });
  }

  const supabase = createServiceClient();

  for (const raw of events) {
    const event = raw as Record<string, unknown>;
    const eventType = event.event as string;
    const messageId = event["message-id"] as string | undefined;
    const tags = (event.tags as string[] | undefined) ?? [];

    // Only process blitz emails — ignore order confirmations, review requests etc.
    if (!tags.includes("industry-blitz")) {
      continue;
    }

    if (!messageId) {
      console.warn(
        "[brevo-webhook] Event missing message-id, skipping",
        eventType
      );
      continue;
    }

    const now = new Date().toISOString();

    console.log(
      `[brevo-webhook] Processing event: ${eventType} messageId: ${messageId}`
    );

    if (eventType === "opened") {
      // Mark the send record as opened
      await supabase
        .from("tc_email_sends")
        .update({ opened_at: now, status: "opened" })
        .eq("brevo_message_id", messageId)
        .eq("status", "sent");

      // Fetch lead_id from the send record, then increment engagement counters
      const { data: sendRecord } = await supabase
        .from("tc_email_sends")
        .select("lead_id")
        .eq("brevo_message_id", messageId)
        .maybeSingle();

      if (sendRecord?.lead_id) {
        const { data: lead } = await supabase
          .from("tc_leads")
          .select("emails_opened")
          .eq("id", sendRecord.lead_id)
          .single();
        if (lead) {
          await supabase
            .from("tc_leads")
            .update({
              emails_opened: (lead.emails_opened ?? 0) + 1,
              last_opened_at: now,
            })
            .eq("id", sendRecord.lead_id);
        }
      }
    } else if (eventType === "click") {
      // Mark the send record as clicked
      await supabase
        .from("tc_email_sends")
        .update({ clicked_at: now, status: "clicked" })
        .eq("brevo_message_id", messageId);

      // Fetch lead_id from the send record, then increment click counters
      const { data: sendRecord } = await supabase
        .from("tc_email_sends")
        .select("lead_id")
        .eq("brevo_message_id", messageId)
        .maybeSingle();

      if (sendRecord?.lead_id) {
        const { data: lead } = await supabase
          .from("tc_leads")
          .select("emails_clicked")
          .eq("id", sendRecord.lead_id)
          .single();
        if (lead) {
          await supabase
            .from("tc_leads")
            .update({
              emails_clicked: (lead.emails_clicked ?? 0) + 1,
              last_clicked_at: now,
            })
            .eq("id", sendRecord.lead_id);
        }
      }
    } else if (eventType === "unsubscribed" || eventType === "spam") {
      const email = event.email as string | undefined;
      if (email) {
        await supabase
          .from("tc_leads")
          .update({
            drip_status: "unsubscribed",
            unsubscribed_at: now,
            next_email_at: null,
          })
          .eq("email", email);
        console.log(`[brevo-webhook] Unsubscribed/spam: ${email}`);
      }
    } else if (eventType === "hardBounce") {
      const email = event.email as string | undefined;
      if (email) {
        await supabase
          .from("tc_leads")
          .update({ drip_status: "bounced" })
          .eq("email", email);
        console.log(`[brevo-webhook] Hard bounce: ${email}`);
      }
    }
  }

  // Always return 200 — Brevo retries on non-200
  return new NextResponse("OK", { status: 200 });
}
