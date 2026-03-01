import QRCode from "qrcode";
import { buildQuoteEmailHtml, buildDiagramSvgXml, type QuoteEmailData } from "@/lib/email/quoteTemplate";
import type { EstimateResponse } from "@/lib/engine/types";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendEmail, type SendEmailAttachment } from "@/lib/email/smtp";
import { requireStaffUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface SendQuoteRequest {
  to: string;
  customerName?: string;
  note?: string;
  quoteData: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
  proofImage?: { dataUrl: string; filename: string; mimeType: string } | null;
  includePaymentLink?: boolean;
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
    const { to, customerName, note, quoteData, jobDetails, proofImage, includePaymentLink } = body;

    // Validate
    if (!to || !isValidEmail(to)) {
      return Response.json({ error: "A valid customer email address is required." }, { status: 400 });
    }
    if (!quoteData || quoteData.status !== "QUOTED" || !quoteData.sell_price) {
      return Response.json({ error: "Quote is incomplete or not ready to send." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const from = process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
    const bcc = process.env.SMTP_BCC ?? undefined;

    // Generate payment link + QR code if requested and token secret is configured
    let paymentUrl: string | undefined;
    let qrCodeBuffer: Buffer | undefined;
    const QR_CID = "qrcode@truecolor";
    if (includePaymentLink && process.env.PAYMENT_TOKEN_SECRET) {
      const sellPrice = quoteData.sell_price ?? 0;
      const totalWithGst = Math.round(sellPrice * 1.05 * 100) / 100;
      const description = `True Color Display Printing — ${jobDetails.categoryLabel}`;
      const token = encodePaymentToken(totalWithGst, description, to);
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
}: Pick<SendQuoteRequest, "customerName" | "note" | "quoteData" | "jobDetails"> & { hasProofAttachment?: boolean; paymentUrl?: string }): string {
  const sellPrice = quoteData.sell_price ?? 0;
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;
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
