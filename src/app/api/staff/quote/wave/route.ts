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
