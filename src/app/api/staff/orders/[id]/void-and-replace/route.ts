import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";
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
      .select("id, order_number, status, paid_at, wave_invoice_id, voided_at, quote_request_id")
      .eq("id", id)
      .maybeSingle();
    if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paid_at || order.status !== "pending_payment") {
      return NextResponse.json({ error: "Paid or progressed documents are immutable; use the finance correction/refund process and record its reference." }, { status: 409 });
    }
    if (order.voided_at) return NextResponse.json({ error: "This payment request has already been voided" }, { status: 409 });
    if (order.quote_request_id) {
      return NextResponse.json({ error: "Structured quotes must be corrected by sending a new quote revision, not by voiding the materialized order." }, { status: 409 });
    }
    if (!order.wave_invoice_id) {
      return NextResponse.json({ error: "The accounting invoice is not linked. Reconcile it before issuing a replacement." }, { status: 409 });
    }

    // Claim the request before voiding in Wave, so the current payment link is
    // immediately unusable and a concurrent replacement cannot be created.
    const voidedAt = new Date().toISOString();
    const { data: voided, error: claimError } = await supabase
      .from("orders")
      .update({ voided_at: voidedAt, voided_by: auth.email ?? "staff", void_reason: reason })
      .eq("id", id)
      .eq("status", "pending_payment")
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

    const { error: finalizedError } = await supabase
      .from("orders")
      .update({ wave_voided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("voided_at", voidedAt);
    if (finalizedError) {
      console.error("[void-and-replace] Wave void completed but persistence failed:", finalizedError.message);
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
