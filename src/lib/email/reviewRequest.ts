/**
 * src/lib/email/reviewRequest.ts
 *
 * Review request email — sent when an order is marked "complete" by staff.
 * Goal: gather Google reviews from satisfied customers.
 *
 * Sent from: PATCH /api/staff/orders/[id]/status when status === "complete"
 *
 */

import { sendEmail } from "./smtp";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewRequestParams {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
}

// ─── Google review link ───────────────────────────────────────────────────────
const GOOGLE_REVIEW_URL =
  "https://g.page/r/CZH6HlbNejQAEAE/review";

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function sendReviewRequestEmail(
  params: ReviewRequestParams
): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const subject = `How did your order ${params.orderNumber} turn out?`;
  const html = buildReviewRequestEmailHtml(params);
  const text = buildReviewRequestEmailText(params);

  await sendEmail({
    from,
    to: params.customerEmail,
    subject,
    html,
    text,
  });

  console.log(
    `[reviewRequest] email sent → ${params.customerEmail} | order ${params.orderNumber}`
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildReviewRequestEmailHtml({
  customerName,
  orderNumber,
}: ReviewRequestParams): string {
  const firstName = customerName.split(" ")[0] || customerName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>How did your order ${escHtml(orderNumber)} turn out?</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- HEADER -->
        <tr>
          <td style="background:#1c1712;border-radius:12px 12px 0 0;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#d6cfc7;letter-spacing:.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Saskatoon, Saskatchewan &middot; Canada
            </p>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 24px;text-align:center;border-top:3px solid #f5c842;">
            <div style="display:inline-block;width:50px;height:50px;background:#f5c842;border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
              <span style="font-size:26px;color:#1c1712;line-height:50px;display:inline-block;">&#9733;</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Your order is complete!
            </h1>
            <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Hi ${escHtml(firstName)}, we hope everything turned out exactly the way you imagined.
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
          <td style="background:#ffffff;padding:8px 32px 32px;">

            <!-- Review ask -->
            <div style="background:#fffbea;border:1px solid #f5c842;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Happy with the results?
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#4a3728;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                A quick Google review helps other Saskatoon businesses find us &mdash; and it means the world to our small local team.
                It only takes about 30 seconds.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#e52222;border-radius:8px;">
                    <a href="${escHtml(GOOGLE_REVIEW_URL)}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.01em;">
                      Leave a Google Review &#8594;
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- "Not happy?" block -->
            <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;margin-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#7a1818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;">
                Not 100% happy? Please reply to this email or call us at
                <a href="tel:+13069548688" style="color:#e52222;font-weight:600;text-decoration:none;">(306) 954-8688</a>
                &mdash; we&rsquo;ll make it right.
              </p>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1c1712;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              216 33rd St W &middot; Saskatoon, SK &middot; Canada
            </p>
            <p style="margin:0 0 8px;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="tel:+13069548688" style="color:#f08080;text-decoration:none;">(306) 954-8688</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:info@true-color.ca" style="color:#f08080;text-decoration:none;">info@true-color.ca</a>
            </p>
            <p style="margin:0;font-size:11px;color:#7a6560;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              This is a one-time courtesy email for order #${escHtml(orderNumber)}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

function buildReviewRequestEmailText({
  customerName,
  orderNumber,
}: ReviewRequestParams): string {
  const firstName = customerName.split(" ")[0] || customerName;

  return `Hi ${firstName},

Your order #${orderNumber} is now complete — we hope everything turned out exactly the way you imagined!

If you're happy with the results, we'd love a quick Google review. It helps other Saskatoon businesses find us and means a lot to our small local team. It only takes about 30 seconds:

${GOOGLE_REVIEW_URL}

Not 100% happy? Reply to this email or call us at (306) 954-8688 — we'll make it right.

Thanks for supporting a local Saskatoon business,
The True Color Team

---
True Color Display Printing
216 33rd St W, Saskatoon, SK
(306) 954-8688 · info@true-color.ca

This is a one-time courtesy email for order #${orderNumber}.
`;
}

// ─── HTML escape helper ───────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
