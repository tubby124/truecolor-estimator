/**
 * POST /api/staff/orders/[id]/confirm-etransfer
 *
 * Staff confirms receipt of an eTransfer payment from the customer.
 * Guards that the order is etransfer + pending_payment before proceeding.
 *
 * Side effects (all non-fatal after status update):
 *   1. True Color payment-confirmation update (Wave owns the financial receipt)
 *   2. Staff notification FROM hello@outreach.true-color.ca
 *   3. Wave invoice approved + payment recorded as BANK_TRANSFER
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendEmail } from "@/lib/email/smtp";
import { escHtml } from "@/lib/email/components/escHtml";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordAuditEvent } from "@/lib/audit/record";
import { buildPurchaseAmounts } from "@/lib/analytics/purchase-amounts";
import { sendMeasurementProtocolPurchase } from "@/lib/analytics/measurementProtocol";
import { sendMetaCapiEvent } from "@/lib/analytics/metaCapi";

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
        discount_code, discount_amount, wave_invoice_id,
        wave_invoice_approved_at, wave_payment_recorded_at,
        created_at, receipt_token, meta_tracking_consent, meta_fbp, meta_fbc,
        ga_client_id, ga_session_id, ga_session_number, ga_context_captured_at,
        order_items ( merchant_offer_id, commerce_product_id, product_name, qty, width_in, height_in, sides, line_total ),
        customer_id, customers ( name, email, phone, marketing_consent )
      `)
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: `Order is already ${order.status} — cannot re-confirm` },
        { status: 409 }
      );
    }

    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string; phone?: string | null; marketing_consent?: boolean | null } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });
    }

    // ── Update status ────────────────────────────────────────────────────────────

    const { data: transitioned, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "payment_received",
        paid_at: new Date().toISOString(),
        // 2026-08-19: reminders die the moment staff records the e-Transfer,
        // even if a later step in this handler partially fails.
        followup_paused_at: new Date().toISOString(),
        followup_paused_reason: "etransfer-confirmed",
      })
      .eq("id", id)
      .eq("status", "pending_payment")
      .is("voided_at", null)
      .select("id")
      .maybeSingle();

    if (updateErr || !transitioned) {
      console.error("[confirm-etransfer] status update failed:", updateErr?.message ?? "already transitioned");
      return NextResponse.json(
        { error: updateErr?.message ?? "Order payment was already confirmed" },
        { status: updateErr ? 500 : 409 },
      );
    }

    console.log(`[confirm-etransfer] order ${order.order_number} → payment_received`);

    await sendMeasurementProtocolPurchase({
      transaction_id: order.id,
      ...buildPurchaseAmounts(order),
      customer_id: order.customer_id,
      ga_client_id: order.ga_client_id,
      ga_session_id: order.ga_session_id,
      ga_session_number: order.ga_session_number,
      ga_context_captured_at: order.ga_context_captured_at,
      payment_type: "etransfer",
    }).then((delivered) => {
      if (!delivered) console.error("[confirm-etransfer] GA4 MP purchase request was not accepted (non-fatal)");
    }).catch((err) => {
      console.error("[confirm-etransfer] GA4 MP purchase failed (non-fatal):", err);
    });

    // Audit event: staff confirmed eTransfer
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.status_changed",
      entity_type: "order",
      entity_id: order.id,
      detail: {
        from: "pending_payment",
        to: "payment_received",
        order_number: order.order_number,
        method: "etransfer",
        original_payment_method: order.payment_method,
        amount: Number(order.total ?? 0),
      },
    });

    // Bump customer lifetime stats now (moved off order-creation 2026-05-20)
    await incrementCustomerOrderStats(supabase, order.customer_id, Number(order.total ?? 0));

    // Brevo sync at payment_received (shifted from order creation — TC-15)
    try {
      const nameParts = customer.name.trim().split(/\s+/);
      const orderItemsRaw = Array.isArray(order.order_items) ? order.order_items : [];
      await syncCustomerToBrevo({
        email: customer.email,
        firstName: nameParts[0] || customer.name,
        lastName: nameParts.slice(1).join(" ") || undefined,
        orderNumber: order.order_number,
        orderTotal: Number(order.total),
        productSummary: (orderItemsRaw as { product_name: string }[]).map((i) => i.product_name).join(", "),
        source: "checkout",
        accountStatus: "none",
        marketingConsent: customer.marketing_consent === true,
      });
    } catch (brevoErr) {
      console.error("[confirm-etransfer] Brevo sync failed (non-fatal):", brevoErr);
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const totalStr = Number(order.total).toFixed(2);
    const orderTotal = Number(order.total ?? 0);

    if (order.meta_tracking_consent === true) {
      void sendMetaCapiEvent({
        event_name: "Purchase",
        event_id: order.order_number,
        event_source_url: "https://truecolorprinting.ca/order-confirmed",
        user_data: {
          email: customer.email,
          phone: customer.phone ?? undefined,
          fbp: order.meta_fbp ?? undefined,
          fbc: order.meta_fbc ?? undefined,
          external_id: order.customer_id ?? undefined,
        },
        custom_data: {
          currency: "CAD",
          value: Number(order.total),
          content_type: "product",
          content_ids: items.map((item) => (item.product_name ?? "").slice(0, 100)),
          num_items: items.reduce((sum, item) => sum + Number(item.qty ?? 1), 0),
          contents: items.map((item) => ({
            id: (item.product_name ?? "").slice(0, 100),
            quantity: Number(item.qty ?? 1),
            item_price: Number(item.qty) > 0 ? Number(item.line_total) / Number(item.qty) : Number(item.line_total),
          })),
        },
      }).catch((err) => console.error("[confirm-etransfer] Meta CAPI failed (non-fatal):", err));
    }

    // ── 1. Wave: approve invoice + record payment ────────────────────────────────
    // Runs BEFORE the customer update so Wave's financial document is only
    // available after the invoice is genuinely PAID.
    // Split try/catch on approve vs record so a re-approval throw on an already-
    // approved invoice doesn't short-circuit recordWavePayment (bug 2026-05-22).
    let wavePaid = Boolean(order.wave_payment_recorded_at);
    if (order.wave_invoice_id) {
      if (!order.wave_invoice_approved_at) {
        try {
          await approveWaveInvoice(order.wave_invoice_id);
          const { error: updErr } = await supabase
            .from("orders")
            .update({ wave_invoice_approved_at: new Date().toISOString() })
            .eq("id", id);
          if (updErr) console.error("[confirm-etransfer] wave_invoice_approved_at save failed (non-fatal):", updErr.message);
        } catch (approveErr) {
          const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
          console.error("[confirm-etransfer] Wave invoice approve failed (non-fatal):", msg);
          void sendTelegramNotification(
            `⚠️ <b>Wave approve failed</b>\n` +
            `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
            `Path: confirm-etransfer\n` +
            `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
            `Action: manually approve in Wave dashboard.`
          ).catch(() => {});
        }
      }

      if (!wavePaid) {
        try {
          const waveCustomerId = await findCustomerByEmail(customer.email).catch(() => null);
          await recordWavePayment(
            order.wave_invoice_id,
            orderTotal,
            "BANK_TRANSFER",
            `eTransfer — Order ${order.order_number}`,
            waveCustomerId ?? undefined,
            id, // Supabase order UUID as externalId — idempotency key
          );
          const { error: updErr } = await supabase
            .from("orders")
            .update({ wave_payment_recorded_at: new Date().toISOString() })
            .eq("id", id);
          if (updErr) console.error("[confirm-etransfer] wave_payment_recorded_at save failed (non-fatal):", updErr.message);
          wavePaid = true;
          console.log(`[confirm-etransfer] Wave payment recorded (${order.wave_invoice_id})`);
        } catch (paymentErr) {
          const msg = paymentErr instanceof Error ? paymentErr.message : String(paymentErr);
          console.error("[confirm-etransfer] Wave payment recording failed (non-fatal):", msg);
          void sendTelegramNotification(
            `🚨 <b>Wave payment NOT recorded</b>\n` +
            `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
            `Path: confirm-etransfer\n` +
            `eTransfer was received but Wave bookkeeping is out of sync.\n` +
            `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
            `Action: record payment in Wave manually against this invoice.`
          ).catch(() => {});
        }
      }
    }

    // ── 2. True Color payment update ───────────────────────────────────────────
    // A manual e-transfer becomes a Wave paid invoice first. Only then send our
    // service update; Wave remains the official financial document.
    let notificationWarning: string | undefined;
    if (order.wave_invoice_id && !wavePaid) {
      notificationWarning = "eTransfer was recorded, but the Wave paid invoice is not confirmed. No customer update was sent.";
    } else {
      try {
        await sendOrderStatusEmail({
          orderId: order.id,
          idempotencyKey: `payment-confirmation:${order.id}:v1`,
          requireEmailLog: true,
          status: "payment_received",
          orderNumber: order.order_number,
          customerName: customer.name,
          customerEmail: customer.email,
          items: items.map((i) => ({
            product_name: i.product_name,
            qty: i.qty,
            width_in: i.width_in,
            height_in: i.height_in,
            sides: i.sides,
            line_total: Number(i.line_total),
          })),
          total: Number(order.total),
          isRush: Boolean(order.is_rush),
          paymentMethod: "etransfer",
        });
        console.log(`[confirm-etransfer] payment update accepted → ${customer.email}`);
      } catch (e) {
        notificationWarning = "eTransfer was confirmed, but the customer payment update could not be confirmed. Check delivery before resending.";
        console.error("[confirm-etransfer] payment update failed (non-fatal):", e);
      }
    }

    await recordAuditEvent({
      actor_type: "system",
      event_type: "order.notification_outcome",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        status: "payment_received",
        outcome: notificationWarning ? "unconfirmed" : "accepted",
        channel: "truecolor_payment_update",
      },
    });

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
      ${notificationWarning
        ? "Customer payment update was not confirmed; check delivery before resending."
        : "Customer payment update accepted. Wave is the official paid invoice."}
    </p>
  </div>
</body></html>`,
        text: `eTransfer confirmed — ${order.order_number}\nCustomer: ${customer.name} (${customer.email})\nTotal: $${totalStr} CAD\nStatus → Payment Received. ${notificationWarning ? "Customer payment update was not confirmed." : "Customer payment update accepted; Wave holds the official paid invoice."}`,
      });
    } catch (e) {
      console.error("[confirm-etransfer] staff notification failed (non-fatal):", e);
    }

    // Wave approval/recording is complete before the customer update, so staff
    // never see a financial-document success state for an unpaid Wave invoice.

    return NextResponse.json({ ok: true, ...(notificationWarning ? { notificationWarning } : {}) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm eTransfer";
    console.error("[confirm-etransfer]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
