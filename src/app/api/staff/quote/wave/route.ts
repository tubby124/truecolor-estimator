/**
 * POST /api/staff/quote/wave
 *
 * Creates a Wave invoice from a staff quote. Optionally approves + sends it
 * to the customer via Wave's own email (giving them a hosted payment link).
 *
 * Actions:
 *   "draft" → create DRAFT invoice only (appears in Wave, not sent)
 *   "send"  → create + approve + send to customer via Wave email
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import type { EstimateResponse } from "@/lib/engine/types";
import {
  createOrFindWaveCustomer,
  createWaveInvoice,
  approveWaveInvoice,
  sendWaveInvoice,
  type WaveLineItem,
} from "@/lib/wave/invoice";

interface WaveQuoteRequest {
  customerEmail: string;
  customerName?: string;
  quoteData: EstimateResponse;
  jobDetails: {
    qty: number;
    isRush: boolean;
    categoryLabel: string;
  };
  action: "draft" | "send";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check Wave is configured before doing any work
    if (!process.env.WAVE_API_TOKEN) {
      return Response.json(
        { error: "Wave is not configured on this server (WAVE_API_TOKEN missing)." },
        { status: 503 }
      );
    }

    const body: WaveQuoteRequest = await req.json();
    const { customerEmail, customerName, quoteData, jobDetails, action } = body;

    // Validate
    if (!customerEmail || !isValidEmail(customerEmail)) {
      return Response.json({ error: "A valid customer email address is required." }, { status: 400 });
    }
    if (!quoteData || quoteData.status !== "QUOTED" || !quoteData.sell_price) {
      return Response.json({ error: "Quote is not ready (status must be QUOTED with a price)." }, { status: 400 });
    }
    if (!jobDetails?.qty || jobDetails.qty < 1) {
      return Response.json({ error: "Job quantity is required." }, { status: 400 });
    }

    const name = customerName?.trim() || customerEmail;

    // 1. Find or create Wave customer
    const customerId = await createOrFindWaveCustomer(customerEmail, name);

    // 2. Map quote line items → Wave line items
    //    EstimateResponse.line_items has { description, qty, unit_price, line_total }
    const waveItems: WaveLineItem[] = quoteData.line_items.map((item) => ({
      description: item.description,
      unitPrice: item.unit_price,
      qty: item.qty,
      applyGst: true,
    }));

    // 3. Create the invoice (DRAFT)
    const invoice = await createWaveInvoice(customerId, waveItems, {
      isRush: jobDetails.isRush,
      memo: `Pickup at 216 33rd St W, Saskatoon SK. Questions? Call (306) 954-8688.`,
    });

    let finalAction: "draft" | "approved" | "sent" = "draft";

    // 4. If "send": approve then send via Wave email
    if (action === "send") {
      try {
        await approveWaveInvoice(invoice.invoiceId);
        finalAction = "approved";
        await sendWaveInvoice(invoice.invoiceId, customerEmail);
        finalAction = "sent";
      } catch (sendErr) {
        // Non-fatal — invoice was created, just not sent
        console.error("[quote/wave] Approve/send failed (invoice still created):", sendErr);
      }
    }

    // Staff summary notification — fires only when invoice was actually sent
    if (finalAction === "sent") {
      try {
        const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
        const rushLabel = jobDetails.isRush ? " 🚨 RUSH" : "";
        const totalDisplay = quoteData.sell_price?.toFixed(2) ?? "?";
        await sendEmail({
          from: process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>",
          to: staffEmail,
          subject: `[Quote Sent] ${name} — ${jobDetails.categoryLabel} ×${jobDetails.qty}${rushLabel} — $${totalDisplay}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
              <div style="background:#16C2F3;padding:16px 24px;">
                <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Quote Sent to Customer</p>
              </div>
              <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Customer</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;">${customerEmail}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Job</td><td style="padding:6px 0;">${jobDetails.categoryLabel} × ${jobDetails.qty}${rushLabel}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;font-weight:600;">$${totalDisplay} + GST</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Invoice #</td><td style="padding:6px 0;">${invoice.invoiceNumber}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Sent at</td><td style="padding:6px 0;">${new Date().toLocaleString("en-CA", { timeZone: "America/Regina" })} CST</td></tr>
                </table>
                ${invoice.viewUrl ? `<div style="margin-top:16px;"><a href="${invoice.viewUrl}" style="background:#16C2F3;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;font-size:14px;">View Wave Invoice</a></div>` : ""}
              </div>
            </div>`,
          text: `Quote sent to ${name} (${customerEmail})\nJob: ${jobDetails.categoryLabel} × ${jobDetails.qty}${rushLabel}\nTotal: $${totalDisplay} + GST\nInvoice #: ${invoice.invoiceNumber}\n${invoice.viewUrl ? `View: ${invoice.viewUrl}` : ""}`,
        });
        console.log(`[quote/wave] staff notification sent → ${staffEmail}`);
      } catch (notifyErr) {
        console.error("[quote/wave] staff notification failed (non-fatal):", notifyErr);
      }
    }

    return Response.json({
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice.invoiceId,
      viewUrl: invoice.viewUrl,
      pdfUrl: invoice.pdfUrl,
      action: finalAction,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Wave invoice";
    console.error("[api/staff/quote/wave]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
