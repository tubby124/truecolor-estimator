/**
 * GET /api/staff/customer-quotes?email=customer@example.com
 *
 * Staff-only. Returns all quote requests for a given customer email.
 * Used by the staff customers portal to show quote history inline.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ quotes: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, created_at, name, items, replied_at, reply_body, staff_note, file_links")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[customer-quotes]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quotes: data ?? [] });
}
