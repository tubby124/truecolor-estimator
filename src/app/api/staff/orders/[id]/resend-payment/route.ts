import { resolveWaveOnlineCheckout } from "@/lib/payment/wave-online-checkout";
import { paymentLinkBlock } from "@/lib/orders/payment-readiness";
/**
 * POST /api/staff/orders/[id]/resend-payment
 *
 * Staff-only. Re-sends the payment link to the customer for an order
 * that is still in pending_payment status.
 *
 * Re-encodes a durable True Color /pay/{token} link to the approved Wave
 * invoice. Provider payment is reconciled before collection; Starter uses polling.
 *
 * Guards: staff auth, order must exist, status must be pending_payment.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { resolveOrderPayLink, type ResolvedOrderPayLink } from "@/lib/orders/payLink";
import { sendPaymentRequestEmail } from "@/lib/email/paymentRequest";
import { sanitizeError } from "@/lib/errors/sanitize";
import { recordAuditEvent } from "@/lib/audit/record";
import { pstExemptionInvoiceNote } from "@/lib/payment/pst-exemption";

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
        pst,
        pst_exempt,
        pst_vendor_number,
        voided_at, is_archived, paid_at, wave_payment_recorded_at,
        wave_invoice_approved_at, quote_wave_state, quote_checkout_state, quote_request_id,
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
    if (order.voided_at) {
      return NextResponse.json({ error: "This payment request was voided and cannot be resent" }, { status: 409 });
    }

    const blocked = paymentLinkBlock(order);
    if (blocked) {
      await recordAuditEvent({ actor_type: "staff", actor_id: staffCheck.email, event_type: "order.payment_link_blocked", entity_type: "order", entity_id: id, detail: { reason: blocked } });
      return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string; company?: string | null } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on file" }, { status: 400 });
    }

    const total = Number(order.total);
    const subtotal = Number(order.subtotal);
    const gst = Number(order.gst);
    const pst = Number(order.pst ?? 0);

    // Build a description from order_items (or fall back to notes)
    const items = (Array.isArray(order.order_items) ? order.order_items : [order.order_items])
      .filter(Boolean) as Array<{ product_name: string; qty: number; line_total: number }>;

    const description =
      items.length > 0
        ? items.length === 1
          ? `${items[0].product_name}${items[0].qty > 1 ? ` × ${items[0].qty}` : ""}`
          : `${items[0].product_name} + ${items.length - 1} more (Order ${order.order_number})`
        : `True Color Order ${order.order_number}`;

    // Verify the actual Wave invoice before handing out another online link.
    // The signed link repeats this check when opened, after any later payment.
    try {
      const online = await resolveWaveOnlineCheckout(supabase, { orderId: id });
      if (online.action !== "ready") {
        return NextResponse.json({ error: online.action === "already_paid" ? "This order is already paid" : "The payment balance changed. Refresh this order before sending a link." }, { status: 409 });
      }
    } catch {
      return NextResponse.json({ error: "Wave online payment is not ready. Review this order before sending a payment link." }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

    // Online links resolve to the approved Wave invoice.
    // Ledger-aware: a partially-paid order gets a balance link, never the raw
    // total, and the email below quotes the same amount the link charges.
    let payLink: ResolvedOrderPayLink;
    try {
      payLink = await resolveOrderPayLink(supabase, {
        orderId: id,
        orderNumber: order.order_number,
        total,
        customerEmail: customer.email,
        siteUrl,
      });
    } catch (err) {
      console.error("[resend-payment] pay link resolution failed:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Could not read the payment ledger — no email was sent" },
        { status: 500 }
      );
    }
    if (payLink.amountDueCents <= 0) {
      return NextResponse.json(
        { error: "This order is already covered by recorded payments — nothing left to charge" },
        { status: 400 }
      );
    }
    const paymentUrl = payLink.paymentUrl;

    // NOTE: do NOT update payment_reference here — it is set to the order UUID
    // by /pay/[token] when the customer clicks, and the Clover webhook matches on it.
    // Overwriting it with the URL breaks webhook matching.

    await sendPaymentRequestEmail({
      orderId: id,
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
      balanceDue: payLink.amountDue,
      paymentUrl,
      paymentMethod: "wave",
      notes: order.notes as string | null,
      pstExemptionNote: pstExemptionInvoiceNote({
        enabled: order.pst_exempt === true,
        vendorNumber: order.pst_vendor_number ?? undefined,
      }) ?? undefined,
    });

    console.log(`[resend-payment] payment link resent → ${customer.email} | order ${order.order_number} | due $${payLink.amountDue.toFixed(2)} of $${total.toFixed(2)} | wave_invoice_id ${order.wave_invoice_id ?? "none"}`);

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.payment_link_resent",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        recipient: customer.email,
        total,
        amount_due: payLink.amountDue,
        payment_method: "wave",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-payment]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
