/**
 * Client-side only — calls window.open.
 * Generates print-ready HTML quote documents for single or multi-item quotes.
 */
import type { CartItem } from "@/lib/types/cart";
import { buildSpecDiagramSvg } from "@/lib/diagram";
import { SITE_URL } from "@/lib/config";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeTimestamps() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeRef = String(now.getHours() * 100 + now.getMinutes()).padStart(4, "0");
  const quoteRef = `Q-${dateStr}-${timeRef}`;
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);
  return {
    quoteRef,
    todayStr: now.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
    validStr: validUntil.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
  };
}

const SHARED_CSS = `
  @page { size: letter; margin: 18mm 20mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #111827; font-size: 13px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e52222; }
  .logo img { height: 44px; width: auto; }
  .company-info { text-align: right; font-size: 11px; color: #6b7280; }
  .company-info strong { display: block; font-size: 13px; color: #111827; font-weight: 700; margin-bottom: 2px; }
  .meta-row { display: flex; gap: 32px; margin-bottom: 24px; }
  .meta-item { flex: 1; }
  .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 2px; }
  .meta-value { font-size: 13px; font-weight: 600; color: #111827; }
  .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 8px; }
  .specs-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 12px; color: #374151; }
  .diagram-box { background: #faf8f6; border: 1.5px solid #e2dbd4; border-radius: 8px; overflow: hidden; margin-bottom: 20px; padding: 8px; text-align: center; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
  thead { background: #f9fafb; }
  th { padding: 9px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th:last-child { text-align: right; }
  .total-row td { padding: 12px 14px; font-size: 15px; font-weight: 700; background: #e52222; color: white; }
  .subtotal-row td, .gst-row td { padding: 8px 14px; font-size: 12px; background: #f9fafb; color: #6b7280; }
  .validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #166534; margin-bottom: 16px; }
  .payment-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 12px; }
  .signature-box { border-top: 2px solid #374151; margin-top: 28px; padding-top: 16px; }
  .sig-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #374151; margin-bottom: 4px; }
  .sig-desc { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sig-field { border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 4px; min-height: 28px; }
  .sig-field-label { font-size: 10px; color: #6b7280; margin-top: 4px; }
  .terms { font-size: 10px; color: #9ca3af; margin-top: 20px; line-height: 1.6; }
  .rush-banner { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #9a3412; font-weight: 600; margin-bottom: 12px; }
  .item-divider { border-bottom: 2px dashed #e5e7eb; margin-bottom: 28px; padding-bottom: 4px; }
  .item-number { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 6px; }
`;

const SIGNATURE_FOOTER = `
  <div class="signature-box">
    <div class="sig-title">Customer Approval</div>
    <div class="sig-desc">By signing below, I approve the above specifications and authorize True Color Display Printing to proceed with production.</div>
    <div class="sig-grid">
      <div><div class="sig-field"></div><div class="sig-field-label">Authorized Signature</div></div>
      <div><div class="sig-field"></div><div class="sig-field-label">Date</div></div>
      <div><div class="sig-field"></div><div class="sig-field-label">Printed Name</div></div>
      <div><div class="sig-field"></div><div class="sig-field-label">Company (if applicable)</div></div>
    </div>
  </div>
  <div class="terms">
    50% deposit required to begin production · Balance due on pickup · All prices in CAD · GST (5%) + PST (6%) included<br />
    Prices valid for 30 days from quote date · Questions? Call (306) 954-8688 or email info@true-color.ca<br />
    True Color Display Printing · 216 33rd St W (Upstairs), Saskatoon SK S7M 0R1
  </div>
`;

function buildSpecsRow(jobDetails: CartItem["jobDetails"]): string {
  const hasDimensions = jobDetails.widthIn && jobDetails.heightIn;
  const wFt = hasDimensions ? (jobDetails.widthIn! / 12).toFixed(2) : null;
  const hFt = hasDimensions ? (jobDetails.heightIn! / 12).toFixed(2) : null;
  return [
    jobDetails.categoryLabel,
    hasDimensions ? `${wFt} × ${hFt} ft` : null,
    jobDetails.qty > 1 ? `Qty: ${jobDetails.qty}` : "Qty: 1",
    jobDetails.sides === 2 ? "Double-sided" : "Single-sided",
    jobDetails.materialName || null,
    jobDetails.isRush ? "RUSH ORDER" : null,
  ].filter(Boolean).join("  ·  ");
}

function openPrintWindow(html: string): void {
  const win = window.open("about:blank", "_blank");
  if (!win) {
    alert("Print blocked by browser. Please allow pop-ups for this site, then try again.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
  setTimeout(() => { try { win.print(); } catch { /* already printed */ } }, 800);
}

/**
 * Print a quote for one or more cart items.
 * Single item → same layout as the existing QuotePanel print.
 * Multiple items → combined document with per-item sections + combined total.
 */
export function printMultiQuote(items: CartItem[]): void {
  if (items.length === 0) return;

  const { quoteRef, todayStr, validStr } = makeTimestamps();
  const logoUrl = `${SITE_URL}/truecolorlogo.webp`;
  const isSingle = items.length === 1;

  // Combined financials
  const combinedSubtotal = items.reduce((s, it) => s + (it.result.sell_price ?? 0), 0);
  const combinedDesignFee = items.reduce((s, it) => s + (it.result.design_fee ?? 0), 0);
  const combinedGst = Math.round(combinedSubtotal * 0.05 * 100) / 100;
  const combinedPst = Math.round((combinedSubtotal - combinedDesignFee) * 0.06 * 100) / 100;
  const combinedTotal = Math.round((combinedSubtotal + combinedGst + combinedPst) * 100) / 100;

  // Build per-item sections
  const itemSections = items.map((item, i) => {
    const { result, jobDetails } = item;
    const sellPrice = result.sell_price ?? 0;
    const specsRow = buildSpecsRow(jobDetails);
    const diagramSvg = buildSpecDiagramSvg(jobDetails);
    const lineItemRows = result.line_items.map(li => `
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${escHtml(li.description)}</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;white-space:nowrap;font-variant-numeric:tabular-nums;">$${li.line_total.toFixed(2)}</td>
      </tr>`).join("");

    const isLastItem = i === items.length - 1;

    return `
      ${!isSingle ? `<div class="item-number">Item ${i + 1} of ${items.length} — ${escHtml(jobDetails.categoryLabel)}</div>` : ""}
      ${jobDetails.isRush ? `<div class="rush-banner">⚡ RUSH ORDER — Same-day/priority turnaround requested</div>` : ""}
      <div class="section-label">Job Specifications</div>
      <div class="specs-box">${escHtml(specsRow)}</div>
      <div class="diagram-box">${diagramSvg}</div>
      <div class="section-label">Quote Breakdown</div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>
          ${lineItemRows}
          ${isSingle ? `
          <tr class="subtotal-row"><td>Subtotal</td><td style="text-align:right;font-variant-numeric:tabular-nums;">$${sellPrice.toFixed(2)}</td></tr>
          <tr class="gst-row"><td>GST (5%)</td><td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedGst.toFixed(2)}</td></tr>
          <tr class="gst-row"><td>PST (6%)</td><td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedPst.toFixed(2)}</td></tr>
          <tr class="total-row"><td>Total (CAD)</td><td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedTotal.toFixed(2)}</td></tr>
          ` : `
          <tr class="subtotal-row"><td>Item subtotal</td><td style="text-align:right;font-variant-numeric:tabular-nums;">$${sellPrice.toFixed(2)}</td></tr>
          `}
        </tbody>
      </table>
      ${!isSingle && !isLastItem ? `<div class="item-divider"></div>` : ""}
    `;
  }).join("");

  // Combined total section (multi-item only)
  const combinedTotalSection = isSingle ? "" : `
    <div class="section-label">Combined Total</div>
    <table>
      <tbody>
        <tr class="subtotal-row">
          <td>Combined Subtotal (${items.length} items)</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedSubtotal.toFixed(2)}</td>
        </tr>
        <tr class="gst-row">
          <td>GST (5%)</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedGst.toFixed(2)}</td>
        </tr>
        <tr class="gst-row">
          <td>PST (6%)</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedPst.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total (CAD)</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;">$${combinedTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  const metaRow = `
    <div class="meta-item"><div class="meta-label">Quote #</div><div class="meta-value">${escHtml(quoteRef)}</div></div>
    <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${escHtml(todayStr)}</div></div>
    <div class="meta-item"><div class="meta-label">Valid Until</div><div class="meta-value">${escHtml(validStr)}</div></div>
    ${!isSingle ? `<div class="meta-item"><div class="meta-label">Items</div><div class="meta-value">${items.length} items</div></div>` : ""}
  `;

  const titleStr = isSingle
    ? `Quote ${quoteRef} — ${items[0].jobDetails.categoryLabel} — True Color Display Printing`
    : `Multi-Item Quote ${quoteRef} (${items.length} items) — True Color Display Printing`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(titleStr)}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>

  <div class="header">
    <div class="logo"><img src="${logoUrl}" alt="True Color Display Printing" /></div>
    <div class="company-info">
      <strong>True Color Display Printing</strong>
      216 33rd St W (Upstairs), Saskatoon SK<br />
      (306) 954-8688 · info@true-color.ca
    </div>
  </div>

  <div class="meta-row">${metaRow}</div>

  ${itemSections}
  ${combinedTotalSection}

  <div class="validity">✓ This quote is valid for <strong>30 days</strong> from the date above. Prices are in Canadian dollars and include GST and PST.</div>

  <div class="section-label">Payment</div>
  <div class="payment-box">
    <div style="margin-bottom:8px;"><strong>Interac eTransfer</strong> — info@true-color.ca (auto-deposit enabled, no password needed)</div>
    <div style="color:#6b7280;">Or pay by card online: truecolorprinting.ca &nbsp;·&nbsp; 50% deposit required to begin production</div>
  </div>

  ${SIGNATURE_FOOTER}

</body>
</html>`;

  openPrintWindow(html);
}
