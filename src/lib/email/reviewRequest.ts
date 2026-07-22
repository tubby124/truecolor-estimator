/**
 * src/lib/email/reviewRequest.ts
 *
 * Neutral review request email — sent to every customer when an order is
 * marked "complete" by staff.
 *
 * Sent from: PATCH /api/staff/orders/[id]/status when status === "complete"
 *
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { orderTrackingNudge, orderTrackingNudgeText } from "./components/orderTrackingNudge";
import { escHtml } from "./components/escHtml";
import { preheader } from "./components/preheader";
import { productAnchor } from "./components/productAnchor";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewRequestParams {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  /** Optional — used for product-anchored subject ("How did your business cards turn out?") */
  items?: Array<{ product_name: string; qty: number }>;
}

// ─── Google review link ───────────────────────────────────────────────────────
// verified 2026-04-08 — opens True Color Display Printing Ltd. Google review dialog
const GOOGLE_REVIEW_URL =
  "https://g.page/r/CZH6HlbNejQAEAE/review";

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function sendReviewRequestEmail(
  params: ReviewRequestParams
): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const anchor = productAnchor(params.items);
  const subject =
    anchor === "your order"
      ? `How did your order turn out?`
      : `How did your ${anchor} turn out?`;
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
  ${preheader("Tell us honestly how your completed order turned out.")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        ${emailHeader()}

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
              Hi ${escHtml(firstName)}, we would appreciate your honest feedback about the finished order.
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
                How did your order turn out?
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#4a3728;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Please share an honest Google review&mdash;what went well and what we could improve.
                We send the same request to every customer, and there is no reward for leaving a review.
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

            ${orderTrackingNudge()}

            <!-- Support block -->
            <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;margin-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#7a1818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;">
                Need help with this order? Reply to this email or call us at
                <a href="tel:+13069548688" style="color:#e52222;font-weight:600;text-decoration:none;">(306) 954-8688</a>
                &mdash; we&rsquo;ll make it right.
              </p>
            </div>

          </td>
        </tr>

        ${emailFooter(`This is a one-time courtesy email for order #${escHtml(orderNumber)}.`)}

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

Your order #${orderNumber} is now complete. We would appreciate your honest feedback about the finished order.

Please share an honest Google review — what went well and what we could improve. We send the same request to every customer, and there is no reward for leaving a review:

${GOOGLE_REVIEW_URL}

Need help with this order? Reply to this email or call us at (306) 954-8688.
${orderTrackingNudgeText()}
Thanks for supporting a local Saskatoon business,
The True Color Team

---
True Color Display Printing
216 33rd St W, Saskatoon, SK
(306) 954-8688 · info@true-color.ca

This is a one-time courtesy email for order #${orderNumber}.
`;
}
