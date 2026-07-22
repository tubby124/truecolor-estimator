/**
 * Shared Gmail DWD client and message parsing helpers.
 *
 * The Workspace delegation is authorized for gmail.modify exactly. Consumers
 * in this repo only read messages, but changing the requested scope to
 * gmail.readonly would make the existing DWD grant fail.
 */

import { google } from "googleapis";
import { JWT } from "google-auth-library";

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

export interface GmailHeaderLike {
  name?: string | null;
  value?: string | null;
}

interface GmailPayloadLike {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: unknown[] | null;
}

export function getGmailMailbox(): string {
  return (process.env.GMAIL_IMPERSONATE_EMAIL ?? "info@true-color.ca").trim().toLowerCase();
}

export function getGmailClient() {
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

export function getHeader(
  headers: readonly GmailHeaderLike[] | null | undefined,
  name: string
): string {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Pull the email address out of a `Name <email>` From header. */
export function parseFrom(header: string): { email: string; name: string } {
  const match = header.match(/<([^>]+)>/);
  const email = (match ? match[1] : header).trim().toLowerCase();
  const name = match ? header.slice(0, match.index).replace(/"/g, "").trim() : "";
  return { email, name };
}

function extractMimeBody(payload: unknown, mimeType: string): string {
  const node = payload as GmailPayloadLike | null;
  if (!node) return "";
  if (node.mimeType === mimeType && node.body?.data) {
    return Buffer.from(node.body.data, "base64url").toString("utf8");
  }
  for (const part of node.parts ?? []) {
    const text = extractMimeBody(part, mimeType);
    if (text) return text;
  }
  return "";
}

/** Recursively find the first text/plain part and decode it. */
export function extractPlainText(payload: unknown): string {
  return extractMimeBody(payload, "text/plain");
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const numeric = code[1]?.toLowerCase() === "x"
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
  });
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Prefer text/plain, with a text/html fallback for HTML-only replies. */
export function extractMessageText(payload: unknown): string {
  const plain = extractPlainText(payload);
  if (plain) return plain;
  return htmlToText(extractMimeBody(payload, "text/html"));
}

/**
 * Strip quoted history so downstream consumers store/classify only the new
 * reply. This intentionally preserves the blitz reader's existing behavior.
 */
export function stripQuotedHistory(raw: string): string {
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

/** RFC 3834 plus common vacation/auto-responder heuristics. */
export function isAutoReply(
  autoSubmitted: string,
  precedence: string,
  xAutoreply: string,
  subject: string
): boolean {
  if (autoSubmitted && autoSubmitted.toLowerCase() !== "no") return true;
  if (["bulk", "auto_reply", "junk", "list"].includes(precedence.toLowerCase())) return true;
  if (xAutoreply) return true;
  return /out of (the )?office|automatic reply|auto-?reply|on vacation|away from (the )?office|currently away/i.test(
    subject
  );
}
