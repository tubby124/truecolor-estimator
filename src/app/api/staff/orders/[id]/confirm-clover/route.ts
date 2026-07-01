/**
 * POST /api/staff/orders/[id]/confirm-clover
 *
 * Manual staff resolution for ambiguous Clover matches. Staff must paste the
 * Clover payment ID they verified in Clover. The route verifies that payment
 * with Clover before marking the order paid.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail, getWaveInvoicePublicUrl } from "@/lib/wave/invoice";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordAuditEvent } from "@/lib/audit/record";
import { recordPaymentAttempt } from "@/lib/payments/attempts";
import { sanitizeError } from "@/lib/errors/sanitize";

const CLOVER_BASE =
  process.env.CLOVER_ENVIRONMENT === "sandbox"
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";

interface Params {
  params: Promise<{ id: string }>;
}

interface CloverPayment {
  id: string;
  amount?: number;
  result?: string;
  createdTime?: number;
  clientCreatedTime?: number;
  order?: { id?: string };
}

async function fetchCloverPayment(paymentId: string): Promise<CloverPayment> {
  const token = process.env.CLOVER_API_KEY;
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!token || !merchantId) throw new Error("CLOVER_API_KEY / CLOVER_MERCHANT_ID not configured");

  const url = new URL(`${CLOVER_BASE}/v3/merchants/${merchantId}/payments/${encodeURIComponent(paymentId)}`);
  url.searchParams.set("expand", "order");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clover payment lookup failed (${res.status}): ${text.slice(0, 160)}`);
  }
  return (await res.json()) as CloverPayment;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as { clover_payment_id?: string; reason?: string };
    const cloverPaymentId = body.clover_payment_id?.trim();
    const reason = body.reason?.trim();

    if (!cloverPaymentId) {
      return NextResponse.json({ error: "Clover payment ID is required" }, { status: 400 });
    }
    if (!reason || reason.length < 6) {
      return NextResponse.json({ error: "Add a short reason for the manual confirmation" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_method, customer_id,
        subtotal, gst, pst, total, is_rush,
        discount_code, discount_amount, wave_invoice_id,
        wave_invoice_approved_at, wave_payment_recorded_at,
        created_at, receipt_token,
        order_items ( product_name, qty, width_in, height_in, sides, line_total ),
        customers ( name, email, company, marketing_consent )
      `)
      .eq("id", id)
      .single();

    if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 409 });
    }
    if (order.payment_method !== "clover_card") {
      return NextResponse.json({ error: "Manual Clover confirmation is only for Clover card orders" }, { status: 400 });
    }

    const cloverPayment = await fetchCloverPayment(cloverPaymentId);
    if ((cloverPayment.result ?? "").toUpperCase() !== "SUCCESS") {
      return NextResponse.json({ error: `Clover payment is not successful (${cloverPayment.result ?? "unknown"})` }, { status: 400 });
    }

    const expectedCents = Math.round(Number(order.total ?? 0) * 100);
    const paidCents = Number(cloverPayment.amount ?? 0);
    if (paidCents <= 0 || Math.abs(paidCents - expectedCents) > 100) {
      return NextResponse.json(
        { error: `Clover amount $${(paidCents / 100).toFixed(2)} does not match order total $${(expectedCents / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    const { data: existingLedger } = await supabase
      .from("order_payments")
      .select("order_id")
      .eq("method", "clover")
      .eq("external_reference", cloverPaymentId)
      .maybeSingle();
    if (existingLedger && existingLedger.order_id !== order.id) {
      return NextResponse.json({ error: "That Clover payment is already linked to another order" }, { status: 409 });
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string; company?: string | null; marketing_consent?: boolean | null } | null;
    if (!customer?.email) return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });

    const amountDollars = paidCents / 100;
    if (!existingLedger) {
      const { error: ledgerErr } = await supabase.from("order_payments").insert({
        order_id: order.id,
        amount: amountDollars,
        currency: "CAD",
        method: "clover",
        status: "recorded",
        payer_name: customer.name ?? null,
        payer_company: customer.company ?? null,
        payer_email: customer.email ?? null,
        external_reference: cloverPaymentId,
        recorded_by: staffCheck.email,
        recorded_at: cloverPayment.createdTime
          ? new Date(cloverPayment.createdTime).toISOString()
          : new Date().toISOString(),
        notes: `Staff-confirmed ambiguous Clover match: ${reason}`,
        metadata: {
          clover_payment_id: cloverPaymentId,
          clover_order_id: cloverPayment.order?.id ?? null,
          manual_reason: reason,
        },
      });
      if (ledgerErr && (ledgerErr as { code?: string }).code !== "23505") {
        return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
      }
    }

    const paidAt = cloverPayment.createdTime
      ? new Date(cloverPayment.createdTime).toISOString()
      : new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update({ status: "payment_received", paid_at: paidAt })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .select("id");
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    if ((updated?.length ?? 0) === 0) {
      return NextResponse.json({ error: "Order changed while confirming payment; refresh and try again" }, { status: 409 });
    }

    await recordPaymentAttempt(supabase, {
      order_id: order.id,
      status: "payment_captured",
      amount: amountDollars,
      clover_order_id: cloverPayment.order?.id ?? null,
      clover_payment_id: cloverPaymentId,
      raw_event: { manual_staff_confirmation: true, clover_payment: cloverPayment, reason },
      customer_message: "Payment received. Thank you.",
    });

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.status_changed",
      entity_type: "order",
      entity_id: order.id,
      detail: {
        from: "pending_payment",
        to: "payment_received",
        order_number: order.order_number,
        method: "clover_card",
        amount: amountDollars,
        clover_payment_id: cloverPaymentId,
        reason,
        manual: true,
      },
    });

    await incrementCustomerOrderStats(supabase, order.customer_id, Number(order.total ?? 0));

    let wavePaid = Boolean(order.wave_payment_recorded_at);
    if (order.wave_invoice_id) {
      if (!order.wave_invoice_approved_at) {
        try {
          await approveWaveInvoice(order.wave_invoice_id);
          await supabase.from("orders")
            .update({ wave_invoice_approved_at: new Date().toISOString() })
            .eq("id", order.id);
        } catch (approveErr) {
          const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
          void sendTelegramNotification(
            `⚠️ <b>Wave approve failed</b>\n` +
            `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${amountDollars.toFixed(2)}\n` +
            `Path: staff manual Clover confirmation\n` +
            `Error: ${escapeTelegramHtml(msg.slice(0, 200))}`
          ).catch(() => {});
        }
      }

      if (!wavePaid) {
        try {
          const waveCustomerId = await findCustomerByEmail(customer.email).catch(() => null);
          await recordWavePayment(
            order.wave_invoice_id,
            amountDollars,
            "CREDIT_CARD",
            `Clover card — Order ${order.order_number} (staff confirmed)`,
            waveCustomerId ?? undefined,
            cloverPaymentId,
          );
          await supabase.from("orders")
            .update({ wave_payment_recorded_at: new Date().toISOString() })
            .eq("id", order.id);
          wavePaid = true;
        } catch (waveErr) {
          const msg = waveErr instanceof Error ? waveErr.message : String(waveErr);
          void sendTelegramNotification(
            `🚨 <b>Wave payment NOT recorded</b>\n` +
            `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${amountDollars.toFixed(2)}\n` +
            `Path: staff manual Clover confirmation\n` +
            `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
            `Action: record payment in Wave manually.`
          ).catch(() => {});
        }
      }
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const waveInvoiceUrl = wavePaid && order.wave_invoice_id
      ? await getWaveInvoicePublicUrl(order.wave_invoice_id).catch(() => null)
      : null;
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
      paymentMethod: "clover_card",
      oid: order.id,
      receiptToken: order.receipt_token ?? null,
      waveInvoiceUrl,
    }).catch((receiptErr) => {
      console.error("[confirm-clover] receipt failed (non-fatal):", receiptErr);
    });

    try {
      const nameParts = customer.name.trim().split(/\s+/);
      await syncCustomerToBrevo({
        email: customer.email,
        firstName: nameParts[0] || customer.name,
        lastName: nameParts.slice(1).join(" ") || undefined,
        orderNumber: order.order_number,
        orderTotal: Number(order.total),
        productSummary: items.map((i) => i.product_name).join(", "),
        source: "checkout",
        accountStatus: "none",
        marketingConsent: customer.marketing_consent === true,
      });
    } catch (brevoErr) {
      console.error("[confirm-clover] Brevo sync failed (non-fatal):", brevoErr);
    }

    void sendTelegramNotification(
      `💰 <b>Order paid</b>\n` +
      `<b>${escapeTelegramHtml(order.order_number)}</b> · $${amountDollars.toFixed(2)}\n` +
      `Resolved manually from ambiguous Clover match.`
    ).catch(() => {});

    return NextResponse.json({ ok: true, status: "payment_received" });
  } catch (err) {
    console.error("[confirm-clover]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
