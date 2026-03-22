/**
 * POST /api/staff/manual-order
 *
 * Staff-only endpoint. Creates a manual payment request:
 *   1. Upserts customer in Supabase
 *   2. Creates order + order_items (one row per item)
 *   3. Creates payment link (Clover /pay/{token} OR Wave hosted invoice)
 *   4. Sends payment request email to customer
 *   5. Sends staff notification
 *
 * Accepts multi-item orders: { items: [{ product, qty, details?, amount }] }
 * Backward compat: if `description` + `amount` present (no items), wraps into single item.
 *
 * Returns: { orderId, orderNumber, paymentUrl }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { createOrFindWaveCustomer, createWaveInvoice, approveWaveInvoice, sendWaveInvoice } from "@/lib/wave/invoice";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendPaymentRequestEmail, type AccountInfo } from "@/lib/email/paymentRequest";
import { sendStaffOrderNotification } from "@/lib/email/staffNotification";
import { sendAccountWelcomeEmail } from "@/lib/email/accountWelcome";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";
import { sanitizeError } from "@/lib/errors/sanitize";

const GST_RATE = 0.05;
const PST_RATE = 0.06;

interface OrderItemInput {
  product: string;
  qty: number;
  details?: string;
  amount: number;
}

export async function POST(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json() as {
      contact: { name: string; email: string; company?: string; phone?: string };
      // Multi-item (new)
      items?: OrderItemInput[];
      // Legacy single-item (backward compat)
      description?: string;
      amount?: number;
      payment_method: "clover" | "wave";
      notes?: string;
    };

    const { contact, payment_method, notes } = body;

    // ── Normalize items (backward compat) ──
    let items: OrderItemInput[];
    if (body.items && body.items.length > 0) {
      items = body.items;
    } else if (body.description && body.amount) {
      items = [{ product: "Other", qty: 1, details: body.description, amount: body.amount }];
    } else {
      return NextResponse.json({ error: "At least one order item is required" }, { status: 400 });
    }

    // ── Validation ──
    if (!contact?.name?.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!contact?.email?.trim()) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }
    if (!["clover", "wave"].includes(payment_method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.product?.trim()) {
        return NextResponse.json({ error: "Each item requires a product type" }, { status: 400 });
      }
      if (!item.amount || item.amount <= 0 || isNaN(item.amount)) {
        return NextResponse.json({ error: `Amount for "${item.product}" must be greater than $0` }, { status: 400 });
      }
      if (item.amount > 99999) {
        return NextResponse.json({ error: `Amount for "${item.product}" exceeds maximum ($99,999)` }, { status: 400 });
      }
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

    // ── 1b. Create Supabase auth account (non-fatal) ──
    // Two-step: createUser first (reliable), then generateLink for magic login URL.
    // generateLink alone has a known Supabase bug where it occasionally fails to
    // create the user — createUser first avoids this. See: supabase/supabase#22521
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    let accountInfo: AccountInfo | null = null;
    try {
      const customerEmail = contact.email.toLowerCase().trim();
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: { name: contact.name.trim() },
      });

      if (!createErr) {
        // Brand new auth account — generate a magic link so they log in with one click
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: customerEmail,
          options: { redirectTo: `${siteUrl}/account/callback` },
        });
        accountInfo = {
          isNewAccount: true,
          accountLink: linkData?.properties?.action_link ?? `${siteUrl}/account`,
        };
        console.log(`[manual-order] new auth account created → ${customerEmail}`);
      } else if (
        createErr.message?.toLowerCase().includes("already") ||
        createErr.message?.toLowerCase().includes("registered") ||
        (createErr as { code?: string }).code === "email_exists"
      ) {
        // Returning customer — link to account page (they have their password)
        accountInfo = { isNewAccount: false, accountLink: `${siteUrl}/account` };
      }
    } catch (authErr) {
      console.error("[manual-order] auth account (non-fatal):", authErr instanceof Error ? authErr.message : authErr);
    }

    // ── 2. Calculate totals ──
    const subtotal = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const gst = Math.round(subtotal * GST_RATE * 100) / 100;
    const pst = Math.round(subtotal * PST_RATE * 100) / 100;
    const total = Math.round((subtotal + gst + pst) * 100) / 100;

    // Build combined description for payment links and emails
    const combinedDescription = items.length === 1
      ? formatItemLabel(items[0])
      : items.map((it, i) => `${i + 1}. ${formatItemLabel(it)}`).join("; ");

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
          pst,
          total,
          payment_method: payment_method === "wave" ? "wave" : "clover_card",
          notes: notes?.trim() || null,
          staff_notes: `Manual order — ${items.length} item(s) created by staff via payment request`,
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
    }

    if (!order) {
      return NextResponse.json({ error: "Failed to create order after retries" }, { status: 500 });
    }

    // ── 4. Insert order_items rows (one per item) ──
    for (const item of items) {
      void supabase.from("order_items").insert({
        order_id: order.id,
        category: "MANUAL",
        product_name: formatItemLabel(item),
        qty: item.qty || 1,
        sides: 1,
        addons: [],
        is_rush: false,
        design_status: "PRINT_READY",
        unit_price: Math.round(item.amount * 100) / 100,
        line_total: Math.round(item.amount * 100) / 100,
      });
    }

    // ── 5. Generate payment URL ──
    const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
    let paymentUrl: string | null = null;

    if (payment_method === "clover") {
      try {
        const token = encodePaymentToken(total, combinedDescription, contact.email.toLowerCase().trim(), redirectUrl);
        paymentUrl = `${siteUrl}/pay/${token}`;

        void supabase
          .from("orders")
          .update({ payment_reference: paymentUrl } as Record<string, unknown>)
          .eq("id", order.id);
      } catch (tokenErr) {
        console.error("[manual-order] payment token encode:", tokenErr);
        return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
      }
    } else {
      // Wave: create invoice → approve → send
      try {
        const waveCustomerId = await createOrFindWaveCustomer(
          contact.email.toLowerCase().trim(),
          contact.name.trim()
        );

        const waveLineItems = items.map((item) => ({
          description: formatItemLabel(item),
          unitPrice: Math.round(item.amount * 100) / 100,
          qty: 1,
          applyGst: true,
          applyPst: true,
        }));

        const inv = await createWaveInvoice(
          waveCustomerId,
          waveLineItems,
          { orderNumber: order.order_number }
        );

        void supabase
          .from("orders")
          .update({ wave_invoice_id: inv.invoiceId } as Record<string, unknown>)
          .eq("id", order.id);

        await approveWaveInvoice(inv.invoiceId);

        await sendWaveInvoice(inv.invoiceId, contact.email.toLowerCase().trim(), {
          subject: `Invoice from True Color Display Printing — ${order.order_number}`,
          message: `Hi ${contact.name.trim()},\n\nPlease find your invoice attached. Click "Pay Invoice" to pay online.\n\nRef: ${order.order_number}\n\nThank you,\nTrue Color Display Printing\n(306) 954-8688`,
        });

        console.log(`[manual-order] Wave invoice sent → ${contact.email} | order ${order.order_number}`);

        // Send account welcome email (Wave doesn't include account info)
        if (accountInfo) {
          try {
            await sendAccountWelcomeEmail({
              customerName: contact.name.trim(),
              customerEmail: contact.email.toLowerCase().trim(),
              orderNumber: order.order_number,
              isNewAccount: accountInfo.isNewAccount,
              accountLink: accountInfo.accountLink,
            });
          } catch (acctErr) {
            console.error("[manual-order] account welcome email (non-fatal):", acctErr);
          }
        }

        // Staff notification (skip customer payment email — Wave already sent it)
        try {
          await sendStaffOrderNotification({
            orderNumber: order.order_number,
            contact: {
              name: contact.name.trim(),
              email: contact.email.toLowerCase().trim(),
              company: contact.company?.trim(),
              phone: contact.phone?.trim(),
            },
            items: items.map((item) => ({
              product_name: formatItemLabel(item),
              qty: item.qty || 1,
              width_in: null,
              height_in: null,
              sides: 1,
              design_status: "PRINT_READY" as const,
              line_total: Math.round(item.amount * 100) / 100,
            })),
            subtotal,
            gst,
            pst,
            total,
            is_rush: false,
            payment_method: "wave",
            notes: `[Manual Order — Wave] ${notes?.trim() ?? "Created via staff payment request"}`,
            filePaths: [],
            siteUrl,
          });
        } catch (staffEmailErr) {
          console.error("[manual-order] staff notification failed (non-fatal):", staffEmailErr);
        }

        // Sync customer to Brevo (non-fatal)
        try {
          const nameParts = contact.name.trim().split(/\s+/);
          await syncCustomerToBrevo({
            email: contact.email.toLowerCase().trim(),
            firstName: nameParts[0] || contact.name.trim(),
            lastName: nameParts.slice(1).join(" ") || undefined,
            company: contact.company?.trim() || undefined,
            phone: contact.phone?.trim() || undefined,
            orderNumber: order.order_number,
            orderTotal: total,
            productSummary: items.map((i) => i.product).join(", "),
            source: "manual_order",
            accountStatus: accountInfo?.isNewAccount ? "created" : accountInfo ? "active" : "none",
          });
        } catch (brevoErr) {
          console.error("[manual-order] Brevo sync failed (non-fatal):", brevoErr);
        }

        return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, paymentUrl: null });
      } catch (waveErr) {
        console.error("[manual-order] Wave invoice error:", waveErr);
        return NextResponse.json({ error: "Failed to create Wave invoice. Please try Clover instead." }, { status: 500 });
      }
    }

    // ── 6. Send payment request email to customer (Clover path only) ──
    try {
      await sendPaymentRequestEmail({
        orderNumber: order.order_number,
        contact: {
          name: contact.name.trim(),
          email: contact.email.toLowerCase().trim(),
          company: contact.company?.trim() || null,
        },
        items: items.map((item) => ({
          product: item.product,
          qty: item.qty || 1,
          details: item.details,
          amount: Math.round(item.amount * 100) / 100,
        })),
        subtotal,
        gst,
        pst,
        total,
        paymentUrl: paymentUrl!,
        paymentMethod: payment_method,
        notes: notes?.trim() || null,
        accountInfo,
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
        items: items.map((item) => ({
          product_name: formatItemLabel(item),
          qty: item.qty || 1,
          width_in: null,
          height_in: null,
          sides: 1,
          design_status: "PRINT_READY" as const,
          line_total: Math.round(item.amount * 100) / 100,
        })),
        subtotal,
        gst,
        pst,
        total,
        is_rush: false,
        payment_method: "clover_pending",
        notes: `[Manual Order] ${notes?.trim() ?? "Created via staff payment request"}`,
        filePaths: [],
        siteUrl,
      });
    } catch (staffEmailErr) {
      console.error("[manual-order] staff notification failed (non-fatal):", staffEmailErr);
    }

    // Sync customer to Brevo (non-fatal)
    try {
      const nameParts = contact.name.trim().split(/\s+/);
      await syncCustomerToBrevo({
        email: contact.email.toLowerCase().trim(),
        firstName: nameParts[0] || contact.name.trim(),
        lastName: nameParts.slice(1).join(" ") || undefined,
        company: contact.company?.trim() || undefined,
        phone: contact.phone?.trim() || undefined,
        orderNumber: order.order_number,
        orderTotal: total,
        productSummary: items.map((i) => i.product).join(", "),
        source: "manual_order",
        accountStatus: accountInfo?.isNewAccount ? "created" : accountInfo ? "active" : "none",
      });
    } catch (brevoErr) {
      console.error("[manual-order] Brevo sync failed (non-fatal):", brevoErr);
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, paymentUrl });
  } catch (err) {
    console.error("[manual-order]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/** Build a human-readable label for an order item */
function formatItemLabel(item: OrderItemInput): string {
  const qty = item.qty > 1 ? `${item.qty}x ` : "";
  const details = item.details?.trim() ? ` — ${item.details.trim()}` : "";
  return `${qty}${item.product}${details}`;
}
