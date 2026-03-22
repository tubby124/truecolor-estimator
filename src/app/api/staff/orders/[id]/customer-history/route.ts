import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const ip = getClientIp(req);
  if (!rateLimit(`customer-history:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { id: orderId } = await params;
    const supabase = createServiceClient();

    const { data: order } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!order?.customer_id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, email, company, phone")
      .eq("id", order.customer_id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, total, is_rush,
        order_items ( product_name, qty )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[customer-history] query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allOrders = orders ?? [];
    const totalSpend = allOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return NextResponse.json({
      customer: {
        name: customer.name,
        email: customer.email,
        company: customer.company ?? null,
        phone: customer.phone ?? null,
      },
      orderCount: allOrders.length,
      totalSpend,
      orders: allOrders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load customer history";
    console.error("[customer-history]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
