/**
 * PATCH /api/staff/coupons/[id]  — toggle is_active (soft enable/disable)
 * DELETE /api/staff/coupons/[id] — deactivate (soft delete — sets is_active=false)
 * Both require staff auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  const supabase = createServiceClient();

  const body = (await req.json()) as { is_active?: boolean };
  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active (boolean) is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("discount_codes")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select("id, code, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update code." }, { status: 500 });
  }

  return NextResponse.json({ code: data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  const supabase = createServiceClient();

  // Soft delete — deactivate rather than hard delete (preserves redemption history)
  const { error } = await supabase
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to deactivate code." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
