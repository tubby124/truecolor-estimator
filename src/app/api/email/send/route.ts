import nodemailer from "nodemailer";
import { buildQuoteEmailHtml, type QuoteEmailData } from "@/lib/email/quoteTemplate";
import type { EstimateResponse } from "@/lib/engine/types";

interface SendQuoteRequest {
  to: string;
  customerName?: string;
  note?: string;
  quoteData: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
  proofImage?: { dataUrl: string; filename: string; mimeType: string } | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false"; // default true
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP environment variables not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function POST(req: Request) {
  try {
    const body: SendQuoteRequest = await req.json();
    const { to, customerName, note, quoteData, jobDetails, proofImage } = body;

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

    const hasProofAttachment = !!(proofImage?.dataUrl);
    const html = buildQuoteEmailHtml({ customerEmail: to, customerName, note, quoteData, jobDetails, siteUrl, hasProofAttachment });

    const subject = customerName
      ? `Your Quote from True Color Display Printing — ${jobDetails.categoryLabel}`
      : `Quote from True Color Display Printing — ${jobDetails.categoryLabel}`;

    const transporter = getTransporter();

    // Build attachment array if a proof image was uploaded
    type MailAttachment = { filename: string; content: Buffer; contentType: string };
    const attachments: MailAttachment[] = [];
    if (proofImage?.dataUrl) {
      // Strip "data:<mime>;base64," prefix
      const base64Data = proofImage.dataUrl.replace(/^data:[^;]+;base64,/, "");
      attachments.push({
        filename: proofImage.filename,
        content: Buffer.from(base64Data, "base64"),
        contentType: proofImage.mimeType,
      });
    }

    await transporter.sendMail({
      from,
      to,
      bcc,
      subject,
      html,
      // Plain-text fallback
      text: buildPlainText({ customerName, note, quoteData, jobDetails, hasProofAttachment }),
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email/send]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildPlainText({
  customerName,
  note,
  quoteData,
  jobDetails,
  hasProofAttachment,
}: Pick<SendQuoteRequest, "customerName" | "note" | "quoteData" | "jobDetails"> & { hasProofAttachment?: boolean }): string {
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
