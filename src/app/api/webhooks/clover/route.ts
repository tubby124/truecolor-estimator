/**
 * POST /api/webhooks/clover
 *
 * Receives Clover payment events and automatically confirms order status
 * when a payment is captured. This is more reliable than depending solely
 * on the redirect URL — if a customer pays and closes the Clover tab before
 * being redirected, the webhook still fires and the order gets confirmed.
 *
 * Setup: Register this URL in Clover Dashboard → Developer → App Market → Webhooks
 * URL: https://[your-domain]/api/webhooks/clover
 * Events to subscribe: PAYMENT
 *
 * Auth: HMAC-SHA256 signature on request body using PAYMENT_TOKEN_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // Verify request via CLOVER_WEBHOOK_SECRET query param.
  // Register the webhook in Clover Dashboard with URL:
  //   https://truecolorprinting.ca/api/webhooks/clover?k=<CLOVER_WEBHOOK_SECRET>
  // Clover does NOT sign hosted checkout webhook bodies — HMAC approach is not applicable.
  const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = req.nextUrl.searchParams.get("k") ?? "";
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(webhookSecret);
    const valid =
      providedBuf.length === expectedBuf.length &&
      timingSafeEqual(providedBuf, expectedBuf);
    if (!valid) {
      console.warn("[clover-webhook] Invalid webhook secret — possible spoofing attempt");
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  } else {
    console.warn("[clover-webhook] CLOVER_WEBHOOK_SECRET not set — accepting without auth (set env var in Railway)");
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[clover-webhook] received event type:", event.type);

  // Handle payment capture events
  // Clover sends type=PAYMENT with object.status=captured when card is charged
  if (event.type === "PAYMENT") {
    const obj = event.object as Record<string, unknown> | undefined;
    if (obj?.status === "captured" || obj?.status === "paid") {
      // Primary: externalReferenceId = our Supabase order UUID (set in createCloverCheckout)
      // Fallback: cloverOrderId = Clover's internal order ID (for backward compat)
      const extRef = (obj.externalReferenceId ?? obj.external_reference_id) as string | undefined;
      const cloverOrderId = (obj.orderId ?? obj.order_id) as string | undefined;
      const matchRef = extRef ?? cloverOrderId;

      console.log(`[clover-webhook] matching by ${extRef ? "externalReferenceId" : "cloverOrderId"}: ${matchRef}`);

      if (matchRef) {
        try {
          const supabase = createServiceClient();
          const { data: updatedOrders, error } = await supabase
            .from("orders")
            .update({
              status: "payment_received",
              paid_at: new Date().toISOString(),
            })
            .eq("payment_reference", matchRef)
            .eq("status", "pending_payment")
            .select("id, order_number, customer_id, total, is_rush, wave_invoice_id");

          if (error) {
            console.error("[clover-webhook] order update failed:", error.message);
          } else {
            const count = updatedOrders?.length ?? 0;
            console.log(
              `[clover-webhook] order confirmed via webhook | Clover order: ${cloverOrderId} | rows updated: ${count}`
            );

            // Send "payment confirmed" email + mark Wave invoice paid (both non-fatal)
            if (updatedOrders && updatedOrders.length > 0) {
              const order = updatedOrders[0];

              try {
                const { data: customer } = await supabase
                  .from("customers")
                  .select("email, name")
                  .eq("id", order.customer_id)
                  .single();
                if (customer) {
                  await sendOrderStatusEmail({
                    status: "payment_received",
                    orderNumber: order.order_number,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    total: order.total,
                    isRush: order.is_rush,
                    paymentMethod: "clover_card",
                  });
                  console.log(`[clover-webhook] payment confirmed email sent → ${customer.email}`);

                  // Itemized receipt (non-fatal)
                  try {
                    const { data: fullOrder } = await supabase
                      .from("orders")
                      .select(`subtotal, gst, pst, total, is_rush, discount_code, discount_amount, created_at, order_items ( product_name, qty, width_in, height_in, sides, line_total )`)
                      .eq("id", order.id)
                      .single();
                    if (fullOrder) {
                      const receiptItems = Array.isArray(fullOrder.order_items) ? fullOrder.order_items : [];
                      await sendPaymentReceipt({
                        orderNumber: order.order_number,
                        customerName: customer.name,
                        customerEmail: customer.email,
                        createdAt: fullOrder.created_at,
                        items: receiptItems.map((i) => ({
                          product_name: i.product_name,
                          qty: i.qty,
                          width_in: i.width_in,
                          height_in: i.height_in,
                          sides: i.sides,
                          line_total: Number(i.line_total),
                        })),
                        subtotal: Number(fullOrder.subtotal),
                        gst: Number(fullOrder.gst),
                        pst: Number(fullOrder.pst ?? 0),
                        total: Number(fullOrder.total),
                        isRush: Boolean(fullOrder.is_rush),
                        discountCode: fullOrder.discount_code ?? null,
                        discountAmount: fullOrder.discount_amount ? Number(fullOrder.discount_amount) : null,
                        paymentMethod: "clover_card",
                      });
                      console.log(`[clover-webhook] receipt sent → ${customer.email}`);
                    }
                  } catch (receiptErr) {
                    console.error("[clover-webhook] receipt failed (non-fatal):", receiptErr);
                  }
                }

                if (customer?.email) {
                  try {
                    await fetch("https://api.brevo.com/v3/contacts", {
                      method: "POST",
                      headers: {
                        "api-key": process.env.BREVO_API_KEY!,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: customer.email,
                        attributes: { LAST_PAYMENT_DATE: new Date().toISOString().slice(0, 10) },
                        updateEnabled: true,
                      }),
                    });
                  } catch (brevoErr) {
                    console.error("[clover-webhook] Brevo LAST_PAYMENT_DATE update failed (non-fatal):", brevoErr);
                  }
                }
              } catch (emailErr) {
                console.error("[clover-webhook] payment confirmed email failed (non-fatal):", emailErr);
              }

              // Mark Wave invoice as PAID (non-fatal)
              const waveInvoiceId = order.wave_invoice_id ?? null;
              const orderTotal = Number(order.total ?? 0);
              if (waveInvoiceId && orderTotal > 0) {
                try {
                  await approveWaveInvoice(waveInvoiceId);

                  // Look up customer email for Wave customer ID (auto-reconciliation)
                  const { data: orderCustomer } = await supabase
                    .from("customers")
                    .select("email")
                    .eq("id", order.customer_id)
                    .single();
                  const waveCustomerId = orderCustomer?.email
                    ? await findCustomerByEmail(orderCustomer.email).catch(() => null)
                    : null;

                  await recordWavePayment(
                    waveInvoiceId,
                    orderTotal,
                    "CREDIT_CARD",
                    `Clover card — Order ${order.order_number}`,
                    waveCustomerId ?? undefined,
                    order.id,  // Supabase order UUID as externalId — idempotency key
                  );

                  // Write Wave sync timestamps back to the order row
                  const now = new Date().toISOString();
                  void supabase.from("orders")
                    .update({ wave_invoice_approved_at: now, wave_payment_recorded_at: now })
                    .eq("id", order.id);

                  console.log(`[clover-webhook] Wave invoice marked paid → ${waveInvoiceId}`);
                } catch (waveErr) {
                  console.error("[clover-webhook] Wave payment recording failed (non-fatal):", waveErr);
                }
              }
            }
          }
        } catch (err) {
          console.error("[clover-webhook] unexpected error:", err);
        }
      }
    }
  }

  // Always return 200 — Clover retries on non-200
  return NextResponse.json({ ok: true });
}
