/**
 * Reply → suppress loop for the industry-blitz cold drip.
 *
 * Closes the gap where a lead replied in plain English (opt-out, decline, or
 * interest) but the n8n drip kept cold-emailing them because nothing wrote the
 * reply back to tc_leads. (See campaign-cleanup-log.md — Caelia sat queued 7
 * days after "please stop contacting me".)
 *
 * Three tiers, escalating (a lead's recorded state never downgrades):
 *   reply   (rank 1) → drip_status=paused,        suppression_reason=replied_warm    + Telegram alert
 *   decline (rank 2) → drip_status=unsubscribed,   suppression_reason=replied_decline (no blacklist, no alert)
 *   optout  (rank 3) → drip_status=unsubscribed,   suppression_reason=replied_optout  + Brevo blacklist
 *
 * suppression_reason is the field the v2 drip engine already honours (it skips
 * any lead with it set), so sends stop immediately. Idempotent: we only act when
 * the new tier outranks the lead's current recorded tier, so overlapping re-runs
 * don't double-act or re-alert, and escalation (warm → optout) still fires.
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
  declined: { email: string; business: string | null }[];
  paused: { email: string; business: string | null }[];
  skipped: { email: string; reason: string }[];
  dryRun: boolean;
}

const RANK: Record<ReplyClass, number> = { reply: 1, decline: 2, optout: 3 };
const REASON_RANK: Record<string, number> = {
  replied_warm: 1,
  replied_decline: 2,
  replied_optout: 3,
};

async function brevoBlacklist(email: string): Promise<number> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return 0;
  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ emailBlacklisted: true }),
  });
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
    declined: [],
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

    const klass = classifyReply(reply.bodyText, reply.subject);
    const business = matched[0].business_name;

    // Only act if the new tier outranks the lead's current recorded tier.
    const currentRank = Math.max(
      0,
      ...matched.map((l) => REASON_RANK[l.suppression_reason ?? ""] ?? 0)
    );
    if (RANK[klass] <= currentRank) {
      result.skipped.push({ email, reason: `already handled (tier ${currentRank})` });
      continue;
    }

    if (klass === "optout") {
      if (!dryRun) {
        await supabase
          .from("tc_leads")
          .update({
            drip_status: "unsubscribed",
            suppression_reason: "replied_optout",
            unsubscribed_at: now,
            next_email_at: null,
          })
          .eq("email", email);
      }
      const brevo = dryRun ? "skipped" : await brevoBlacklist(email);
      result.removed.push({ email, business, brevo });
    } else if (klass === "decline") {
      if (!dryRun) {
        await supabase
          .from("tc_leads")
          .update({
            drip_status: "unsubscribed",
            suppression_reason: "replied_decline",
            unsubscribed_at: now,
            next_email_at: null,
          })
          .eq("email", email);
      }
      result.declined.push({ email, business });
    } else {
      // "reply" → pause cold drip, ping a human.
      if (!dryRun) {
        await supabase
          .from("tc_leads")
          .update({
            drip_status: "paused",
            suppression_reason: "replied_warm",
            next_email_at: null,
          })
          .eq("email", email);
        await sendTelegramNotification(
          `📨 <b>Blitz reply — needs a human</b>\n` +
            `<b>${escapeTelegramHtml(business ?? email)}</b> (${escapeTelegramHtml(email)})\n` +
            `Subject: ${escapeTelegramHtml(reply.subject)}\n\n` +
            `${escapeTelegramHtml(reply.bodyText.slice(0, 300))}\n\n` +
            `Cold drip paused. Reply from info@true-color.ca.`
        );
      }
      result.paused.push({ email, business });
    }
  }

  return result;
}
