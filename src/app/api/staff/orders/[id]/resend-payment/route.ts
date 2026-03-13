/**
 * POST /api/staff/orders/[id]/resend-payment
 *
 * Staff-only. Re-sends the payment link to the customer for an order
 * that is still in pending_payment status.
 *
 * Clover orders: re-encodes a fresh /pay/{token} and sends paymentRequest email.
 * Wave orders:   re-sends the Wave invoice email via sendWaveInvoice().
 *
 * Guards: staff auth, order must exist, status must be pending_payment.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendPaymentRequestEmail } from "@/lib/email/paymentRequest";
import { sendWaveInvoice } from "@/lib/wave/invoice";
import { sanitizeError } from "@/lib/errors/sanitize";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Fetch full order with customer
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total,
        subtotal,
        gst,
        payment_method,
        wave_invoice_id,
        notes,
        customers ( name, email, company ),
        order_items ( product_name, qty, line_total )
      `)
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Guard: only resend for pending_payment orders
    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Payment link can only be resent for orders awaiting payment" },
        { status: 400 }
      );
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string; company?: string | null } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on file" }, { status: 400 });
    }

    const total = Number(order.total);
    const subtotal = Number(order.subtotal);
    const gst = Number(order.gst);
    const pst = Number((order as Record<string, unknown>).pst ?? 0);

    // Build a description from order_items (or fall back to notes)
    const items = (Array.isArray(order.order_items) ? order.order_items : [order.order_items])
      .filter(Boolean) as Array<{ product_name: string; qty: number; line_total: number }>;

    const description =
      items.length > 0
        ? items.length === 1
          ? `${items[0].product_name}${items[0].qty > 1 ? ` × ${items[0].qty}` : ""}`
          : `${items[0].product_name} + ${items.length - 1} more (Order ${order.order_number})`
        : `True Color Order ${order.order_number}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

    if (order.payment_method === "wave" && order.wave_invoice_id) {
      // Re-send Wave's invoice email
      await sendWaveInvoice(order.wave_invoice_id, customer.email, {
        subject: `Invoice from True Color Display Printing — ${order.order_number}`,
        message: `Hi ${customer.name},\n\nThis is a resend of your invoice. Please click "Pay Invoice" to pay online.\n\nRef: ${order.order_number}\n\nThank you,\nTrue Color Display Printing\n(306) 954-8688`,
      });
      console.log(`[resend-payment] Wave invoice resent → ${customer.email} | order ${order.order_number}`);
    } else {
      // Clover (or wave without invoice ID): re-encode fresh /pay/{token} and send branded email
      const redirectUrl = `${siteUrl}/order-confirmed?oid=${id}`;
      const payToken = encodePaymentToken(total, description, customer.email, redirectUrl);
      const paymentUrl = `${siteUrl}/pay/${payToken}`;

      // Update payment_reference on order with the new link (best-effort)
      void supabase
        .from("orders")
        .update({ payment_reference: paymentUrl } as Record<string, unknown>)
        .eq("id", id);

      await sendPaymentRequestEmail({
        orderNumber: order.order_number,
        contact: {
          name: customer.name,
          email: customer.email,
          company: customer.company ?? null,
        },
        items: items.length > 0
          ? items.map((it) => ({
              product: it.product_name,
              qty: it.qty || 1,
              amount: Number(it.line_total),
            }))
          : [{ product: description, qty: 1, amount: subtotal }],
        subtotal,
        gst,
        pst,
        total,
        paymentUrl,
        paymentMethod: "clover",
        notes: order.notes as string | null,
      });

      console.log(`[resend-payment] Clover link resent → ${customer.email} | order ${order.order_number}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-payment]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
