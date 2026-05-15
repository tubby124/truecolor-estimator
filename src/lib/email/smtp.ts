/**
 * src/lib/email/smtp.ts
 *
 * Sends transactional email via Resend REST API (HTTPS, port 443).
 *
 * WHY RESEND (not Brevo): 2026-05-11 — Brevo silently throttled the account to
 * ~10 sends/day after the Wave 1 Construction campaign tripped anti-abuse. API
 * returned 201 + messageId but emails never delivered. Resend has separate
 * transactional infrastructure with no cold-list anti-abuse throttling, and
 * a generous free tier (3,000/mo, 100/day) that fits True Color's volume.
 *
 * WHY ALSO NOT SMTP: Railway Hobby plan ($5/mo) blocks ALL outbound SMTP ports
 * (25, 465, 587, 2525) at the platform firewall — no DNS trick, no nodemailer
 * config, no alternate port fixes this. Resend REST API over HTTPS (port 443)
 * is the only path that works on Railway Hobby.
 *
 * Required env var: RESEND_API_KEY  (Resend Dashboard → API Keys → Create)
 * Sender display: SMTP_FROM env var (e.g. 'True Color Display Printing <hello@outreach.true-color.ca>')
 * Reply-to fallback: SMTP_REPLY_TO env var (e.g. info@true-color.ca)
 * Auto-BCC: SMTP_BCC env var (comma-separated)
 */

export interface SendEmailAttachment {
  content: string; // base64 encoded
  name: string;
  contentId?: string; // optional CID for inline images
}

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "high" | "normal" | "low";
  attachments?: SendEmailAttachment[];
}

/** Strip name part from "Display Name <addr@example.com>" → "addr@example.com" */
function extractEmail(addr: string): string {
  const match = addr.match(/^.+?\s*<(.+?)>$/);
  return match ? match[1].trim() : addr.trim();
}

function toEmailList(addr: string | string[]): string[] {
  return (Array.isArray(addr) ? addr : [addr]).map((a) => a.trim()).filter(Boolean);
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY not configured — add it to Railway Variables " +
        "(Resend Dashboard → API Keys → Create API Key)"
    );
  }

  const from =
    options.from ??
    process.env.SMTP_FROM ??
    "True Color Display Printing <hello@outreach.true-color.ca>";

  // Auto-BCC staff on every outgoing email. SMTP_BCC supports comma-separated:
  // "a@b.com,c@d.com". Skip BCC if caller already set one, or if the primary
  // recipient IS one of the BCC addresses.
  const globalBccRaw = process.env.SMTP_BCC;
  const globalBcc = globalBccRaw
    ? globalBccRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const toAddresses = toEmailList(options.to).map(extractEmail);
  const effectiveBcc =
    options.bcc !== undefined
      ? toEmailList(options.bcc)
      : globalBcc?.length && !globalBcc.some((b) => toAddresses.includes(extractEmail(b)))
        ? globalBcc
        : undefined;

  // Reply-To: caller override, then SMTP_REPLY_TO env var fallback.
  // Without this, customer "reply" goes to the From address (unmonitored).
  const effectiveReplyTo = options.replyTo ?? process.env.SMTP_REPLY_TO;

  const body: Record<string, unknown> = {
    from,
    to: toEmailList(options.to),
    subject: options.subject,
    html: options.html,
  };

  if (options.text) body.text = options.text;
  if (effectiveBcc) body.bcc = effectiveBcc;
  if (effectiveReplyTo) body.reply_to = effectiveReplyTo;

  // RFC 8058 / Gmail Feb 2024 bulk-sender requirement.
  // Without List-Unsubscribe + List-Unsubscribe-Post=One-Click headers, Gmail
  // junks transactional + marketing email wholesale even when SPF/DKIM/DMARC
  // pass. Identical fix shipped on hasansharif.ca commit e1f10d9 / 2026-05-14.
  // Primary recipient's address is encoded into the one-click URL so the
  // endpoint knows who to unsubscribe.
  const headers: Record<string, string> = {};
  const primaryRecipient = extractEmail(toAddresses[0] ?? "");
  if (primaryRecipient) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const oneClickUrl =
      `${siteUrl}/api/email/unsubscribe-one-click?email=${encodeURIComponent(primaryRecipient)}`;
    headers["List-Unsubscribe"] =
      `<${oneClickUrl}>, <mailto:unsubscribe@true-color.ca?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  if (options.priority === "high") {
    headers["X-Priority"] = "1";
    headers["Importance"] = "High";
  }
  if (Object.keys(headers).length > 0) {
    body.headers = headers;
  }
  if (options.attachments?.length) {
    body.attachments = options.attachments.map((a) => {
      const att: Record<string, string> = { content: a.content, filename: a.name };
      if (a.contentId) att.content_id = a.contentId;
      return att;
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }

  // Log to email_log (non-fatal — never block email delivery on a DB write)
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (supabaseUrl && supabaseKey) {
    const toList = toEmailList(options.to);
    const rows = toList.map((addr) => ({
      to_address: extractEmail(addr),
      email_type: options.subject,
      subject: options.subject,
      status: "sent",
    }));
    fetch(`${supabaseUrl}/rest/v1/email_log`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    }).catch((err) => {
      console.error("[smtp] email_log write failed (non-fatal):", err instanceof Error ? err.message : err);
    });
  }
}
