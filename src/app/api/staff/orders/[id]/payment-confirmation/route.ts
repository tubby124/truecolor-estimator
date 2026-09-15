/**
 * POST /api/staff/orders/[id]/payment-confirmation
 *
 * Resends the True Color fulfilment update after payment. This is explicitly
 * not a receipt: official financial documents are provided by Wave.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

const PAID_STATUSES = new Set([
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
]);

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total, is_rush, payment_method,
        order_items ( product_name, qty, width_in, height_in, sides, line_total ),
        customers ( name, email )
      `)
      .eq("id", id)
      .single();
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!PAID_STATUSES.has(order.status ?? "")) {
      return NextResponse.json({ error: "Payment must be confirmed before an update can be sent" }, { status: 409 });
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string | null; email: string | null } | null;
    if (!customer?.email?.trim()) return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });

    const body = await req.json().catch(() => ({})) as {
      resend?: boolean;
      requestId?: string;
      requestCreatedAt?: number;
    };
    const { data: previous, error: historyError } = await supabase
      .from("email_log")
      .select("sent_at")
      .eq("order_id", id)
      .like("subject", "Payment confirmed —%")
      .in("status", ["sent", "delivered", "opened", "clicked"])
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (historyError) {
      return NextResponse.json({ error: "Payment-update history could not be verified. No email was sent." }, { status: 503 });
    }
    if (previous && body.resend !== true) {
      return NextResponse.json({ ok: true, alreadySent: true, sentAt: previous.sent_at });
    }
    if (body.resend === true && (
      typeof body.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId) ||
      typeof body.requestCreatedAt !== "number" ||
      !Number.isFinite(body.requestCreatedAt) ||
      Date.now() - body.requestCreatedAt > 5 * 60_000 ||
      body.requestCreatedAt - Date.now() > 30_000
    )) {
      return NextResponse.json({ error: "A fresh, unique resend request is required" }, { status: 400 });
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    await sendOrderStatusEmail({
      orderId: id,
      idempotencyKey: body.resend === true
        ? `payment-confirmation-resend:${id}:${body.requestId}`
        : `payment-confirmation:${id}:v1`,
      requireEmailLog: true,
      status: "payment_received",
      orderNumber: order.order_number,
      customerName: customer.name ?? "Customer",
      customerEmail: customer.email,
      total: Number(order.total),
      isRush: Boolean(order.is_rush),
      paymentMethod: order.payment_method ?? undefined,
      items: items.map((item) => ({
        product_name: item.product_name,
        qty: item.qty,
        width_in: item.width_in,
        height_in: item.height_in,
        sides: item.sides,
        line_total: Number(item.line_total),
      })),
    });
    await recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.notification_outcome",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        status: "payment_received",
        outcome: "accepted",
        channel: "truecolor_payment_update",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[staff/orders/payment-confirmation] send failed:", error);
    return NextResponse.json({ error: "Payment update could not be sent" }, { status: 500 });
  }
}
