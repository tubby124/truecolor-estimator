/**
 * POST /api/account/receipt
 *
 * Sends a payment receipt email to the authenticated customer for a given order.
 * Auth: Supabase Bearer token (same pattern as /api/account/orders).
 * Body: { orderId: string }
 *
 * Security: order.customer must match the authenticated user's email — customers
 * can only email receipts for their own orders.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://dczbgraekmzirxknjvwe.supabase.co";

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // ── Fetch order (with customer join) ────────────────────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, subtotal, gst, pst, total, is_rush,
       discount_code, discount_amount, payment_method, created_at,
       order_items ( product_name, qty, width_in, height_in, sides, line_total ),
       customers ( name, email )`
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // ── Ownership check ─────────────────────────────────────────────────────────
  const customerRaw = Array.isArray(order.customers)
    ? order.customers[0]
    : order.customers;
  const customer = customerRaw as { name: string; email: string } | null;

  if (!customer?.email || customer.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Paid status guard ───────────────────────────────────────────────────────
  const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];
  if (!PAID_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: "Receipt only available for paid orders" },
      { status: 400 }
    );
  }

  // ── Send receipt ────────────────────────────────────────────────────────────
  try {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    await sendPaymentReceipt({
      orderNumber: order.order_number,
      customerName: customer.name,
      customerEmail: customer.email,
      createdAt: order.created_at,
      items: items.map((i) => ({
        product_name: i.product_name,
        qty: i.qty,
        width_in: i.width_in,
        height_in: i.height_in,
        sides: i.sides,
        line_total: Number(i.line_total),
      })),
      subtotal: Number(order.subtotal),
      gst: Number(order.gst),
      pst: Number(order.pst ?? 0),
      total: Number(order.total),
      isRush: Boolean(order.is_rush),
      discountCode: order.discount_code,
      discountAmount: order.discount_amount ? Number(order.discount_amount) : null,
      paymentMethod: order.payment_method,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send receipt";
    console.error("[account/receipt]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
