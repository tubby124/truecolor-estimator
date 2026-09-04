/**
 * PATCH /api/staff/orders/[id]/status
 *
 * Updates order status. Staff-only route — requires authenticated Supabase session.
 * Body: { status: order_status }
 *
 * Allowed transitions (enforced client-side; server accepts any valid status):
 *   pending_payment → payment_received → in_production → ready_for_pickup → complete
 *
 * Automatically emails the customer on key transitions:
 *   payment_received  → "Payment confirmed — your order is in the queue"
 *   in_production     → "We're printing your order now"
 *   ready_for_pickup  → "Your order is ready for pickup!"
 *   complete          → enters the guarded review-request cron lifecycle (no immediate email)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail, getWaveInvoicePublicUrl } from "@/lib/wave/invoice";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordAuditEvent } from "@/lib/audit/record";
import { sendMeasurementProtocolPurchase } from "@/lib/analytics/measurementProtocol";

const VALID_STATUSES = [
  "pending_payment",
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

// Statuses that trigger a customer notification email
const NOTIFY_STATUSES = new Set<OrderStatus>([
  "payment_received",
  "in_production",
  "ready_for_pickup",
]);

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: OrderStatus };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Guard: block jumps past payment_received from pending_payment.
    // Without this, staff can mark an unpaid order "complete" (Gil 2026-05-14 bug)
    // which skips approveWaveInvoice + recordWavePayment and shows the customer
    // a PAID receipt for money never collected.
    const { data: current } = await supabase
      .from("orders")
      .select("status, order_number, completed_at, voided_at")
      .eq("id", id)
      .maybeSingle();

    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (current.voided_at) {
      return NextResponse.json({ error: "This payment request was voided and cannot be advanced" }, { status: 409 });
    }
    const isRepeatComplete = current.status === "complete" && status === "complete";
    if (current.status === status && !isRepeatComplete) {
      return NextResponse.json({ ok: true, status, alreadyApplied: true });
    }

    if (current?.status === "pending_payment" && status !== "pending_payment" && status !== "payment_received") {
      return NextResponse.json(
        { error: `Mark payment received first. ${current.order_number} is still awaiting payment — confirm payment before moving to ${status}.` },
        { status: 400 }
      );
    }

    const statusUpdatedAt = new Date();
    if (!isRepeatComplete) {
      // Persist the status and its transition timestamp in one compare-and-swap.
      // Conversion triggers must never observe payment_received without paid_at.
      const transition: Record<string, string> = { status };
      if (status === "payment_received") transition.paid_at = statusUpdatedAt.toISOString();
      if (status === "ready_for_pickup") transition.ready_at = statusUpdatedAt.toISOString();
      if (status === "complete") transition.completed_at = statusUpdatedAt.toISOString();

      let transitionQuery = supabase
        .from("orders")
        .update(transition)
        .eq("id", id)
        .eq("status", current.status)
        .is("voided_at", null);
      if (status === "payment_received") transitionQuery = transitionQuery.is("paid_at", null);
      const { data: changedOrder, error } = await transitionQuery.select("id").maybeSingle();

      if (error) {
        console.error("[staff/orders/status]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!changedOrder) {
        const { data: latest } = await supabase
          .from("orders")
          .select("status")
          .eq("id", id)
          .maybeSingle();
        if (latest?.status === status) {
          return NextResponse.json({ ok: true, status, alreadyApplied: true });
        }
        return NextResponse.json(
          { error: "Order status changed in another request. Refresh before trying again." },
          { status: 409 },
        );
      }

      void recordAuditEvent({
        actor_type: "staff",
        actor_id: staffCheck.email ?? "staff",
        event_type: "order.status_changed",
        entity_type: "order",
        entity_id: id,
        detail: {
          from: current.status,
          to: status,
          order_number: current.order_number ?? null,
          manual: true,
        },
      });
    }
    // On transition INTO payment_received: bump customer lifetime stats.
    // Idempotency: only fires when guard above (current.status === "pending_payment")
    // confirmed the transition is a real change. Webhook retries naturally skipped.
    if (status === "payment_received" && current?.status === "pending_payment") {
      const { data: statsOrder } = await supabase
        .from("orders")
        .select(`customer_id, total, gst, pst, payment_method,
                 order_items ( product_name, qty, line_total )`)
        .eq("id", id)
        .single();
      if (statsOrder) {
        await incrementCustomerOrderStats(supabase, statsOrder.customer_id, Number(statsOrder.total ?? 0));
        const measurementItems = Array.isArray(statsOrder.order_items) ? statsOrder.order_items : [];
        void sendMeasurementProtocolPurchase({
          transaction_id: id,
          value: Number(statsOrder.total),
          customer_id: statsOrder.customer_id,
          payment_type: statsOrder.payment_method ?? "staff_manual",
          tax: Number(statsOrder.gst ?? 0) + Number(statsOrder.pst ?? 0),
          items: measurementItems.map((item) => ({
            item_id: (item.product_name ?? "").slice(0, 100),
            item_name: item.product_name ?? "Unknown",
            price: Number(item.qty) > 0
              ? Number(item.line_total) / Number(item.qty)
              : Number(item.line_total),
            quantity: Number(item.qty ?? 1),
          })),
        }).then((delivered) => {
          if (!delivered) console.error("[staff/orders/status] GA4 MP purchase was not delivered (non-fatal)");
        }).catch((err) => {
          console.error("[staff/orders/status] GA4 MP purchase failed (non-fatal):", err);
        });
      }
    }

    // ── Status-change side effects (all non-fatal) ────────────────────────────

    // Standard status notification emails (payment_received / in_production / ready_for_pickup)
    if (NOTIFY_STATUSES.has(status)) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select(`order_number, subtotal, gst, pst, total, is_rush, discount_code,
                   discount_amount, wave_invoice_id, wave_invoice_approved_at,
                   wave_payment_recorded_at, payment_method, created_at, receipt_token,
                   order_items ( product_name, qty, width_in, height_in, sides, line_total ),
                   customers ( name, email )`)
          .eq("id", id)
          .single();

        if (order) {
          const customerRaw = Array.isArray(order.customers)
            ? order.customers[0]
            : order.customers;
          const customer = customerRaw as { name: string; email: string } | null;

          // Only email the customer at ready_for_pickup.
          // payment_received: receipt below is sufficient (was duplicate).
          // in_production: dead noise — customer doesn't care about the middle stage.
          // Reducing customer-facing emails from 9 → 4 per order (2026-05-14).
          if (customer?.email && status === "ready_for_pickup") {
            const statusItems = Array.isArray(order.order_items) ? order.order_items : [];
            await sendOrderStatusEmail({
              status: "ready_for_pickup",
              orderNumber: order.order_number,
              customerName: customer.name,
              customerEmail: customer.email,
              total: Number(order.total),
              isRush: Boolean(order.is_rush),
              paymentMethod: order.payment_method ?? undefined,
              items: statusItems.map((i) => ({
                product_name: i.product_name,
                qty: i.qty,
                width_in: i.width_in,
                height_in: i.height_in,
                sides: i.sides,
                line_total: Number(i.line_total),
              })),
            });
          }

          // ── Wave: approve invoice + record payment ──────────────────────────
          // Runs BEFORE the receipt email so the email's Wave PDF link only
          // appears when the invoice is actually marked PAID.
          //
          // Previously skipped for clover_card (assumed the Clover webhook would
          // handle it). Fixed 2026-06-27: if the card was declined or the webhook
          // failed, wave_payment_recorded_at stays null and Wave is never updated.
          // Now we always run if wave_payment_recorded_at is null, using the right
          // payment type based on what method is on the order.
          //
          // Split try/catch on approve vs record so a re-approval throw on an
          // already-approved invoice does NOT short-circuit recordWavePayment
          // (the bug behind 27 stuck production orders, found 2026-05-22).
          let wavePaid = Boolean(order.wave_payment_recorded_at);
          if (status === "payment_received" && order.wave_invoice_id) {
            const paymentMethod = (order as { payment_method?: string }).payment_method;
            const orderTotal = Number(order.total ?? 0);
            const wavePaymentType = paymentMethod === "clover_card" ? "CREDIT_CARD" : "BANK_TRANSFER";
            const waveNote = paymentMethod === "clover_card"
              ? `Card (staff confirm) — Order ${order.order_number}`
              : `eTransfer — Order ${order.order_number}`;

            if (!order.wave_invoice_approved_at) {
              try {
                await approveWaveInvoice(order.wave_invoice_id);
                const { error: updErr } = await supabase.from("orders")
                  .update({ wave_invoice_approved_at: new Date().toISOString() })
                  .eq("id", id);
                if (updErr) console.error("[staff/orders/status] wave_invoice_approved_at save failed (non-fatal):", updErr.message);
              } catch (approveErr) {
                const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
                console.error("[staff/orders/status] Wave invoice approve failed (non-fatal):", msg);
                void sendTelegramNotification(
                  `⚠️ <b>Wave approve failed</b>\n` +
                  `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
                  `Path: status → payment_received\n` +
                  `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
                  `Action: manually approve in Wave dashboard.`
                ).catch(() => {});
              }
            }

            if (!wavePaid) {
              try {
                const waveCustomerId = customer?.email
                  ? await findCustomerByEmail(customer.email).catch(() => null)
                  : null;
                await recordWavePayment(
                  order.wave_invoice_id,
                  orderTotal,
                  wavePaymentType,
                  waveNote,
                  waveCustomerId ?? undefined,
                  id,  // Supabase order UUID as externalId — prevents duplicate transactions
                );
                const { error: updErr } = await supabase.from("orders")
                  .update({ wave_payment_recorded_at: new Date().toISOString() })
                  .eq("id", id);
                if (updErr) console.error("[staff/orders/status] wave_payment_recorded_at save failed (non-fatal):", updErr.message);
                wavePaid = true;
                console.log(`[staff/orders/status] Wave payment recorded — ${paymentMethod ?? "unknown"} (${order.wave_invoice_id})`);
              } catch (paymentErr) {
                const msg = paymentErr instanceof Error ? paymentErr.message : String(paymentErr);
                console.error("[staff/orders/status] Wave payment recording failed (non-fatal):", msg);
                void sendTelegramNotification(
                  `🚨 <b>Wave payment NOT recorded</b>\n` +
                  `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
                  `Path: status → payment_received\n` +
                  `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
                  `Action: record payment in Wave manually against this invoice.`
                ).catch(() => {});
              }
            }
          }

          // Itemized receipt on payment_received (non-fatal) — covers manual status override
          // and any orders where the webhook/confirm-etransfer didn't fire the receipt.
          // waveInvoiceUrl only attached when Wave knows the invoice is PAID — otherwise
          // customer falls back to the TC branded PDF (bug fix 2026-05-22).
          if (status === "payment_received" && customer?.email) {
            try {
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
                paymentMethod: order.payment_method ?? undefined,
                oid: id,
                receiptToken: (order as { receipt_token?: string | null }).receipt_token ?? null,
                waveInvoiceUrl,
              });
              console.log(`[staff/orders/status] receipt sent at payment_received → ${customer.email}${waveInvoiceUrl ? " (with Wave PDF)" : ""}`);
            } catch (receiptErr) {
              console.error("[staff/orders/status] receipt at payment_received failed (non-fatal):", receiptErr);
            }
          }

          // Wave invoice approval still happens upstream (line ~154), so accounting
          // is intact — we just don't email the Wave PDF separately. Customer
          // already received our itemized receipt at payment_received. Customers
          // who need the Wave invoice can download it from their account dashboard.
        }
      } catch (emailErr) {
        // Non-fatal — status already updated, just log the email failure
        console.error("[staff/orders/status] customer notification failed (non-fatal):", emailErr);
      }
    }

    // Review email delivery is deliberately decoupled from this staff mutation.
    // The authenticated cron waits five days, applies customer-level cadence and
    // consent/suppression checks, then sends at most two messages in one cycle.
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[staff/orders/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
