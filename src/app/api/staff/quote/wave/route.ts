import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";

/**
 * Retired orphan-invoice endpoint. Wave drafts must have a durable order and
 * accounting reservation so an ambiguous provider response cannot be retried
 * into a second invoice. The Make a Quote flow already provides that contract.
 */
export async function POST() {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;
  return NextResponse.json({
    error: "Create this draft with Make a Quote. It saves the complete quote and reserves its Wave invoice before creation, preserving agreed prices and safe retries.",
    code: "ORDER_BACKED_QUOTE_REQUIRED",
    quoteUrl: "/staff/orders?manual=quote",
  }, { status: 409 });
}
