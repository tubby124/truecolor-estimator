/**
 * POST /api/staff/orders/[id]/receipt
 *
 * Sends a payment receipt email to the customer for a given order.
 * Staff-only — uses requireStaffUser().
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";

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
         discount_code, discount_amount, payment_method, created_at,
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

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    await sendPaymentReceipt({
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
    });

    console.log(`[staff/orders/receipt] sent → ${customer.email} | order ${order.order_number}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send receipt";
    console.error("[staff/orders/receipt]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
