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
import { createHmac } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // Verify HMAC signature from Clover
  const tokenSecret = process.env.PAYMENT_TOKEN_SECRET;
  if (tokenSecret) {
    const signature = req.headers.get("x-clover-signature") ?? "";
    const expected = createHmac("sha256", tokenSecret)
      .update(bodyText)
      .digest("base64");

    if (signature && signature !== expected) {
      console.warn("[clover-webhook] Invalid signature — possible spoofing attempt");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
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
          const { error, count } = await supabase
            .from("orders")
            .update({
              status: "payment_received",
              paid_at: new Date().toISOString(),
            })
            .eq("payment_reference", cloverOrderId)
            .eq("status", "pending_payment");

          if (error) {
            console.error("[clover-webhook] order update failed:", error.message);
          } else {
            console.log(
              `[clover-webhook] order confirmed via webhook | Clover order: ${cloverOrderId} | rows updated: ${count ?? 0}`
            );
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
