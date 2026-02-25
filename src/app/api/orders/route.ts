/**
 * POST /api/orders
 *
 * Creates:
 *   1. Supabase customer (upsert by email)
 *   2. Supabase order + order_items rows
 *   3. Wave invoice (DRAFT — silent, not sent to customer yet)
 *   4. Clover Hosted Checkout session
 *
 * Returns: { orderId, orderNumber, checkoutUrl }
 * On eTransfer: returns { orderId, orderNumber, checkoutUrl: null }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createOrFindWaveCustomer, createWaveInvoice } from "@/lib/wave/invoice";
import { createCloverCheckout } from "@/lib/payment/clover";
import { encodePaymentToken } from "@/lib/payment/token";
import type { CartItem } from "@/lib/cart/cart";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { sendStaffOrderNotification } from "@/lib/email/staffNotification";

export interface CreateOrderRequest {
  items: CartItem[];
  contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  };
  is_rush: boolean;
  payment_method: "clover_card" | "etransfer";
  notes?: string;
  file_storage_paths?: string[];
}

const GST_RATE = 0.05;
const RUSH_FEE = 40;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderRequest;
    const { items, contact, is_rush, payment_method, notes, file_storage_paths } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!contact?.email || !contact?.name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Upsert customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .upsert(
        {
          email: contact.email.toLowerCase().trim(),
          name: contact.name.trim(),
          company: contact.company?.trim() || null,
          phone: contact.phone?.trim() || null,
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (custErr || !customer) {
      console.error("[orders] customer upsert:", custErr);
      return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
    }

    // Update address if provided (non-fatal — column added via migration, may not exist yet)
    if (contact.address?.trim()) {
      void supabase
        .from("customers")
        .update({ address: contact.address.trim() } as Record<string, unknown>)
        .eq("id", customer.id);
    }

    // Append company to saved companies[] list (non-fatal — requires migration)
    if (contact.company?.trim()) {
      void (async () => {
        try {
          const { data: c } = await supabase
            .from("customers")
            .select("companies")
            .eq("id", customer.id)
            .maybeSingle();
          const current: string[] = Array.isArray((c as { companies?: unknown })?.companies)
            ? (c as { companies: string[] }).companies
            : [];
          const newCo = contact.company!.trim();
          if (!current.includes(newCo)) {
            await supabase
              .from("customers")
              .update({ companies: [...current, newCo] } as Record<string, unknown>)
              .eq("id", customer.id);
          }
        } catch {
          // companies column may not exist yet — skip
        }
      })();
    }

    // 2. Calculate totals
    const subtotal = items.reduce((s, i) => s + i.sell_price, 0);
    const rush = is_rush ? RUSH_FEE : 0;
    const gst = Math.round((subtotal + rush) * GST_RATE * 100) / 100;
    const total = subtotal + rush + gst;

    // 3. Create order row
    // Generate order_number server-side — bypasses DB trigger (which may not be deployed)
    // Format: TC-2026-X4F2A — year + 5-char base-36 timestamp suffix (collision prob ~0.01%)
    const orderYear = new Date().getFullYear();
    const orderSuffix = Date.now().toString(36).slice(-5).toUpperCase();
    const generatedOrderNumber = `TC-${orderYear}-${orderSuffix}`;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: generatedOrderNumber,
        customer_id: customer.id,
        status: "pending_payment",
        is_rush,
        subtotal,
        gst,
        total,
        payment_method,
        notes: notes?.trim() || (contact.company ? `Company: ${contact.company}` : null),
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error("[orders] INSERT failed:", {
        code: orderErr?.code,
        message: orderErr?.message,
        details: orderErr?.details,
        hint: orderErr?.hint,
      });
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Save all file paths to order (requires DB migration: file_storage_paths TEXT[] — best-effort)
    if (file_storage_paths?.length) {
      void supabase
        .from("orders")
        .update({ file_storage_paths } as Record<string, unknown>)
        .eq("id", order.id);
    }

    // 4. Create order_items rows
    // line_items_json requires DB migration: ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_items_json JSONB;
    const orderItems = items.map((item) => ({
      order_id: order.id,
      category: item.category,
      product_name: item.product_name,
      material_code: item.config.material_code ?? null,
      width_in: item.config.width_in ?? null,
      height_in: item.config.height_in ?? null,
      sides: item.config.sides ?? 1,
      qty: item.qty,
      addons: item.config.addons ?? [],
      is_rush,
      design_status: item.config.design_status ?? "PRINT_READY",
      unit_price: item.sell_price / item.qty,
      line_total: item.sell_price,
      ...(item.line_items ? { line_items_json: item.line_items } : {}),
    }));

    // Attach first file path to first order item (DB column only stores one path per item)
    if (file_storage_paths?.length && orderItems.length > 0) {
      (orderItems[0] as Record<string, unknown>).file_storage_path = file_storage_paths[0];
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("[orders] order_items insert:", itemsErr);
      // Non-fatal — order exists, continue
    }

    // 5. Create Wave invoice (DRAFT, silent)
    let waveInvoiceId: string | null = null;
    try {
      const waveCustomerId = await createOrFindWaveCustomer(
        contact.email.toLowerCase().trim(),
        contact.name.trim()
      );

      const waveItems = items.map((item) => ({
        description: item.label,
        unitPrice: item.sell_price / item.qty,
        qty: item.qty,
        applyGst: true,
      }));

      const inv = await createWaveInvoice(waveCustomerId, waveItems, {
        isRush: is_rush,
        orderNumber: order.order_number,
      });

      waveInvoiceId = inv.invoiceId;

      // Save wave_invoice_id back to order (best-effort — schema may not have column yet)
      void supabase
        .from("orders")
        .update({ wave_invoice_id: waveInvoiceId } as Record<string, unknown>)
        .eq("id", order.id);
    } catch (waveErr) {
      // Wave failure is non-fatal — order still exists, staff can create manually
      console.error("[orders] Wave invoice creation failed (non-fatal):", waveErr);
    }

    // 6. Clover Hosted Checkout (card only)
    let checkoutUrl: string | null = null;
    if (payment_method === "clover_card") {
      const totalCents = Math.round(total * 100);
      const description =
        items.length === 1
          ? items[0].product_name
          : `True Color Order ${order.order_number} (${items.length} items)`;

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        "https://truecolor-estimator.vercel.app";
      const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;

      const clover = await createCloverCheckout(totalCents, description, contact.email, redirectUrl);
      checkoutUrl = clover.checkoutUrl;

      // Save Clover session ref (best-effort)
      void supabase
        .from("orders")
        .update({ payment_reference: clover.sessionId } as Record<string, unknown>)
        .eq("id", order.id);

      // Build a durable /pay/{token} URL for the email (30-day validity, creates fresh Clover session on each click)
      // The raw checkoutUrl expires after 15 minutes and should not go in emails
      try {
        const payToken = encodePaymentToken(total, description, contact.email, redirectUrl);
        checkoutUrl = `${siteUrl}/pay/${payToken}`;
      } catch {
        // If token signing fails, keep the raw Clover URL as fallback
      }
    }


    // 7. Send order confirmation email to customer (non-fatal)
    try {
      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        contact,
        items: orderItems.map((item, idx) => ({
          product_name: item.product_name,
          qty: item.qty,
          width_in: item.width_in,
          height_in: item.height_in,
          sides: item.sides,
          design_status: item.design_status,
          line_total: item.line_total,
          line_items: items[idx]?.line_items,
        })),
        subtotal,
        gst,
        total,
        is_rush,
        payment_method,
        checkout_url: checkoutUrl ?? undefined,
        uploadedFileCount: file_storage_paths?.length ?? 0,
      });
    } catch (emailErr) {
      console.error("[orders] confirmation email failed (non-fatal):", emailErr);
    }

    // 8. Send staff notification email (non-fatal)
    try {
      const siteUrlForEmail =
        process.env.NEXT_PUBLIC_SITE_URL ??
        "https://truecolor-estimator.vercel.app";
      await sendStaffOrderNotification({
        orderNumber: order.order_number,
        contact,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          qty: item.qty,
          width_in: item.width_in,
          height_in: item.height_in,
          sides: item.sides,
          design_status: item.design_status,
          line_total: item.line_total,
        })),
        subtotal,
        gst,
        total,
        is_rush,
        payment_method,
        notes: notes ?? null,
        filePaths: file_storage_paths ?? [],
        siteUrl: siteUrlForEmail,
      });
    } catch (staffEmailErr) {
      console.error("[orders] staff notification failed (non-fatal):", staffEmailErr);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl,
      waveInvoiceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    console.error("[orders]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
