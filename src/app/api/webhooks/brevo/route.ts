/**
 * POST /api/webhooks/brevo
 *
 * Receives Brevo transactional/campaign email events and updates the blitz
 * observability tables (tc_leads, tc_email_sends) with open/click/bounce/
 * unsubscribe signals.
 *
 * Two email tracks are supported:
 *
 * 1. n8n drip track (tag: "industry-blitz")
 *    - Events matched via message-id → tc_email_sends → tc_leads
 *    - Agriculture canary + future n8n-enrolled niches
 *
 * 2. Brevo HTML track (tag: "brevo-html-blitz")
 *    - Events matched directly by email → tc_leads
 *    - Healthcare, Construction, Retail, Sports, Events, Nonprofits, Real Estate
 *    - REQUIRED: add tag "brevo-html-blitz" to each HTML campaign template in Brevo UI
 *
 * All other Brevo emails (order confirmations, review requests) are silently ignored.
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
    const email = (event.email as string | undefined)?.toLowerCase();
    const tags = (event.tags as string[] | undefined) ?? [];

    const isBlitzDrip = tags.includes("industry-blitz");
    const isHtmlBlitz = tags.includes("brevo-html-blitz");

    // Only process events from known blitz tracks
    if (!isBlitzDrip && !isHtmlBlitz) {
      continue;
    }

    const now = new Date().toISOString();

    console.log(
      `[brevo-webhook] Processing event: ${eventType} track: ${isBlitzDrip ? "n8n-drip" : "html"} messageId: ${messageId ?? "—"} email: ${email ?? "—"}`
    );

    if (eventType === "opened") {
      if (isBlitzDrip && messageId) {
        // n8n drip track: match via message-id → tc_email_sends → tc_leads
        await supabase
          .from("tc_email_sends")
          .update({ opened_at: now, status: "opened" })
          .eq("brevo_message_id", messageId)
          .eq("status", "sent");

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
            // Upgrade engagement_state: none → opened (never downgrade)
            await supabase
              .from("tc_leads")
              .update({ engagement_state: "opened" })
              .eq("id", sendRecord.lead_id)
              .eq("engagement_state", "none");
          }
        }
      } else if (isHtmlBlitz && email) {
        // HTML track: match directly by email
        const { data: lead } = await supabase
          .from("tc_leads")
          .select("id, emails_opened")
          .eq("email", email)
          .maybeSingle();
        if (lead) {
          await supabase
            .from("tc_leads")
            .update({
              emails_opened: (lead.emails_opened ?? 0) + 1,
              last_opened_at: now,
            })
            .eq("id", lead.id);
          // Upgrade engagement_state: none → opened (never downgrade)
          await supabase
            .from("tc_leads")
            .update({ engagement_state: "opened" })
            .eq("id", lead.id)
            .eq("engagement_state", "none");
        }
      }
    } else if (eventType === "click") {
      if (isBlitzDrip && messageId) {
        // n8n drip track: match via message-id → tc_email_sends → tc_leads
        await supabase
          .from("tc_email_sends")
          .update({ clicked_at: now, status: "clicked" })
          .eq("brevo_message_id", messageId);

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
            // Upgrade engagement_state: none|opened → clicked (never downgrade)
            await supabase
              .from("tc_leads")
              .update({ engagement_state: "clicked" })
              .eq("id", sendRecord.lead_id)
              .in("engagement_state", ["none", "opened"]);
          }
        }
      } else if (isHtmlBlitz && email) {
        // HTML track: match directly by email
        const { data: lead } = await supabase
          .from("tc_leads")
          .select("id, emails_clicked")
          .eq("email", email)
          .maybeSingle();
        if (lead) {
          await supabase
            .from("tc_leads")
            .update({
              emails_clicked: (lead.emails_clicked ?? 0) + 1,
              last_clicked_at: now,
            })
            .eq("id", lead.id);
          // Upgrade engagement_state: none|opened → clicked (never downgrade)
          await supabase
            .from("tc_leads")
            .update({ engagement_state: "clicked" })
            .eq("id", lead.id)
            .in("engagement_state", ["none", "opened"]);
        }
      }
    } else if (eventType === "unsubscribed" || eventType === "spam") {
      // Both tracks: match by email
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
      // Both tracks: match by email
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
