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
 *   complete          → review request email scheduled two hours later
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendReviewRequestEmail } from "@/lib/email/reviewRequest";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail, getWaveInvoicePublicUrl } from "@/lib/wave/invoice";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordAuditEvent } from "@/lib/audit/record";

const VALID_STATUSES = [
  "pending_payment",
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

const REVIEW_REQUEST_DELAY_MS = 2 * 60 * 60 * 1000;

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
      .select("status, order_number, completed_at")
      .eq("id", id)
      .maybeSingle();

    if (current?.status === "pending_payment" && status !== "pending_payment" && status !== "payment_received") {
      return NextResponse.json(
        { error: `Mark payment received first. ${current.order_number} is still awaiting payment — confirm payment before moving to ${status}.` },
        { status: 400 }
      );
    }

    const statusUpdatedAt = new Date();

    // Step 1: Update status (always succeeds — no optional columns)
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);

    if (error) {
      console.error("[staff/orders/status]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit event: staff manually moved status
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.status_changed",
      entity_type: "order",
      entity_id: id,
      detail: {
        from: current?.status ?? "unknown",
        to: status,
        order_number: current?.order_number ?? null,
        manual: true,
      },
    });

    // Step 2: Update timestamp columns — non-fatal if columns don't exist yet in schema
    const timestamps: Record<string, string> = {};
    if (status === "payment_received") timestamps.paid_at = statusUpdatedAt.toISOString();
    if (status === "ready_for_pickup") timestamps.ready_at = statusUpdatedAt.toISOString();
    if (status === "complete" && current?.status !== "complete") {
      timestamps.completed_at = statusUpdatedAt.toISOString();
    }

    if (Object.keys(timestamps).length > 0) {
      const { error: tsError } = await supabase.from("orders").update(timestamps).eq("id", id);
      if (tsError) {
        // Non-fatal — status already saved. Columns may not exist yet (run migration).
        console.warn("[staff/orders/status] timestamp update failed (run DB migration):", tsError.message);
      }
    }

    // On transition INTO payment_received: bump customer lifetime stats.
    // Idempotency: only fires when guard above (current.status === "pending_payment")
    // confirmed the transition is a real change. Webhook retries naturally skipped.
    if (status === "payment_received" && current?.status === "pending_payment") {
      const { data: statsOrder } = await supabase
        .from("orders")
        .select("customer_id, total")
        .eq("id", id)
        .single();
      if (statsOrder) {
        await incrementCustomerOrderStats(supabase, statsOrder.customer_id, Number(statsOrder.total ?? 0));
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

    let reviewRequestWarning: string | undefined;

    // Review request + receipt fallback — fires when staff marks order "complete".
    // Repeating "complete" inside Resend's 24-hour idempotency window is a
    // safe recovery path when the provider or durable email log was uncertain.
    if (status === "complete") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select(`order_number, customer_id, subtotal, gst, pst, total, is_rush, discount_code,
                   discount_amount, payment_method, created_at, wave_invoice_id,
                   order_items ( product_name, qty, width_in, height_in, sides, line_total ),
                   customers ( name, email )`)
          .eq("id", id)
          .single();

        if (order) {
          const customerRaw = Array.isArray(order.customers)
            ? order.customers[0]
            : order.customers;
          const customer = customerRaw as { name: string; email: string } | null;

          if (customer?.email) {
            // A deterministic provider idempotency key closes the concurrent-request
            // race. The durable log check also prevents a second request if staff move
            // an already-completed order backward and then complete it again later.
            const { data: existingReview, error: existingReviewError } = await supabase
              .from("email_log")
              .select("id")
              .eq("order_id", id)
              .ilike("subject", "How did your % turn out?")
              .limit(1)
              .maybeSingle();

            if (existingReviewError) {
              reviewRequestWarning =
                "Review request was not scheduled because the duplicate guard could not be verified.";
              console.error(
                "[staff/orders/status] review duplicate guard failed:",
                existingReviewError.message
              );
            } else if (!existingReview) {
              const completedAt =
                current?.status === "complete"
                  ? Date.parse(current.completed_at ?? "")
                  : statusUpdatedAt.getTime();
              const retryAgeMs = Date.now() - completedAt;
              const missingCompletionTime = !Number.isFinite(completedAt);
              const outsideSafeRetryWindow =
                current?.status === "complete" &&
                retryAgeMs >= 23 * 60 * 60 * 1000;

              if (missingCompletionTime || outsideSafeRetryWindow) {
                reviewRequestWarning =
                  "Review request was not retried because the safe provider idempotency window has expired; verify it in Resend first.";
                console.error(
                  `[staff/orders/status] review retry requires manual verification — ${order.order_number}`
                );
              } else {
              // Receipt was already sent at payment_received (no duplicate at complete).
              const reviewItems = Array.isArray(order.order_items) ? order.order_items : [];
              await sendReviewRequestEmail({
                orderId: id,
                customerId: order.customer_id ?? undefined,
                customerName: customer.name,
                customerEmail: customer.email,
                orderNumber: order.order_number,
                scheduledAt: new Date(completedAt + REVIEW_REQUEST_DELAY_MS).toISOString(),
                items: reviewItems.map((i) => ({
                  product_name: i.product_name,
                  qty: i.qty,
                })),
              });
              }
            } else {
              console.log(`[staff/orders/status] review request already exists — ${order.order_number}`);
            }
          }
        }
      } catch (reviewEmailErr) {
        // Non-fatal — status already saved, review email failure should never block the response
        console.error("[staff/orders/status] review request email failed (non-fatal):", reviewEmailErr);
        reviewRequestWarning =
          "Order completed, but the review request needs a safe retry within 23 hours.";
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      ...(reviewRequestWarning ? { reviewRequestWarning } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[staff/orders/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
