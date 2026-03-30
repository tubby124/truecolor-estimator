/**
 * POST /api/auth/signup-notify
 *
 * Called client-side after a successful supabase.auth.signUp().
 * 1. Sends admin notification email (owner knows a new account was created)
 * 2. Sends welcome email to the new customer
 * 3. Creates/updates Brevo contact (list 25 — customers)
 *
 * Fire-and-forget from the client — failure here does NOT affect the signup flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/smtp";
import { sendSignupWelcomeEmail } from "@/lib/email/signupWelcome";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 3 per IP per minute (signup itself is already rate-limited by Supabase)
  const ip = getClientIp(req);
  if (!rateLimit(`signup-notify:${ip}`, 3, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";

    const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

    // ── Welcome email to new customer (non-fatal) ──────────────────────────
    sendSignupWelcomeEmail({ email, name: name || undefined }).catch((err) => {
      console.error("[signup-notify] welcome email failed (non-fatal):", err instanceof Error ? err.message : err);
    });

    // ── Add to Brevo contacts list 25 (customers) (non-fatal) ─────────────
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const nameParts = name ? name.split(/\s+/) : [];
      const brevoContact: Record<string, unknown> = {
        email,
        listIds: [25],
        updateEnabled: true,
        attributes: {
          CUSTOMER_SOURCE: "self_signup",
          ACCOUNT_STATUS: "created",
          ...(nameParts[0] ? { FIRSTNAME: nameParts[0] } : {}),
          ...(nameParts[1] ? { LASTNAME: nameParts.slice(1).join(" ") } : {}),
        },
      };
      fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": brevoApiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(brevoContact),
      }).then((r) => {
        if (!r.ok) r.text().then((t) => console.error("[signup-notify] brevo contact failed:", t));
        else console.log(`[signup-notify] brevo contact created → ${email}`);
      }).catch((err) => {
        console.error("[signup-notify] brevo contact error (non-fatal):", err instanceof Error ? err.message : err);
      });
    }

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (!adminEmail) {
      // No admin email configured — skip admin notification silently
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toLocaleString("en-CA", {
      timeZone: "America/Regina",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const subject = `NEW ACCOUNT — ${email}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Account</title>
</head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <tr>
          <td style="background:#1c1712;border-radius:12px 12px 0 0;padding:18px 32px;">
            <p style="margin:0;font-size:12px;font-weight:600;color:#d6cfc7;letter-spacing:.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color — Admin Notification
            </p>
            <p style="margin:2px 0 0;font-size:11px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${now} (Saskatchewan time)</p>
          </td>
        </tr>

        <tr>
          <td style="background:#16C2F3;padding:12px 32px;text-align:center;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              New customer account created
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:28px 32px 32px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Account Email</p>
            <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="mailto:${email}" style="color:#16C2F3;text-decoration:none;">${email}</a>
            </p>

            <a href="${siteUrl}/staff/orders"
              style="display:inline-block;background:#16C2F3;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Open Staff Dashboard →
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#1c1712;border-radius:0 0 12px 12px;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing — Admin notification only
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
      "NEW ACCOUNT",
      "=".repeat(40),
      "",
      `Email:  ${email}`,
      `Time:   ${now} (Saskatchewan)`,
      "",
      `Staff dashboard: ${siteUrl}/staff/orders`,
      "",
      "True Color Display Printing — Admin notification",
    ].join("\n");

    await sendEmail({ from, to: adminEmail, subject, html, text });
    console.log(`[signup-notify] admin email sent → ${adminEmail} | new account: ${email}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-fatal — log but don't expose error to client
    console.error("[signup-notify] failed (non-fatal):", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
