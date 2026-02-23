/**
 * GET /api/account/orders
 * Returns orders for the authenticated customer.
 * Uses Supabase session from Authorization header (Bearer token).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ needsLogin: true });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user?.email) {
    return NextResponse.json({ needsLogin: true });
  }

  // Use service key to query orders by email (RLS may restrict customer access)
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  const admin = createClient(SUPABASE_URL, serviceKey);

  const { data: customers } = await admin
    .from("customers")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .limit(1);

  if (!customers?.length) {
    return NextResponse.json({ orders: [] });
  }

  const customerId = customers[0].id;

  const { data: orders, error: ordersErr } = await admin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      total,
      created_at,
      is_rush,
      payment_method,
      order_items (
        id,
        product_name,
        qty,
        width_in,
        height_in,
        sides,
        design_status,
        line_total,
        category,
        material_code
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersErr) {
    return NextResponse.json({ error: ordersErr.message }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [] });
}
