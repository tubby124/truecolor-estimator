import { NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { getQuoteTaxRates } from "@/lib/payment/quote-order";

export async function GET() {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    return NextResponse.json(await getQuoteTaxRates(createServiceClient()));
  } catch (error) {
    console.error("[staff/pricing/tax-rates]", error);
    return NextResponse.json({ error: "Tax configuration unavailable" }, { status: 503 });
  }
}
