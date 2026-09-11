/**
 * POST /api/staff/orders/[id]/payment-link
 *
 * Staff-only. Returns the customer's /pay/{token} link for an order awaiting
 * payment so staff can paste it into a text, Messenger, or a phone follow-up.
 * Sends nothing — use /resend-payment to email the customer.
 *
 * The amount is the remaining balance (order total minus counted ledger
 * payments), never the raw total: a partial payment leaves orders.total
 * untouched, so a full-total link would charge that customer twice.
 *
 * Guards: staff auth, order must exist, status must be pending_payment, not
 * voided, customer email on file, and something must still be owed.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { resolveOrderPayLink } from "@/lib/orders/payLink";
import { buildPayLinkMessage } from "@/lib/orders/payLinkMessage";
import { sanitizeError } from "@/lib/errors/sanitize";
import { recordAuditEvent } from "@/lib/audit/record";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total,
        voided_at,
        customers ( name, email )
      `)
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: "A payment link is only available for orders awaiting payment" },
        { status: 400 }
      );
    }
    if (order.voided_at) {
      return NextResponse.json(
        { error: "This payment request was voided — its link cannot be shared" },
        { status: 409 }
      );
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on file" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

    let payLink;
    try {
      payLink = await resolveOrderPayLink(supabase, {
        orderId: id,
        orderNumber: order.order_number,
        total: Number(order.total),
        customerEmail: customer.email,
        siteUrl,
      });
    } catch (err) {
      console.error("[payment-link] pay link resolution failed:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Could not read the payment ledger — no link was generated" },
        { status: 500 }
      );
    }

    if (payLink.amountDueCents <= 0) {
      return NextResponse.json(
        { error: "Recorded payments already cover this order — nothing left to charge" },
        { status: 400 }
      );
    }

    // Never written to payment_reference: /pay/[token] sets it to the order UUID
    // when the customer clicks, and the Clover webhook matches on it.

    const message = buildPayLinkMessage({
      customerName: customer.name,
      orderNumber: order.order_number,
      amountDue: payLink.amountDue,
      orderTotal: payLink.orderTotal,
      paymentUrl: payLink.paymentUrl,
    });

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.payment_link_copied",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        total: payLink.orderTotal,
        amount_due: payLink.amountDue,
        amount_paid: payLink.amountPaid,
      },
    });

    return NextResponse.json({
      ok: true,
      paymentUrl: payLink.paymentUrl,
      amountDue: payLink.amountDue,
      orderTotal: payLink.orderTotal,
      amountPaid: payLink.amountPaid,
      orderNumber: order.order_number,
      customerFirstName: customer.name.trim().split(/\s+/)[0] || "there",
      message,
    });
  } catch (err) {
    console.error("[payment-link]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
