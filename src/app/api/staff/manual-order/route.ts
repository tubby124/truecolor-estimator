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
  kind?: "product" | "fee";  // default "product" — fee lines skip the spec block
  title?: string;            // optional invoice line headline (overrides display name)
  product: string;           // product category OR fee name (e.g. "Installation Fee")
  // ── Albert-format spec block (kind="product" only — all optional) ──
  material?: string;         // "4mm Coroplast"
  sides?: string;            // "One side full colour printing"
  size?: string;             // "24 x 36 in"
  process?: string;          // "Gloss lamination / die cut"
  // ── Common ──
  qty: number;
  details?: string;          // free-text notes (extras the chips don't cover)
  unitPrice?: number;        // for staff reference; amount is authoritative
  amount: number;            // line total in CAD
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
      quote_only?: boolean; // true = don't send payment link / Wave invoice stays as draft
      notes?: string;
    };

    const { contact, payment_method, notes } = body;
    const quoteOnly = body.quote_only === true;

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
    // PST exempts kind="fee" items (design, rush, installation) per CLAUDE.md / truecolor-pricing-safety.md.
    // GST applies to everything (CRA: services like design ARE GST-taxable in Canada).
    const subtotal = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100;
    const pstableSubtotal = Math.round(
      items.filter((it) => it.kind !== "fee").reduce((s, it) => s + it.amount, 0) * 100
    ) / 100;
    const gst = Math.round(subtotal * GST_RATE * 100) / 100;
    const pst = Math.round(pstableSubtotal * PST_RATE * 100) / 100;
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
          staff_notes: quoteOnly
            ? `[QUOTE ONLY] Manual quote — ${items.length} item(s) — no payment link sent. Convert to invoice when customer approves.`
            : `Manual order — ${items.length} item(s) created by staff via payment request`,
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

    // Increment customer lifetime stats (non-fatal)
    void (async () => {
      try {
        const { data: c } = await supabase
          .from("customers")
          .select("order_count, total_spent")
          .eq("id", customer.id)
          .single();
        if (c) {
          await supabase
            .from("customers")
            .update({
              order_count: (c.order_count ?? 0) + 1,
              total_spent: Math.round(((c.total_spent ?? 0) + total) * 100) / 100,
            })
            .eq("id", customer.id);
        }
      } catch {
        console.error("[manual-order] customer stats increment failed (non-fatal)");
      }
    })();

    // ── 4. Insert order_items rows (one per item) ──
    for (const item of items) {
      const { error: itemErr } = await supabase.from("order_items").insert({
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
      if (itemErr) {
        console.error(`[manual-order] order_items insert failed for order ${order.id}:`, itemErr.message);
      }
    }

    // ── 5. Generate payment URL ──
    const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
    let paymentUrl: string | null = null;

    if (payment_method === "clover") {
      if (!quoteOnly) {
        try {
          const token = encodePaymentToken(total, combinedDescription, contact.email.toLowerCase().trim(), redirectUrl);
          paymentUrl = `${siteUrl}/pay/${token}`;

          // NOTE: do NOT set payment_reference to the URL — the Clover webhook matches on it
          // using the order UUID. /pay/[token] sets it correctly when the customer clicks.
        } catch (tokenErr) {
          console.error("[manual-order] payment token encode:", tokenErr);
          return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
        }
      }
      // quoteOnly Clover: paymentUrl stays null — customer email shows quote-mode CTA.
    } else {
      // Wave: create invoice → approve → send
      try {
        const waveCustomerId = await createOrFindWaveCustomer(
          contact.email.toLowerCase().trim(),
          contact.name.trim()
        );

        // Wave invoice description renders Albert's full spec block (multi-line).
        // Wave PDFs preserve newlines in line-item descriptions — same format
        // customers have been getting from Albert directly for years.
        const waveLineItems = items.map((item) => ({
          description: formatItemAlbertBlock(item),
          unitPrice: Math.round(item.amount * 100) / 100,
          qty: 1,
          applyGst: true,
          applyPst: item.kind !== "fee", // PST exempt for design/rush/installation fees
        }));

        const inv = await createWaveInvoice(
          waveCustomerId,
          waveLineItems,
          { orderNumber: order.order_number }
        );

        // CRITICAL: must `await` — `void supabase.update().eq()` does NOT fire the HTTP
        // request (PostgrestFilterBuilder only executes on await/.then()). Bug found
        // 2026-05-15 caused 30+ days of Wave orders to have NULL wave_invoice_id
        // even though the Wave invoice was created successfully.
        {
          const { error: updErr } = await supabase
            .from("orders")
            .update({ wave_invoice_id: inv.invoiceId } as Record<string, unknown>)
            .eq("id", order.id);
          if (updErr) console.error("[manual-order] wave_invoice_id save failed (non-fatal):", updErr.message);
        }

        if (!quoteOnly) {
          // Standard flow: approve + send via Wave (Wave emails the customer the invoice + payment link).
          await approveWaveInvoice(inv.invoiceId);
          await sendWaveInvoice(inv.invoiceId, contact.email.toLowerCase().trim(), {
            subject: `Invoice from True Color Display Printing — ${order.order_number}`,
            message: `Hi ${contact.name.trim()},\n\nPlease find your invoice attached. Click "Pay Invoice" to pay online.\n\nRef: ${order.order_number}\n\nThank you,\nTrue Color Display Printing\n(306) 954-8688`,
          });
          console.log(`[manual-order] Wave invoice sent → ${contact.email} | order ${order.order_number}`);
        } else {
          // Quote-only: leave Wave invoice as draft and send our own quote-style email to the customer.
          console.log(`[manual-order] Wave draft created (quote-only) → ${contact.email} | order ${order.order_number} | wave_invoice_id ${inv.invoiceId}`);
          try {
            await sendPaymentRequestEmail({
              orderNumber: order.order_number,
              contact: {
                name: contact.name.trim(),
                email: contact.email.toLowerCase().trim(),
                company: contact.company?.trim() || null,
              },
              items: items.map((item) => ({
                kind: item.kind ?? "product",
                product: item.title?.trim() || item.product,
                qty: item.qty || 1,
                material: item.material,
                sides: item.sides,
                size: item.size,
                process: item.process,
                details: item.details,
                unitPrice: item.unitPrice,
                amount: Math.round(item.amount * 100) / 100,
                albertBlock: formatItemAlbertBlock(item),
              })),
              subtotal,
              gst,
              pst,
              total,
              paymentUrl: "",  // unused in quote mode
              paymentMethod: "wave",
              quoteOnly: true,
              notes: notes?.trim() || null,
              accountInfo,
            });
          } catch (emailErr) {
            console.error("[manual-order] quote email failed (non-fatal):", emailErr);
          }
        }

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
            notes: quoteOnly
              ? `[QUOTE ONLY — Wave draft] ${notes?.trim() ?? "Quote sent — convert to invoice when customer approves"}`
              : `[Manual Order — Wave] ${notes?.trim() ?? "Created via staff payment request"}`,
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

    // ── 6. Send payment request email to customer (Clover path) ──
    // In quote-only mode, paymentUrl is empty and the email renders a "Reply to approve" CTA
    // instead of the Pay Now button.
    try {
      await sendPaymentRequestEmail({
        orderNumber: order.order_number,
        contact: {
          name: contact.name.trim(),
          email: contact.email.toLowerCase().trim(),
          company: contact.company?.trim() || null,
        },
        items: items.map((item) => ({
          kind: item.kind ?? "product",
          product: item.title?.trim() || item.product,
          qty: item.qty || 1,
          material: item.material,
          sides: item.sides,
          size: item.size,
          process: item.process,
          details: item.details,
          unitPrice: item.unitPrice,
          amount: Math.round(item.amount * 100) / 100,
          albertBlock: formatItemAlbertBlock(item),
        })),
        subtotal,
        gst,
        pst,
        total,
        paymentUrl: paymentUrl ?? "",
        paymentMethod: payment_method,
        quoteOnly,
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
        notes: quoteOnly
          ? `[QUOTE ONLY — Clover] ${notes?.trim() ?? "Quote sent — no payment link until customer approves"}`
          : `[Manual Order] ${notes?.trim() ?? "Created via staff payment request"}`,
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

/** Build a single-line human-readable label for an order item.
 *  Used for order_items.product_name (DB column), Wave invoice fallback, etc.
 *  When structured spec fields are present they're flattened onto one line. */
function formatItemLabel(item: OrderItemInput): string {
  // Short label only. Qty/dimensions/sides have their own columns and render
  // separately in receipts and the staff dashboard. Full spec text lives in the
  // Wave invoice via formatItemAlbertBlock — don't duplicate it here.
  const titled = item.title?.trim();
  const product = item.product?.trim() || "Other";
  if (titled && product !== "Other" && titled.toLowerCase() !== product.toLowerCase()) {
    return `${titled} (${product})`;
  }
  return titled || product;
}

/** Render an item as Albert's plain-text quote block.
 *  This is what staff customers see in the email body and Wave invoice description.
 *
 *  Example output:
 *    Material : 4mm Coroplast
 *    Colour : One side full colour printing
 *    Size : 24" x 36"
 *    Process : Gloss lamination
 *    Quantity : 1
 *    Unit Price : $ 45.00 for each
 *    Total amount : $ 45.00 plus tax
 *
 *  Falls back to a 1-line label for fee items or items missing spec fields. */
export function formatItemAlbertBlock(item: OrderItemInput): string {
  if (item.kind === "fee") {
    // Fee line: simple Name + Amount line. Albert phrases these as separate lines.
    const note = item.details?.trim() ? ` (${item.details.trim()})` : "";
    return `${item.product}${note} : $ ${item.amount.toFixed(2)} plus tax`;
  }

  const lines: string[] = [];
  if (item.title?.trim()) lines.push(item.title.trim());
  if (item.material?.trim()) lines.push(`Material : ${item.material.trim()}`);
  if (item.sides?.trim()) lines.push(`Colour : ${item.sides.trim()}`);
  if (item.size?.trim()) lines.push(`Size : ${item.size.trim()}`);
  if (item.process?.trim()) lines.push(`Process : ${item.process.trim()}`);
  if (item.qty > 0) lines.push(`Quantity : ${item.qty}`);
  if (item.unitPrice && item.unitPrice > 0 && item.qty > 1) {
    lines.push(`Unit Price : $ ${item.unitPrice.toFixed(2)} for each`);
  }
  lines.push(`Total amount : $ ${item.amount.toFixed(2)} plus tax`);

  // If no spec fields were filled, fall back to the freeform details + product name
  // so we still show something useful (don't render "Quantity : 1 / Total amount" alone).
  const hasSpec = item.material || item.sides || item.size || item.process;
  if (!hasSpec && !item.title?.trim()) {
    const labelLine = item.product || "Custom item";
    const detailsLine = item.details?.trim() ? `Details : ${item.details.trim()}` : "";
    return [labelLine, detailsLine, ...lines].filter(Boolean).join("\n");
  }
  if (!hasSpec && item.details?.trim()) {
    lines.splice(lines.findIndex((l) => l.startsWith("Quantity")), 0, `Details : ${item.details.trim()}`);
  } else if (item.details?.trim()) {
    lines.splice(lines.findIndex((l) => l.startsWith("Quantity")), 0, `Notes : ${item.details.trim()}`);
  }
  return lines.join("\n");
}
