/**
 * PATCH /api/staff/orders/[id]/notes
 *
 * Saves staff-only internal production notes on an order.
 * Notes are never sent to the customer — for staff use only.
 *
 * Body: { staff_notes: string }
 * Requires: ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_notes TEXT;
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, getSessionUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { staff_notes } = (await req.json()) as { staff_notes: string };

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("orders")
      .update({ staff_notes: staff_notes?.trim() || null } as Record<string, unknown>)
      .eq("id", id);

    if (error) {
      console.error("[staff/orders/notes]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[staff/orders/notes] saved → order ${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save notes";
    console.error("[staff/orders/notes]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
