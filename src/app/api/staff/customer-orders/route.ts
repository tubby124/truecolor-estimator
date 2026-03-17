/**
 * GET /api/staff/customer-orders?email=customer@example.com
 *
 * Staff-only endpoint. Returns up to 20 most recent orders (with line items)
 * for a given customer email. Used by the "Past Orders" modal in the
 * Request Payment flow to enable one-click reordering.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const ip = getClientIp(req);
  if (!rateLimit(`customer-orders:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const supabase = createServiceClient();

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, subtotal, total, is_rush,
        order_items ( id, product_name, qty, line_total, category )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[customer-orders] query error:", error);
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch (err) {
    console.error("[customer-orders]", err instanceof Error ? err.message : err);
    return NextResponse.json({ orders: [] });
  }
}
