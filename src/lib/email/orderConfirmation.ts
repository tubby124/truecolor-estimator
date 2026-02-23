/**
 * src/lib/email/orderConfirmation.ts
 *
 * Sends an HTML order confirmation email to the customer immediately after
 * a successful order is created (card charged or eTransfer instructions).
 *
 * Nodemailer transporter pattern mirrors /api/email/send/route.ts.
 */

import nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderConfirmationParams {
  orderNumber: string;
  contact: { name: string; email: string };
  items: Array<{
    product_name: string;
    qty: number;
    width_in: number | null;
    height_in: number | null;
    sides: number;
    design_status: string;
    line_total: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
  is_rush: boolean;
  payment_method: "clover_card" | "etransfer";
  checkout_url?: string; // Clover hosted checkout URL (card orders only)
}

// ─── Transporter (same pattern as /api/email/send/route.ts) ───────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false"; // default true
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP environment variables not configured — need SMTP_HOST, SMTP_USER, SMTP_PASS"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationParams
): Promise<void> {
  const {
    orderNumber,
    contact,
    items,
    subtotal,
    gst,
    total,
    is_rush,
    payment_method,
  } = params;

  const from =
    process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const bcc = process.env.SMTP_BCC ?? undefined;
  const subject =
    payment_method === "clover_card"
      ? `Complete your payment — Order ${orderNumber} · True Color Display Printing`
      : `Order ${orderNumber} received — True Color Display Printing`;

  const html = buildOrderConfirmationHtml(params);
  const text = buildOrderConfirmationText(params);

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: contact.email,
    bcc,
    subject,
    html,
    text,
  });

  console.log(
    `[orderConfirmation] email sent → ${contact.email} | order ${orderNumber} | method ${payment_method} | total $${total.toFixed(2)}`
  );

  // suppress unused-variable warnings for simple fields accessed only in template
  void subtotal;
  void gst;
  void is_rush;
  void items;
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildOrderConfirmationHtml(p: OrderConfirmationParams): string {
  const { orderNumber, contact, items, subtotal, gst, total, is_rush, payment_method, checkout_url } = p;
  const RUSH_FEE = 40;

  // ── Line items rows ──
  const itemRows = items
    .map((item, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#faf8f6";

      const dimPart =
        item.width_in && item.height_in
          ? `${(item.width_in / 12).toFixed(2)} × ${(item.height_in / 12).toFixed(2)} ft`
          : "";

      const sidesPart = item.sides === 2 ? "2-sided" : "1-sided";

      const statusLabel: Record<string, string> = {
        PRINT_READY: "Print-ready file",
        NEED_DESIGN: "Design needed",
        NEED_TOUCHUP: "Artwork touch-up",
      };
      const designPart = statusLabel[item.design_status] ?? item.design_status;

      const meta = [dimPart, `Qty: ${item.qty}`, sidesPart, designPart]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr style="background: ${bg};">
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #f0ebe4; line-height: 1.5;">
            <strong style="display: block; font-weight: 600;">${escHtml(item.product_name)}</strong>
            <span style="font-size: 12px; color: #6b7280; display: block; margin-top: 2px;">${escHtml(meta)}</span>
          </td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; font-variant-numeric: tabular-nums; vertical-align: top;">
            $${item.line_total.toFixed(2)}
          </td>
        </tr>`;
    })
    .join("");

  // ── Rush row ──
  const rushRow = is_rush
    ? `<tr style="background: #fff8f0;">
        <td style="padding: 10px 16px; font-size: 13px; color: #7a4010; border-bottom: 1px solid #f0d0a8;">
          Rush fee (same-day priority)
        </td>
        <td style="padding: 10px 16px; font-size: 13px; color: #7a4010; text-align: right; border-bottom: 1px solid #f0d0a8; font-variant-numeric: tabular-nums;">
          $${RUSH_FEE.toFixed(2)}
        </td>
      </tr>`
    : "";

  // ── Payment note block ──
  const paymentBlock =
    payment_method === "clover_card"
      ? `<div style="background: #fff7ed; border: 1px solid #fb923c; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #9a3412; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            Complete your payment
          </p>
          <p style="margin: 0 0 14px; font-size: 13px; color: #7c2d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
            Your order is confirmed — click below to pay <strong>$${total.toFixed(2)} CAD</strong> securely via Clover.
          </p>
          ${checkout_url
            ? `<a href="${escHtml(checkout_url)}"
                style="display: inline-block; background: #ea580c; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin-bottom: 12px;">
                Pay now →
              </a>`
            : ""}
          <p style="margin: 0; font-size: 11px; color: #9a3412; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            You can also pay anytime from your <a href="https://truecolor-estimator.vercel.app/account" style="color: #9a3412;">order dashboard</a> · Questions? Email <a href="mailto:info@true-color.ca" style="color: #9a3412;">info@true-color.ca</a>
          </p>
        </div>`
      : `<div style="background: #fdf8ee; border: 1px solid #f0d890; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #7a5a00; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            Complete payment by Interac e-Transfer
          </p>
          <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #6b4c00; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.01em;">
            info@true-color.ca
          </p>
          <p style="margin: 0; font-size: 13px; color: #7a5a00; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
            Send exactly <strong>$${total.toFixed(2)} CAD</strong> · Auto-deposit enabled — no password needed.
            Your order will be queued once payment is received.
          </p>
        </div>`;

  // ── Rush banner ──
  const rushBanner = is_rush
    ? `<div style="background: #fff8f0; border: 1px solid #f0c070; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 13px; color: #7a4010; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Rush order — same-day priority turnaround (+$${RUSH_FEE.toFixed(2)} rush fee included)
        </p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Order ${escHtml(orderNumber)} confirmed — True Color Display Printing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4efe9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color: #f4efe9; padding: 32px 16px;">
    <tr>
      <td align="center">

        <!-- Card — max 560px wide -->
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

          <!-- ── CONFIRMATION HERO ── -->
          <tr>
            <td style="background: #ffffff; padding: 36px 32px 20px; text-align: center; border-top: 3px solid #16C2F3;">

              <!-- Blue check circle -->
              <div style="display: inline-block; width: 50px; height: 50px; background-color: #16C2F3; border-radius: 50%; line-height: 50px; text-align: center; margin-bottom: 16px;">
                <span style="font-size: 26px; color: #ffffff; line-height: 50px; display: inline-block;">&#10003;</span>
              </div>

              <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Order confirmed!
              </h1>
              <p style="margin: 0 0 18px; font-size: 14px; color: #6b7280; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${payment_method === "clover_card"
                  ? `Hi ${escHtml(contact.name)}, your order is saved and held for you. Complete payment below to start production.`
                  : `Hi ${escHtml(contact.name)}, thanks for your order. We have received it and will get started once payment clears.`}
              </p>

              <!-- Order number badge -->
              <div style="display: inline-block; background-color: #f4efe9; border-radius: 8px; padding: 8px 20px; border: 1px solid #ddd5c8;">
                <span style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: block; margin-bottom: 2px;">
                  Order Number
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

              <!-- Rush banner (if applicable) -->
              ${rushBanner}

              <!-- ── ORDER ITEMS TABLE ── -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Your Items
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border: 1px solid #e2dbd4; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">

                <thead>
                  <tr style="background: #f9f6f3;">
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Item
                    </th>
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Price
                    </th>
                  </tr>
                </thead>

                <tbody>
                  ${itemRows}
                  ${rushRow}

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
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      GST (5%)
                    </td>
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${gst.toFixed(2)}
                    </td>
                  </tr>

                  <!-- TOTAL row — red bar -->
                  <tr style="background: #e52222;">
                    <td style="padding: 16px; font-size: 15px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Total (CAD)
                    </td>
                    <td style="padding: 16px; font-size: 20px; font-weight: 700; color: #ffffff; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- ── PAYMENT BLOCK ── -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Payment
              </p>
              ${paymentBlock}

              <!-- ── PICKUP INFO ── -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Pickup
              </p>
              <div style="background: #faf7f4; border: 1px solid #e6ddd5; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1c1712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  216 33rd St W, Saskatoon, SK
                </p>
                <p style="margin: 0 0 4px; font-size: 13px; color: #4a3728; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Mon–Fri &nbsp;9 AM – 5 PM
                </p>
                <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Typical turnaround: <strong>1–3 business days</strong>${is_rush ? " &nbsp;(your rush order is prioritized)" : ""}.
                  We will email you when your order is ready.
                </p>
              </div>

              <!-- ── QUESTIONS ── -->
              <div style="background: #fdf4f4; border: 1px solid #f0bfbb; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px;">
                <p style="margin: 0; font-size: 13px; color: #7a1818; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
                  Questions? Reply to this email or reach us at
                  <a href="mailto:info@true-color.ca" style="color: #e52222; font-weight: 600; text-decoration: none;">info@true-color.ca</a>
                  — we respond same business day.
                </p>
              </div>

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
              <p style="margin: 0 0 8px; font-size: 12px; color: #9c928a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <a href="tel:+13066528888" style="color: #f08080; text-decoration: none;">(306) 652-8888</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@true-color.ca" style="color: #f08080; text-decoration: none;">info@true-color.ca</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                All prices in CAD · GST included
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

function buildOrderConfirmationText(p: OrderConfirmationParams): string {
  const { orderNumber, contact, items, subtotal, gst, total, is_rush, payment_method, checkout_url } = p;
  const RUSH_FEE = 40;

  const itemLines = items.map((item) => {
    const dim =
      item.width_in && item.height_in
        ? ` (${(item.width_in / 12).toFixed(2)} × ${(item.height_in / 12).toFixed(2)} ft)`
        : "";
    return `  - ${item.product_name}${dim} × ${item.qty} — $${item.line_total.toFixed(2)}`;
  });

  const payNote =
    payment_method === "clover_card"
      ? `Please complete your payment of $${total.toFixed(2)} CAD at:\n${checkout_url ?? "https://truecolor-estimator.vercel.app"}`
      : `Please send $${total.toFixed(2)} CAD via Interac e-Transfer to: info@true-color.ca (auto-deposit, no password).`;

  const lines = [
    `Hi ${contact.name},`,
    "",
    `Your order ${orderNumber} has been confirmed — True Color Display Printing.`,
    "",
    "--- ORDER SUMMARY ---",
    ...itemLines,
    "",
    is_rush ? `  Rush fee: $${RUSH_FEE.toFixed(2)}` : "",
    `  Subtotal: $${subtotal.toFixed(2)}`,
    `  GST (5%): $${gst.toFixed(2)}`,
    `  TOTAL:    $${total.toFixed(2)} CAD`,
    "",
    "--- PAYMENT ---",
    payNote,
    "",
    "--- PICKUP ---",
    "216 33rd St W, Saskatoon, SK",
    "Mon–Fri  9 AM – 5 PM",
    is_rush
      ? "Your rush order is prioritized — we will contact you today."
      : "Typical turnaround: 1–3 business days. We will email you when your order is ready.",
    "",
    "Questions? Reply to this email or call (306) 652-8888.",
    "",
    "True Color Display Printing",
    "Saskatoon, SK, Canada",
    "info@true-color.ca",
  ].filter((l) => l !== null && l !== undefined);

  return lines.join("\n");
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
