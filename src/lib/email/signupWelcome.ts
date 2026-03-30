/**
 * src/lib/email/signupWelcome.ts
 *
 * Welcome email sent to a new customer immediately after self-signup
 * (via POST /api/auth/signup-notify).
 *
 * Different from accountWelcome.ts which requires an order number.
 * This is a pure "you've joined" email with a Get a Quote CTA.
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { escHtml } from "./components/escHtml";

export async function sendSignupWelcomeEmail(opts: {
  email: string;
  name?: string;
}): Promise<void> {
  const { email, name } = opts;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
  const firstName = name ? escHtml(name.trim().split(/\s+/)[0]) : null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  const subject = "Welcome to True Color Display Printing!";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to True Color Display Printing</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        ${emailHeader()}

        <!-- HERO -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 20px;text-align:center;border-top:3px solid #16C2F3;">
            <div style="display:inline-block;width:50px;height:50px;background:#16C2F3;border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
              <span style="font-size:22px;color:#ffffff;line-height:50px;display:inline-block;">&#10003;</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Welcome to True Color!
            </h1>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${greeting} Your account is set up and ready to go.
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:8px 32px 32px;">

            <!-- $10 OFF WELCOME OFFER -->
            <div style="background:linear-gradient(135deg,#0ea5e9 0%,#16C2F3 100%);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:.1em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Welcome offer — first order
              </p>
              <p style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                $10 OFF
              </p>
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border:2px dashed rgba(255,255,255,0.6);border-radius:8px;padding:8px 20px;margin-bottom:12px;">
                <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:.12em;font-family:'Courier New',Courier,monospace;">WELCOME10</span>
              </div>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.85);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Enter at checkout — no minimum order required
              </p>
            </div>

            <!-- DUAL CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="48%" style="padding-right:8px;">
                  <a href="${siteUrl}/products"
                    style="display:block;background:#1c1712;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:13px 16px;border-radius:8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    Browse Products &rarr;
                  </a>
                </td>
                <td width="48%" style="padding-left:8px;">
                  <a href="${siteUrl}/quote"
                    style="display:block;background:#16C2F3;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:13px 16px;border-radius:8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    Get a Quote &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- What we print -->
            <div style="background:#faf7f4;border:1px solid #e6ddd5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                What we print in Saskatoon:
              </p>
              <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#4a3728;line-height:1.9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                <li>Coroplast signs &amp; vinyl banners</li>
                <li>Business cards, flyers &amp; postcards</li>
                <li>Vehicle magnets &amp; window decals</li>
                <li>Retractable banners &amp; foamboard displays</li>
                <li>Stickers, booklets, photo posters &amp; more</li>
              </ul>
            </div>

            <!-- Account perks -->
            <div style="background:#faf7f4;border:1px solid #e6ddd5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                From your account dashboard:
              </p>
              <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#4a3728;line-height:1.9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                <li>Track order status in real time</li>
                <li>View &amp; approve design proofs</li>
                <li>Reorder past items in one click</li>
              </ul>
            </div>

            <!-- Contact -->
            <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#7a1818;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Questions? Call <strong>(306) 954-8688</strong> or email
                <a href="mailto:info@true-color.ca" style="color:#e52222;font-weight:600;text-decoration:none;">info@true-color.ca</a>
              </p>
            </div>

          </td>
        </tr>

        ${emailFooter()}

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    "",
    "Your True Color Display Printing account is set up and ready to go.",
    "",
    "── WELCOME OFFER ──────────────────────────────",
    "$10 OFF your first order — use code: WELCOME10",
    "Enter at checkout, no minimum required.",
    "────────────────────────────────────────────────",
    "",
    `Browse all products: ${siteUrl}/products`,
    `Get an instant quote: ${siteUrl}/quote`,
    "",
    "What we print in Saskatoon:",
    "  - Coroplast signs & vinyl banners",
    "  - Business cards, flyers & postcards",
    "  - Vehicle magnets & window decals",
    "  - Retractable banners & foamboard displays",
    "  - Stickers, booklets, photo posters & more",
    "",
    "From your account dashboard:",
    "  - Track order status in real time",
    "  - View & approve design proofs",
    "  - Reorder past items in one click",
    "",
    "Questions? Call (306) 954-8688 or email info@true-color.ca",
    "",
    "True Color Display Printing",
    "216 33rd St W, Saskatoon, SK",
    "https://truecolorprinting.ca",
  ].join("\n");

  await sendEmail({ to: email, subject, html, text });
  console.log(`[signupWelcome] sent → ${email}`);
}
