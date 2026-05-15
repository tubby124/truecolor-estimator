/**
 * Shared "what you ordered" block for transactional emails.
 *
 * Single source of truth for the line-items table across orderConfirmation,
 * statusUpdate, paymentReceipt, proofSent, and reviewRequest emails.
 * Without it, every lifecycle email said "TC-6258 is in production" with no
 * context — customers don't remember the order number, they remember the
 * product. This shows the product, dimensions, qty, and line total.
 *
 * Inline-styled HTML only (Gmail strips classes). Mobile-safe at 560px max.
 */

import { escHtml } from "./escHtml";

export interface OrderItemsBlockItem {
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  line_total: number;
}

/**
 * @param items     The order's line items
 * @param heading   Optional override (default "What you ordered")
 * @param showTotal When true, renders the summed line-total at the bottom
 */
export function orderItemsBlock(
  items: OrderItemsBlockItem[],
  opts: { heading?: string; showTotal?: boolean } = {}
): string {
  if (!items || items.length === 0) return "";

  const heading = opts.heading ?? "What you ordered";
  const total = items.reduce((s, i) => s + (i.line_total || 0), 0);

  const rows = items
    .map((item, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#faf8f6";
      const dimPart =
        item.width_in && item.height_in
          ? `${item.width_in}"×${item.height_in}"`
          : "";
      const sidesPart = item.sides === 2 ? "2-sided" : "";
      const meta = [`Qty ${item.qty}`, dimPart, sidesPart]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr style="background:${bg};">
          <td style="padding:12px 16px;font-size:13px;color:#1f2937;border-bottom:1px solid #f0ebe4;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <strong style="display:block;font-weight:600;font-size:14px;">${escHtml(item.product_name)}</strong>
            <span style="font-size:12px;color:#6b7280;">${escHtml(meta)}</span>
          </td>
          <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1f2937;text-align:right;border-bottom:1px solid #f0ebe4;white-space:nowrap;vertical-align:top;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-variant-numeric:tabular-nums;">
            $${item.line_total.toFixed(2)}
          </td>
        </tr>`;
    })
    .join("");

  const totalRow = opts.showTotal
    ? `<tr style="background:#1c1712;">
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Subtotal</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-variant-numeric:tabular-nums;">$${total.toFixed(2)}</td>
      </tr>`
    : "";

  return `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(heading)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2dbd4;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${rows}
        ${totalRow}
      </tbody>
    </table>`;
}

/**
 * Plain-text version of the items block (for the text fallback).
 */
export function orderItemsBlockText(
  items: OrderItemsBlockItem[],
  opts: { heading?: string } = {}
): string {
  if (!items || items.length === 0) return "";
  const heading = opts.heading ?? "WHAT YOU ORDERED";
  const lines = items.map((item) => {
    const dim =
      item.width_in && item.height_in
        ? ` ${item.width_in}"×${item.height_in}"`
        : "";
    const sides = item.sides === 2 ? " · 2-sided" : "";
    return `  - ${item.product_name}${dim}${sides} × Qty ${item.qty} — $${item.line_total.toFixed(2)}`;
  });
  return `\n${heading}\n${lines.join("\n")}\n`;
}
