/**
 * Gmail reply reader for the industry-blitz drip.
 *
 * Reads info@true-color.ca via a Google Workspace service account with
 * domain-wide delegation (DWD) — the same service account gmail.py uses for
 * the `truecolor` profile (claude-truecolor@…), impersonating info@true-color.ca.
 *
 * Env vars (Railway):
 *   GMAIL_SA_CLIENT_EMAIL    — service-account client_email
 *   GMAIL_SA_PRIVATE_KEY     — service-account private_key (\n-escaped is fine)
 *   GMAIL_IMPERSONATE_EMAIL  — defaults to info@true-color.ca
 *
 * Scope: gmail.modify — this exact scope string is what the service account's
 * domain-wide delegation is authorized for in the Workspace admin console.
 * DWD matches scopes exactly, so gmail.readonly is rejected ("unauthorized_client")
 * even though it's narrower. We only read here; modify is the authorized grant.
 */

import {
  extractPlainText,
  getGmailClient,
  getHeader,
  isAutoReply,
  parseFrom,
  stripQuotedHistory,
} from "@/lib/email/gmailClient";

export interface InboundReply {
  messageId: string;
  threadId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  /** New reply text only — quoted history is stripped. */
  bodyText: string;
  /** Epoch ms of receipt. */
  internalDate: number;
}

/**
 * List inbound replies to info@true-color.ca over the last `hours`.
 * Excludes mail sent by us (info@ / outreach subdomain).
 */
export async function listRecentReplies(hours: number): Promise<InboundReply[]> {
  const gmail = getGmailClient();
  const query = [
    "to:info@true-color.ca",
    `newer_than:${Math.max(1, Math.ceil(hours / 24))}d`,
    "-from:true-color.ca",
    "in:inbox",
  ].join(" ");

  const list = await gmail.users.messages.list({ userId: "me", q: query, maxResults: 200 });
  const ids = list.data.messages ?? [];
  const replies: InboundReply[] = [];

  for (const { id } of ids) {
    if (!id) continue;
    const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    const headers = msg.data.payload?.headers ?? [];
    const get = (name: string) => getHeader(headers, name);

    const { email, name } = parseFrom(get("From"));
    const internalDate = Number(msg.data.internalDate ?? 0);
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    if (internalDate && internalDate < cutoff) continue;

    // Skip auto-responders / out-of-office so they don't wrongly pause a lead
    // or spam the human-alert channel.
    if (isAutoReply(get("Auto-Submitted"), get("Precedence"), get("X-Autoreply"), get("Subject"))) {
      continue;
    }

    replies.push({
      messageId: id,
      threadId: msg.data.threadId ?? "",
      fromEmail: email,
      fromName: name,
      subject: get("Subject"),
      bodyText: stripQuotedHistory(extractPlainText(msg.data.payload)),
      internalDate,
    });
  }

  return replies;
}
