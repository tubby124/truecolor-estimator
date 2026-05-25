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

import { google } from "googleapis";
import { JWT } from "google-auth-library";

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

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

function getGmailClient() {
  const clientEmail = process.env.GMAIL_SA_CLIENT_EMAIL;
  const privateKey = process.env.GMAIL_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const subject = process.env.GMAIL_IMPERSONATE_EMAIL ?? "info@true-color.ca";

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Gmail service-account not configured (GMAIL_SA_CLIENT_EMAIL / GMAIL_SA_PRIVATE_KEY)"
    );
  }

  const auth = new JWT({ email: clientEmail, key: privateKey, scopes: GMAIL_SCOPES, subject });
  return google.gmail({ version: "v1", auth });
}

/** Pull the email address out of a "Name <email>" From header. */
function parseFrom(header: string): { email: string; name: string } {
  const match = header.match(/<([^>]+)>/);
  const email = (match ? match[1] : header).trim().toLowerCase();
  const name = match ? header.slice(0, match.index).replace(/"/g, "").trim() : "";
  return { email, name };
}

/** Recursively find the first text/plain part and decode it. */
function extractPlainText(payload: unknown): string {
  const node = payload as {
    mimeType?: string;
    body?: { data?: string };
    parts?: unknown[];
  };
  if (!node) return "";
  if (node.mimeType === "text/plain" && node.body?.data) {
    return Buffer.from(node.body.data, "base64url").toString("utf8");
  }
  for (const part of node.parts ?? []) {
    const text = extractPlainText(part);
    if (text) return text;
  }
  return "";
}

/**
 * Strip quoted history so the classifier only sees what the lead actually
 * wrote. Cuts at the first "On … wrote:" / "From:" / "-----Original" marker
 * and drops any leading ">" quote lines.
 */
function stripQuotedHistory(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  const cutMarkers = [
    /^On .+wrote:\s*$/i,
    /^-{2,}\s*Original Message\s*-{2,}/i,
    /^From:\s.+/i,
    /^_{5,}\s*$/,
  ];
  for (const line of lines) {
    if (cutMarkers.some((re) => re.test(line.trim()))) break;
    if (line.trimStart().startsWith(">")) continue;
    out.push(line);
  }
  return out.join("\n").trim();
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
    const get = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

    const { email, name } = parseFrom(get("From"));
    const internalDate = Number(msg.data.internalDate ?? 0);
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    if (internalDate && internalDate < cutoff) continue;

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
