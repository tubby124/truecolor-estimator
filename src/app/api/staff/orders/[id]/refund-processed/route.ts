/**
 * POST /api/staff/orders/[id]/refund-processed
 *
 * Staff just processed a manual Clover refund for this order (triggered
 * by a prior reprice with negative delta). This route writes the audit
 * event so /staff/lifecycle's RefundsPendingPanel drops the row from
 * the queue.
 *
 * Does NOT call the Clover refund API. That's a separate explicit-owner-
 * approval gate. Staff handles the refund manually in the Clover dashboard;
 * this endpoint just records that the manual step is done.
 *
 * Body (optional):
 *   { clover_refund_id?: string, notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent, extractRequestContext } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      clover_refund_id?: string;
      notes?: string;
    };

    const supabase = createServiceClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, total, staff_notes")
      .eq("id", id)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Append to staff_notes for in-line readability on the order page
    const stamp = `[${new Date().toISOString().slice(0, 10)}] REFUND PROCESSED by ${staffCheck.email}${body.clover_refund_id ? ` (Clover ref ${body.clover_refund_id})` : ""}${body.notes ? `: ${body.notes}` : ""}`;
    const newStaffNotes = order.staff_notes ? `${order.staff_notes}\n${stamp}` : stamp;
    await supabase
      .from("orders")
      .update({ staff_notes: newStaffNotes } as Record<string, unknown>)
      .eq("id", order.id);

    // Audit event — this is what drops the row from the RefundsPendingPanel
    const reqCtx = extractRequestContext(req);
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.refund_processed",
      entity_type: "order",
      entity_id: order.id,
      detail: {
        order_number: order.order_number,
        clover_refund_id: body.clover_refund_id ?? null,
        notes: body.notes ?? null,
      },
      ip: reqCtx.ip,
      user_agent: reqCtx.user_agent,
    });

    return NextResponse.json({ ok: true, order_number: order.order_number });
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
