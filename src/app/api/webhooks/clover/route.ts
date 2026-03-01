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
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // Verify HMAC signature from Clover — always required (fail-closed)
  const tokenSecret = process.env.PAYMENT_TOKEN_SECRET;
  if (!tokenSecret) {
    console.error("[clover-webhook] PAYMENT_TOKEN_SECRET not configured — rejecting all webhook calls");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 401 });
  }

  const signature = req.headers.get("x-clover-signature") ?? "";
  const expected = createHmac("sha256", tokenSecret)
    .update(bodyText)
    .digest("base64");

  // Use constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    !signature ||
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    console.warn("[clover-webhook] Invalid or missing signature — possible spoofing attempt");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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
      const cloverOrderId = (obj.orderId ?? obj.order_id) as string | undefined;
      if (cloverOrderId) {
        try {
          const supabase = createServiceClient();
          const { data: updatedOrders, error } = await supabase
            .from("orders")
            .update({
              status: "payment_received",
              paid_at: new Date().toISOString(),
            })
            .eq("payment_reference", cloverOrderId)
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
