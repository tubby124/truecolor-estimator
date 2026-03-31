/**
 * src/lib/email/smtp.ts
 *
 * Sends transactional email via Brevo REST API (HTTPS, port 443).
 *
 * WHY: Railway Hobby plan ($5/mo) blocks ALL outbound SMTP ports (25, 465,
 * 587, 2525) at the platform firewall level — no DNS trick, no nodemailer
 * config, no Brevo SMTP relay (also port 587), no alternate port fixes this.
 *
 * SOLUTION: Brevo transactional email REST API over HTTPS (port 443).
 * Railway does not block outbound HTTPS. No nodemailer needed.
 *
 * Required env var: BREVO_API_KEY  (Brevo → Settings → API Keys → v3 key)
 * Sender display name still reads from: SMTP_FROM env var (unchanged)
 */

interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailAttachment {
  content: string; // base64 encoded
  name: string;
  contentId?: string; // set to enable CID inline image: <img src="cid:contentId">
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

/** Parse "Display Name <addr@example.com>" or bare "addr@example.com" */
function parseAddress(addr: string): EmailRecipient {
  const match = addr.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: addr.trim() };
}

function toRecipientList(addr: string | string[]): EmailRecipient[] {
  return (Array.isArray(addr) ? addr : [addr]).map(parseAddress);
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY not configured — add it to Railway Variables " +
        "(Brevo Dashboard → Settings → API Keys → Generate new key)"
    );
  }

  const fromRaw =
    options.from ??
    process.env.SMTP_FROM ??
    "True Color Display Printing <info@true-color.ca>";

  // Auto-BCC staff on every outgoing email so info@true-color.ca sees all sent mail in Hostinger.
  // SMTP_BCC supports comma-separated addresses: "a@b.com,c@d.com"
  // Skip BCC if caller already set one, or if the primary recipient IS one of the BCC addresses.
  const globalBccRaw = process.env.SMTP_BCC;
  const globalBcc = globalBccRaw
    ? globalBccRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const toAddresses = (Array.isArray(options.to) ? options.to : [options.to]).join(",");
  const effectiveBcc =
    options.bcc ??
    (globalBcc?.length && !globalBcc.some((b) => toAddresses.includes(b))
      ? globalBcc
      : undefined);

  const body: Record<string, unknown> = {
    sender: parseAddress(fromRaw),
    to: toRecipientList(options.to),
    subject: options.subject,
    htmlContent: options.html,
  };

  if (options.text) body.textContent = options.text;
  if (effectiveBcc) body.bcc = toRecipientList(effectiveBcc);
  // replyTo: caller can override; fall back to SMTP_REPLY_TO env var.
  // Without this, customer "reply" in their email client goes to the From address
  // (which may be unmonitored). Set SMTP_REPLY_TO=info@true-color.ca in Railway.
  const effectiveReplyTo = options.replyTo ?? process.env.SMTP_REPLY_TO;
  if (effectiveReplyTo) body.replyTo = parseAddress(effectiveReplyTo);
  if (options.priority === "high") {
    body.headers = { "X-Priority": "1", Importance: "High" };
  }
  if (options.attachments?.length) {
    body.attachment = options.attachments.map((a) => {
      const att: Record<string, string> = { content: a.content, name: a.name };
      if (a.contentId) att.contentId = a.contentId;
      return att;
    });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo API error ${res.status}: ${errText}`);
  }

  // Log to email_log (non-fatal — never block email delivery on a DB write)
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (supabaseUrl && supabaseKey) {
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    const rows = toList.map((addr) => ({
      to_address: parseAddress(addr).email,
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
