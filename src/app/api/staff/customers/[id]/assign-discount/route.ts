/**
 * POST /api/staff/customers/[id]/assign-discount
 *
 * Staff-only. Assigns a discount code to a customer's account and:
 *   - If the customer has a pending_payment order: recalculates taxes, updates the
 *     order totals, generates a fresh payment link, and sends an updated payment email.
 *   - If no pending order: sends a "discount is on your account" notification email.
 *
 * Body: { code: string }
 * Returns: { ok: true, action: "invoice_updated" | "code_assigned_no_order", orderCount?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendPaymentRequestEmail } from "@/lib/email/paymentRequest";
import { sendEmail } from "@/lib/email/smtp";
import { sanitizeError } from "@/lib/errors/sanitize";
import { voidWaveInvoice, createOrFindWaveCustomer, createWaveInvoice, approveWaveInvoice, type WaveLineItem } from "@/lib/wave/invoice";

const GST_RATE = 0.05;
const PST_RATE = 0.06;
const RUSH_FEE = 40;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id: customerId } = await params;
    const body = (await req.json()) as { code?: string };
    const rawCode = body.code?.trim();
    if (!rawCode) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    const code = rawCode.toUpperCase();

    const supabase = createServiceClient();

    // 1. Load customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, name, email, company")
      .eq("id", customerId)
      .maybeSingle();
    if (custErr || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 2. Validate code — exists, active, not expired
    const { data: dc, error: dcErr } = await supabase
      .from("discount_codes")
      .select("id, code, discount_amount, is_active, per_account_limit, max_uses, expires_at")
      .ilike("code", code)
      .maybeSingle();

    if (dcErr || !dc) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }
    if (!dc.is_active) {
      return NextResponse.json({ error: "Code is not active" }, { status: 400 });
    }
    if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code has expired" }, { status: 400 });
    }

    // 3. per_account_limit check
    const { count: usedByCustomer } = await supabase
      .from("discount_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("code_id", dc.id)
      .eq("customer_id", customer.id);
    if ((usedByCustomer ?? 0) >= dc.per_account_limit) {
      return NextResponse.json(
        { error: "This customer has already used this code" },
        { status: 400 }
      );
    }

    // 4. Global max_uses check
    if (dc.max_uses !== null) {
      const { count: totalUsed } = await supabase
        .from("discount_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("code_id", dc.id);
      if ((totalUsed ?? 0) >= dc.max_uses) {
        return NextResponse.json(
          { error: "Code has reached its global usage limit" },
          { status: 400 }
        );
      }
    }

    const discountAmount = Number(dc.discount_amount);

    // 5. Set pending_discount_code on customer
    const { error: pendErr } = await supabase
      .from("customers")
      .update({ pending_discount_code: dc.code } as Record<string, unknown>)
      .eq("id", customer.id);
    if (pendErr) {
      console.error("[assign-discount] failed to set pending_discount_code:", pendErr);
      return NextResponse.json({ error: "Failed to attach code to account" }, { status: 500 });
    }

    // 6. Find all pending_payment orders for this customer
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, is_rush, subtotal, gst, pst, total,
        payment_method, wave_invoice_id, notes,
        order_items ( product_name, qty, line_total )
      `)
      .eq("customer_id", customer.id)
      .eq("status", "pending_payment")
      .order("created_at", { ascending: false });

    // 7a. No pending orders — send notification email and return
    if (!orders?.length) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
      await sendEmail({
        to: customer.email,
        subject: `Your $${discountAmount.toFixed(2)} discount is ready — True Color Printing`,
        html: buildNotificationHtml(customer.name, dc.code, discountAmount, siteUrl),
        text: buildNotificationText(customer.name, dc.code, discountAmount, siteUrl),
        replyTo: "info@true-color.ca",
      });
      console.log(
        `[assign-discount] no pending order — notification sent to ${customer.email} | code ${dc.code}`
      );
      return NextResponse.json({ ok: true, action: "code_assigned_no_order" });
    }

    for (const order of orders) {
    // 8. Tax recalculation
    const rush = order.is_rush ? RUSH_FEE : 0;
    const originalSubtotal = Number(order.subtotal);
    const newDiscountedSubtotal = Math.max(0, originalSubtotal - discountAmount);
    const newGst = Math.round((newDiscountedSubtotal + rush) * GST_RATE * 100) / 100;
    const newPst = Math.round(newDiscountedSubtotal * PST_RATE * 100) / 100;
    const newTotal = Math.round((newDiscountedSubtotal + rush + newGst + newPst) * 100) / 100;

    // 9. Update order row
    const { error: upErr } = await supabase
      .from("orders")
      .update({
        subtotal: newDiscountedSubtotal,
        gst: newGst,
        pst: newPst,
        total: newTotal,
        discount_code: dc.code,
        discount_amount: discountAmount,
      })
      .eq("id", order.id);
    if (upErr) {
      console.error("[assign-discount] order update failed:", upErr);
      return NextResponse.json({ error: "Failed to update order totals" }, { status: 500 });
    }

    // 9b. Wave invoice present — void old, create new at discounted amounts (non-fatal, fire-and-forget)
    if (order.wave_invoice_id) {
      const capturedWaveInvoiceId = order.wave_invoice_id;
      void (async () => {
        try {
          await voidWaveInvoice(capturedWaveInvoiceId).catch((e: unknown) => {
            console.warn(`[assign-discount] Wave invoiceVoid failed (continuing): ${e instanceof Error ? e.message : e}`);
          });
          const waveCustomerId = await createOrFindWaveCustomer(
            customer.email,
            (customer.name as string | null) ?? customer.email
          );
          const waveItems: WaveLineItem[] = [
            {
              description: `True Color Order ${order.order_number} (${dc.code} discount applied)`,
              unitPrice: newDiscountedSubtotal,
              qty: 1,
              applyGst: true,
              applyPst: true,
            },
          ];
          const inv = await createWaveInvoice(waveCustomerId, waveItems, {
            isRush: order.is_rush,
            orderNumber: order.order_number,
          });
          await approveWaveInvoice(inv.invoiceId);
          void supabase
            .from("orders")
            .update({ wave_invoice_id: inv.invoiceId } as Record<string, unknown>)
            .eq("id", order.id);
          console.log(
            `[assign-discount] Wave invoice replaced: ${capturedWaveInvoiceId} → ${inv.invoiceId} | order ${order.order_number}`
          );
        } catch (waveErr) {
          console.error("[assign-discount] Wave invoice replacement failed (non-fatal):", waveErr instanceof Error ? waveErr.message : waveErr);
        }
      })();
    }

    // 10. Fresh payment token
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
    const items = (Array.isArray(order.order_items) ? order.order_items : [order.order_items])
      .filter(Boolean) as Array<{ product_name: string; qty: number; line_total: number }>;
    const description =
      items.length === 1
        ? `${items[0].product_name}${items[0].qty > 1 ? ` x ${items[0].qty}` : ""}`
        : items.length > 1
          ? `${items[0].product_name} + ${items.length - 1} more (Order ${order.order_number})`
          : `True Color Order ${order.order_number}`;

    const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
    const payToken = encodePaymentToken(newTotal, description, customer.email, redirectUrl);
    const paymentUrl = `${siteUrl}/pay/${payToken}`;

    // NOTE: do NOT update payment_reference — it is set to the order UUID by /pay/[token]
    // when the customer clicks, and the Clover webhook matches on it.
    // Overwriting it with the URL breaks webhook matching.

    // 11. Send updated payment email
    // Pass originalSubtotal so customer sees pre-discount subtotal, then discount row, then new total
    await sendPaymentRequestEmail({
      orderNumber: order.order_number,
      contact: {
        name: customer.name as string,
        email: customer.email,
        company: customer.company as string | null,
      },
      items:
        items.length > 0
          ? items.map((it) => ({
              product: it.product_name,
              qty: it.qty || 1,
              amount: Number(it.line_total),
            }))
          : [{ product: description, qty: 1, amount: originalSubtotal }],
      subtotal: originalSubtotal,
      gst: newGst,
      pst: newPst,
      total: newTotal,
      paymentUrl,
      paymentMethod: "clover",
      notes: order.notes as string | null,
      discount_code: dc.code,
      discount_amount: discountAmount,
    });

    console.log(
      `[assign-discount] order ${order.order_number} updated | code=${dc.code} | discount=$${discountAmount} | newTotal=$${newTotal} | email → ${customer.email}`
    );
    } // end for (const order of orders)

    return NextResponse.json({
      ok: true,
      action: "invoice_updated",
      orderCount: orders.length,
    });
  } catch (err) {
    console.error("[assign-discount]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// ─── DELETE: clear pending discount ──────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id: customerId } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("customers")
      .update({ pending_discount_code: null } as Record<string, unknown>)
      .eq("id", customerId);

    if (error) {
      return NextResponse.json({ error: "Failed to clear discount" }, { status: 500 });
    }

    console.log(`[clear-discount] pending_discount_code cleared for customer ${customerId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// ─── Notification email helpers (no pending order) ────────────────────────────

function buildNotificationHtml(
  name: string | null,
  code: string,
  amount: number,
  siteUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#1c1712;border-radius:12px 12px 0 0;padding:18px 28px;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px 32px 36px;border-radius:0 0 12px 12px;border-top:3px solid #16C2F3;">
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1c1712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${greeting}</p>
            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              We've applied a <strong style="color:#059669;">$${amount.toFixed(2)} discount</strong> to your account.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:0 0 20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your Discount Code</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#15803d;letter-spacing:0.12em;font-family:monospace;">${code}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#166534;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Saves you $${amount.toFixed(2)} — applied automatically when you log in and check out</p>
            </div>
            <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Simply log into your account and your discount will be applied automatically at checkout — no code entry needed.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${siteUrl}/checkout" style="display:inline-block;background:#16C2F3;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Shop &amp; Pay Now &rarr;
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;"/>
            <p style="margin:0;font-size:12px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing · 216 33rd St W, Saskatoon, SK ·
              <a href="tel:3069548688" style="color:#16C2F3;text-decoration:none;">(306) 954-8688</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNotificationText(
  name: string | null,
  code: string,
  amount: number,
  siteUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return [
    greeting,
    "",
    `We've applied a $${amount.toFixed(2)} discount to your account.`,
    "",
    `Your discount code: ${code}`,
    `Saves you: $${amount.toFixed(2)} CAD`,
    "",
    `Log into your account and your discount will be applied automatically at checkout — no code entry needed.`,
    "",
    `Shop now: ${siteUrl}/checkout`,
    "",
    "---",
    "True Color Display Printing",
    "216 33rd St W, Saskatoon, SK",
    "(306) 954-8688",
    "info@true-color.ca",
  ].join("\n");
}
