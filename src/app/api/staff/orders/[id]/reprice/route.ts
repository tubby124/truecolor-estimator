import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";

/** Retired: a total-only edit cannot safely revise items, taxes or accounting. */
export async function POST() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    error: "Total-only repricing is retired. For an unpaid order use Void & replace; for a structured quote send a complete new revision. Paid, progressed or unreconciled documents require finance review.",
    code: "FULL_CORRECTION_REQUIRED",
    correctionUrl: "/staff/orders",
  }, { status: 409 });
}
