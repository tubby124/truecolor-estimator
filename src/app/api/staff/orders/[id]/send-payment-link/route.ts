/**
 * POST /api/staff/orders/[id]/send-payment-link
 *
 * Staff-only. Sends a Clover Pay Now link to ANY payer for ANY amount against
 * a specific order. This is the split-payment / partial-payment workhorse —
 * it does NOT change the order or the customer record, it just emails a link.
 *
 * Use cases:
 *   - Customer wants to split an invoice 50/50 between two companies
 *   - Customer's first card was declined; staff sends a fresh link for the balance
 *   - A different person at the customer's organization is paying
 *
 * The link uses the same HMAC payment-token pattern as resend-payment, so it
 * survives Clover's 15-minute checkout-session expiry. When the customer pays,
 * the existing Clover webhook records the payment against this order (just as
 * a regular payment — staff still records the ledger row manually for now via
 * the Record payment form; webhook auto-attribution is a follow-up).
 *
 * Body: { amount, payer: { name, email, company? }, notes? }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendPaymentRequestEmail } from "@/lib/email/paymentRequest";
import { recordAuditEvent } from "@/lib/audit/record";
import { summarizeOrderPayments, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";

interface Params {
  params: Promise<{ id: string }>;
}

interface PayerInput {
  name?: unknown;
  email?: unknown;
  company?: unknown;
}

function cleanString(value: unknown, maxLen = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isValidEmail(email: string): boolean {
  // Lightweight RFC-ish check — full validation happens at the SMTP layer.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = await req.json() as { amount?: unknown; payer?: PayerInput; notes?: unknown };

    // ── Validate inputs ─────────────────────────────────────────────────────
    const amount = parseAmount(body.amount);
    if (amount === null || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (amount > 100_000) {
      return NextResponse.json({ error: "Amount exceeds maximum ($100,000)" }, { status: 400 });
    }

    const payerName = cleanString(body.payer?.name);
    const payerEmail = cleanString(body.payer?.email)?.toLowerCase() ?? null;
    const payerCompany = cleanString(body.payer?.company);
    const notes = cleanString(body.notes, 500);

    if (!payerEmail) {
      return NextResponse.json({ error: "Payer email is required" }, { status: 400 });
    }
    if (!isValidEmail(payerEmail)) {
      return NextResponse.json({ error: "Payer email is invalid" }, { status: 400 });
    }
    if (!payerName && !payerCompany) {
      return NextResponse.json({ error: "Payer name or company is required" }, { status: 400 });
    }

    // ── Load order context (used for email title + ledger-aware messaging) ─
    const supabase = createServiceClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total,
        subtotal,
        gst,
        pst,
        is_rush,
        notes,
        customers ( name, email, company )
      `)
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      console.error("[send-payment-link] order fetch", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const total = Number(order.total ?? 0);
    if (amount > total + 0.01) {
      return NextResponse.json(
        { error: `Amount exceeds the order total (${total.toFixed(2)})` },
        { status: 400 },
      );
    }

    // ── Overpayment guard — sum existing ledger + this new link's amount ───
    // We treat the new link as a future ledger entry (worst case it gets paid
    // in full). If that would tip the order over the total, block unless the
    // route is rerun with allowOverpay=true (future enhancement).
    const { data: paymentRows } = await supabase
      .from("order_payments")
      .select("amount, method, status")
      .eq("order_id", id);

    const recordedLedger: OrderPaymentLedgerEntry[] = ((paymentRows ?? []) as Array<{ amount: number | string; method: string; status: string | null }>).map((r) => ({
      amount: Number(r.amount),
      method: r.method as OrderPaymentLedgerEntry["method"],
      status: (r.status ?? "recorded") as OrderPaymentLedgerEntry["status"],
    }));
    const summary = summarizeOrderPayments(total, recordedLedger);
    if (amount > summary.balanceDue + 0.01) {
      return NextResponse.json(
        {
          error: `Amount exceeds the remaining balance ($${summary.balanceDue.toFixed(2)}).`,
          balanceDue: summary.balanceDue,
        },
        { status: 400 },
      );
    }

    // ── Build payment token + URL ──────────────────────────────────────────
    let token: string;
    try {
      token = encodePaymentToken(
        amount,
        `True Color Order ${order.order_number}${amount < total ? ` — partial payment` : ""}`,
        payerEmail,
      );
    } catch (err) {
      console.error("[send-payment-link] token encode failed", err);
      return NextResponse.json({ error: "Server configuration error — payment token signing failed" }, { status: 500 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const paymentUrl = `${siteUrl}/pay/${token}`;

    // ── Send payment-request email to this specific payer ──────────────────
    const isPartial = amount < total - 0.01;
    const customNote = notes
      ?? (isPartial
        ? `This is your portion ($${amount.toFixed(2)}) of order ${order.order_number} — total invoice is $${total.toFixed(2)}.`
        : null);

    try {
      await sendPaymentRequestEmail({
        orderNumber: order.order_number,
        contact: {
          name: payerName || payerCompany || "Customer",
          email: payerEmail,
          company: payerCompany,
        },
        // Only one synthetic line item for the partial amount — split-payment
        // recipients don't see the full order's item breakdown by design.
        items: [
          {
            product: isPartial
              ? `Partial payment — order ${order.order_number}`
              : `Order ${order.order_number}`,
            qty: 1,
            amount,
          },
        ],
        subtotal: amount,
        gst: 0,
        pst: 0,
        total: amount,
        paymentUrl,
        paymentMethod: "clover",
        notes: customNote,
      });
    } catch (emailErr) {
      console.error("[send-payment-link] email send failed", emailErr);
      return NextResponse.json({ error: "Failed to send payment-link email" }, { status: 500 });
    }

    // ── Audit log ──────────────────────────────────────────────────────────
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.payment_link_sent",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        amount,
        payer_name: payerName,
        payer_company: payerCompany,
        payer_email: payerEmail,
        is_partial: isPartial,
        balance_due_before: summary.balanceDue,
      },
    });

    return NextResponse.json({
      ok: true,
      sentTo: payerEmail,
      amount,
      paymentUrl,
      isPartial,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send payment link";
    console.error("[send-payment-link]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
