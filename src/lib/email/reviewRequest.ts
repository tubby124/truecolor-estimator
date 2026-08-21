/**
 * Honest Google review request — sent by the guarded review-request cron.
 *
 * The voice is owner-led and direct, not a copy of another brand. It must never
 * exchange a discount, reward, or favourable-rating request for a review.
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { escHtml } from "./components/escHtml";
import { preheader } from "./components/preheader";
import { productAnchor } from "./components/productAnchor";

export type ReviewRequestTouch = "initial" | "reminder";

export interface ReviewRequestParams {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  touch: ReviewRequestTouch;
  /** Tokenized reply address lets an inbound customer reply stop this cycle. */
  replyTo?: string;
  items?: Array<{ product_name: string; qty: number }>;
}

// Verified 2026-08-21: opens True Color Display Printing Ltd. Google review dialog.
const GOOGLE_REVIEW_URL = "https://g.page/r/CZH6HlbNejQAEAE/review";

export async function sendReviewRequestEmail(
  params: ReviewRequestParams,
): Promise<{ providerMessageId: string }> {
  const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const anchor = productAnchor(params.items);
  const subject = params.touch === "initial"
    ? anchor === "your order" ? "Quick gut check on your order" : `Quick gut check on your ${anchor}`
    : anchor === "your order" ? "One last quick thing about your order" : `One last quick thing about your ${anchor}`;

  return sendEmail({
    from,
    to: params.customerEmail,
    replyTo: params.replyTo,
    subject,
    html: buildReviewRequestEmailHtml(params),
    text: buildReviewRequestEmailText(params),
    orderId: params.orderId,
    customerId: params.customerId,
    idempotencyKey: `review-request/${params.touch}/${params.orderId}`,
    requireEmailLog: true,
    tags: [
      { name: "email_type", value: "review_request" },
      { name: "review_touch", value: params.touch },
    ],
  });
}

function buildReviewRequestEmailHtml({ customerName, orderNumber, touch }: ReviewRequestParams): string {
  const firstName = customerName.split(" ")[0] || customerName;
  const reminder = touch === "reminder";
  const headline = reminder ? "One last tiny favour." : "Quick gut check.";
  const body = reminder
    ? "Your print is hopefully out there doing its job. If you have a minute, an honest Google review helps a local shop more than another generic ad ever could."
    : "Did your finished print do what it needed to do? If yes, great. If not, reply and tell us. Either way, an honest Google review helps a local Saskatoon shop earn the next job.";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escHtml(headline)}</title></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  ${preheader(reminder ? "A final, no-pressure request for honest feedback." : "An honest review helps a local print shop grow.")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px" cellpadding="0" cellspacing="0">
      ${emailHeader()}
      <tr><td style="background:#1c1712;padding:34px 32px 26px;border-top:4px solid #f5c842;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#f5c842;">True Color field report · ${reminder ? "final ping" : "your order"}</p>
        <h1 style="margin:0;font-size:29px;line-height:1.1;font-weight:800;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(headline)}</h1>
      </td></tr>
      <tr><td style="background:#fff;padding:30px 32px 32px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1c1712;">Hi ${escHtml(firstName)},</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#374151;">${escHtml(body)}</p>
        <div style="margin:0 0 24px;padding:14px 16px;border-left:4px solid #f5c842;background:#fffbea;">
          <p style="margin:0;font-size:13px;line-height:1.55;color:#4a3728;"><strong>Order ${escHtml(orderNumber)}</strong> · We want the real version: what worked, what did not, and what we can do better next time.</p>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#e52222;border-radius:7px;">
          <a href="${escHtml(GOOGLE_REVIEW_URL)}" style="display:inline-block;padding:14px 24px;color:#fff;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:.01em;">Leave an honest Google review →</a>
        </td></tr></table>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.55;color:#6b7280;">No reward. No scripted five-star nonsense. Just your real experience. If something missed the mark, reply to this email or call (306) 954-8688 and we will deal with it.</p>
      </td></tr>
      ${emailFooter(`This is ${reminder ? "our final" : "a"} one-time follow-up for order #${escHtml(orderNumber)}.`)}
    </table>
  </td></tr></table>
</body></html>`;
}

function buildReviewRequestEmailText({ customerName, orderNumber, touch }: ReviewRequestParams): string {
  const firstName = customerName.split(" ")[0] || customerName;
  const body = touch === "reminder"
    ? "Your print is hopefully out there doing its job. If you have a minute, an honest Google review helps a local shop more than another generic ad ever could."
    : "Did your finished print do what it needed to do? If yes, great. If not, reply and tell us. Either way, an honest Google review helps a local Saskatoon shop earn the next job.";
  return `Hi ${firstName},

${body}

Order ${orderNumber}. We want the real version: what worked, what did not, and what we can do better next time.

Leave an honest Google review:
${GOOGLE_REVIEW_URL}

No reward. No scripted five-star nonsense. Just your real experience. If something missed the mark, reply to this email or call (306) 954-8688 and we will deal with it.

True Color Display Printing
216 33rd St W, Saskatoon, SK
(306) 954-8688 · info@true-color.ca
`;
}
