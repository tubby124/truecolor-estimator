/**
 * src/lib/email/statusUpdate.ts
 *
 * Sends customer notification emails when staff advances an order status.
 * Triggered from PATCH /api/staff/orders/[id]/status
 *
 * Emails sent for:
 *   payment_received  → "Payment confirmed — your order is queued"
 *   in_production     → "We're printing your order now"
 *   ready_for_pickup  → "Your order is ready for pickup!"
 *
 * No email for: pending_payment (customer already has confirmation), complete (staff-side only)
 */

import nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusUpdateParams {
  status: "payment_received" | "in_production" | "ready_for_pickup";
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  isRush: boolean;
  paymentMethod?: string; // "clover_card" | "etransfer" — affects payment_received wording
}

// ─── Transporter ──────────────────────────────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP not configured");
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: 10_000, greetingTimeout: 5_000, socketTimeout: 15_000 });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function sendOrderStatusEmail(params: StatusUpdateParams): Promise<void> {
  const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
  const subject = buildSubject(params);
  const html = buildHtml(params);
  const text = buildText(params);

  const transporter = getTransporter();
  await transporter.sendMail({ from, to: params.customerEmail, subject, html, text });

  console.log(
    `[statusUpdate] email sent → ${params.customerEmail} | ${params.orderNumber} | status: ${params.status}`
  );
}

// ─── Subject lines ────────────────────────────────────────────────────────────

function buildSubject(p: StatusUpdateParams): string {
  switch (p.status) {
    case "payment_received":
      return `Payment received — order ${p.orderNumber} is in the queue`;
    case "in_production":
      return `We're printing your order ${p.orderNumber} now`;
    case "ready_for_pickup":
      return `Your order ${p.orderNumber} is ready for pickup!`;
  }
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHtml(p: StatusUpdateParams): string {
  const { status, orderNumber, customerName, total, isRush, paymentMethod } = p;
  const paymentLabel = paymentMethod === "clover_card" ? "card payment" : "e-Transfer";

  const configs = {
    payment_received: {
      accentColor: "#16a34a",
      headerBg: "#f0fdf4",
      headerBorder: "#86efac",
      icon: "✓",
      iconBg: "#16a34a",
      headline: "Payment confirmed!",
      subline: `Your ${paymentLabel} of <strong>$${total.toFixed(2)} CAD</strong> has been received. Your order is now in our production queue.`,
      bodyContent: `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#15803d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            What happens next
          </p>
          <p style="margin:0;font-size:13px;color:#166534;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;">
            ${isRush
              ? "Your <strong>rush order</strong> is being prioritized — we'll start printing today and contact you when it's ready."
              : "We'll start printing within 1 business day and email you as soon as your order is ready for pickup."}
          </p>
        </div>`,
    },
    in_production: {
      accentColor: "#7c3aed",
      headerBg: "#faf5ff",
      headerBorder: "#c4b5fd",
      icon: "⚙",
      iconBg: "#7c3aed",
      headline: isRush ? "Rush order in production!" : "We're printing your order!",
      subline: isRush
        ? "Your rush order is being printed right now — same-day priority."
        : "Great news — your order is now in production. We'll email you as soon as it's ready.",
      bodyContent: `
        <div style="background:#faf5ff;border:1px solid #c4b5fd;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#6d28d9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Estimated turnaround
          </p>
          <p style="margin:0;font-size:13px;color:#5b21b6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;">
            ${isRush
              ? "Same-day — we'll contact you today when it's ready."
              : "Typically 1–3 business days. We'll send you a pickup notification email as soon as it's done."}
          </p>
        </div>`,
    },
    ready_for_pickup: {
      accentColor: "#16C2F3",
      headerBg: "#f0fbff",
      headerBorder: "#7dd3fc",
      icon: "★",
      iconBg: "#16C2F3",
      headline: "Your order is ready!",
      subline: "Everything looks great — come pick it up at your convenience during business hours.",
      bodyContent: `
        <div style="background:#f0fbff;border:1px solid #7dd3fc;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0369a1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Pickup location
          </p>
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            216 33rd St W, Saskatoon, SK
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:#0c4a6e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Monday – Friday &nbsp;9 AM – 5 PM
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Please bring your order number: <strong style="color:#1c1712;">${escHtml(orderNumber)}</strong>
          </p>
        </div>`,
    },
  } as const;

  const c = configs[status];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${escHtml(buildSubject(p))}</title>
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
          <td style="background:#fff;padding:36px 32px 24px;text-align:center;border-top:3px solid ${escHtml(c.accentColor)};">
            <div style="display:inline-block;width:50px;height:50px;background:${escHtml(c.accentColor)};border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
              <span style="font-size:22px;color:#fff;line-height:50px;display:inline-block;">${c.icon}</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${c.headline}
            </h1>
            <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Hi ${escHtml(customerName)}, ${c.subline}
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
            ${c.bodyContent}

            <!-- Questions block -->
            <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#7a1818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
                Questions? Reply to this email or reach us at
                <a href="mailto:info@true-color.ca" style="color:#e52222;font-weight:600;text-decoration:none;">info@true-color.ca</a>
                or <a href="tel:+13069548688" style="color:#e52222;font-weight:600;text-decoration:none;">(306) 954-8688</a>.
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

function buildText(p: StatusUpdateParams): string {
  const { status, orderNumber, customerName, total, isRush, paymentMethod } = p;
  const paymentLabel = paymentMethod === "clover_card" ? "card payment" : "e-Transfer payment";

  const messages = {
    payment_received: [
      `Hi ${customerName},`,
      "",
      `We've received your ${paymentLabel} of $${total.toFixed(2)} CAD.`,
      `Your order ${orderNumber} is now in our production queue.`,
      "",
      isRush
        ? "Your rush order is being prioritized — we'll start printing today."
        : "We'll start printing within 1 business day and email you when it's ready.",
    ],
    in_production: [
      `Hi ${customerName},`,
      "",
      `Great news — your order ${orderNumber} is now in production!`,
      "",
      isRush
        ? "Your rush order is being printed right now — same-day priority."
        : "We'll send you another email as soon as it's ready for pickup (typically 1–3 business days).",
    ],
    ready_for_pickup: [
      `Hi ${customerName},`,
      "",
      `Your order ${orderNumber} is ready for pickup!`,
      "",
      "Pickup location:",
      "216 33rd St W, Saskatoon, SK",
      "Monday – Friday  9 AM – 5 PM",
      "",
      `Please bring your order number: ${orderNumber}`,
    ],
  };

  return [
    ...messages[status],
    "",
    "Questions? Reply to this email or call (306) 954-8688.",
    "",
    "— True Color Display Printing",
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
