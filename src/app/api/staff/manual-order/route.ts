/**
 * POST /api/staff/manual-order
 *
 * Staff-only endpoint. Creates a manual payment request:
 *   1. Upserts customer in Supabase
 *   2. Creates order + order_items (tagged as manual via staff_notes)
 *   3. Creates payment link (Clover /pay/{token} OR Wave hosted invoice)
 *   4. Sends payment request email to customer
 *   5. Sends staff notification
 *
 * Returns: { orderId, orderNumber, paymentUrl }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { createOrFindWaveCustomer, createWaveInvoice, approveWaveInvoice, sendWaveInvoice } from "@/lib/wave/invoice";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendPaymentRequestEmail } from "@/lib/email/paymentRequest";
import { sendStaffOrderNotification } from "@/lib/email/staffNotification";
import { sanitizeError } from "@/lib/errors/sanitize";

const GST_RATE = 0.05;

export async function POST(req: NextRequest) {
  // Staff auth check
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json() as {
      contact: { name: string; email: string; company?: string; phone?: string };
      description: string;
      amount: number;
      payment_method: "clover" | "wave";
      notes?: string;
    };

    const { contact, description, amount, payment_method, notes } = body;

    // ── Validation ──
    if (!contact?.name?.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!contact?.email?.trim()) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "Order description is required" }, { status: 400 });
    }
    if (!amount || amount <= 0 || isNaN(amount)) {
      return NextResponse.json({ error: "Amount must be greater than $0" }, { status: 400 });
    }
    if (amount > 99999) {
      return NextResponse.json({ error: "Amount exceeds maximum allowed ($99,999)" }, { status: 400 });
    }
    if (!["clover", "wave"].includes(payment_method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ── 1. Upsert customer ──
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
      console.error("[manual-order] customer upsert:", custErr);
      return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
    }

    // ── 2. Calculate totals ──
    const subtotal = Math.round(amount * 100) / 100;
    const gst = Math.round(subtotal * GST_RATE * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;

    // ── 3. Create order row (retry on order_number collision) ──
    const orderYear = new Date().getFullYear();
    type OrderRow = { id: string; order_number: string };
    let order: OrderRow | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      const orderNumber = `TC-${orderYear}-${String((orderCount ?? 0) + 1).padStart(4, "0")}`;

      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          status: "pending_payment",
          is_rush: false,
          subtotal,
          gst,
          total,
          payment_method: payment_method === "wave" ? "wave" : "clover_card",
          notes: notes?.trim() || null,
          staff_notes: "Manual order — created by staff via payment request",
        })
        .select("id, order_number")
        .single();

      if (!error) {
        order = data as OrderRow;
        break;
      }
      if ((error as { code?: string }).code !== "23505") {
        console.error("[manual-order] order INSERT:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }
      // 23505 = unique_violation on order_number — retry with new count
    }

    if (!order) {
      return NextResponse.json({ error: "Failed to create order after retries" }, { status: 500 });
    }

    // ── 4. Insert order_items row ──
    void supabase.from("order_items").insert({
      order_id: order.id,
      category: "MANUAL",
      product_name: description.trim(),
      qty: 1,
      sides: 1,
      addons: [],
      is_rush: false,
      design_status: "PRINT_READY",
      unit_price: subtotal,
      line_total: subtotal,
    });

    // ── 5. Generate payment URL ──
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
    let paymentUrl: string | null = null;

    if (payment_method === "clover") {
      // Encode a 30-day signed payment token → /pay/{token} creates fresh Clover session on each click
      try {
        const token = encodePaymentToken(total, description.trim(), contact.email.toLowerCase().trim(), redirectUrl);
        paymentUrl = `${siteUrl}/pay/${token}`;

        // Save payment_reference on order (best-effort)
        void supabase
          .from("orders")
          .update({ payment_reference: paymentUrl } as Record<string, unknown>)
          .eq("id", order.id);
      } catch (tokenErr) {
        console.error("[manual-order] payment token encode:", tokenErr);
        return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
      }
    } else {
      // Wave: create invoice → approve → get viewUrl → send our branded email
      // If viewUrl not available, fall back to Wave's own invoice email
      try {
        const waveCustomerId = await createOrFindWaveCustomer(
          contact.email.toLowerCase().trim(),
          contact.name.trim()
        );

        const inv = await createWaveInvoice(
          waveCustomerId,
          [{ description: description.trim(), unitPrice: subtotal, qty: 1, applyGst: true }],
          { orderNumber: order.order_number }
        );

        // Save wave_invoice_id on order (best-effort)
        void supabase
          .from("orders")
          .update({ wave_invoice_id: inv.invoiceId } as Record<string, unknown>)
          .eq("id", order.id);

        // Approve the invoice so it becomes payable
        await approveWaveInvoice(inv.invoiceId);

        if (inv.viewUrl) {
          // Wave returned a hosted checkout URL — use it in our branded email
          paymentUrl = inv.viewUrl;
        } else {
          // viewUrl not available — let Wave send their own invoice email (CC's the shop)
          await sendWaveInvoice(inv.invoiceId, contact.email.toLowerCase().trim(), {
            subject: `Invoice from True Color Display Printing — ${order.order_number}`,
            message: `Hi ${contact.name.trim()},\n\nPlease find your invoice attached. Click "Pay Invoice" to pay online.\n\nRef: ${order.order_number}\n\nThank you,\nTrue Color Display Printing\n(306) 954-8688`,
          });
          // Wave handled the email — return success without our custom email
          console.log(`[manual-order] Wave invoice sent directly | order ${order.order_number}`);
          return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, paymentUrl: null });
        }
      } catch (waveErr) {
        console.error("[manual-order] Wave invoice error:", waveErr);
        return NextResponse.json({ error: "Failed to create Wave invoice. Please try Clover instead." }, { status: 500 });
      }
    }

    // ── 6. Send payment request email to customer ──
    try {
      await sendPaymentRequestEmail({
        orderNumber: order.order_number,
        contact: {
          name: contact.name.trim(),
          email: contact.email.toLowerCase().trim(),
          company: contact.company?.trim() || null,
        },
        description: description.trim(),
        subtotal,
        gst,
        total,
        paymentUrl: paymentUrl!,
        paymentMethod: payment_method,
        notes: notes?.trim() || null,
      });
    } catch (emailErr) {
      console.error("[manual-order] customer email failed (non-fatal):", emailErr);
    }

    // ── 7. Send staff notification ──
    try {
      await sendStaffOrderNotification({
        orderNumber: order.order_number,
        contact: {
          name: contact.name.trim(),
          email: contact.email.toLowerCase().trim(),
          company: contact.company?.trim(),
          phone: contact.phone?.trim(),
        },
        items: [{
          product_name: description.trim(),
          qty: 1,
          width_in: null,
          height_in: null,
          sides: 1,
          design_status: "PRINT_READY",
          line_total: subtotal,
        }],
        subtotal,
        gst,
        total,
        is_rush: false,
        payment_method: payment_method === "wave" ? "etransfer" : "clover_card",
        notes: `[Manual Order] ${notes?.trim() ?? "Created via staff payment request"}`,
        filePaths: [],
        siteUrl,
      });
    } catch (staffEmailErr) {
      console.error("[manual-order] staff notification failed (non-fatal):", staffEmailErr);
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, paymentUrl });
  } catch (err) {
    console.error("[manual-order]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
