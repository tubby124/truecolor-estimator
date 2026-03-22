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
import { requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import type { EstimateResponse } from "@/lib/engine/types";
import {
  createOrFindWaveCustomer,
  createWaveInvoice,
  approveWaveInvoice,
  sendWaveInvoice,
  type WaveLineItem,
} from "@/lib/wave/invoice";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";

interface JobDetailsMini {
  qty: number;
  isRush: boolean;
  categoryLabel: string;
}

interface WaveQuoteRequest {
  customerEmail: string;
  customerName?: string;
  // Single-item mode
  quoteData?: EstimateResponse;
  jobDetails?: JobDetailsMini;
  // Multi-item mode
  items?: Array<{ quoteData: EstimateResponse; jobDetails: JobDetailsMini }>;
  action: "draft" | "send";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    // Check Wave is configured before doing any work
    if (!process.env.WAVE_API_TOKEN) {
      return Response.json(
        { error: "Wave is not configured on this server (WAVE_API_TOKEN missing)." },
        { status: 503 }
      );
    }

    const body: WaveQuoteRequest = await req.json();
    const { customerEmail, customerName, action } = body;

    // Validate email
    if (!customerEmail || !isValidEmail(customerEmail)) {
      return Response.json({ error: "A valid customer email address is required." }, { status: 400 });
    }

    const name = customerName?.trim() || customerEmail;
    const isMultiItem = body.items && body.items.length > 0;

    // ── Multi-item path ────────────────────────────────────────────────────────
    let waveItems: WaveLineItem[];
    let isRush: boolean;
    let totalDisplay: string;
    let jobSummary: string;

    if (isMultiItem) {
      const items = body.items!;
      for (const item of items) {
        if (!item.quoteData || item.quoteData.status !== "QUOTED" || !item.quoteData.sell_price) {
          return Response.json({ error: "One or more items are incomplete or not ready to send." }, { status: 400 });
        }
      }
      // Combine all line items — prefix each with category label for clarity
      waveItems = items.flatMap((item) =>
        item.quoteData.line_items.map((li) => ({
          description: items.length > 1
            ? `[${item.jobDetails.categoryLabel}] ${li.description}`
            : li.description,
          unitPrice: li.unit_price,
          qty: li.qty,
          applyGst: true,
        }))
      );
      isRush = items.some((it) => it.jobDetails.isRush);
      const combinedSubtotal = items.reduce((s, it) => s + (it.quoteData.sell_price ?? 0), 0);
      totalDisplay = combinedSubtotal.toFixed(2);
      jobSummary = items.map((it) => `${it.jobDetails.categoryLabel} ×${it.jobDetails.qty}`).join(", ");
    } else {
      // ── Single-item path ───────────────────────────────────────────────────
      const { quoteData, jobDetails } = body;
      if (!quoteData || quoteData.status !== "QUOTED" || !quoteData.sell_price) {
        return Response.json({ error: "Quote is not ready (status must be QUOTED with a price)." }, { status: 400 });
      }
      if (!jobDetails?.qty || jobDetails.qty < 1) {
        return Response.json({ error: "Job quantity is required." }, { status: 400 });
      }
      waveItems = quoteData.line_items.map((item) => ({
        description: item.description,
        unitPrice: item.unit_price,
        qty: item.qty,
        applyGst: true,
      }));
      isRush = jobDetails.isRush;
      totalDisplay = quoteData.sell_price?.toFixed(2) ?? "?";
      jobSummary = `${jobDetails.categoryLabel} ×${jobDetails.qty}`;
    }

    // 1. Find or create Wave customer
    const customerId = await createOrFindWaveCustomer(customerEmail, name);

    // 2. Create the invoice (DRAFT)
    const invoice = await createWaveInvoice(customerId, waveItems, {
      isRush,
      memo: `Pickup at 216 33rd St W, Saskatoon SK. Questions? Call (306) 954-8688.`,
    });

    let finalAction: "draft" | "approved" | "sent" = "draft";

    // 3. If "send": approve then send via Wave email
    if (action === "send") {
      try {
        await approveWaveInvoice(invoice.invoiceId);
        finalAction = "approved";
        await sendWaveInvoice(invoice.invoiceId, customerEmail);
        finalAction = "sent";
      } catch (sendErr) {
        console.error("[quote/wave] Approve/send failed (invoice still created):", sendErr);
      }
    }

    // Staff summary notification — fires only when invoice was actually sent
    if (finalAction === "sent") {
      try {
        const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
        const rushLabel = isRush ? " 🚨 RUSH" : "";
        const multiLabel = isMultiItem ? ` (${body.items!.length} items)` : "";
        await sendEmail({
          from: process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>",
          to: staffEmail,
          subject: `[Quote Sent] ${name} — ${jobSummary}${rushLabel}${multiLabel} — $${totalDisplay}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
              <div style="background:#16C2F3;padding:16px 24px;">
                <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Quote Sent to Customer</p>
              </div>
              <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Customer</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;">${customerEmail}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Job</td><td style="padding:6px 0;">${jobSummary}${rushLabel}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;font-weight:600;">$${totalDisplay} + GST</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Invoice #</td><td style="padding:6px 0;">${invoice.invoiceNumber}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;">Sent at</td><td style="padding:6px 0;">${new Date().toLocaleString("en-CA", { timeZone: "America/Regina" })} CST</td></tr>
                </table>
                ${invoice.viewUrl ? `<div style="margin-top:16px;"><a href="${invoice.viewUrl}" style="background:#16C2F3;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;font-size:14px;">View Wave Invoice</a></div>` : ""}
              </div>
            </div>`,
          text: `Quote sent to ${name} (${customerEmail})\nJob: ${jobSummary}${rushLabel}\nTotal: $${totalDisplay} + GST\nInvoice #: ${invoice.invoiceNumber}\n${invoice.viewUrl ? `View: ${invoice.viewUrl}` : ""}`,
        });
        console.log(`[quote/wave] staff notification sent → ${staffEmail}`);
      } catch (notifyErr) {
        console.error("[quote/wave] staff notification failed (non-fatal):", notifyErr);
      }
    }

    try {
      const nameParts = name.split(/\s+/);
      await syncCustomerToBrevo({
        email: customerEmail.toLowerCase().trim(),
        firstName: nameParts[0] || name,
        lastName: nameParts.slice(1).join(" ") || undefined,
        orderNumber: invoice.invoiceNumber,
        orderTotal: parseFloat(totalDisplay) || 0,
        productSummary: jobSummary,
        source: "quote",
        accountStatus: "none",
      });
    } catch (brevoErr) {
      console.error("[quote/wave] Brevo sync failed (non-fatal):", brevoErr);
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
