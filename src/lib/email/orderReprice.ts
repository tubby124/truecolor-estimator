/**
 * Customer-facing reprice email.
 *
 * Sent when staff hits "Reprice" on an order whose price needs to change
 * after the original quote (the 7ft die-cut case: design complexity not
 * caught at quote time, larger than quoted, material upgrade requested).
 *
 * Three modes — same email template, different copy:
 *   - INCREASE: customer owes delta. Pay Now link via /pay/[token].
 *   - DECREASE: customer is owed refund. Refund instruction included.
 *   - NO_CHANGE: rare — just updated specs, no $ change.
 */

import { sendEmail } from "./smtp";
import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";
import { preheader } from "./components/preheader";
import { escHtml } from "./components/escHtml";

export interface RepriceParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  originalTotal: number;
  newTotal: number;
  reason: string;          // dropdown label (e.g. "Design Complexity")
  explanation?: string | null;
  payLinkUrl?: string | null;  // present only when delta > 0
  staffEmail?: string;
  orderId?: string;
  customerId?: string;
}

const REASONS: Record<string, string> = {
  "DESIGN_COMPLEXITY":   "Design complexity higher than originally quoted",
  "LARGER_THAN_QUOTED":  "Final size larger than originally quoted",
  "MATERIAL_UPGRADE":    "Material upgrade requested",
  "ADD_ON":              "Customer add-on (rush, finishing, etc.)",
  "OTHER":               "Adjustment",
};

export async function sendOrderRepriceEmail(p: RepriceParams): Promise<void> {
  const delta = p.newTotal - p.originalTotal;
  const mode: "INCREASE" | "DECREASE" | "NO_CHANGE" =
    delta > 0.01 ? "INCREASE" : delta < -0.01 ? "DECREASE" : "NO_CHANGE";

  const reasonLabel = REASONS[p.reason] ?? p.reason;
  const fromAddr = "True Color Display Printing <hello@outreach.true-color.ca>";

  const subject =
    mode === "INCREASE"
      ? `Updated quote — ${p.orderNumber} · $${p.newTotal.toFixed(2)} CAD`
      : mode === "DECREASE"
      ? `Refund coming — ${p.orderNumber} · $${Math.abs(delta).toFixed(2)} adjustment`
      : `Updated quote — ${p.orderNumber}`;

  const preheaderText =
    mode === "INCREASE"
      ? `New total $${p.newTotal.toFixed(2)} — pay the $${delta.toFixed(2)} difference to confirm, or reply if you want to discuss.`
      : mode === "DECREASE"
      ? `New total $${p.newTotal.toFixed(2)} — $${Math.abs(delta).toFixed(2)} refund processing.`
      : `Order ${p.orderNumber} specs updated.`;

  const html = buildHtml({ ...p, delta, mode, reasonLabel, preheaderText });
  const text = buildText({ ...p, delta, mode, reasonLabel });

  await sendEmail({
    from: fromAddr,
    to: p.customerEmail,
    subject,
    html,
    text,
    orderId: p.orderId,
    customerId: p.customerId,
  });
}

function buildHtml(p: RepriceParams & { delta: number; mode: "INCREASE" | "DECREASE" | "NO_CHANGE"; reasonLabel: string; preheaderText: string }): string {
  const ctaBlock =
    p.mode === "INCREASE" && p.payLinkUrl
      ? `
        <div style="background:#f0fbff;border:1px solid #7de0f7;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 12px;font-size:14px;color:#0c4a6e;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Pay the <strong>$${p.delta.toFixed(2)} CAD difference</strong> to lock in the updated quote.
          </p>
          <a href="${escHtml(p.payLinkUrl)}" style="display:inline-block;background:#16C2F3;color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Pay $${p.delta.toFixed(2)} Now &rarr;
          </a>
          <p style="margin:14px 0 0;font-size:11px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Want to discuss? Reply to this email or call <a href="tel:+13069548688" style="color:#0369a1;text-decoration:none;">(306) 954-8688</a>
          </p>
        </div>`
      : p.mode === "DECREASE"
      ? `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:18px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#166534;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            Refund of $${Math.abs(p.delta).toFixed(2)} CAD processing
          </p>
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            We&rsquo;ll refund the difference to your original payment method. Allow 3&ndash;5 business days for it to appear on your statement.
          </p>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escHtml(p.orderNumber)} — updated quote</title></head>
<body style="margin:0;padding:0;background:#faf7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${preheader(p.preheaderText)}
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf7f4;padding:24px 0;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="600" style="background:#fff;border-radius:12px;max-width:600px;">
      ${emailHeader()}
      <tr><td style="padding:32px 40px 8px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">Order ${escHtml(p.orderNumber)} &middot; updated</p>
        <h1 style="margin:0;font-size:24px;color:#1c1712;line-height:1.2;">Hi ${escHtml(p.customerName.split(" ")[0])},</h1>
      </td></tr>
      <tr><td style="padding:8px 40px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#3f3a35;line-height:1.6;">
          We need to update the quote for your order. Reason: <strong>${escHtml(p.reasonLabel)}</strong>.
        </p>
        ${p.explanation ? `<p style="margin:0 0 16px;font-size:14px;color:#3f3a35;line-height:1.6;background:#f9f5f0;border-left:3px solid #d6cfc7;padding:12px 16px;border-radius:0 8px 8px 0;">${escHtml(p.explanation)}</p>` : ""}
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#faf7f4;border-radius:10px;">
          <tr><td style="padding:14px 18px;border-bottom:1px solid #ece5dc;">
            <span style="float:left;color:#7a6a60;font-size:13px;">Original total</span>
            <span style="float:right;font-family:monospace;color:#3f3a35;">$${p.originalTotal.toFixed(2)}</span>
            <div style="clear:both;"></div>
          </td></tr>
          <tr><td style="padding:14px 18px;">
            <span style="float:left;color:#1c1712;font-size:15px;font-weight:700;">Updated total</span>
            <span style="float:right;font-family:monospace;color:#1c1712;font-weight:700;">$${p.newTotal.toFixed(2)}</span>
            <div style="clear:both;"></div>
          </td></tr>
          ${p.mode !== "NO_CHANGE" ? `<tr><td style="padding:10px 18px;background:${p.mode === "INCREASE" ? "#fef3c7" : "#dcfce7"};border-radius:0 0 10px 10px;">
            <span style="float:left;color:${p.mode === "INCREASE" ? "#78350f" : "#166534"};font-size:13px;font-weight:600;">${p.mode === "INCREASE" ? "You owe" : "Refund"}</span>
            <span style="float:right;font-family:monospace;color:${p.mode === "INCREASE" ? "#78350f" : "#166534"};font-weight:700;">$${Math.abs(p.delta).toFixed(2)}</span>
            <div style="clear:both;"></div>
          </td></tr>` : ""}
        </table>
        ${ctaBlock}
        <p style="margin:24px 0 0;font-size:13px;color:#7a6a60;line-height:1.6;">
          Questions about the change? Reply to this email or call (306) 954-8688 &mdash; we&rsquo;re happy to walk through it.
        </p>
      </td></tr>
      ${emailFooter()}
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildText(p: RepriceParams & { delta: number; mode: "INCREASE" | "DECREASE" | "NO_CHANGE"; reasonLabel: string }): string {
  const lines = [
    `Hi ${p.customerName.split(" ")[0]},`,
    "",
    `We need to update the quote for order ${p.orderNumber}.`,
    `Reason: ${p.reasonLabel}`,
    p.explanation ? `\n${p.explanation}` : "",
    "",
    `Original total: $${p.originalTotal.toFixed(2)}`,
    `Updated total:  $${p.newTotal.toFixed(2)}`,
  ];
  if (p.mode === "INCREASE") {
    lines.push(`You owe:        $${p.delta.toFixed(2)}`, "");
    if (p.payLinkUrl) {
      lines.push(`Pay the difference here to lock in the quote:`, p.payLinkUrl);
    }
  } else if (p.mode === "DECREASE") {
    lines.push(`Refund:         $${Math.abs(p.delta).toFixed(2)}`, "", `We'll refund the difference to your original payment method (3-5 business days).`);
  }
  lines.push("", "Questions? Reply to this email or call (306) 954-8688.");
  return lines.filter(Boolean).join("\n");
}
