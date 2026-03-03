/**
 * GET /api/staff/coupons/[id]/redemptions
 * Returns the redemption log for a specific discount code.
 * Requires staff auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("discount_redemptions")
    .select(`
      id,
      amount_saved,
      redeemed_at,
      customers ( name, email ),
      orders ( order_number )
    `)
    .eq("code_id", id)
    .order("redeemed_at", { ascending: false });

  if (error) {
    console.error("[staff/coupons/redemptions]", error);
    return NextResponse.json({ error: "Failed to load redemptions." }, { status: 500 });
  }

  return NextResponse.json({ redemptions: data ?? [] });
}
