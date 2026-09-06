import { NextResponse } from "next/server";
import { getCanonicalTaxRates } from "@/lib/pricing/canonical-rates";
import { getConfigNum } from "@/lib/data/loader";

export const dynamic = "force-dynamic";

/** Public business rates only. No database client or customer data. */
export async function GET() {
  try {
    return NextResponse.json({ ...getCanonicalTaxRates(), rushFee: getConfigNum("rush_fee_flat") }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Pricing configuration unavailable" }, { status: 503 });
  }
}
