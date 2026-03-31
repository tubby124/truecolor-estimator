/**
 * POST /api/staff/orders/[id]/confirm-etransfer
 *
 * Staff confirms receipt of an eTransfer payment from the customer.
 * Guards that the order is etransfer + pending_payment before proceeding.
 *
 * Side effects (all non-fatal after status update):
 *   1. sendOrderStatusEmail(payment_received) — "payment confirmed, in queue"
 *   2. sendPaymentReceipt — itemized receipt with line items, taxes, total
 *   3. Staff notification FROM hello@outreach.true-color.ca
 *   4. Wave invoice approved + payment recorded as BANK_TRANSFER
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { sendEmail } from "@/lib/email/smtp";
import { escHtml } from "@/lib/email/components/escHtml";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Fetch full order needed for receipt
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_method,
        subtotal, gst, pst, total, is_rush,
        discount_code, discount_amount, wave_invoice_id, created_at,
        order_items ( product_name, qty, width_in, height_in, sides, line_total ),
        customers ( name, email )
      `)
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_method !== "etransfer") {
      return NextResponse.json({ error: "Not an eTransfer order" }, { status: 400 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: `Order is already ${order.status} — cannot re-confirm` },
        { status: 409 }
      );
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });
    }

    // ── Update status ────────────────────────────────────────────────────────────

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: "payment_received", paid_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) {
      console.error("[confirm-etransfer] status update failed:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log(`[confirm-etransfer] order ${order.order_number} → payment_received`);

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const totalStr = Number(order.total).toFixed(2);

    // ── 1. Payment confirmed status email ────────────────────────────────────────

    try {
      await sendOrderStatusEmail({
        status: "payment_received",
        orderNumber: order.order_number,
        customerName: customer.name,
        customerEmail: customer.email,
        total: Number(order.total),
        isRush: Boolean(order.is_rush),
        paymentMethod: "etransfer",
      });
    } catch (e) {
      console.error("[confirm-etransfer] status email failed (non-fatal):", e);
    }

    // ── 2. Itemized receipt ──────────────────────────────────────────────────────

    try {
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
        discountCode: order.discount_code ?? null,
        discountAmount: order.discount_amount ? Number(order.discount_amount) : null,
        paymentMethod: "etransfer",
      });
      console.log(`[confirm-etransfer] receipt sent → ${customer.email}`);
    } catch (e) {
      console.error("[confirm-etransfer] receipt failed (non-fatal):", e);
    }

    // ── 3. Staff notification ────────────────────────────────────────────────────

    try {
      const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
      await sendEmail({
        from: "True Color Display Printing <hello@outreach.true-color.ca>",
        to: staffEmail,
        subject: `eTransfer confirmed — ${order.order_number} · $${totalStr}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px 16px;background:#f4efe9;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 32px;border:1px solid #e2dbd4;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.06em;">✓ eTransfer Confirmed</p>
    <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1c1712;letter-spacing:.03em;">${escHtml(order.order_number)}</p>
    <p style="margin:0 0 6px;font-size:14px;color:#374151;">
      <strong>${escHtml(customer.name)}</strong> &nbsp;·&nbsp;
      <a href="mailto:${escHtml(customer.email)}" style="color:#16C2F3;text-decoration:none;">${escHtml(customer.email)}</a>
    </p>
    <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1c1712;">$${escHtml(totalStr)} CAD</p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Status updated to <strong>Payment Received</strong>.<br/>
      Customer confirmation + itemized receipt emailed automatically.
    </p>
  </div>
</body></html>`,
        text: `eTransfer confirmed — ${order.order_number}\nCustomer: ${customer.name} (${customer.email})\nTotal: $${totalStr} CAD\nStatus → Payment Received. Customer receipt emailed.`,
      });
    } catch (e) {
      console.error("[confirm-etransfer] staff notification failed (non-fatal):", e);
    }

    // ── 4. Wave payment recording ────────────────────────────────────────────────

    if (order.wave_invoice_id) {
      try {
        await approveWaveInvoice(order.wave_invoice_id);
        void supabase
          .from("orders")
          .update({ wave_invoice_approved_at: new Date().toISOString() })
          .eq("id", id);

        const waveCustomerId = await findCustomerByEmail(customer.email).catch(() => null);
        await recordWavePayment(
          order.wave_invoice_id,
          Number(order.total),
          "BANK_TRANSFER",
          `eTransfer — Order ${order.order_number}`,
          waveCustomerId ?? undefined,
          id, // Supabase order UUID as externalId — idempotency key
        );
        void supabase
          .from("orders")
          .update({ wave_payment_recorded_at: new Date().toISOString() })
          .eq("id", id);
        console.log(`[confirm-etransfer] Wave payment recorded (${order.wave_invoice_id})`);
      } catch (e) {
        console.error("[confirm-etransfer] Wave payment recording failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm eTransfer";
    console.error("[confirm-etransfer]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
