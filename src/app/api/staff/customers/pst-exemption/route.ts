import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ vendorNumber: null });

  const { data, error } = await createServiceClient()
    .from("customers")
    .select("pst_vendor_number")
    .eq("email", email)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load customer tax preference" }, { status: 500 });
  return NextResponse.json({ vendorNumber: data?.pst_vendor_number ?? null });
}
