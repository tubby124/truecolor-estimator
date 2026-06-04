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
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { accountSection, accountSectionText } from "./components/accountSection";
import { orderTrackingNudge, orderTrackingNudgeText } from "./components/orderTrackingNudge";
import { escHtml } from "./components/escHtml";

export interface PaymentRequestItem {
  product: string;
  qty: number;
  details?: string;
  amount: number;
  // ── Albert-format spec fields (all optional) ──
  // When present, the email body renders these as a multi-line spec block matching
  // the format Albert has used in plain-text quotes for years. Falls back to a
  // single-line description if none are set (preserves legacy behavior).
  kind?: "product" | "fee";
  material?: string;
  sides?: string;
  size?: string;
  process?: string;
  unitPrice?: number;
  albertBlock?: string;  // pre-rendered multi-line block from the API route
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
  /** True = quote-framed email with an Approve & Pay CTA. The paymentUrl is still required
   *  because quote emails let the customer pay immediately to approve the quote. */
  quoteOnly?: boolean;
  notes?: string | null;
  accountInfo?: AccountInfo | null;
  discount_code?: string;
  discount_amount?: number;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function sendPaymentRequestEmail(
  params: PaymentRequestEmailParams
): Promise<void> {
  const { orderNumber, contact, total, quoteOnly } = params;

  const subject = quoteOnly
    ? `Your Quote — $${total.toFixed(2)} CAD | True Color Display Printing`
    : `Payment Request — $${total.toFixed(2)} CAD | True Color Display Printing`;

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

/**
 * Render one line-item row.
 *
 * Three render modes (auto-detected from item shape):
 *   1. FEE LINE         — kind="fee", short single-line "Name : $X plus tax"
 *   2. ALBERT BLOCK     — kind="product" + ≥1 spec field (material/sides/size/process),
 *                         renders multi-line "Material : ... / Colour : ... / Size : ..."
 *   3. LEGACY FALLBACK  — no spec fields at all, renders the old "Nx Product — Details" format
 *
 * Every line in the spec block is conditional — we never print empty fields. The
 * Quantity + Unit Price lines only appear when meaningful (qty > 1 or unitPrice > 0).
 */
function buildItemRowHtml(item: PaymentRequestItem): string {
  const qtyPrefix = item.qty > 1 ? `${item.qty}x ` : "";

  // ── 1. FEE LINE — no spec block ──
  if (item.kind === "fee") {
    const note = item.details?.trim() ? ` <span style="color:#9ca3af; font-weight: normal;">(${escHtml(item.details)})</span>` : "";
    return `<tr style="background: #ffffff;">
      <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #f0ebe4; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <strong style="font-weight: 600;">${escHtml(item.product)}</strong>${note}
      </td>
      <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; font-variant-numeric: tabular-nums; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        $${item.amount.toFixed(2)}
      </td>
    </tr>`;
  }

  const hasSpecFields = !!(item.material?.trim() || item.sides?.trim() || item.size?.trim() || item.process?.trim());

  // ── 2. ALBERT BLOCK — spec fields present ──
  if (hasSpecFields) {
    // Build the headline. Prefer title (project name) if set, otherwise product name.
    // If both exist and differ, show "Title (Product)" so the customer sees both.
    const titled = item.product?.trim() || "";
    const headlineHtml = `<strong style="font-weight: 600; font-size: 14px; color: #111827;">${escHtml(qtyPrefix)}${escHtml(titled)}</strong>`;

    // One line per filled spec field. Label column ~80px so columns align visually.
    const specRows: string[] = [];
    const addRow = (label: string, value: string) => {
      specRows.push(
        `<div style="display:flex; gap:8px; font-size:13px; line-height:1.55; color:#374151; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <span style="min-width:80px; color:#9ca3af; font-weight:600;">${escHtml(label)}</span>
          <span style="color:#1f2937;">${escHtml(value)}</span>
        </div>`
      );
    };

    if (item.material?.trim()) addRow("Material", item.material.trim());
    if (item.sides?.trim()) addRow("Colour", item.sides.trim());
    if (item.size?.trim()) addRow("Size", item.size.trim());
    if (item.process?.trim()) addRow("Process", item.process.trim());
    addRow("Quantity", String(item.qty));
    if (item.unitPrice && item.unitPrice > 0 && item.qty > 1) {
      addRow("Unit Price", `$ ${item.unitPrice.toFixed(2)} for each`);
    }
    if (item.details?.trim()) addRow("Notes", item.details.trim());

    return `<tr style="background: #ffffff;">
      <td style="padding: 16px; border-bottom: 1px solid #f0ebe4; vertical-align: top;">
        ${headlineHtml}
        <div style="margin-top: 8px;">
          ${specRows.join("")}
        </div>
      </td>
      <td style="padding: 16px; font-size: 14px; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; font-variant-numeric: tabular-nums; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <strong style="font-weight: 700;">$${item.amount.toFixed(2)}</strong>
        <div style="font-size:11px; color:#9ca3af; font-weight:400; margin-top:2px;">plus tax</div>
      </td>
    </tr>`;
  }

  // ── 3. LEGACY FALLBACK — no spec fields, render the old way ──
  const details = item.details?.trim()
    ? `<span style="font-size: 12px; color: #6b7280; display: block; margin-top: 2px;">${escHtml(item.details)}</span>`
    : "";
  return `<tr style="background: #ffffff;">
    <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #f0ebe4; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <strong style="font-weight: 600;">${escHtml(qtyPrefix)}${escHtml(item.product)}</strong>
      ${details}
    </td>
    <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; font-variant-numeric: tabular-nums; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      $${item.amount.toFixed(2)}
    </td>
  </tr>`;
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildPaymentRequestHtml(p: PaymentRequestEmailParams): string {
  const { orderNumber, contact, items, subtotal, gst, pst, total, paymentUrl, paymentMethod, quoteOnly, notes, accountInfo, discount_code, discount_amount } = p;

  const heroTitle = quoteOnly ? "Your Quote" : "Payment Request";
  const methodNote = quoteOnly
    ? "Review the line items below. You can pay the Clover link to approve and lock in the quote, or reply to this email — or call (306) 954-8688 — if you'd like changes first."
    : paymentMethod === "wave"
      ? "You can view and pay your invoice online using the button below."
      : "Click the button below to pay securely by credit card via Clover.";

  // Build item rows.
  // Renders Albert's spec block (Material/Colour/Size/Process/Quantity/Unit Price/Total)
  // when structured fields are present, falling back to a 1-line description otherwise.
  const itemRows = items.map((item) => buildItemRowHtml(item)).join("\n");

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

          ${emailHeader()}

          <!-- ── HERO ── -->
          <tr>
            <td style="background: #ffffff; padding: 36px 32px 20px; text-align: center; border-top: 3px solid #16C2F3;">

              <div style="display: inline-block; width: 50px; height: 50px; background-color: #16C2F3; border-radius: 50%; line-height: 50px; text-align: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: #ffffff; line-height: 50px; display: inline-block;">$</span>
              </div>

              <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${heroTitle}
              </h1>
              <p style="margin: 0 0 18px; font-size: 14px; color: #6b7280; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${quoteOnly
                  ? `Hi ${escHtml(contact.name)}, here's your quote from True Color Display Printing. ${escHtml(methodNote)}`
                  : `Hi ${escHtml(contact.name)}, True Color Display Printing has sent you a payment request. ${escHtml(methodNote)}`}
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

                  <!-- Discount row (only shown when discount is applied) -->
                  ${discount_code && discount_amount && discount_amount > 0 ? `<tr style="background: #f0fdf4;">
                    <td style="padding: 4px 16px; font-size: 13px; color: #059669; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Discount (${escHtml(discount_code)})
                    </td>
                    <td style="padding: 4px 16px; font-size: 13px; color: #059669; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      -$${discount_amount.toFixed(2)}
                    </td>
                  </tr>` : ""}

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

              <!-- CTA — Pay Now (same button for quote + invoice; the quote IS the invoice) -->
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${quoteOnly ? "Approve & Pay" : "Payment"}
              </p>
              <div style="background: #f0fbff; border: 1px solid #7de0f7; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #0c4a6e; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ${quoteOnly
                    ? `Pay <strong>$${total.toFixed(2)} CAD</strong> to lock in your quote — or reply to this email if you'd like changes first.`
                    : `Click the button below to pay <strong>$${total.toFixed(2)} CAD</strong> securely online. Your payment is protected by Clover.`}
                </p>
                <a href="${escHtml(paymentUrl)}"
                  style="display: inline-block; background: #16C2F3; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.01em;">
                  Pay $${total.toFixed(2)} Now &rarr;
                </a>
                <p style="margin: 14px 0 0; font-size: 11px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ${quoteOnly
                    ? `Need changes? Reply to this email or call <a href="tel:+13069548688" style="color: #0369a1; text-decoration: none;">(306) 954-8688</a>`
                    : `Questions? Reply to this email or call <a href="tel:+13069548688" style="color: #0369a1; text-decoration: none;">(306) 954-8688</a>`}
                </p>
              </div>

              <!-- e-Transfer alternative -->
              <div style="background: #fdfaf5; border: 1px solid #e8dcc4; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #1c1712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Prefer Interac e-Transfer?
                </p>
                <p style="margin: 0; font-size: 13px; color: #4a3728; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Send <strong>$${total.toFixed(2)} CAD</strong> to
                  <a href="mailto:info@true-color.ca" style="color: #0369a1; text-decoration: none; font-weight: 600;">info@true-color.ca</a>
                  and put <strong>${escHtml(orderNumber)}</strong> in the message. We&rsquo;ll confirm receipt and start production within 1 business day.
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

              ${accountInfo ? accountSection({ isNewAccount: accountInfo.isNewAccount, accountLink: accountInfo.accountLink, customerName: contact.name }) : ""}

              ${orderTrackingNudge()}

            </td>
          </tr>

          ${emailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

function buildPaymentRequestText(p: PaymentRequestEmailParams): string {
  const { orderNumber, contact, items, subtotal, gst, pst, total, paymentUrl, quoteOnly, accountInfo, discount_code, discount_amount } = p;

  // Plain-text rendering uses Albert's pre-built block when available (kind="product"
  // with spec fields), and falls back to a 1-line representation otherwise.
  const itemLines: string[] = [];
  items.forEach((item, idx) => {
    if (idx > 0) itemLines.push("");
    if (item.albertBlock && item.albertBlock.trim()) {
      itemLines.push(...item.albertBlock.split("\n").map((l) => `  ${l}`));
    } else if (item.kind === "fee") {
      const note = item.details?.trim() ? ` (${item.details.trim()})` : "";
      itemLines.push(`  ${item.product}${note} : $ ${item.amount.toFixed(2)} plus tax`);
    } else {
      const qty = item.qty > 1 ? `${item.qty}x ` : "";
      const details = item.details?.trim() ? ` — ${item.details.trim()}` : "";
      itemLines.push(`  ${qty}${item.product}${details}  $${item.amount.toFixed(2)}`);
    }
  });

  const ctaBlock = quoteOnly
    ? [
        `--- APPROVE & PAY ---`,
        `Pay $${total.toFixed(2)} CAD to lock in your quote:`,
        paymentUrl,
        ``,
        `Need changes? Reply to this email or call (306) 954-8688.`,
      ]
    : [
        `--- PAY NOW ---`,
        paymentUrl,
      ];

  const etransferBlock = [
    ``,
    `--- PREFER E-TRANSFER? ---`,
    `Send $${total.toFixed(2)} CAD to info@true-color.ca and put ${orderNumber} in the message.`,
    `We'll confirm receipt and start production within 1 business day.`,
  ];

  return [
    `Hi ${contact.name},`,
    "",
    quoteOnly
      ? `Here's your quote from True Color Display Printing.`
      : `True Color Display Printing has sent you a payment request.`,
    "",
    quoteOnly ? `--- QUOTE SUMMARY ---` : `--- ORDER SUMMARY ---`,
    ...itemLines,
    p.notes ? `  Note: ${p.notes}` : "",
    "",
    `  Subtotal: $${subtotal.toFixed(2)}`,
    ...(discount_code && discount_amount && discount_amount > 0 ? [`  Discount (${discount_code}): -$${discount_amount.toFixed(2)}`] : []),
    `  GST (5%): $${gst.toFixed(2)}`,
    `  PST (6%): $${pst.toFixed(2)}`,
    `  TOTAL:    $${total.toFixed(2)} CAD`,
    "",
    ...ctaBlock,
    ...etransferBlock,
    "",
    `Reference: ${orderNumber}`,
    "",
    `Questions? Reply to this email or call (306) 954-8688.`,
    "",
    ...(accountInfo ? [accountSectionText({ isNewAccount: accountInfo.isNewAccount, accountLink: accountInfo.accountLink, customerName: contact.name })] : []),
    orderTrackingNudgeText(),
    `True Color Display Printing`,
    `216 33rd St W · Saskatoon, SK`,
    `info@true-color.ca`,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");
}
