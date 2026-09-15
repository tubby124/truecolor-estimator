/**
 * POST /api/staff/orders/[id]/receipt
 *
 * Sends a payment receipt email to the customer for a given order.
 * Staff-only — uses requireStaffUser().
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { recordAuditEvent } from "@/lib/audit/record";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `id, order_number, status, subtotal, gst, pst, total, is_rush,
         discount_code, discount_amount, payment_method, created_at, receipt_token,
         order_items ( product_name, qty, width_in, height_in, sides, line_total ),
         customers ( name, email )`
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerRaw = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });
    }

    if (!["payment_received", "in_production", "ready_for_pickup", "complete"].includes(order.status)) {
      return NextResponse.json({ error: "Payment must be confirmed before a receipt can be sent" }, { status: 409 });
    }
    const body = await req.json().catch(() => ({})) as { resend?: boolean; requestId?: string; requestCreatedAt?: number };
    const { data: previous, error: receiptError } = await supabase.from("email_log")
      .select("sent_at").eq("order_id", id).like("subject", "Receipt —%")
      .in("status", ["sent", "delivered", "opened", "clicked"])
      .order("sent_at", { ascending: false }).limit(1).maybeSingle();
    if (receiptError) return NextResponse.json({ error: "Receipt history could not be verified. No email was sent." }, { status: 503 });
    if (previous && body.resend !== true) return NextResponse.json({ ok: true, alreadySent: true, sentAt: previous.sent_at });
    if (body.resend === true && (typeof body.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId))) {
      return NextResponse.json({ error: "A unique resend request is required" }, { status: 400 });
    }

    if (body.resend === true && (typeof body.requestCreatedAt !== "number" || !Number.isFinite(body.requestCreatedAt) ||
      Date.now() - body.requestCreatedAt > 5 * 60_000 || body.requestCreatedAt - Date.now() > 30_000)) {
      return NextResponse.json({ error: "This resend request expired. Confirm a new resend to continue." }, { status: 400 });
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    await sendPaymentReceipt({
      idempotencyKey: body.resend === true ? `receipt-resend:${id}:${body.requestId}` : `payment-receipt:${id}:v1`,
      orderNumber: order.order_number,
      customerName: customer.name,
      customerEmail: customer.email,
      createdAt: order.created_at,
      items: items.map((i) => ({
        product_name: i.product_name,
        qty: i.qty,
        width_in: i.width_in,
        height_in: i.height_in,
        sides: i.sides,
        line_total: Number(i.line_total),
      })),
      subtotal: Number(order.subtotal),
      gst: Number(order.gst),
      pst: Number(order.pst ?? 0),
      total: Number(order.total),
      isRush: Boolean(order.is_rush),
      discountCode: order.discount_code,
      discountAmount: order.discount_amount ? Number(order.discount_amount) : null,
      paymentMethod: order.payment_method,
      oid: order.id,
      receiptToken: (order as { receipt_token?: string | null }).receipt_token ?? null,
    });

    await recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.notification_outcome",
      entity_type: "order",
      entity_id: id,
      detail: { order_number: order.order_number, status: "payment_received", outcome: "accepted" },
    });
    console.log(`[staff/orders/receipt] sent → ${customer.email} | order ${order.order_number}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send receipt";
    console.error("[staff/orders/receipt]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
