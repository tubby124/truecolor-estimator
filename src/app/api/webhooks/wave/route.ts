/**
 * POST /api/webhooks/wave
 *
 * Receives Wave Accounting webhook events. Used to detect when a customer
 * pays a Wave invoice via Wave Payments ("Pay Now" link) and sync the
 * payment status back to our Supabase order.
 *
 * Setup (one-time):
 *   1. Wave Dashboard → Settings → Integrations → Webhooks
 *   2. Add URL: https://truecolor-estimator.vercel.app/api/webhooks/wave
 *   3. Select event: invoice_paid
 *   4. Copy the signing secret → add as WAVE_WEBHOOK_SECRET in Vercel env vars
 *
 * Auth: HMAC-SHA256 signature on raw request body using WAVE_WEBHOOK_SECRET.
 *       Wave sends the signature in the "X-Wave-Signature" header as
 *       "sha256=<hex_digest>".
 *
 * Event shape (Wave invoice_paid):
 *   {
 *     data: {
 *       resourceType: "invoice",
 *       resource: { id: "<wave_invoice_id>", status: "paid", ... }
 *     }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature from Wave
  const webhookSecret = process.env.WAVE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get("x-wave-signature") ?? "";
    const expected =
      "sha256=" +
      createHmac("sha256", webhookSecret).update(bodyText).digest("hex");

    if (!signature || signature !== expected) {
      console.warn("[wave-webhook] Invalid or missing signature — possible spoofing attempt");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventData = event.data as Record<string, unknown> | undefined;
  const resource = eventData?.resource as Record<string, unknown> | undefined;

  // Only handle invoice.paid events
  if (
    eventData?.resourceType === "invoice" &&
    resource?.status === "paid" &&
    resource?.id
  ) {
    const waveInvoiceId = resource.id as string;
    console.log("[wave-webhook] invoice paid event →", waveInvoiceId);

    try {
      const supabase = createServiceClient();

      // Look up the order by wave_invoice_id
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, total, is_rush, status")
        .eq("wave_invoice_id", waveInvoiceId)
        .single();

      if (error || !order) {
        console.warn("[wave-webhook] No order found for wave_invoice_id:", waveInvoiceId);
      } else if (order.status !== "pending_payment") {
        console.log(
          `[wave-webhook] Order ${order.order_number} already past pending_payment (status: ${order.status}) — skipping`
        );
      } else {
        // Advance order to payment_received
        const { error: updateErr } = await supabase
          .from("orders")
          .update({ status: "payment_received", paid_at: new Date().toISOString() })
          .eq("id", order.id);

        if (updateErr) {
          console.error("[wave-webhook] order update failed:", updateErr.message);
        } else {
          console.log(`[wave-webhook] order ${order.order_number} → payment_received`);

          // Send payment confirmed email (non-fatal)
          try {
            const { data: customer } = await supabase
              .from("customers")
              .select("email, name")
              .eq("id", order.customer_id)
              .single();

            if (customer?.email) {
              await sendOrderStatusEmail({
                status: "payment_received",
                orderNumber: order.order_number,
                customerName: customer.name,
                customerEmail: customer.email,
                total: Number(order.total),
                isRush: Boolean(order.is_rush),
                paymentMethod: "wave_payments",
              });
              console.log(`[wave-webhook] payment confirmed email sent → ${customer.email}`);
            }
          } catch (emailErr) {
            console.error("[wave-webhook] payment email failed (non-fatal):", emailErr);
          }
        }
      }
    } catch (err) {
      console.error("[wave-webhook] unexpected error:", err);
    }
  } else {
    console.log("[wave-webhook] unhandled event — resourceType:", eventData?.resourceType, "status:", resource?.status);
  }

  // Always return 200 — Wave retries on non-200
  return NextResponse.json({ ok: true });
}
