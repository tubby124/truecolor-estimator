/**
 * POST /api/staff/quote/wave
 *
 * Creates a Wave invoice from a staff quote. Always DRAFT — never sent via
 * Wave's hosted-payment email (deprecated 2026-05-20: Wave has no webhooks
 * on the current plan, so payments through Wave's portal silently desync
 * from Supabase).
 *
 * For sending a payment request to the customer, use /api/staff/manual-order
 * which creates the Supabase order + sends our paymentRequest email with a
 * Clover /pay/[token] link. The Clover webhook auto-approves the Wave
 * invoice + records payment.
 *
 * Actions:
 *   "draft" → create DRAFT invoice (default, only option)
 *   "send"  → DEPRECATED — silently downgraded to draft + warning logged
 */

import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import type { EstimateResponse } from "@/lib/engine/types";
import {
  createOrFindWaveCustomer,
  createWaveInvoice,
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

// Rule IDs that are PST-exempt per CLAUDE.md / truecolor-domain.md:
//   Rush fee — explicitly PST-exempt
//   Design fees — engine treats design_fee as PST-exempt in Step 10
// All other line items (print sales, add-ons, etc.) are taxable in SK.
const PST_EXEMPT_RULE_IDS = new Set([
  "PR-DESIGN-BASIC",
  "PR-DESIGN-FULL",
  "PR-DESIGN-LOGO",
  "PR-ADDON-RUSH",
]);

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
          applyPst: !PST_EXEMPT_RULE_IDS.has(li.rule_id),
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
        applyPst: !PST_EXEMPT_RULE_IDS.has(item.rule_id),
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

    const finalAction = "draft" as const;

    // Send-via-Wave path was deprecated 2026-05-20. Wave's hosted-payment page
    // is no longer used (no webhooks → silent desync). If staff explicitly
    // requested "send", we still create the DRAFT but log the deprecation.
    // Staff should re-create the payment request via /api/staff/manual-order.
    if (action === "send") {
      console.warn(`[quote/wave] action="send" deprecated — invoice ${invoice.invoiceId} created as DRAFT only. Use manual-order flow to send payment request via Clover.`);
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
