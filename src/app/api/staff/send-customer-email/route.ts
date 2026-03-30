/**
 * POST /api/staff/send-customer-email
 *
 * Sends a freeform email to a customer from the staff portal.
 * Staff-only — requires active staff session.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";

export async function POST(req: NextRequest) {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  let body: { to?: string; subject?: string; message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!to || !subject || !message) {
    return NextResponse.json({ error: "to, subject, and message are required" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#1c1712;border-radius:12px 12px 0 0;padding:18px 28px;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px 32px;border-radius:0 0 12px 12px;">
            <div style="white-space:pre-wrap;font-size:14px;color:#1c1712;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              True Color Display Printing · 216 33rd St W, Saskatoon, SK ·
              <a href="tel:3069548688" style="color:#16C2F3;text-decoration:none;">(306) 954-8688</a> ·
              <a href="${siteUrl}" style="color:#16C2F3;text-decoration:none;">${siteUrl.replace("https://", "")}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail({
      to,
      subject,
      html,
      text: `${message}\n\n---\nTrue Color Display Printing\n216 33rd St W, Saskatoon, SK\n(306) 954-8688\n${siteUrl}`,
      replyTo: "info@true-color.ca",
    });
    console.log(`[send-customer-email] sent to ${to} | subject: "${subject}" | by: ${authResult.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-customer-email] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
