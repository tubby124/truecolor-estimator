import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";
import { waveQuery, WAVE_BUSINESS_ID } from "@/lib/wave/client";
import { voidWaveInvoice } from "@/lib/wave/invoice";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json() as { reason?: unknown };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: "A correction reason of up to 500 characters is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, paid_at, wave_invoice_id, voided_at, quote_request_id, payment_reference, quote_checkout_state, quote_wave_state, wave_invoice_approved_at, wave_payment_recorded_at, total")
      .eq("id", id)
      .maybeSingle();
    if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paid_at || order.wave_payment_recorded_at || order.status !== "pending_payment") {
      return NextResponse.json({ error: "Paid or progressed documents are immutable; use the finance correction/refund process and record its reference." }, { status: 409 });
    }
    if (order.voided_at) return NextResponse.json({ error: "This payment request has already been voided" }, { status: 409 });
    if (order.quote_request_id) {
      return NextResponse.json({ error: "Structured quotes must be corrected by sending a new quote revision, not by voiding the materialized order." }, { status: 409 });
    }
    if (!order.wave_invoice_id) {
      return NextResponse.json({ error: "The accounting invoice is not linked. Reconcile it before issuing a replacement." }, { status: 409 });
    }

    if (order.payment_reference || ![null, "none", "failed"].includes(order.quote_checkout_state)) {
      return NextResponse.json({ error: "A checkout exists or its outcome is uncertain. Reconcile Clover before replacing this request." }, { status: 409 });
    }
    if (order.quote_wave_state !== "ready" || !order.wave_invoice_approved_at) {
      return NextResponse.json({ error: "Accounting is not confirmed ready. Reconcile Wave before replacing this request." }, { status: 409 });
    }
    const { data: attempts, error: attemptsError } = await supabase.from("payment_attempts")
      .select("id").eq("order_id", id).limit(1);
    if (attemptsError || !attempts || attempts.length) {
      return NextResponse.json({ error: "Payment history must be reconciled before replacing this request." }, { status: 409 });
    }
    // A local pending flag does not prove the accounting invoice is unpaid.
    // Wave statuses/amount fields: developer.waveapps.com API Reference, Sep 6 2026.
    let invoice: { id: string; status: string; amountPaid: { value: string }; total: { value: string } } | null;
    try {
      const snapshot = await waveQuery<{ business: { invoice: typeof invoice } | null }>(
        `query($bizId: ID!, $invId: ID!) { business(id: $bizId) { invoice(id: $invId) { id status amountPaid { value } total { value } } } }`,
        { bizId: WAVE_BUSINESS_ID, invId: order.wave_invoice_id },
      );
      invoice = snapshot.business?.invoice ?? null;
    } catch {
      return NextResponse.json({ error: "Wave payment state could not be verified. Reconcile before replacing this request." }, { status: 502 });
    }
    if (!invoice || invoice.id !== order.wave_invoice_id || !["DRAFT", "SAVED", "SENT", "VIEWED", "UNPAID", "OVERDUE"].includes(invoice.status)
      || !invoice.amountPaid || invoice.amountPaid.value === "" || Number(invoice.amountPaid.value) !== 0
      || !invoice.total || !Number.isFinite(Number(invoice.total.value)) || !Number.isFinite(Number(order.total))
      || Math.round(Number(invoice.total.value) * 100) !== Math.round(Number(order.total) * 100)) {
      return NextResponse.json({ error: "Wave is paid, changed, missing or uncertain. Finance review is required before correction." }, { status: 409 });
    }

    // Claim the request before voiding in Wave, so the current payment link is
    // immediately unusable and a concurrent replacement cannot be created.
    const voidedAt = new Date().toISOString();
    const { data: voided, error: claimError } = await supabase
      .from("orders")
      .update({ voided_at: voidedAt, voided_by: auth.email ?? "staff", void_reason: reason })
      .eq("id", id)
      .eq("status", "pending_payment")
      .is("paid_at", null)
      .is("wave_payment_recorded_at", null)
      .is("payment_reference", null)
      .eq("quote_wave_state", "ready")
      .eq("wave_invoice_id", order.wave_invoice_id)
      .eq("total", order.total)
      .is("voided_at", null)
      .select("id, order_number")
      .maybeSingle();
    if (claimError || !voided) {
      return NextResponse.json({ error: "This payment request changed before it could be voided. Refresh and try again." }, { status: 409 });
    }

    try {
      await voidWaveInvoice(order.wave_invoice_id);
    } catch (waveError) {
      console.error("[void-and-replace] Wave void failed:", waveError instanceof Error ? waveError.message : waveError);
      return NextResponse.json({ error: "Wave void could not be confirmed. The original request remains blocked; reconcile Wave before restoring or replacing it." }, { status: 502 });
    }

    const { data: finalized, error: finalizedError } = await supabase
      .from("orders")
      .update({ wave_voided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("voided_at", voidedAt)
      .eq("status", "pending_payment")
      .is("paid_at", null)
      .select("id")
      .maybeSingle();
    if (finalizedError || !finalized) {
      console.error("[void-and-replace] Wave void completed but persistence failed:", finalizedError?.message ?? "Order changed after void");
      return NextResponse.json({ error: "Wave was voided but the internal record needs reconciliation before a replacement can be sent." }, { status: 502 });
    }

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: auth.email ?? "staff",
      event_type: "order.payment_request_voided",
      entity_type: "order",
      entity_id: id,
      detail: { order_number: order.order_number, reason },
    });

    return NextResponse.json({ ok: true, replacementUrl: `/staff/orders?manual=1&replace=${encodeURIComponent(id)}` });
  } catch (error) {
    console.error("[void-and-replace]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
