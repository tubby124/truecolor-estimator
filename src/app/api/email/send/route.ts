import QRCode from "qrcode";
import { buildQuoteEmailHtml, buildDiagramSvgXml, type QuoteEmailData } from "@/lib/email/quoteTemplate";
import type { EstimateResponse } from "@/lib/engine/types";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendEmail, type SendEmailAttachment } from "@/lib/email/smtp";
import { requireStaffUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface QuoteItem {
  quoteData: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
}

interface SendQuoteRequest {
  to: string;
  customerName?: string;
  note?: string;
  // Single-item mode
  quoteData?: EstimateResponse;
  jobDetails?: QuoteEmailData["jobDetails"];
  proofImage?: { dataUrl: string; filename: string; mimeType: string } | null;
  // Multi-item mode
  items?: QuoteItem[];
  includePaymentLink?: boolean;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMultiItemEmailHtml(opts: {
  customerName?: string;
  note?: string;
  items: QuoteItem[];
  siteUrl: string;
  paymentUrl?: string;
  qrCodeCid?: string;
}): string {
  const { customerName, note, items, siteUrl, paymentUrl, qrCodeCid } = opts;
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  const combinedSubtotal = items.reduce((s, it) => s + (it.quoteData.sell_price ?? 0), 0);
  const combinedDesignFee = items.reduce((s, it) => s + (it.quoteData.design_fee ?? 0), 0);
  const gst = Math.round(combinedSubtotal * 0.05 * 100) / 100;
  const pst = Math.round((combinedSubtotal - combinedDesignFee) * 0.06 * 100) / 100;
  const total = Math.round((combinedSubtotal + gst + pst) * 100) / 100;

  const logoUrl = `${siteUrl}/truecolorlogo.webp`;

  const itemSections = items.map((item, i) => {
    const { quoteData, jobDetails } = item;
    const sellPrice = quoteData.sell_price ?? 0;
    const hasDimensions = jobDetails.widthIn && jobDetails.heightIn;
    const wFt = hasDimensions ? (jobDetails.widthIn! / 12).toFixed(2) : null;
    const hFt = hasDimensions ? (jobDetails.heightIn! / 12).toFixed(2) : null;

    const specs = [
      hasDimensions ? `${wFt} × ${hFt} ft` : null,
      `Qty: ${jobDetails.qty}`,
      jobDetails.sides === 2 ? "Double-sided" : "Single-sided",
      jobDetails.materialName ? `Material: ${jobDetails.materialName}` : null,
      jobDetails.isRush ? "⚡ RUSH" : null,
    ].filter(Boolean).join("  ·  ");

    const lineItemRows = quoteData.line_items.map(li => `
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;line-height:1.5;">${escHtml(li.description)}</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;white-space:nowrap;font-variant-numeric:tabular-nums;">$${li.line_total.toFixed(2)}</td>
      </tr>`).join("");

    return `
      <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:2px dashed #e5e7eb;">
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1c1712;padding-bottom:6px;border-bottom:2px solid #16C2F3;">
          Item ${i + 1}: ${escHtml(jobDetails.categoryLabel)}
        </h3>
        ${specs ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${escHtml(specs)}</p>` : ""}
        ${jobDetails.isRush ? `<p style="margin:0 0 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:6px 10px;font-size:12px;color:#9a3412;font-weight:600;">⚡ RUSH ORDER — Same-day/priority turnaround</p>` : ""}
        <table width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:8px;">
          <thead style="background:#f9fafb;">
            <tr>
              <th style="padding:8px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">Description</th>
              <th style="padding:8px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:right;border-bottom:1px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemRows}
            <tr style="background:#f9fafb;">
              <td style="padding:8px 16px;font-size:13px;color:#6b7280;">Item subtotal</td>
              <td style="padding:8px 16px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:#6b7280;">$${sellPrice.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }).join("");

  const paymentBlock = paymentUrl ? `
    <div style="margin:20px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#166534;">Pay Online — Secure Checkout</p>
      ${qrCodeCid ? `<img src="cid:${qrCodeCid}" width="140" height="140" alt="QR Code" style="display:block;margin:0 auto 12px;" />` : ""}
      <a href="${escHtml(paymentUrl)}" style="display:inline-block;background:#16C2F3;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;">Pay $${total.toFixed(2)} Now →</a>
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">Or copy this link: ${escHtml(paymentUrl)}</p>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#1c1712;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;">
      <img src="${logoUrl}" height="36" alt="True Color Display Printing" style="display:block;" />
      <span style="color:#16C2F3;font-size:12px;font-weight:600;">Multi-Item Quote · ${items.length} items</span>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#111827;">${escHtml(greeting)}</p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;">Here is your ${items.length}-item quote from True Color Display Printing.</p>

      ${note ? `<div style="background:#faf8f6;border-left:3px solid #16C2F3;padding:12px 16px;margin-bottom:24px;border-radius:0 6px 6px 0;"><p style="margin:0;font-size:14px;color:#374151;font-style:italic;">${escHtml(note)}</p></div>` : ""}

      ${itemSections}

      <!-- Combined Total -->
      <table width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <thead style="background:#f9fafb;">
          <tr><th colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb;">Combined Total — ${items.length} items</th></tr>
        </thead>
        <tbody>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Subtotal</td><td style="padding:8px 16px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:#6b7280;">$${combinedSubtotal.toFixed(2)}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;">GST (5%)</td><td style="padding:8px 16px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:#6b7280;">$${gst.toFixed(2)}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;">PST (6%)</td><td style="padding:8px 16px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:#6b7280;">$${pst.toFixed(2)}</td></tr>
          <tr style="background:#16C2F3;"><td style="padding:14px 16px;font-size:16px;font-weight:700;color:#fff;">Total (CAD)</td><td style="padding:14px 16px;font-size:16px;font-weight:700;color:#fff;text-align:right;font-variant-numeric:tabular-nums;">$${total.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#166534;">✓ This quote is valid for <strong>30 days</strong>. Prices are in Canadian dollars.</p>
      </div>

      ${paymentBlock}

      <p style="font-size:13px;color:#374151;margin-bottom:6px;">To approve, reply to this email or contact us at <a href="mailto:info@true-color.ca" style="color:#16C2F3;">info@true-color.ca</a></p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1c1712;">True Color Display Printing</p>
      <p style="margin:0;font-size:12px;color:#6b7280;">216 33rd St W (Upstairs), Saskatoon SK · (306) 954-8688 · <a href="mailto:info@true-color.ca" style="color:#16C2F3;">info@true-color.ca</a></p>
      <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;"><a href="${escHtml(siteUrl)}" style="color:#16C2F3;">${escHtml(siteUrl)}</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildMultiItemPlainText(opts: {
  customerName?: string;
  note?: string;
  items: QuoteItem[];
  paymentUrl?: string;
}): string {
  const { customerName, note, items, paymentUrl } = opts;
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  const combinedSubtotal = items.reduce((s, it) => s + (it.quoteData.sell_price ?? 0), 0);
  const combinedDesignFee = items.reduce((s, it) => s + (it.quoteData.design_fee ?? 0), 0);
  const gst = Math.round(combinedSubtotal * 0.05 * 100) / 100;
  const pst = Math.round((combinedSubtotal - combinedDesignFee) * 0.06 * 100) / 100;
  const total = Math.round((combinedSubtotal + gst + pst) * 100) / 100;

  const itemLines = items.map((item, i) => {
    const { quoteData, jobDetails } = item;
    const sellPrice = quoteData.sell_price ?? 0;
    const specs = [
      jobDetails.materialName ? `Material: ${jobDetails.materialName}` : null,
      jobDetails.widthIn && jobDetails.heightIn
        ? `Size: ${(jobDetails.widthIn / 12).toFixed(2)} × ${(jobDetails.heightIn / 12).toFixed(2)} ft`
        : null,
      `Qty: ${jobDetails.qty}`,
      jobDetails.sides === 2 ? "Double-sided" : "Single-sided",
      jobDetails.isRush ? "RUSH ORDER" : null,
    ].filter(Boolean).join(" · ");

    return [
      `--- Item ${i + 1}: ${jobDetails.categoryLabel} ---`,
      specs,
      ...quoteData.line_items.map((li) => `  ${li.description}: $${li.line_total.toFixed(2)}`),
      `  Item subtotal: $${sellPrice.toFixed(2)}`,
    ].join("\n");
  }).join("\n\n");

  return [
    greeting,
    "",
    `Here is your ${items.length}-item quote from True Color Display Printing.`,
    "",
    note ? `Note: ${note}` : "",
    note ? "" : "",
    itemLines,
    "",
    "--- Combined Total ---",
    `Subtotal: $${combinedSubtotal.toFixed(2)}`,
    `GST (5%): $${gst.toFixed(2)}`,
    `PST (6%): $${pst.toFixed(2)}`,
    `TOTAL: $${total.toFixed(2)} CAD`,
    "",
    "This quote is valid for 30 days.",
    "",
    paymentUrl ? `Pay online: ${paymentUrl}` : "",
    paymentUrl ? "" : "",
    "To approve, reply to this email or contact us at info@true-color.ca",
    "",
    "True Color Display Printing",
    "Saskatoon, SK, Canada",
    "info@true-color.ca",
    "https://truecolorprinting.ca",
  ].filter((l) => l !== null && l !== undefined).join("\n");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  // Staff-only endpoint — only the owner can send quote emails
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const body: SendQuoteRequest = await req.json();
    const { to, customerName, note, proofImage, includePaymentLink } = body;

    // Validate email
    if (!to || !isValidEmail(to)) {
      return Response.json({ error: "A valid customer email address is required." }, { status: 400 });
    }

    const isMultiItem = body.items && body.items.length > 0;

    // ── Multi-item path ────────────────────────────────────────────────────────
    if (isMultiItem) {
      const items = body.items!;
      for (const item of items) {
        if (!item.quoteData || item.quoteData.status !== "QUOTED" || !item.quoteData.sell_price) {
          return Response.json({ error: "One or more items are incomplete or not ready to send." }, { status: 400 });
        }
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
      const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
      const bcc = process.env.SMTP_BCC ?? undefined;

      // Combined financials for payment token
      const combinedSubtotal = items.reduce((s, it) => s + (it.quoteData.sell_price ?? 0), 0);
      const combinedDesignFee = items.reduce((s, it) => s + (it.quoteData.design_fee ?? 0), 0);
      const combinedGst = Math.round(combinedSubtotal * 0.05 * 100) / 100;
      const combinedPst = Math.round((combinedSubtotal - combinedDesignFee) * 0.06 * 100) / 100;
      const combinedTotal = Math.round((combinedSubtotal + combinedGst + combinedPst) * 100) / 100;

      let paymentUrl: string | undefined;
      let qrCodeBuffer: Buffer | undefined;
      const QR_CID = "qrcode@truecolor";

      if (includePaymentLink && process.env.PAYMENT_TOKEN_SECRET) {
        const description = `True Color Display Printing — ${items.length}-Item Quote`;
        const token = encodePaymentToken(combinedTotal, description, to);
        paymentUrl = `${siteUrl}/pay/${token}`;
        try {
          qrCodeBuffer = await QRCode.toBuffer(paymentUrl, {
            width: 260,
            margin: 2,
            color: { dark: "#111827", light: "#ffffff" },
          });
        } catch {
          qrCodeBuffer = undefined;
        }
      }

      const qrCodeCid = qrCodeBuffer ? QR_CID : undefined;
      const html = buildMultiItemEmailHtml({ customerName, note, items, siteUrl, paymentUrl, qrCodeCid });
      const text = buildMultiItemPlainText({ customerName, note, items, paymentUrl });

      const itemLabels = items.map((it) => it.jobDetails.categoryLabel).join(", ");
      const subject = customerName
        ? `Your ${items.length}-Item Quote from True Color Display Printing — ${itemLabels}`
        : `Multi-Item Quote (${items.length} items) from True Color Display Printing`;

      const attachments: SendEmailAttachment[] = [];
      if (qrCodeBuffer) {
        attachments.push({ name: "qrcode.png", content: qrCodeBuffer.toString("base64"), contentId: QR_CID });
      }

      await sendEmail({
        from,
        to,
        bcc,
        subject,
        html,
        text,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      return Response.json({ success: true });
    }

    // ── Single-item path (existing) ────────────────────────────────────────────
    if (!body.quoteData || body.quoteData.status !== "QUOTED" || !body.quoteData.sell_price) {
      return Response.json({ error: "Quote is incomplete or not ready to send." }, { status: 400 });
    }
    // Non-null guaranteed by validation above
    const quoteData = body.quoteData;
    // jobDetails may be missing — guard usages below with `?? ""`
    const jobDetails = body.jobDetails ?? { category: "", categoryLabel: "Quote", qty: 1, isRush: false };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
    const bcc = process.env.SMTP_BCC ?? undefined;

    // Generate payment link + QR code if requested and token secret is configured
    let paymentUrl: string | undefined;
    let qrCodeBuffer: Buffer | undefined;
    const QR_CID = "qrcode@truecolor";
    if (includePaymentLink && process.env.PAYMENT_TOKEN_SECRET) {
      const sellPrice = quoteData.sell_price ?? 0;
      const designFee = quoteData.design_fee ?? 0;
      const gst = Math.round(sellPrice * 0.05 * 100) / 100;
      const pst = Math.round((sellPrice - designFee) * 0.06 * 100) / 100;
      const totalWithTax = Math.round((sellPrice + gst + pst) * 100) / 100;
      const description = `True Color Display Printing — ${jobDetails.categoryLabel}`;
      const token = encodePaymentToken(totalWithTax, description, to);
      paymentUrl = `${siteUrl}/pay/${token}`;
      try {
        // Use toBuffer (not toDataURL) — data: URIs are stripped by Gmail and all major email clients
        qrCodeBuffer = await QRCode.toBuffer(paymentUrl, {
          width: 260,
          margin: 2,
          color: { dark: "#111827", light: "#ffffff" },
        });
      } catch {
        // QR failure is non-fatal — email still sends with the text link
        qrCodeBuffer = undefined;
      }
    }

    const hasProofAttachment = !!(proofImage?.dataUrl);

    // Generate spec diagram PNG via @resvg/resvg-js (SVG → PNG so email clients render it)
    const DIAGRAM_CID = "diagram@truecolor";
    let diagramBuffer: Buffer | undefined;
    try {
      const { Resvg } = await import("@resvg/resvg-js");
      const svgXml = buildDiagramSvgXml(jobDetails);
      const resvg = new Resvg(svgXml, { fitTo: { mode: "width", value: 400 } });
      diagramBuffer = Buffer.from(resvg.render().asPng());
    } catch (e) {
      console.warn("[diagram] PNG generation failed, falling back to inline SVG:", e);
    }

    // Pass CID string to template so it renders as cid: src (works in all email clients)
    const qrCodeCid = qrCodeBuffer ? QR_CID : undefined;
    const PROOF_CID = "proof@truecolor";
    const proofImageCid = hasProofAttachment ? PROOF_CID : undefined;
    const diagramCid = diagramBuffer ? DIAGRAM_CID : undefined;
    const html = buildQuoteEmailHtml({ customerEmail: to, customerName, note, quoteData, jobDetails, siteUrl, hasProofAttachment, paymentUrl, qrCodeCid, proofImageCid, diagramCid });

    const subject = customerName
      ? `Your Quote from True Color Display Printing — ${jobDetails.categoryLabel}`
      : `Quote from True Color Display Printing — ${jobDetails.categoryLabel}`;

    // Build attachment array for Brevo API (base64 content + optional contentId for CID inline)
    const attachments: SendEmailAttachment[] = [];

    // Proof image — inline CID (renders in email body)
    if (proofImage?.dataUrl) {
      const base64Data = proofImage.dataUrl.replace(/^data:[^;]+;base64,/, "");
      attachments.push({ name: proofImage.filename, content: base64Data, contentId: PROOF_CID });
    }

    // Spec diagram PNG — inline CID (renders the product diagram in email body)
    if (diagramBuffer) {
      attachments.push({ name: "diagram.png", content: diagramBuffer.toString("base64"), contentId: DIAGRAM_CID });
    }

    // QR code — inline CID (embedded in HTML payment block)
    if (qrCodeBuffer) {
      attachments.push({ name: "qrcode.png", content: qrCodeBuffer.toString("base64"), contentId: QR_CID });
    }

    await sendEmail({
      from,
      to,
      bcc,
      subject,
      html,
      text: buildPlainText({ customerName, note, quoteData, jobDetails, hasProofAttachment, paymentUrl }),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email/send]", message);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}

function buildPlainText({
  customerName,
  note,
  quoteData,
  jobDetails,
  hasProofAttachment,
  paymentUrl,
}: {
  customerName?: string;
  note?: string;
  quoteData: import("@/lib/engine/types").EstimateResponse;
  jobDetails: NonNullable<SendQuoteRequest["jobDetails"]>;
  hasProofAttachment?: boolean;
  paymentUrl?: string;
}): string {
  const sellPrice = quoteData.sell_price ?? 0;
  const designFee = quoteData.design_fee ?? 0;
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const pst = Math.round((sellPrice - designFee) * 0.06 * 100) / 100;
  const total = Math.round((sellPrice + gst + pst) * 100) / 100;
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  const lines = [
    greeting,
    "",
    "Here is your quote from True Color Display Printing.",
    "",
    note ? `Note: ${note}` : "",
    note ? "" : "",
    `Product: ${jobDetails.categoryLabel}`,
    jobDetails.materialName ? `Material: ${jobDetails.materialName}` : "",
    jobDetails.widthIn && jobDetails.heightIn
      ? `Size: ${(jobDetails.widthIn / 12).toFixed(2)} × ${(jobDetails.heightIn / 12).toFixed(2)} ft`
      : "",
    `Quantity: ${jobDetails.qty}`,
    jobDetails.isRush ? "Rush order: Yes" : "",
    "",
    "--- Quote ---",
    ...quoteData.line_items.map((i) => `${i.description}: $${i.line_total.toFixed(2)}`),
    "",
    `Subtotal: $${sellPrice.toFixed(2)}`,
    `GST (5%): $${gst.toFixed(2)}`,
    `PST (6%): $${pst.toFixed(2)}`,
    `TOTAL: $${total.toFixed(2)} CAD`,
    "",
    "This quote is valid for 30 days.",
    "",
    paymentUrl ? `Pay online: ${paymentUrl}` : "",
    paymentUrl ? "" : "",
    "To approve, reply to this email or contact us at info@true-color.ca",
    hasProofAttachment ? "" : "",
    hasProofAttachment ? "A proof of your design is attached to this email." : "",
    "",
    "True Color Display Printing",
    "Saskatoon, SK, Canada",
    "info@true-color.ca",
    "https://truecolorprinting.ca",
  ].filter((l) => l !== null && l !== undefined);

  return lines.join("\n");
}
