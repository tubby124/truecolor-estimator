/**
 * src/lib/email/paymentRequest.ts
 *
 * Sends a branded payment request email to a customer.
 * Used by POST /api/staff/manual-order when staff creates a manual payment request.
 * Supports multi-item orders (renders one row per item).
 *
 * Design matches orderConfirmation.ts: dark header #1c1712, cyan CTA #16C2F3.
 */

import { sendEmail } from "./smtp";

export interface PaymentRequestItem {
  product: string;
  qty: number;
  details?: string;
  amount: number;
}

export interface AccountInfo {
  isNewAccount: boolean;
  accountLink: string;
}

export interface PaymentRequestEmailParams {
  orderNumber: string;
  contact: { name: string; email: string; company?: string | null };
  items: PaymentRequestItem[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  paymentUrl: string;
  paymentMethod: "clover" | "wave";
  notes?: string | null;
  accountInfo?: AccountInfo | null;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function sendPaymentRequestEmail(
  params: PaymentRequestEmailParams
): Promise<void> {
  const { orderNumber, contact, total } = params;

  const subject = `Payment Request — $${total.toFixed(2)} CAD | True Color Display Printing`;

  await sendEmail({
    to: contact.email,
    subject,
    html: buildPaymentRequestHtml(params),
    text: buildPaymentRequestText(params),
  });

  console.log(
    `[paymentRequest] email sent → ${contact.email} | order ${orderNumber} | total $${total.toFixed(2)} | ${params.items.length} item(s)`
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildPaymentRequestHtml(p: PaymentRequestEmailParams): string {
  const { orderNumber, contact, items, subtotal, gst, pst, total, paymentUrl, paymentMethod, notes, accountInfo } = p;

  const methodNote =
    paymentMethod === "wave"
      ? "You can view and pay your invoice online using the button below."
      : "Click the button below to pay securely by credit card via Clover.";

  // Build item rows
  const itemRows = items.map((item) => {
    const qty = item.qty > 1 ? `${item.qty}x ` : "";
    const details = item.details?.trim() ? `<span style="font-size: 12px; color: #6b7280; display: block; margin-top: 2px;">${escHtml(item.details)}</span>` : "";
    return `<tr style="background: #ffffff;">
      <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #f0ebe4; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <strong style="font-weight: 600;">${escHtml(qty)}${escHtml(item.product)}</strong>
        ${details}
      </td>
      <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; font-variant-numeric: tabular-nums; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        $${item.amount.toFixed(2)}
      </td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Payment Request — ${escHtml(orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4efe9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color: #f4efe9; padding: 32px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">

          <!-- ── DARK HEADER ── -->
          <tr>
            <td style="background-color: #1c1712; border-radius: 12px 12px 0 0; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #d6cfc7; letter-spacing: 0.08em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color Display Printing
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #7a6a60; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Saskatoon, Saskatchewan · Canada
              </p>
            </td>
          </tr>

          <!-- ── HERO ── -->
          <tr>
            <td style="background: #ffffff; padding: 36px 32px 20px; text-align: center; border-top: 3px solid #16C2F3;">

              <div style="display: inline-block; width: 50px; height: 50px; background-color: #16C2F3; border-radius: 50%; line-height: 50px; text-align: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: #ffffff; line-height: 50px; display: inline-block;">$</span>
              </div>

              <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Payment Request
              </h1>
              <p style="margin: 0 0 18px; font-size: 14px; color: #6b7280; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Hi ${escHtml(contact.name)}, True Color Display Printing has sent you a payment request.
                ${escHtml(methodNote)}
              </p>

              <!-- Order number badge -->
              <div style="display: inline-block; background-color: #f4efe9; border-radius: 8px; padding: 8px 20px; border: 1px solid #ddd5c8;">
                <span style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: block; margin-bottom: 2px;">
                  Reference
                </span>
                <span style="font-size: 18px; font-weight: 700; color: #1c1712; letter-spacing: 0.04em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ${escHtml(orderNumber)}
                </span>
              </div>

            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background: #ffffff; padding: 24px 32px 32px;">

              <!-- Order summary table -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Order Summary
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border: 1px solid #e2dbd4; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">

                <tbody>
                  <!-- Item rows -->
                  ${itemRows}

                  ${contact.company ? `<tr style="background: #fafafa;">
                    <td colspan="2" style="padding: 8px 16px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #f0ebe4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Company: ${escHtml(contact.company)}
                    </td>
                  </tr>` : ""}

                  ${notes ? `<tr style="background: #fafafa;">
                    <td colspan="2" style="padding: 10px 16px; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f0ebe4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
                      Note: ${escHtml(notes)}
                    </td>
                  </tr>` : ""}

                  <!-- Subtotal row -->
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 10px 16px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; border-top: 1px solid #e2dbd4;">
                      Subtotal
                    </td>
                    <td style="padding: 10px 16px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; border-top: 1px solid #e2dbd4;">
                      $${subtotal.toFixed(2)}
                    </td>
                  </tr>

                  <!-- GST row -->
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 4px 16px 4px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      GST (5%)
                    </td>
                    <td style="padding: 4px 16px 4px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${gst.toFixed(2)}
                    </td>
                  </tr>

                  <!-- PST row -->
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      PST (6%)
                    </td>
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${pst.toFixed(2)}
                    </td>
                  </tr>

                  <!-- TOTAL row -->
                  <tr style="background: #1c1712;">
                    <td style="padding: 16px; font-size: 15px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Total (CAD)
                    </td>
                    <td style="padding: 16px; font-size: 20px; font-weight: 700; color: #ffffff; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Payment CTA -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Payment
              </p>
              <div style="background: #f0fbff; border: 1px solid #7de0f7; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #0c4a6e; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Click the button below to pay <strong>$${total.toFixed(2)} CAD</strong> securely online.
                  Your payment is protected by ${paymentMethod === "wave" ? "Wave" : "Clover"}.
                </p>
                <a href="${escHtml(paymentUrl)}"
                  style="display: inline-block; background: #16C2F3; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.01em;">
                  Pay $${total.toFixed(2)} Now &rarr;
                </a>
                <p style="margin: 14px 0 0; font-size: 11px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Questions? Reply to this email or call
                  <a href="tel:+13069548688" style="color: #0369a1; text-decoration: none;">(306) 954-8688</a>
                </p>
              </div>

              <!-- Pickup info -->
              <div style="background: #faf7f4; border: 1px solid #e6ddd5; border-radius: 10px; padding: 14px 18px;">
                <p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #1c1712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Pickup: 216 33rd St W, Saskatoon, SK
                </p>
                <p style="margin: 0; font-size: 12px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Mon–Fri &nbsp;9 AM – 5 PM · We will email you when your order is ready for pickup.
                </p>
              </div>

              ${accountInfo?.isNewAccount ? `
              <!-- New account section -->
              <div style="margin-top: 24px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 20px 24px; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Your Account
                </p>
                <p style="margin: 0 0 14px; font-size: 13px; color: #15803d; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  We've created a free account for you at <strong>truecolorprinting.ca</strong>.<br>
                  Click below to log in instantly and view your order status, proof, and payment history.
                </p>
                <a href="${escHtml(accountInfo.accountLink)}"
                  style="display: inline-block; background: #16a34a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  View Your Order Online &rarr;
                </a>
                <p style="margin: 10px 0 0; font-size: 11px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Link valid for 1 hour. Set a permanent password anytime from your account page.
                </p>
              </div>
              ` : accountInfo ? `
              <!-- Returning customer account link -->
              <p style="margin-top: 20px; margin-bottom: 0; font-size: 13px; color: #6b7280; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                View this and all past orders at
                <a href="${escHtml(accountInfo.accountLink)}" style="color: #0369a1; text-decoration: none; font-weight: 600;">truecolorprinting.ca/account</a>.
              </p>
              ` : ""}

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background: #1c1712; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #f5f0eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color Display Printing
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #9c928a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                216 33rd St W · Saskatoon, SK · Canada
              </p>
              <p style="margin: 0; font-size: 12px; color: #9c928a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <a href="tel:+13069548688" style="color: #f08080; text-decoration: none;">(306) 954-8688</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@true-color.ca" style="color: #f08080; text-decoration: none;">info@true-color.ca</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

function buildPaymentRequestText(p: PaymentRequestEmailParams): string {
  const { orderNumber, contact, items, subtotal, gst, pst, total, paymentUrl, accountInfo } = p;

  const itemLines = items.map((item) => {
    const qty = item.qty > 1 ? `${item.qty}x ` : "";
    const details = item.details?.trim() ? ` — ${item.details}` : "";
    return `  ${qty}${item.product}${details}  $${item.amount.toFixed(2)}`;
  });

  return [
    `Hi ${contact.name},`,
    "",
    `True Color Display Printing has sent you a payment request.`,
    "",
    `--- ORDER SUMMARY ---`,
    ...itemLines,
    p.notes ? `  Note: ${p.notes}` : "",
    "",
    `  Subtotal: $${subtotal.toFixed(2)}`,
    `  GST (5%): $${gst.toFixed(2)}`,
    `  PST (6%): $${pst.toFixed(2)}`,
    `  TOTAL:    $${total.toFixed(2)} CAD`,
    "",
    `--- PAY NOW ---`,
    paymentUrl,
    "",
    `Reference: ${orderNumber}`,
    "",
    `Questions? Reply to this email or call (306) 954-8688.`,
    "",
    ...(accountInfo?.isNewAccount ? [
      `--- YOUR ACCOUNT ---`,
      `We've created a free account for you at truecolorprinting.ca.`,
      `Log in instantly (link valid 1 hour): ${accountInfo.accountLink}`,
      `You can set a permanent password from your account page.`,
      "",
    ] : accountInfo ? [
      `View this and all past orders: ${accountInfo.accountLink}`,
      "",
    ] : []),
    `True Color Display Printing`,
    `216 33rd St W · Saskatoon, SK`,
    `info@true-color.ca`,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");
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
