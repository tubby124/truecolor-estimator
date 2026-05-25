/**
 * Reply → suppress loop for the industry-blitz cold drip.
 *
 * Closes the gap where a lead replied in plain English (opt-out, decline, or
 * interest) but the n8n drip kept cold-emailing them because nothing wrote the
 * reply back to tc_leads. (See campaign-cleanup-log.md — Caelia sat queued 7
 * days after "please stop contacting me".)
 *
 * For each inbound reply matched to a blitz lead:
 *   - "optout" → drip_status=unsubscribed, suppression_reason=replied_optout,
 *                next_email_at=null  +  Brevo blacklist
 *   - "reply"  → drip_status=paused, suppression_reason=replied_warm,
 *                next_email_at=null  +  Telegram alert for human follow-up
 *
 * Both set suppression_reason, which the v2 drip engine already honours
 * (skips any lead with suppression_reason set), so sends stop immediately.
 *
 * Idempotent: a lead already in the target terminal state is skipped, so
 * re-runs over an overlapping time window don't double-act or re-alert.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { listRecentReplies, type InboundReply } from "./gmail-replies";
import { classifyReply, type ReplyClass } from "./classify-reply";

interface LeadRow {
  id: string;
  email: string | null;
  business_name: string | null;
  drip_status: string | null;
  suppression_reason: string | null;
}

export interface ProcessResult {
  scanned: number;
  matched: number;
  removed: { email: string; business: string | null; brevo: number | "skipped" }[];
  paused: { email: string; business: string | null }[];
  skipped: { email: string; reason: string }[];
  dryRun: boolean;
}

async function brevoBlacklist(email: string): Promise<number> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return 0;
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ emailBlacklisted: true }),
    }
  );
  return res.status;
}

/** Keep only the most recent reply per sender. */
function latestPerSender(replies: InboundReply[]): Map<string, InboundReply> {
  const map = new Map<string, InboundReply>();
  for (const r of replies) {
    if (!r.fromEmail) continue;
    const prev = map.get(r.fromEmail);
    if (!prev || r.internalDate > prev.internalDate) map.set(r.fromEmail, r);
  }
  return map;
}

export async function processBlitzReplies(opts: {
  hours: number;
  dryRun: boolean;
}): Promise<ProcessResult> {
  const { hours, dryRun } = opts;
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const replies = await listRecentReplies(hours);
  const bySender = latestPerSender(replies);

  const result: ProcessResult = {
    scanned: replies.length,
    matched: 0,
    removed: [],
    paused: [],
    skipped: [],
    dryRun,
  };

  for (const [email, reply] of bySender) {
    // Match to a blitz lead. Non-leads (random customers) never match → untouched.
    const { data: leads } = await supabase
      .from("tc_leads")
      .select("id, email, business_name, drip_status, suppression_reason")
      .eq("email", email);

    const matched = (leads ?? []) as LeadRow[];
    if (matched.length === 0) {
      result.skipped.push({ email, reason: "not a blitz lead" });
      continue;
    }
    result.matched += 1;

    const klass: ReplyClass = classifyReply(reply.bodyText, reply.subject);
    const business = matched[0].business_name;

    if (klass === "optout") {
      // Skip if every matched row is already unsubscribed.
      if (matched.every((l) => l.drip_status === "unsubscribed")) {
        result.skipped.push({ email, reason: "already unsubscribed" });
        continue;
      }
      if (dryRun) {
        result.removed.push({ email, business, brevo: "skipped" });
        continue;
      }
      await supabase
        .from("tc_leads")
        .update({
          drip_status: "unsubscribed",
          suppression_reason: "replied_optout",
          unsubscribed_at: now,
          next_email_at: null,
        })
        .eq("email", email);
      const brevo = await brevoBlacklist(email);
      result.removed.push({ email, business, brevo });
    } else {
      // "reply" → pause cold drip, ping a human. Skip if already handled.
      const alreadyHandled = matched.every(
        (l) =>
          l.suppression_reason === "replied_warm" ||
          l.suppression_reason === "replied_optout" ||
          l.drip_status === "unsubscribed"
      );
      if (alreadyHandled) {
        result.skipped.push({ email, reason: "reply already handled" });
        continue;
      }
      if (dryRun) {
        result.paused.push({ email, business });
        continue;
      }
      await supabase
        .from("tc_leads")
        .update({
          drip_status: "paused",
          suppression_reason: "replied_warm",
          next_email_at: null,
        })
        .eq("email", email);
      result.paused.push({ email, business });

      const preview = reply.bodyText.slice(0, 300);
      await sendTelegramNotification(
        `📨 <b>Blitz reply — needs a human</b>\n` +
          `<b>${escapeTelegramHtml(business ?? email)}</b> (${escapeTelegramHtml(email)})\n` +
          `Subject: ${escapeTelegramHtml(reply.subject)}\n\n` +
          `${escapeTelegramHtml(preview)}\n\n` +
          `Cold drip paused. Reply from info@true-color.ca.`
      );
    }
  }

  return result;
}
