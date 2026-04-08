/**
 * GET /api/receipt/[oid]/pdf
 *
 * Generates and streams a PDF receipt for an order.
 *
 * Auth (either one accepted):
 *   - Guest:  ?token=[receipt_token]  (UUID stored on the order — shared on order-confirmed page)
 *   - Auth:   Authorization: Bearer [supabase_jwt]  (logged-in customer, ownership checked by email)
 *
 * Response: application/pdf attachment named "receipt-TC-XXXX.pdf"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import { ReceiptPdf } from "@/lib/receipt/ReceiptPdf";
import type { ReceiptPdfData } from "@/lib/receipt/ReceiptPdf";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  const { oid } = await params;
  if (!oid) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!tokenParam && !bearerToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  const admin = createClient(SUPABASE_URL, serviceKey);

  // ── Fetch order ─────────────────────────────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      receipt_token,
      subtotal,
      gst,
      pst,
      total,
      is_rush,
      discount_code,
      discount_amount,
      payment_method,
      created_at,
      order_items ( product_name, qty, width_in, height_in, sides, category, line_total ),
      customers ( name, email, company )
    `)
    .eq("id", oid)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // ── Auth check ───────────────────────────────────────────────────────────────
  if (tokenParam) {
    // Guest: token must match order's receipt_token
    if (!order.receipt_token || order.receipt_token !== tokenParam) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
  } else if (bearerToken) {
    // Auth: verify JWT ownership by email
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const userClient = createClient(SUPABASE_URL, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const customer = customerRaw as { name: string; email: string; company?: string | null } | null;
    if (!customer?.email || customer.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Build PDF data ────────────────────────────────────────────────────────────
  const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const customer = customerRaw as { name: string; email: string; company?: string | null } | null;

  const pst = Number(order.pst ?? 0);
  const total = Number(order.total);
  const subtotal = Number(order.subtotal);
  const gst = Number(order.gst);
  const rushFee = order.is_rush
    ? Math.round((total - subtotal - gst - pst) * 100) / 100
    : 0;

  const orderDate = new Date(order.created_at).toLocaleDateString("en-CA", {
    timeZone: "America/Regina",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const items = Array.isArray(order.order_items) ? order.order_items : [];

  const data: ReceiptPdfData = {
    orderNumber: order.order_number,
    orderDate,
    status: order.status,
    customerName: customer?.name ?? "Customer",
    customerEmail: customer?.email ?? "",
    customerCompany: customer?.company ?? null,
    paymentMethod: order.payment_method,
    items: items.map((i) => ({
      product_name: i.product_name,
      qty: i.qty,
      width_in: i.width_in,
      height_in: i.height_in,
      sides: i.sides,
      category: i.category ?? "",
      line_total: Number(i.line_total),
    })),
    subtotal,
    gst,
    pst,
    total,
    isRush: Boolean(order.is_rush),
    rushFee,
    discountCode: order.discount_code ?? null,
    discountAmount: order.discount_amount ? Number(order.discount_amount) : null,
  };

  // ── Render PDF ────────────────────────────────────────────────────────────────
  try {
    const isPaid = PAID_STATUSES.includes(order.status);
    const titleWord = isPaid ? "Receipt" : "Order-Summary";
    const filename = `${titleWord}-${order.order_number}.pdf`;

    const element = createElement(ReceiptPdf, { data }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[receipt/pdf]", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
