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

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  priority?: "high" | "normal" | "low";
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

  const body: Record<string, unknown> = {
    sender: parseAddress(fromRaw),
    to: toRecipientList(options.to),
    subject: options.subject,
    htmlContent: options.html,
  };

  if (options.text) body.textContent = options.text;
  if (options.bcc) body.bcc = toRecipientList(options.bcc);
  if (options.priority === "high") {
    body.headers = { "X-Priority": "1", Importance: "High" };
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
}
