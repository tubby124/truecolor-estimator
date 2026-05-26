/**
 * PATCH /api/staff/orders/[id]/archive
 *
 * Archives or unarchives an order. Staff-only — requires authenticated session.
 * Orders are NEVER deleted — archiving only sets is_archived = true and hides
 * the order from normal views. Always reversible.
 *
 * Body: { archived: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as { archived?: unknown };

    if (typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "Invalid request — archived must be a boolean" }, { status: 400 });
    }

    const archived = body.archived;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("orders")
      .update({
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      console.error("[staff/orders/archive]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: archived ? "order.archived" : "order.unarchived",
      entity_type: "order",
      entity_id: id,
      detail: { archived },
    });

    return NextResponse.json({ ok: true, archived });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update archive state";
    console.error("[staff/orders/archive]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
