/**
 * src/lib/email/paymentReceipt.ts
 *
 * Payment receipt email sent to customers after payment is confirmed.
 * Used by both the client account page ("Email Receipt" button) and
 * the staff orders dashboard ("Send Receipt" button).
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { escHtml } from "./components/escHtml";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  line_total: number;
}

export interface SendPaymentReceiptParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  createdAt: string; // ISO string
  items: ReceiptItem[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  isRush: boolean;
  discountCode?: string | null;
  discountAmount?: number | null;
  paymentMethod: string;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function sendPaymentReceipt(
  params: SendPaymentReceiptParams
): Promise<void> {
  const html = buildReceiptHtml(params);
  const text = buildReceiptText(params);

  await sendEmail({
    to: params.customerEmail,
    subject: `Receipt — True Color Order ${params.orderNumber}`,
    html,
    text,
  });

  console.log(
    `[paymentReceipt] sent → ${params.customerEmail} | order ${params.orderNumber}`
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildReceiptHtml(p: SendPaymentReceiptParams): string {
  const RUSH_FEE = 40;

  const orderDate = new Date(p.createdAt).toLocaleDateString("en-CA", {
    timeZone: "America/Regina",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const paymentLabel =
    p.paymentMethod === "clover_card"
      ? "Credit / debit card (Clover)"
      : p.paymentMethod === "wave"
      ? "Wave Invoice"
      : "Interac e-Transfer";

  // ── Item rows ──
  const itemRows = p.items
    .map((item, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#faf8f6";
      const dimPart =
        item.width_in && item.height_in
          ? ` — ${item.width_in}"×${item.height_in}"`
          : "";
      const sidesPart = item.sides === 2 ? " · 2-sided" : "";
      const desc = `Qty ${item.qty}${dimPart}${sidesPart}`;
      return `
        <tr style="background:${bg};">
          <td style="padding:12px 16px;font-size:13px;color:#1f2937;border-bottom:1px solid #f0ebe4;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <strong style="display:block;font-weight:600;font-size:14px;">${escHtml(item.product_name)}</strong>
            <span style="font-size:12px;color:#6b7280;">${escHtml(desc)}</span>
          </td>
          <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1f2937;text-align:right;border-bottom:1px solid #f0ebe4;white-space:nowrap;vertical-align:top;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            $${item.line_total.toFixed(2)}
          </td>
        </tr>`;
    })
    .join("");

  // ── Rush fee row ──
  const rushRow = p.isRush
    ? `<tr style="background:#fff8f0;">
        <td style="padding:8px 16px;font-size:13px;color:#b45309;border-bottom:1px solid #f0ebe4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Rush fee (same-day priority)</td>
        <td style="padding:8px 16px;font-size:13px;font-weight:600;color:#b45309;text-align:right;border-bottom:1px solid #f0ebe4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$${RUSH_FEE.toFixed(2)}</td>
      </tr>`
    : "";

  // ── Discount row ──
  const discountRow =
    p.discountAmount && p.discountAmount > 0
      ? `<tr style="background:#f0fdf4;">
          <td style="padding:8px 16px;font-size:12px;color:#15803d;border-bottom:1px solid #f0ebe4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Discount${p.discountCode ? ` (${escHtml(p.discountCode)})` : ""}
          </td>
          <td style="padding:8px 16px;font-size:12px;color:#15803d;font-weight:700;text-align:right;border-bottom:1px solid #f0ebe4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            −$${p.discountAmount.toFixed(2)}
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt — Order ${escHtml(p.orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          ${emailHeader()}

          <!-- ── PAID BANNER ── -->
          <tr>
            <td style="background:#16C2F3;padding:12px 32px;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                ✓ Payment Confirmed — Receipt
              </p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px 32px;">

              <!-- Order header -->
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
                <div>
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Order</p>
                  <p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#1c1712;letter-spacing:.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(p.orderNumber)}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(orderDate)}</p>
                </div>
                <div style="text-align:right;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Billed to</p>
                  <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(p.customerName)}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(p.customerEmail)}</p>
                </div>
              </div>

              <!-- Payment method -->
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#15803d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  ✓ Paid via ${escHtml(paymentLabel)}
                </p>
              </div>

              <!-- Items table -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e2dbd4;border-radius:8px;overflow:hidden;margin-bottom:0;">
                <thead>
                  <tr style="background:#f9f6f3;">
                    <th style="padding:9px 16px;font-size:11px;font-weight:700;color:#7a6560;text-transform:uppercase;letter-spacing:.06em;text-align:left;border-bottom:1px solid #e2dbd4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Description</th>
                    <th style="padding:9px 16px;font-size:11px;font-weight:700;color:#7a6560;text-transform:uppercase;letter-spacing:.06em;text-align:right;border-bottom:1px solid #e2dbd4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  ${rushRow}
                  ${discountRow}
                  <tr style="background:#f9f6f3;">
                    <td style="padding:8px 16px;font-size:12px;color:#7a6560;border-top:1px solid #e2dbd4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Subtotal</td>
                    <td style="padding:8px 16px;font-size:12px;color:#4a3728;text-align:right;border-top:1px solid #e2dbd4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$${p.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr style="background:#f9f6f3;">
                    <td style="padding:4px 16px;font-size:12px;color:#7a6560;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">GST (5%)</td>
                    <td style="padding:4px 16px;font-size:12px;color:#4a3728;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$${p.gst.toFixed(2)}</td>
                  </tr>
                  <tr style="background:#f9f6f3;">
                    <td style="padding:4px 16px 8px;font-size:12px;color:#7a6560;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">PST (6%)</td>
                    <td style="padding:4px 16px 8px;font-size:12px;color:#4a3728;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$${p.pst.toFixed(2)}</td>
                  </tr>
                  <tr style="background:#1c1712;">
                    <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">TOTAL</td>
                    <td style="padding:14px 16px;font-size:18px;font-weight:700;color:#ffffff;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$${p.total.toFixed(2)} CAD</td>
                  </tr>
                </tbody>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#1c1712;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#d6cfc7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                True Color Display Printing Ltd. &nbsp;·&nbsp; GST# applies &nbsp;·&nbsp; All amounts in CAD
              </p>
              <p style="margin:0;font-size:11px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                216 33rd St W, Saskatoon SK &nbsp;·&nbsp; info@true-color.ca &nbsp;·&nbsp; (306) 954-8688
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

function buildReceiptText(p: SendPaymentReceiptParams): string {
  const RUSH_FEE = 40;
  const orderDate = new Date(p.createdAt).toLocaleDateString("en-CA", {
    timeZone: "America/Regina",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const paymentLabel =
    p.paymentMethod === "clover_card"
      ? "Credit / debit card (Clover)"
      : p.paymentMethod === "wave"
      ? "Wave Invoice"
      : "Interac e-Transfer";

  const lines = [
    `PAYMENT RECEIPT — True Color Display Printing`,
    "=".repeat(50),
    "",
    `Order:    ${p.orderNumber}`,
    `Date:     ${orderDate}`,
    `Billed to: ${p.customerName} <${p.customerEmail}>`,
    `Payment:  ${paymentLabel}`,
    "",
    "ITEMS",
    ...p.items.map((item) => {
      const dim =
        item.width_in && item.height_in
          ? ` ${item.width_in}"×${item.height_in}"`
          : "";
      const sides = item.sides === 2 ? " · 2-sided" : "";
      return `  - ${item.product_name}${dim}${sides} × Qty ${item.qty} — $${item.line_total.toFixed(2)}`;
    }),
    "",
    p.isRush ? `  Rush fee:     $${RUSH_FEE.toFixed(2)}` : "",
    p.discountAmount && p.discountAmount > 0
      ? `  Discount${p.discountCode ? ` (${p.discountCode})` : ""}: -$${p.discountAmount.toFixed(2)}`
      : "",
    `  Subtotal:     $${p.subtotal.toFixed(2)}`,
    `  GST (5%):     $${p.gst.toFixed(2)}`,
    `  PST (6%):     $${p.pst.toFixed(2)}`,
    `  TOTAL:        $${p.total.toFixed(2)} CAD`,
    "",
    "True Color Display Printing Ltd.",
    "216 33rd St W, Saskatoon SK · info@true-color.ca · (306) 954-8688",
    "GST# applies · All amounts in CAD",
  ].filter(Boolean);

  return lines.join("\n");
}
