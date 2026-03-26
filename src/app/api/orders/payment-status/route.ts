/**
 * GET /api/orders/payment-status?oid={uuid}
 *
 * Public read-only endpoint used by the order-confirmed page to poll for
 * payment confirmation after a Clover Hosted Checkout redirect.
 *
 * Returns only { status } — no sensitive order data exposed.
 * The UUID is unguessable so no further auth is needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const oid = req.nextUrl.searchParams.get("oid");

  if (!oid || !/^[0-9a-f-]{36}$/i.test(oid)) {
    return NextResponse.json({ error: "Invalid oid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("id", oid)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(
    { status: data.status },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
