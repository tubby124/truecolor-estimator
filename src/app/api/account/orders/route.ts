/**
 * GET /api/account/orders
 * Returns orders for the authenticated customer.
 * Uses Supabase session from Authorization header (Bearer token).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encodePaymentToken } from "@/lib/payment/token";

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
      proof_storage_path,
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
    console.error("[account/orders]", ordersErr.message);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolor-estimator.vercel.app";

  const ordersWithPayUrl = (orders ?? []).map((order) => {
    let pay_url: string | null = null;
    if (order.status === "pending_payment" && order.payment_method === "clover_card") {
      try {
        const token = encodePaymentToken(
          order.total,
          `Order ${order.order_number}`,
          user.email ?? undefined,
          `${siteUrl}/order-confirmed?oid=${order.id}`,
        );
        pay_url = `/pay/${token}`;
      } catch {
        // Non-fatal — payment token secret may not be configured
      }
    }
    return { ...order, pay_url };
  });

  return NextResponse.json({ orders: ordersWithPayUrl });
}
