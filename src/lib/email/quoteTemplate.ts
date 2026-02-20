import type { EstimateResponse } from "@/lib/engine/types";
import { logoAbsoluteUrl } from "@/lib/config";

export interface QuoteEmailData {
  customerName?: string;
  customerEmail: string;
  note?: string;
  quoteData: EstimateResponse;
  jobDetails: {
    category: string;
    categoryLabel: string;
    widthIn?: number;
    heightIn?: number;
    qty: number;
    sides?: 1 | 2;
    materialName?: string;
    isRush: boolean;
  };
  siteUrl: string;
  hasProofAttachment?: boolean;
  /** CID for the inline proof image — renders the proof visually inside the email body */
  proofImageCid?: string;
  /** Optional "Pay Now" link embedded in the email (generated server-side) */
  paymentUrl?: string;
  /** Optional QR code CID for inline attachment (e.g. "qrcode@truecolor") — use cid: in img src */
  qrCodeCid?: string;
  /** CID for the spec diagram PNG — when provided renders as <img cid:...> instead of inline SVG */
  diagramCid?: string;
}

export function buildQuoteEmailHtml(data: QuoteEmailData): string {
  const { customerName, note, quoteData, jobDetails, siteUrl, hasProofAttachment, proofImageCid, paymentUrl, qrCodeCid, diagramCid } = data;
  const sellPrice = quoteData.sell_price ?? 0;
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;

  const greeting = customerName ? `Hi ${customerName},` : "Hello,";
  const logoUrl = logoAbsoluteUrl(siteUrl);

  // Dimensions row (only for sqft products)
  const hasDimensions = jobDetails.widthIn && jobDetails.heightIn;
  const widthFt = hasDimensions ? (jobDetails.widthIn! / 12).toFixed(2) : null;
  const heightFt = hasDimensions ? (jobDetails.heightIn! / 12).toFixed(2) : null;
  const sqft = hasDimensions
    ? ((jobDetails.widthIn! / 12) * (jobDetails.heightIn! / 12)).toFixed(2)
    : null;

  // Build line items rows
  const lineItemRows = quoteData.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; line-height: 1.5;">
          ${escHtml(item.description)}
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6; white-space: nowrap; font-variant-numeric: tabular-nums;">
          $${item.line_total.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  // Job detail pills
  const detailItems: string[] = [
    jobDetails.categoryLabel,
    hasDimensions ? `${widthFt} × ${heightFt} ft (${sqft} sq ft)` : "",
    jobDetails.qty > 1 ? `Qty: ${jobDetails.qty}` : "",
    jobDetails.sides === 2 ? "Double-sided" : "",
    jobDetails.materialName || "",
    jobDetails.isRush ? "⚡ Rush order" : "",
  ].filter(Boolean);

  const detailPills = detailItems
    .map(
      (d) =>
        `<span style="display: inline-block; background: #f0eae4; color: #4a3728; font-size: 12px; padding: 4px 10px; border-radius: 999px; margin: 3px 3px 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(d)}</span>`
    )
    .join("");

  const rushBanner = jobDetails.isRush
    ? `<tr>
        <td colspan="2" style="padding: 10px 16px; background: #fff8f0; border-top: 1px solid #f0d0a8; border-bottom: 1px solid #f0d0a8;">
          <p style="margin: 0; font-size: 12px; color: #7a4010; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ⚡ <strong>Rush order</strong> — priority turnaround included
          </p>
        </td>
      </tr>`
    : "";

  const noteBlock = note
    ? `<div style="background: #f8f4f0; border-left: 3px solid #e52222; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 28px;">
        <p style="margin: 0; font-size: 14px; color: #4a3728; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(note)}</p>
      </div>`
    : "";

  const sqftLine =
    quoteData.sqft_calculated && quoteData.price_per_sqft
      ? `<tr>
          <td style="padding: 6px 16px 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" colspan="2">
            ${quoteData.sqft_calculated.toFixed(2)} sq ft × $${quoteData.price_per_sqft.toFixed(2)}/sq ft
          </td>
        </tr>`
      : "";

  const minChargeNote = quoteData.min_charge_applied
    ? `<tr>
        <td colspan="2" style="padding: 4px 16px 8px; font-size: 12px; color: #9a5500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Minimum order charge applied
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Quote from True Color Display Printing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4efe9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4efe9; padding: 32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">

          <!-- HEADER -->
          <tr>
            <td style="background: #e52222; border-radius: 12px 12px 0 0; padding: 28px 32px; text-align: center;">
              <img src="${logoUrl}" alt="True Color Display Printing" width="200" style="display: block; margin: 0 auto; max-width: 200px; height: auto; border: 0;" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background: #ffffff; padding: 32px 32px 24px;">

              <!-- Greeting -->
              <p style="margin: 0 0 6px; font-size: 18px; font-weight: 600; color: #111827;">${greeting}</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Thanks for reaching out! Here is your quote from True Color Display Printing.
              </p>

              <!-- Note from staff (if any) -->
              ${noteBlock}

              <!-- Job details -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Job Details</p>
                <div>${detailPills}</div>
              </div>

              <!-- Proof section — always show spec diagram; show artwork below if uploaded -->
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Your Proof</p>

                <!-- Spec diagram (dimensions + material) -->
                ${buildProductDiagramSvg(jobDetails, diagramCid)}

                ${proofImageCid ? `<!-- Artwork proof image -->
                <div style="border: 2px solid #e2dbd4; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                  <p style="margin: 0; padding: 6px 14px; font-size: 11px; font-weight: 600; color: #7a6560; background: #f8f4f0; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-transform: uppercase; letter-spacing: 0.06em;">Artwork</p>
                  <img src="cid:${proofImageCid}" alt="Your artwork proof" style="display: block; width: 100%; max-width: 100%; height: auto; border: 0;" />
                </div>` : ""}

                <!-- Review callout — always shown -->
                <div style="background: #fff8f0; border: 1px solid #f0d0a8; border-radius: 8px; padding: 10px 14px;">
                  <p style="margin: 0; font-size: 12px; color: #7a4010; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    ⚠️ &nbsp;Please review the dimensions and ${hasProofAttachment ? "artwork" : "specifications"} carefully before approving. This is exactly how your final print will look.
                  </p>
                </div>
              </div>

              <!-- Quote table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border: 1px solid #e2dbd4; border-radius: 10px; overflow: hidden; margin-bottom: 28px;">

                <!-- Column header -->
                <thead>
                  <tr style="background: #f9f6f3;">
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Description</th>
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #7a6560; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; border-bottom: 1px solid #e2dbd4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  ${rushBanner}
                  ${lineItemRows}
                  ${sqftLine}
                  ${minChargeNote}

                  <!-- Subtotal -->
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 10px 16px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Subtotal</td>
                    <td style="padding: 10px 16px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${sellPrice.toFixed(2)}</td>
                  </tr>

                  <!-- GST -->
                  <tr style="background: #f9f6f3;">
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">GST (5%)</td>
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #4a3728; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${gst.toFixed(2)}</td>
                  </tr>

                  <!-- TOTAL -->
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

              <!-- Validity -->
              <div style="background: #faf7f4; border: 1px solid #e6ddd5; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #4a3728; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ✓ &nbsp;This quote is valid for <strong>30 days</strong> from today. Prices are in Canadian dollars and include GST.
                </p>
              </div>

              ${paymentUrl ? `<!-- PAY NOW block -->
              <div style="background: #f0fbf4; border: 2px solid #a3d9b0; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #1a6b37; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Pay Online — Secure Checkout
                </p>
                <p style="margin: 0 0 14px; font-size: 13px; color: #1a5a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Click below to pay by credit or debit card — no account needed.
                </p>
                <a href="${paymentUrl}"
                  style="display: inline-block; background: #16a34a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 700; padding: 14px 36px; border-radius: 10px; text-decoration: none; letter-spacing: 0.01em;">
                  Pay $${total.toFixed(2)} CAD →
                </a>
                ${qrCodeCid ? `<div style="margin-top: 16px;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    Or scan with your phone:
                  </p>
                  <img src="cid:${qrCodeCid}" width="130" height="130" alt="Scan to pay" style="border-radius: 10px; border: 1px solid #a3d9b0;" />
                </div>` : ""}
              </div>` : ""}

              <!-- How to Approve -->
              <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${paymentUrl ? "Or Approve by Email" : "Ready to Proceed?"}
              </p>

              <!-- Step 1: Reply to approve -->
              <div style="background: #fdf4f4; border: 1px solid #f0bfbb; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #9c2020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  1. Reply &ldquo;Approved&rdquo; to confirm your order
                </p>
                <p style="margin: 0; font-size: 12px; color: #7a1818; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
                  Simply reply to this email with <strong>Approved</strong> (or any confirmation) and we&apos;ll get your order started right away.
                </p>
                <div style="text-align: center; margin-top: 12px;">
                  <a href="mailto:info@true-color.ca?subject=Approved%20-%20Quote&body=Hi%2C%20I%20approve%20this%20quote%20and%20would%20like%20to%20proceed."
                    style="display: inline-block; background: #e52222; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    Reply to Approve →
                  </a>
                </div>
              </div>

              <!-- Step 2: eTransfer payment -->
              <div style="background: #faf7f4; border: 1px solid #e6ddd5; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #e52222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  2. Pay by Interac eTransfer
                </p>
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #c01c1c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.01em;">
                  info@true-color.ca
                </p>
                <p style="margin: 0; font-size: 12px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Auto-deposit enabled · No password needed · Send exact total above
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #1c1712; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #f5f0eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color Display Printing
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #9c928a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Saskatoon, Saskatchewan · Canada
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #9c928a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <a href="mailto:info@true-color.ca" style="color: #f08080; text-decoration: none;">info@true-color.ca</a>
                &nbsp;·&nbsp;
                <a href="https://truecolorprinting.ca" style="color: #f08080; text-decoration: none;">truecolorprinting.ca</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #7a6560; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                All prices in CAD · Pricing v1_2026-02-19
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

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Server-side SVG spec diagram (mirrors ProductProof.tsx layout) ──────────

/** Returns the raw <svg>...</svg> XML string — used by route.ts to render a PNG via @resvg/resvg-js */
export function buildDiagramSvgXml(jobDetails: QuoteEmailData["jobDetails"]): string {
  return _buildDiagramSvgInner(jobDetails);
}

function buildProductDiagramSvg(jobDetails: QuoteEmailData["jobDetails"], cid?: string): string {
  const svgInner = _buildDiagramSvgInner(jobDetails);
  const footerHtml = _buildDiagramFooterHtml(jobDetails);
  if (cid) {
    return `
    <div style="background:#faf8f6;border:2px solid #e2dbd4;border-radius:10px;overflow:hidden;margin-bottom:12px;">
      <img src="cid:${cid}" alt="Product specification diagram" width="400" height="220" style="width:100%;max-height:180px;display:block;border:0;" />
      ${footerHtml}
    </div>`;
  }
  // Fallback: inline SVG (stripped by most email clients, but no regression)
  return `
    <div style="background:#faf8f6;border:2px solid #e2dbd4;border-radius:10px;overflow:hidden;margin-bottom:12px;">
      ${svgInner}
      ${footerHtml}
    </div>`;
}

function _buildDiagramFooterHtml(jobDetails: QuoteEmailData["jobDetails"]): string {
  const SQFT_CATS = ["SIGN","BANNER","RIGID","FOAMBOARD","MAGNET","DECAL","VINYL_LETTERING","PHOTO_POSTER","DISPLAY"];
  const isSqft = SQFT_CATS.includes(jobDetails.category);
  const wIn = jobDetails.widthIn ?? 0;
  const hIn = jobDetails.heightIn ?? 0;
  const wFt = wIn / 12;
  const hFt = hIn / 12;
  const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));
  const footerLine1 = [jobDetails.materialName, `${jobDetails.qty > 1 ? `×${jobDetails.qty}` : "1 unit"}`, (jobDetails.sides ?? 1) === 2 ? "2-sided" : "1-sided"].filter(Boolean).join(" · ");
  const dimLine = isSqft && wIn > 0 ? `${fmt(wFt)} ft × ${fmt(hFt)} ft` : "";
  return `<div style="padding:8px 14px;border-top:1px solid #e6ddd5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#7a6560;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(footerLine1)}</p>
    ${dimLine ? `<p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#4a3728;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escHtml(dimLine)}</p>` : ""}
  </div>`;
}

function _buildDiagramSvgInner(jobDetails: QuoteEmailData["jobDetails"]): string {
  const VB_W = 400, VB_H = 220;
  const MAX_W = 280, MAX_H = 140;
  const CX = VB_W / 2, CY = VB_H / 2;

  const SQFT_CATS = ["SIGN","BANNER","RIGID","FOAMBOARD","MAGNET","DECAL","VINYL_LETTERING","PHOTO_POSTER","DISPLAY"];
  const PRINT_ASPECT: Record<string, number> = {
    FLYER: 8.5 / 11, BUSINESS_CARD: 3.5 / 2, BROCHURE: 11 / 8.5, POSTCARD: 6 / 4, STICKER: 1,
  };

  const isSqft = SQFT_CATS.includes(jobDetails.category);
  const wIn = jobDetails.widthIn ?? 0;
  const hIn = jobDetails.heightIn ?? 0;
  const wFt = wIn / 12;
  const hFt = hIn / 12;

  const aspect = isSqft && wIn > 0 && hIn > 0
    ? wIn / hIn
    : (PRINT_ASPECT[jobDetails.category] ?? 1);

  let rW: number, rH: number;
  if (aspect > MAX_W / MAX_H) { rW = MAX_W; rH = MAX_W / aspect; }
  else                         { rH = MAX_H; rW = MAX_H * aspect; }
  const x = CX - rW / 2;
  const y = CY - rH / 2;
  const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

  // Category-specific internal detail markers
  let markers = "";
  const cat = jobDetails.category;
  if (cat === "SIGN") {
    const lines = [0.25, 0.5, 0.75].map(t => y + rH * t);
    markers = `<g opacity="0.25">${lines.map(ly =>
      `<line x1="${x+4}" y1="${ly}" x2="${x+rW-4}" y2="${ly}" stroke="#888" stroke-width="1"/>`
    ).join("")}</g>`;
  } else if (cat === "RIGID") {
    const r = 4, ins = 8;
    const corners = [[x+ins,y+ins],[x+rW-ins,y+ins],[x+ins,y+rH-ins],[x+rW-ins,y+rH-ins]];
    markers = `<g>${corners.map(([cx,cy]) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#aaa" stroke-width="1"/>`
    ).join("")}</g>`;
  } else if (cat === "BANNER") {
    markers = `<g opacity="0.25"><rect x="${x}" y="${y}" width="${rW}" height="6" fill="#ccc"/><rect x="${x}" y="${y+rH-6}" width="${rW}" height="6" fill="#ccc"/></g>`;
  } else if (cat === "FOAMBOARD") {
    markers = `<rect x="${x+4}" y="${y+4}" width="${rW-8}" height="${rH-8}" fill="none" stroke="#d0d0d0" stroke-width="1" rx="1"/>`;
  } else if (cat === "FLYER" || cat === "POSTCARD") {
    const ls = [0.25,0.4,0.55,0.7];
    markers = `<g opacity="0.2">${ls.map((t,i)=>{const lw=i===0?rW*0.5:rW*0.7;return `<line x1="${x+(rW-lw)/2}" y1="${y+rH*t}" x2="${x+(rW+lw)/2}" y2="${y+rH*t}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>`}).join("")}</g>`;
  } else if (cat === "BUSINESS_CARD") {
    markers = `<g opacity="0.2"><line x1="${x+rW*0.15}" y1="${y+rH*0.38}" x2="${x+rW*0.85}" y2="${y+rH*0.38}" stroke="#333" stroke-width="3" stroke-linecap="round"/><line x1="${x+rW*0.15}" y1="${y+rH*0.58}" x2="${x+rW*0.6}" y2="${y+rH*0.58}" stroke="#333" stroke-width="2" stroke-linecap="round"/></g>`;
  } else if (cat === "BROCHURE") {
    markers = `<g opacity="0.3"><line x1="${x+rW/3}" y1="${y+4}" x2="${x+rW/3}" y2="${y+rH-4}" stroke="#888" stroke-width="1" stroke-dasharray="4 2"/><line x1="${x+rW*2/3}" y1="${y+4}" x2="${x+rW*2/3}" y2="${y+rH-4}" stroke="#888" stroke-width="1" stroke-dasharray="4 2"/></g>`;
  }

  const isDashed = cat === "DECAL" || cat === "STICKER";
  const rx = cat === "MAGNET" ? 10 : 2;

  const materialBadge = isSqft && jobDetails.materialName
    ? `<text x="${x+6}" y="${y+14}" font-size="8" fill="#9ca3af" font-family="-apple-system,sans-serif">${escHtml(jobDetails.materialName)}</text>`
    : "";

  const rushBadge = jobDetails.isRush
    ? `<g><rect x="${x+rW-52}" y="${y+4}" width="48" height="14" rx="3" fill="#ef4444"/><text x="${x+rW-28}" y="${y+14}" font-size="7" fill="white" text-anchor="middle" font-family="-apple-system,sans-serif" font-weight="600">RUSH</text></g>`
    : "";

  const dimLabels = isSqft && wIn > 0 && hIn > 0
    ? `<text x="${x+rW/2}" y="${y+rH+22}" text-anchor="middle" fill="#777" font-size="11" font-family="system-ui,sans-serif">${fmt(wFt)} ft</text>
       <line x1="${x+2}" y1="${y+rH+16}" x2="${x+rW/2-22}" y2="${y+rH+16}" stroke="#999" stroke-width="0.75"/>
       <line x1="${x+rW/2+22}" y1="${y+rH+16}" x2="${x+rW-2}" y2="${y+rH+16}" stroke="#999" stroke-width="0.75"/>
       <text x="${x-16}" y="${y+rH/2}" text-anchor="middle" fill="#777" font-size="11" font-family="system-ui,sans-serif" transform="rotate(-90,${x-16},${y+rH/2})">${fmt(hFt)} ft</text>`
    : "";

  const qtyBadge = !isSqft && jobDetails.qty > 1
    ? `<g><rect x="${x+rW-36}" y="${y}" width="36" height="18" rx="9" fill="#e52222" opacity="0.9"/><text x="${x+rW-18}" y="${y+12.5}" text-anchor="middle" fill="white" font-size="10" font-weight="600" font-family="system-ui,sans-serif">×${jobDetails.qty.toLocaleString()}</text></g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}"
    style="width:100%;max-height:180px;display:block;">
    <rect x="${x}" y="${y}" width="${rW}" height="${rH}" fill="#f5f2ee"
      stroke="${isDashed ? "#e52222" : "#c8bfb6"}" stroke-width="1.5"
      ${isDashed ? 'stroke-dasharray="6 3"' : ""} rx="${rx}" ry="${rx}"/>
    ${markers}
    ${materialBadge}
    ${rushBadge}
    ${dimLabels}
    ${qtyBadge}
  </svg>`;
}
