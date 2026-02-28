/**
 * src/lib/email/staffNotification.ts
 *
 * Sends an operational HTML notification email to staff on every new order.
 * Unlike the customer confirmation email, this includes:
 *   - Customer phone number (clickable tel: link)
 *   - Design status badges (colour-coded)
 *   - File links — 7-day signed URLs via service role
 *   - Direct link to staff dashboard
 *   - RUSH banner in red when applicable
 *   - eTransfer warning to NOT start printing until payment confirmed
 */

import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffOrderNotificationParams {
  orderNumber: string;
  contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
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
  notes: string | null;
  filePaths: string[];
  siteUrl: string;
}

// ─── Transporter ─────────────────────────────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP environment variables not configured — need SMTP_HOST, SMTP_USER, SMTP_PASS");
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: 10_000, greetingTimeout: 5_000, socketTimeout: 15_000 });
}

// ─── Signed file URLs via service role ───────────────────────────────────────

async function getSignedFileUrls(
  paths: string[]
): Promise<Array<{ filename: string; url: string | null }>> {
  if (!paths.length) return [];
  try {
    const supabase = createServiceClient();
    return await Promise.all(
      paths.map(async (path) => {
        const filename = path.split("/").pop() ?? path;
        const { data } = await supabase.storage
          .from("print-files")
          .createSignedUrl(path, 60 * 60 * 24 * 7); // 7-day expiry
        return { filename, url: data?.signedUrl ?? null };
      })
    );
  } catch {
    // Non-fatal — return empty links rather than crashing the email
    return paths.map((p) => ({ filename: p.split("/").pop() ?? p, url: null }));
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function sendStaffOrderNotification(
  params: StaffOrderNotificationParams
): Promise<void> {
  const { orderNumber, contact, is_rush, payment_method, total, filePaths, siteUrl } = params;

  const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
  const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";

  const paymentLabel = payment_method === "clover_card" ? "Card (Clover)" : "e-Transfer";
  const rushPrefix = is_rush ? "[RUSH] " : "";
  const subject = `${rushPrefix}NEW ORDER ${orderNumber} · ${contact.name} · $${total.toFixed(2)} · ${paymentLabel}`;

  const fileLinks = await getSignedFileUrls(filePaths);
  const html = buildStaffNotificationHtml(params, fileLinks, siteUrl);
  const text = buildStaffNotificationText(params, fileLinks, siteUrl);

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: staffEmail,
    subject,
    priority: "high",
    html,
    text,
  });

  console.log(
    `[staffNotification] sent → ${staffEmail} | order ${orderNumber} | ${paymentLabel} | $${total.toFixed(2)}`
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildStaffNotificationHtml(
  p: StaffOrderNotificationParams,
  fileLinks: Array<{ filename: string; url: string | null }>,
  siteUrl: string
): string {
  const { orderNumber, contact, items, subtotal, gst, total, is_rush, payment_method, notes } = p;
  const RUSH_FEE = 40;

  const now = new Date().toLocaleString("en-CA", {
    timeZone: "America/Regina",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // ── Alert banner ──
  const alertBanner = is_rush
    ? `<div style="background: #dc2626; padding: 14px 32px; text-align: center;">
        <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.02em;">
          ⚡ RUSH ORDER — Same-day priority
        </p>
      </div>`
    : `<div style="background: #16C2F3; padding: 10px 32px; text-align: center;">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          New order received
        </p>
      </div>`;

  // ── Item rows ──
  const itemRows = items
    .map((item, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#faf8f6";
      const dimPart =
        item.width_in && item.height_in
          ? `${item.width_in}" × ${item.height_in}" (${(item.width_in / 12).toFixed(1)} × ${(item.height_in / 12).toFixed(1)} ft)`
          : "";
      const sidesPart = item.sides === 2 ? "2-sided" : "1-sided";

      const designBg: Record<string, string> = {
        PRINT_READY: "#dcfce7",
        NEED_DESIGN: "#fee2e2",
        NEED_TOUCHUP: "#fef9c3",
      };
      const designColor: Record<string, string> = {
        PRINT_READY: "#166534",
        NEED_DESIGN: "#991b1b",
        NEED_TOUCHUP: "#713f12",
      };
      const designLabel: Record<string, string> = {
        PRINT_READY: "Print-ready",
        NEED_DESIGN: "Needs design",
        NEED_TOUCHUP: "Needs touch-up",
      };
      const dsBg = designBg[item.design_status] ?? "#f3f4f6";
      const dsColor = designColor[item.design_status] ?? "#374151";
      const dsLabel = designLabel[item.design_status] ?? item.design_status;

      const meta = [dimPart, `Qty: ${item.qty}`, sidesPart]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr style="background: ${bg};">
          <td style="padding: 12px 16px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #f0ebe4; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <strong style="display: block; font-weight: 600; font-size: 14px;">${escHtml(item.product_name)}</strong>
            <span style="font-size: 12px; color: #6b7280; display: block; margin-top: 2px;">${escHtml(meta)}</span>
            <span style="display: inline-block; margin-top: 4px; background: ${dsBg}; color: ${dsColor}; font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 4px;">${escHtml(dsLabel)}</span>
          </td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right; border-bottom: 1px solid #f0ebe4; white-space: nowrap; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            $${item.line_total.toFixed(2)}
          </td>
        </tr>`;
    })
    .join("");

  // ── Rush fee row ──
  const rushRow = is_rush
    ? `<tr style="background: #fff8f0;">
        <td style="padding: 10px 16px; font-size: 13px; color: #b45309; border-bottom: 1px solid #f0d0a8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Rush fee
        </td>
        <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #b45309; text-align: right; border-bottom: 1px solid #f0d0a8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          $${RUSH_FEE.toFixed(2)}
        </td>
      </tr>`
    : "";

  // ── Payment block ──
  const paymentBlock =
    payment_method === "clover_card"
      ? `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #15803d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ✓ Card payment captured — Clover
          </p>
          <p style="margin: 0; font-size: 12px; color: #166534; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            $${total.toFixed(2)} CAD charged. Safe to begin production.
          </p>
        </div>`
      : `<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ⏳ e-Transfer pending — DO NOT start printing yet
          </p>
          <p style="margin: 0; font-size: 12px; color: #78350f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            Awaiting $${total.toFixed(2)} CAD to info@true-color.ca. Start production once payment is confirmed.
          </p>
        </div>`;

  // ── Customer notes ──
  const notesBlock = notes?.trim()
    ? `<div style="background: #faf8f6; border-left: 3px solid #d6cfc7; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Customer Notes</p>
        <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(notes)}</p>
      </div>`
    : "";

  // ── File links ──
  const filesBlock =
    fileLinks.length > 0
      ? `<p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Uploaded Files
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          ${fileLinks
            .map((f) =>
              f.url
                ? `<p style="margin: 0 0 6px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    📎 <a href="${f.url}" style="color: #16C2F3; text-decoration: none; font-weight: 600;">${escHtml(f.filename)}</a>
                    <span style="font-size: 11px; color: #9ca3af; margin-left: 6px;">(link valid 7 days)</span>
                  </p>`
                : `<p style="margin: 0 0 6px; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    📎 ${escHtml(f.filename)} <span style="color: #9ca3af;">(link unavailable)</span>
                  </p>`
            )
            .join("")}
        </div>`
      : `<p style="font-size: 13px; color: #9ca3af; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          No files uploaded — customer will bring artwork separately.
        </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order ${escHtml(orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4efe9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color: #f4efe9; padding: 32px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" style="max-width: 580px;" cellpadding="0" cellspacing="0">

          <!-- ── DARK HEADER ── -->
          <tr>
            <td style="background-color: #1c1712; border-radius: 12px 12px 0 0; padding: 18px 32px;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #d6cfc7; letter-spacing: 0.08em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color — Staff Order Notification
              </p>
              <p style="margin: 2px 0 0; font-size: 11px; color: #7a6a60; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(now)} (Saskatchewan time)</p>
            </td>
          </tr>

          <!-- ── ALERT BANNER ── -->
          <tr><td>${alertBanner}</td></tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background: #ffffff; padding: 24px 32px 32px;">

              <!-- Order number + CTA -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div>
                  <p style="margin: 0; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Order</p>
                  <p style="margin: 2px 0 0; font-size: 22px; font-weight: 700; color: #1c1712; letter-spacing: 0.03em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(orderNumber)}</p>
                </div>
                <a href="${siteUrl}/staff/orders"
                  style="display: inline-block; background: #16C2F3; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Open Staff Dashboard →
                </a>
              </div>

              <!-- ── CUSTOMER BLOCK ── -->
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Customer</p>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 13px; color: #374151; padding-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 80px;">
                      <strong style="color: #1c1712;">Name</strong>
                    </td>
                    <td style="font-size: 13px; color: #1c1712; padding-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      ${escHtml(contact.name)}${contact.company ? ` &mdash; ${escHtml(contact.company)}` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #374151; padding-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      <strong style="color: #1c1712;">Email</strong>
                    </td>
                    <td style="font-size: 13px; padding-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      <a href="mailto:${escHtml(contact.email)}" style="color: #16C2F3; text-decoration: none;">${escHtml(contact.email)}</a>
                    </td>
                  </tr>
                  ${contact.phone ? `
                  <tr>
                    <td style="font-size: 13px; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      <strong style="color: #1c1712;">Phone</strong>
                    </td>
                    <td style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      <a href="tel:${escHtml(contact.phone)}" style="color: #1c1712; text-decoration: none; font-weight: 600;">${escHtml(contact.phone)}</a>
                    </td>
                  </tr>` : ""}
                </table>
              </div>

              <!-- ── ITEMS TABLE ── -->
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border: 1px solid #e2dbd4; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f9f6f3;">
                    <th style="padding: 9px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Item</th>
                    <th style="padding: 9px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  ${rushRow}
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 8px 16px; font-size: 12px; color: #7a6560; border-top: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Subtotal</td>
                    <td style="padding: 8px 16px; font-size: 12px; color: #4a3728; text-align: right; border-top: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 4px 16px 8px; font-size: 12px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">GST (5%)</td>
                    <td style="padding: 4px 16px 8px; font-size: 12px; color: #4a3728; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${gst.toFixed(2)}</td>
                  </tr>
                  <tr style="background: #1c1712;">
                    <td style="padding: 14px 16px; font-size: 14px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">TOTAL</td>
                    <td style="padding: 14px 16px; font-size: 18px; font-weight: 700; color: #ffffff; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${total.toFixed(2)} CAD</td>
                  </tr>
                </tbody>
              </table>

              <!-- ── PAYMENT ── -->
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Payment</p>
              ${paymentBlock}

              <!-- ── NOTES ── -->
              ${notesBlock}

              <!-- ── FILES ── -->
              ${filesBlock}

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background: #1c1712; border-radius: 0 0 12px 12px; padding: 16px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #7a6a60; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color Display Printing — Internal staff notification only
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

function buildStaffNotificationText(
  p: StaffOrderNotificationParams,
  fileLinks: Array<{ filename: string; url: string | null }>,
  siteUrl: string
): string {
  const { orderNumber, contact, items, subtotal, gst, total, is_rush, payment_method, notes } = p;
  const RUSH_FEE = 40;

  const lines: string[] = [
    is_rush ? "⚡ RUSH ORDER — SAME-DAY PRIORITY" : "NEW ORDER",
    "=".repeat(50),
    "",
    `Order: ${orderNumber}`,
    `Staff dashboard: ${siteUrl}/staff/orders`,
    "",
    "CUSTOMER",
    `Name:    ${contact.name}${contact.company ? ` (${contact.company})` : ""}`,
    `Email:   ${contact.email}`,
    contact.phone ? `Phone:   ${contact.phone}` : "",
    "",
    "ITEMS",
    ...items.map((item) => {
      const dim =
        item.width_in && item.height_in
          ? ` ${item.width_in}" × ${item.height_in}"`
          : "";
      return `  - ${item.product_name}${dim} × Qty ${item.qty} [${item.design_status}] — $${item.line_total.toFixed(2)}`;
    }),
    "",
    is_rush ? `  Rush fee: $${RUSH_FEE.toFixed(2)}` : "",
    `  Subtotal: $${subtotal.toFixed(2)}`,
    `  GST (5%): $${gst.toFixed(2)}`,
    `  TOTAL:    $${total.toFixed(2)} CAD`,
    "",
    "PAYMENT",
    payment_method === "clover_card"
      ? `Card charged — $${total.toFixed(2)} via Clover. Safe to begin production.`
      : `e-Transfer PENDING — $${total.toFixed(2)} to info@true-color.ca. DO NOT start printing yet.`,
    "",
    notes ? `CUSTOMER NOTES\n${notes}` : "",
    fileLinks.length > 0
      ? [
          "FILES",
          ...fileLinks.map((f) =>
            f.url ? `  ${f.filename}: ${f.url}` : `  ${f.filename}: (link unavailable)`
          ),
        ].join("\n")
      : "FILES: None uploaded",
    "",
    "True Color Display Printing — Internal staff notification",
  ].filter((l) => l !== null && l !== undefined);

  return lines.join("\n");
}

// ─── Customer file revision notification ──────────────────────────────────────

export interface CustomerFileRevisionParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fileName: string;
  fileUrl: string;
  orderId: string;
  siteUrl: string;
}

export async function sendCustomerFileRevisionNotification(
  params: CustomerFileRevisionParams
): Promise<void> {
  const { orderNumber, customerName, customerEmail, fileName, fileUrl, siteUrl } = params;

  const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
  const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const subject = `[File updated] Order ${orderNumber} — ${customerName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <tr><td style="background:#1c1712;border-radius:12px 12px 0 0;padding:18px 32px;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#d6cfc7;letter-spacing:.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            True Color — Customer File Update
          </p>
        </td></tr>

        <tr><td style="background:#fffbeb;border-top:3px solid #f59e0b;padding:14px 32px;text-align:center;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#92400e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Customer uploaded a revised artwork file
          </p>
        </td></tr>

        <tr><td style="background:#fff;padding:24px 32px 32px;">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
            <div>
              <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Order</p>
              <p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(orderNumber)}</p>
            </div>
            <a href="${escHtml(siteUrl)}/staff/orders"
              style="display:inline-block;background:#16C2F3;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Open Staff Dashboard →
            </a>
          </div>

          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Customer</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:13px;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong>${escHtml(customerName)}</strong></p>
            <p style="margin:0;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="mailto:${escHtml(customerEmail)}" style="color:#16C2F3;text-decoration:none;">${escHtml(customerEmail)}</a>
            </p>
          </div>

          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Uploaded file</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;">
            <p style="margin:0;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              📎 <a href="${escHtml(fileUrl)}" target="_blank" style="color:#16C2F3;text-decoration:none;font-weight:600;">${escHtml(fileName)}</a>
              <span style="font-size:11px;color:#9ca3af;margin-left:6px;">(link valid 7 days)</span>
            </p>
          </div>

        </td></tr>

        <tr><td style="background:#1c1712;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            True Color Display Printing — Internal staff notification only
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `[File updated] Order ${orderNumber}`,
    "",
    `Customer: ${customerName} <${customerEmail}>`,
    "",
    `File: ${fileName}`,
    `View: ${fileUrl}`,
    "",
    `Staff dashboard: ${siteUrl}/staff/orders`,
    "",
    "True Color Display Printing — Internal staff notification",
  ].join("\n");

  const transporter = getTransporter();
  await transporter.sendMail({ from, to: staffEmail, subject, html, text });
  console.log(`[staffNotification] file revision sent → ${staffEmail} | order ${orderNumber}`);
}

// ─── HTML escape helper ───────────────────────────────────────────────────────

function escHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
