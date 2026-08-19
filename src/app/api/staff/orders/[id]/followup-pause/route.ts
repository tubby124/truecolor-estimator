/**
 * POST /api/staff/orders/[id]/followup-pause
 * Body: { paused: boolean, reason?: string }
 *
 * Pause stops all automated payment reminders for an order (the
 * "customer already paid externally" case) with an audit reason.
 * Resume clears the pause.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { paused?: boolean; reason?: string };

    if (typeof body.paused !== "boolean") {
      return NextResponse.json({ error: "paused (boolean) required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (body.paused) {
      const reason = (body.reason ?? "").slice(0, 200) || "staff-paused";
      const { data, error } = await supabase
        .from("orders")
        .update({
          followup_paused_at: new Date().toISOString(),
          followup_paused_reason: reason,
        })
        .eq("id", id)
        .select("id, order_number, followup_paused_at, followup_paused_reason")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await recordAuditEvent({
        actor_type: "staff",
        actor_id: "staff",
        event_type: "order.followup_paused",
        entity_type: "order",
        entity_id: id,
        detail: { reason },
      });
      return NextResponse.json({ ok: true, order: data });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ followup_paused_at: null, followup_paused_reason: null })
      .eq("id", id)
      .select("id, order_number, followup_paused_at, followup_paused_reason")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAuditEvent({
      actor_type: "staff",
      actor_id: "staff",
      event_type: "order.followup_resumed",
      entity_type: "order",
      entity_id: id,
      detail: {},
    });
    return NextResponse.json({ ok: true, order: data });
  } catch (err) {
    console.error("[followup-pause] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
