/**
 * PATCH /api/staff/orders/[id]/status
 *
 * Updates order status. Staff-only route — no auth guard yet (noindex, URL-obscured).
 * Body: { status: order_status }
 *
 * Allowed transitions (enforced client-side; server accepts any valid status):
 *   pending_payment → payment_received → in_production → ready_for_pickup → complete
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "pending_payment",
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
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

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[staff/orders/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
