/**
 * GET  /api/staff/coupons  — list all discount codes + redemption counts
 * POST /api/staff/coupons  — create a new discount code
 * Both require staff auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  const { data: codes, error } = await supabase
    .from("discount_codes")
    .select("id, code, type, discount_amount, description, is_active, requires_account, per_account_limit, max_uses, expires_at, created_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load codes" }, { status: 500 });
  }

  // Attach redemption counts per code
  const codesWithCounts = await Promise.all(
    (codes ?? []).map(async (c) => {
      const { count } = await supabase
        .from("discount_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("code_id", c.id);
      return { ...c, redemption_count: count ?? 0 };
    })
  );

  return NextResponse.json({ codes: codesWithCounts });
}

export async function POST(req: NextRequest) {
  const authResult = await requireStaffUser();
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  const body = (await req.json()) as {
    code?: string;
    type?: string;
    discount_amount?: number;
    description?: string;
    per_account_limit?: number;
    max_uses?: number | null;
    expires_at?: string | null;
  };

  if (!body.code?.trim()) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  if (!body.discount_amount || body.discount_amount <= 0) {
    return NextResponse.json({ error: "Discount amount must be greater than 0." }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code,
      type: body.type ?? "custom",
      discount_amount: body.discount_amount,
      description: body.description?.trim() || null,
      per_account_limit: body.per_account_limit ?? 1,
      max_uses: body.max_uses ?? null,
      expires_at: body.expires_at ?? null,
      created_by: authResult.email,
    })
    .select("id, code, type, discount_amount, description, is_active, per_account_limit, max_uses, expires_at, created_by, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `Code "${code}" already exists.` }, { status: 409 });
    }
    console.error("[staff/coupons] create error:", error);
    return NextResponse.json({ error: "Failed to create code." }, { status: 500 });
  }

  return NextResponse.json({ code: { ...data, redemption_count: 0 } }, { status: 201 });
}
