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
 *   complete          → review request email ("How did your order turn out?")
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, getSessionUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendReviewRequestEmail } from "@/lib/email/reviewRequest";
import { approveWaveInvoice, sendWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";

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
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: OrderStatus };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const update: Record<string, unknown> = { status };

    // Set timestamp columns on key transitions
    if (status === "payment_received") update.paid_at = new Date().toISOString();
    if (status === "ready_for_pickup") update.ready_at = new Date().toISOString();
    if (status === "complete") update.completed_at = new Date().toISOString();

    // Guard: "complete" requires current status to be "ready_for_pickup"
    // Prevents review email going to customers who haven't actually picked up their order
    if (status === "complete") {
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .single();

      if (currentOrder?.status !== "ready_for_pickup") {
        return NextResponse.json(
          { error: "Order must be marked 'Ready for Pickup' before completing" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase.from("orders").update(update).eq("id", id);

    if (error) {
      console.error("[staff/orders/status]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Status-change side effects (all non-fatal) ────────────────────────────

    // Standard status notification emails (payment_received / in_production / ready_for_pickup)
    if (NOTIFY_STATUSES.has(status)) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("order_number, total, is_rush, wave_invoice_id, payment_method, customers ( name, email )")
          .eq("id", id)
          .single();

        if (order) {
          const customerRaw = Array.isArray(order.customers)
            ? order.customers[0]
            : order.customers;
          const customer = customerRaw as { name: string; email: string } | null;

          if (customer?.email) {
            await sendOrderStatusEmail({
              status: status as "payment_received" | "in_production" | "ready_for_pickup",
              orderNumber: order.order_number,
              customerName: customer.name,
              customerEmail: customer.email,
              total: Number(order.total),
              isRush: Boolean(order.is_rush),
            });
          }

          // On payment_received: approve Wave invoice + record payment in Wave accounting
          // eTransfer only — Clover webhook handles card orders when payment is captured
          if (status === "payment_received" && order.wave_invoice_id) {
            const paymentMethod = (order as { payment_method?: string }).payment_method;
            if (paymentMethod !== "clover_card") {
              try {
                await approveWaveInvoice(order.wave_invoice_id);
                void supabase.from("orders")
                  .update({ wave_invoice_approved_at: new Date().toISOString() })
                  .eq("id", id);

                // Look up Wave customer ID to enable auto-reconciliation against invoice
                const waveCustomerId = customer?.email
                  ? await findCustomerByEmail(customer.email).catch(() => null)
                  : null;

                await recordWavePayment(
                  order.wave_invoice_id,
                  Number(order.total),
                  "BANK_TRANSFER",
                  `eTransfer — Order ${order.order_number}`,
                  waveCustomerId ?? undefined,
                  id,  // Supabase order UUID as externalId — prevents duplicate transactions
                );
                void supabase.from("orders")
                  .update({ wave_payment_recorded_at: new Date().toISOString() })
                  .eq("id", id);
                console.log(`[staff/orders/status] Wave payment recorded — eTransfer (${order.wave_invoice_id})`);
              } catch (waveErr) {
                console.error("[staff/orders/status] Wave payment recording failed (non-fatal):", waveErr);
              }
            }
          }

          // On ready_for_pickup: send Wave invoice as receipt (approve already done above)
          // Both eTransfer and card orders get the receipt email
          if (status === "ready_for_pickup" && order.wave_invoice_id && customer?.email) {
            try {
              await sendWaveInvoice(order.wave_invoice_id, customer.email, {
                subject: `Receipt — True Color Order ${order.order_number}`,
                message: `Your order is ready for pickup at 216 33rd St W, Saskatoon. Your payment has been confirmed — please find your receipt attached.`,
              });
              console.log(`[staff/orders/status] Wave receipt sent → ${customer.email} (${order.wave_invoice_id})`);
            } catch (waveErr) {
              console.error("[staff/orders/status] Wave receipt send failed (non-fatal):", waveErr);
            }
          }
        }
      } catch (emailErr) {
        // Non-fatal — status already updated, just log the email failure
        console.error("[staff/orders/status] customer notification failed (non-fatal):", emailErr);
      }
    }

    // Review request email — fires when staff marks order "complete"
    if (status === "complete") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("order_number, customers ( name, email )")
          .eq("id", id)
          .single();

        if (order) {
          const customerRaw = Array.isArray(order.customers)
            ? order.customers[0]
            : order.customers;
          const customer = customerRaw as { name: string; email: string } | null;

          if (customer?.email) {
            await sendReviewRequestEmail({
              customerName: customer.name,
              customerEmail: customer.email,
              orderNumber: order.order_number,
            });
          }
        }
      } catch (reviewEmailErr) {
        // Non-fatal — status already saved, review email failure should never block the response
        console.error("[staff/orders/status] review request email failed (non-fatal):", reviewEmailErr);
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[staff/orders/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
