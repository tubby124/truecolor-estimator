/**
 * src/lib/email/proofSent.ts
 *
 * Sends the customer an email when staff uploads a proof for their order.
 * Triggered from POST /api/staff/orders/[id]/proof
 *
 * If the proof is an image (jpg/jpeg/png/webp): renders inline in email body.
 * If the proof is a PDF: shows a download button instead.
 */

import { getSmtpTransporter } from "./smtp";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProofSentParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  proofUrl: string;       // 7-day signed URL (or public URL fallback)
  proofIsImage: boolean;  // true → inline img; false → download button
  message?: string;       // optional staff note shown in email
  items: Array<{
    product_name: string;
    qty: number;
    width_in: number | null;
    height_in: number | null;
    sides: number;
    material_code: string | null;
    line_total: number;
  }>;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function sendProofEmail(params: ProofSentParams): Promise<void> {
  const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const subject = `Proof ready for your review — Order ${params.orderNumber}`;
  const html = buildHtml(params);
  const text = buildText(params);

  const transporter = await getSmtpTransporter();
  await transporter.sendMail({ from, to: params.customerEmail, subject, html, text });

  console.log(
    `[proofSent] email sent → ${params.customerEmail} | ${params.orderNumber}`
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHtml(p: ProofSentParams): string {
  const { orderNumber, customerName, proofUrl, proofIsImage, message, items } = p;

  // Proof block — image inline or PDF download button
  const proofBlock = proofIsImage
    ? `
      <img
        src="${escHtml(proofUrl)}"
        alt="Print proof for ${escHtml(orderNumber)}"
        style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb;display:block;margin:0 auto 12px;"
      />
      <p style="margin:0;text-align:center;">
        <a href="${escHtml(proofUrl)}" target="_blank" style="font-size:13px;color:#6366f1;text-decoration:none;font-weight:600;">
          View full size →
        </a>
      </p>`
    : `
      <div style="text-align:center;">
        <a href="${escHtml(proofUrl)}" target="_blank"
          style="display:inline-block;background:#6366f1;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">
          📄 Download proof PDF →
        </a>
      </div>`;

  // Order details table
  const itemRows = items.map((item) => {
    const size =
      item.width_in && item.height_in
        ? `${(item.width_in / 12).toFixed(1)} × ${(item.height_in / 12).toFixed(1)} ft`
        : "—";
    const sides = item.sides === 2 ? "Double-sided" : "Single-sided";
    const material = item.material_code ?? "—";
    return `
      <tr style="border-bottom:1px solid #f0ebe4;">
        <td style="padding:10px 12px;font-size:13px;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <strong>${escHtml(item.product_name)}</strong>
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          ${escHtml(size)}
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          ${item.qty}
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          ${escHtml(sides)}
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          ${escHtml(material)}
        </td>
      </tr>`;
  }).join("");

  // Optional staff note block
  const staffNoteBlock = message?.trim()
    ? `
      <div style="background:#fffbeb;border-left:4px solid #fbbf24;border-radius:6px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          Note from True Color
        </p>
        ${message.trim().split("\n").map((line) => `<p style="margin:0 0 6px;font-size:13px;color:#78350f;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(line) || "&nbsp;"}</p>`).join("")}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Proof ready — Order ${escHtml(orderNumber)}</title>
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
              Saskatoon, Saskatchewan · Canada
            </p>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="background:#fff;padding:36px 32px 24px;text-align:center;border-top:3px solid #6366f1;">
            <div style="display:inline-block;width:50px;height:50px;background:#6366f1;border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
              <span style="font-size:22px;color:#fff;line-height:50px;display:inline-block;">🖼</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Your proof is ready to review
            </h1>
            <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Hi ${escHtml(customerName)}, your proof for Order ${escHtml(orderNumber)} is ready.
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

        <!-- PROOF + BODY -->
        <tr>
          <td style="background:#fff;padding:8px 32px 32px;">

            <!-- Proof image or download button -->
            <div style="background:#f8f7ff;border:1px solid #c7d2fe;border-radius:10px;padding:20px;margin-bottom:24px;">
              ${proofBlock}
            </div>

            <!-- Staff note (if any) -->
            ${staffNoteBlock}

            <!-- Order details table -->
            ${items.length > 0 ? `
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Your order
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff;">
                <thead>
                  <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                    <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Product</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Size</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Qty</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Sides</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Material</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </div>` : ""}

            <!-- Reply instruction -->
            <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#7a1818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
                Looks good? We&rsquo;ll proceed to print. Have changes? Reply to this email and let us know.
                You can also reach us at
                <a href="mailto:info@true-color.ca" style="color:#e52222;font-weight:600;text-decoration:none;">info@true-color.ca</a>.
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
              216 33rd St W · Saskatoon, SK · Canada
            </p>
            <p style="margin:0;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="tel:+13069548688" style="color:#f08080;text-decoration:none;">(306) 954-8688</a>
              &nbsp;·&nbsp;
              <a href="mailto:info@true-color.ca" style="color:#f08080;text-decoration:none;">info@true-color.ca</a>
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

function buildText(p: ProofSentParams): string {
  const { orderNumber, customerName, proofUrl, message, items } = p;

  const itemLines = items.map((item) => {
    const size =
      item.width_in && item.height_in
        ? `${(item.width_in / 12).toFixed(1)} × ${(item.height_in / 12).toFixed(1)} ft`
        : "";
    const parts = [item.product_name, size, `qty ${item.qty}`, item.material_code ?? ""].filter(Boolean);
    return `  • ${parts.join(" — ")}`;
  });

  return [
    `Hi ${customerName},`,
    "",
    `Your proof for Order ${orderNumber} is ready to review.`,
    "",
    `View your proof: ${proofUrl}`,
    "",
    ...(items.length > 0 ? ["ORDER DETAILS", ...itemLines, ""] : []),
    ...(message?.trim() ? [`Note from True Color: ${message.trim()}`, ""] : []),
    "Looks good? We'll proceed to print. Have changes? Reply to this email and let us know.",
    "",
    "— True Color Display Printing",
    "216 33rd St W, Saskatoon, SK",
    "(306) 954-8688",
    "info@true-color.ca",
  ].join("\n");
}

// ─── HTML escape ──────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
