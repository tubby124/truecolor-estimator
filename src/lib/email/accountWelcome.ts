/**
 * src/lib/email/accountWelcome.ts
 *
 * Lightweight welcome email sent when a customer account is created
 * but the payment email goes through a third party (e.g. Wave invoice).
 *
 * Used by: POST /api/staff/manual-order (Wave path only)
 * Clover path doesn't need this — paymentRequest.ts already includes the account section.
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { orderTrackingNudge, orderTrackingNudgeText } from "./components/orderTrackingNudge";
import { escHtml } from "./components/escHtml";

export interface AccountWelcomeParams {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  isNewAccount: boolean;
  accountLink: string;
}

export async function sendAccountWelcomeEmail(
  params: AccountWelcomeParams
): Promise<void> {
  const { customerName, customerEmail, orderNumber, isNewAccount } = params;

  const subject = isNewAccount
    ? `Your True Color account is ready — Order ${orderNumber}`
    : `Track your order ${orderNumber} online — True Color`;

  await sendEmail({
    to: customerEmail,
    subject,
    html: buildHtml(params),
    text: buildText(params),
  });

  console.log(
    `[accountWelcome] email sent → ${customerEmail} | order ${orderNumber} | new=${isNewAccount}`
  );
}

function buildHtml(p: AccountWelcomeParams): string {
  const { customerName, orderNumber, isNewAccount, accountLink } = p;
  const firstName = customerName.split(" ")[0] || customerName;

  const heroSubline = isNewAccount
    ? `Hi ${escHtml(firstName)}, we&rsquo;ve created a free account for you so you can track order <strong>${escHtml(orderNumber)}</strong> online.`
    : `Hi ${escHtml(firstName)}, you can track order <strong>${escHtml(orderNumber)}</strong> and all your past orders from your dashboard.`;

  const ctaSection = isNewAccount
    ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Your Account
                </p>
                <p style="margin:0 0 14px;font-size:13px;color:#15803d;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Click below to log in instantly and view your order status, proof approvals, and payment history.
                </p>
                <a href="${escHtml(accountLink)}"
                  style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  View Your Order Online &rarr;
                </a>
                <p style="margin:12px 0 0;font-size:11px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Link valid for 1 hour. Set a permanent password anytime from your account page.
                </p>
              </div>`
    : `<div style="background:#f0fbff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 14px;font-size:13px;color:#0c4a6e;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  View this order and all your past orders from your account dashboard.
                </p>
                <a href="${escHtml(accountLink)}"
                  style="display:inline-block;background:#16C2F3;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Go to Your Dashboard &rarr;
                </a>
              </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your True Color account — Order ${escHtml(orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        ${emailHeader()}

        <!-- HERO -->
        <tr>
          <td style="background:#fff;padding:36px 32px 24px;text-align:center;border-top:3px solid #16C2F3;">
            <div style="display:inline-block;width:50px;height:50px;background:#16C2F3;border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
              <span style="font-size:22px;color:#fff;line-height:50px;display:inline-block;">&#9734;</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${isNewAccount ? "Your account is ready!" : "Track your order online"}
            </h1>
            <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${heroSubline}
            </p>
            <div style="display:inline-block;background:#f4efe9;border-radius:8px;padding:8px 20px;border:1px solid #ddd5c8;">
              <span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:block;margin-bottom:2px;">
                Order
              </span>
              <span style="font-size:17px;font-weight:700;color:#1c1712;letter-spacing:.04em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                ${escHtml(orderNumber)}
              </span>
            </div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#fff;padding:8px 32px 32px;">

              ${ctaSection}

              <!-- What you can do -->
              <div style="background:#faf7f4;border:1px solid #e6ddd5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  From your dashboard you can:
                </p>
                <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#4a3728;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  <li>Track your order status in real time</li>
                  <li>View and approve design proofs</li>
                  <li>Reorder past items in one click</li>
                  <li>Keep your contact &amp; company details saved</li>
                </ul>
              </div>

              ${orderTrackingNudge()}

              <!-- Questions -->
              <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;margin-top:16px;">
                <p style="margin:0;font-size:13px;color:#7a1818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
                  Questions? Reply to this email or reach us at
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
}

function buildText(p: AccountWelcomeParams): string {
  const { customerName, orderNumber, isNewAccount, accountLink } = p;
  const firstName = customerName.split(" ")[0] || customerName;

  return [
    `Hi ${firstName},`,
    "",
    isNewAccount
      ? `We've created a free account for you at truecolorprinting.ca so you can track order ${orderNumber} online.`
      : `You can track order ${orderNumber} and all your past orders from your dashboard.`,
    "",
    isNewAccount ? "--- YOUR ACCOUNT ---" : "--- YOUR DASHBOARD ---",
    isNewAccount
      ? `Log in instantly (link valid 1 hour): ${accountLink}`
      : `View your orders: ${accountLink}`,
    "",
    "From your dashboard you can:",
    "  - Track your order status in real time",
    "  - View and approve design proofs",
    "  - Reorder past items in one click",
    "  - Keep your contact & company details saved",
    "",
    orderTrackingNudgeText(),
    "Questions? Reply to this email or call (306) 954-8688.",
    "",
    "True Color Display Printing",
    "216 33rd St W, Saskatoon, SK",
    "info@true-color.ca",
  ].join("\n");
}
