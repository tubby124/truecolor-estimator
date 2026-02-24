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
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, getSessionUser } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";

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

    const { error } = await supabase.from("orders").update(update).eq("id", id);

    if (error) {
      console.error("[staff/orders/status]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send customer notification email for key status transitions (non-fatal)
    if (NOTIFY_STATUSES.has(status)) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("order_number, total, is_rush, customers ( name, email )")
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
        }
      } catch (emailErr) {
        // Non-fatal — status already updated, just log the email failure
        console.error("[staff/orders/status] customer notification failed (non-fatal):", emailErr);
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[staff/orders/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
