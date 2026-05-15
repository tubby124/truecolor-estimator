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
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail } from "@/lib/wave/invoice";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { broadcastStaffNotification } from "@/lib/notifications/broadcast";
import { sendMeasurementProtocolEvent, deriveClientIdFromCustomer } from "@/lib/analytics/measurementProtocol";
import { sendMetaCapiEvent } from "@/lib/analytics/metaPixel";

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
              // Side-channel notifications — fire-and-forget.
              // updatedOrders only contains rows that transitioned from pending_payment to payment_received,
              // so webhook retries on already-paid orders won't fire these.
              for (const updated of updatedOrders ?? []) {
                const totalNum = typeof updated.total === "number" ? updated.total : Number(updated.total ?? 0);
                const orderRef = updated.order_number ?? updated.id;
                const safeOrderRef = escapeTelegramHtml(String(orderRef));
                void broadcastStaffNotification("order.paid", {
                  id: updated.id,
                  order_number: updated.order_number,
                  total: totalNum,
                }).catch(() => {});
                void sendTelegramNotification(
                  `💰 <b>Order paid</b>\n` +
                  `<b>${safeOrderRef}</b> · $${totalNum.toFixed(2)}` +
                  (updated.is_rush ? "\n⚡ RUSH" : "")
                ).catch(() => {});
              }

              const order = updatedOrders[0];

              try {
                const { data: customer } = await supabase
                  .from("customers")
                  .select("email, name, marketing_consent")
                  .eq("id", order.customer_id)
                  .single();
                if (customer) {
                  // Fetch full order WITH items — used for the itemized receipt.
                  // Note: cut the bare "payment confirmed" status email — receipt
                  // below has everything that one had + line items + GST# + PDF.
                  // Customer-facing emails per order: 9 → 4 (2026-05-14).
                  const { data: fullOrder } = await supabase
                    .from("orders")
                    .select(`subtotal, gst, pst, total, is_rush, discount_code, discount_amount, created_at, receipt_token, order_items ( product_name, qty, width_in, height_in, sides, line_total )`)
                    .eq("id", order.id)
                    .single();
                  const receiptItems = fullOrder && Array.isArray(fullOrder.order_items) ? fullOrder.order_items : [];

                  // Itemized receipt (non-fatal)
                  try {
                    if (fullOrder) {
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
                        oid: order.id,
                        receiptToken: fullOrder.receipt_token ?? null,
                      });
                      console.log(`[clover-webhook] receipt sent → ${customer.email}`);

                      // GA4 Measurement Protocol — server-side purchase event (non-fatal, fire-and-forget)
                      // Captures orders that client-side gtag missed (ad blockers, ITP, corp networks)
                      void sendMeasurementProtocolEvent({
                        event_name: "purchase",
                        client_id: deriveClientIdFromCustomer(order.customer_id ?? order.id),
                        user_id: order.customer_id ?? undefined,
                        params: {
                          transaction_id: order.order_number,
                          value: Number(order.total),
                          currency: "CAD",
                          tax: Number(fullOrder.gst ?? 0) + Number(fullOrder.pst ?? 0),
                          payment_type: "clover_card",
                          items: receiptItems.map((i) => ({
                            item_id: (i.product_name ?? "").slice(0, 100),
                            item_name: i.product_name ?? "Unknown",
                            price: Number(i.qty) > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
                            quantity: Number(i.qty ?? 1),
                          })),
                        },
                      }).catch((err) => console.error("[clover-webhook] GA4 MP failed (non-fatal):", err));

                      // Meta Conversions API — Purchase event (server-side, deduped via event_id=order_number)
                      void sendMetaCapiEvent({
                        event_name: "Purchase",
                        event_id: order.order_number,
                        event_source_url: "https://truecolorprinting.ca/order-confirmed",
                        user_data: {
                          email: customer.email,
                          external_id: order.customer_id ?? undefined,
                        },
                        custom_data: {
                          currency: "CAD",
                          value: Number(order.total),
                          content_type: "product",
                          content_ids: receiptItems.map((i) => (i.product_name ?? "").slice(0, 100)),
                          num_items: receiptItems.reduce((s, i) => s + Number(i.qty ?? 1), 0),
                          contents: receiptItems.map((i) => ({
                            id: (i.product_name ?? "").slice(0, 100),
                            quantity: Number(i.qty ?? 1),
                            item_price: Number(i.qty) > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
                          })),
                        },
                      }).catch((err) => console.error("[clover-webhook] Meta CAPI failed (non-fatal):", err));

                      // Insert discount_redemptions for staff-assigned discounts that bypassed checkout (non-fatal)
                      if (fullOrder.discount_code) {
                        try {
                          const { data: dc } = await supabase
                            .from("discount_codes")
                            .select("id")
                            .ilike("code", fullOrder.discount_code)
                            .maybeSingle();
                          if (dc) {
                            const { count: existing } = await supabase
                              .from("discount_redemptions")
                              .select("*", { count: "exact", head: true })
                              .eq("order_id", order.id);
                            if ((existing ?? 0) === 0) {
                              await supabase.from("discount_redemptions").insert({
                                code_id: dc.id,
                                customer_id: order.customer_id,
                                order_id: order.id,
                                redeemed_at: new Date().toISOString(),
                              });
                              console.log(
                                `[clover-webhook] discount_redemptions inserted — code ${fullOrder.discount_code} | order ${order.order_number}`
                              );
                            }
                          }
                        } catch (redemptionErr) {
                          console.error("[clover-webhook] discount_redemptions insert failed (non-fatal):", redemptionErr);
                        }
                      }
                    }

                    // Brevo sync at payment_received (shifted from order creation — TC-15)
                    // Inside fullOrder block so order_items are in scope for productSummary
                    try {
                      const nameParts = customer.name.trim().split(/\s+/);
                      const orderItemNames = (Array.isArray(fullOrder?.order_items) ? fullOrder!.order_items as { product_name: string }[] : [])
                        .map((i) => i.product_name).join(", ");
                      await syncCustomerToBrevo({
                        email: customer.email,
                        firstName: nameParts[0] || customer.name,
                        lastName: nameParts.slice(1).join(" ") || undefined,
                        orderNumber: order.order_number,
                        orderTotal: Number(order.total),
                        productSummary: orderItemNames,
                        source: "checkout",
                        accountStatus: "none",
                        marketingConsent: (customer as { marketing_consent?: boolean | null }).marketing_consent === true,
                      });
                    } catch (brevoErr) {
                      console.error("[clover-webhook] Brevo sync failed (non-fatal):", brevoErr);
                    }
                  } catch (receiptErr) {
                    console.error("[clover-webhook] receipt failed (non-fatal):", receiptErr);
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
