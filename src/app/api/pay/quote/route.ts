import { NextRequest, NextResponse } from "next/server";
import { decodePaymentToken } from "@/lib/payment/token";
import {
  completeQuoteCheckoutReservation,
  failQuoteCheckoutReservation,
  materializeQuoteOrder,
} from "@/lib/payment/quote-order";
import { CloverCheckoutError, createCloverCheckout } from "@/lib/payment/clover";
import {
  provisionQuoteWaveInvoice,
  QuoteWaveProvisioningError,
} from "@/lib/payment/quote-wave";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { recordPaymentAttempt } from "@/lib/payments/attempts";
import { recordAuditEvent } from "@/lib/audit/record";

const PAID_STATUSES = new Set(["payment_received", "in_production", "ready_for_pickup", "complete"]);

function quotePage(req: NextRequest, token: string, state: "stale" | "paid" | "retry" | "opened" | "error") {
  return NextResponse.redirect(
    new URL(`/pay/${encodeURIComponent(token)}?state=${state}`, req.url),
    303,
  );
}

function hasValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([req.nextUrl.origin]);
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try { allowed.add(new URL(configured).origin); } catch { /* invalid config is not an allowed origin */ }
  }
  return allowed.has(origin);
}

export async function POST(req: NextRequest) {
  if (!hasValidOrigin(req) || req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  if (!rateLimit(`quote-pay:${ip}`, 10, 60_000)) {
    let token = "";
    try { token = String((await req.formData()).get("token") ?? ""); } catch { /* handled below */ }
    return token ? quotePage(req, token, "retry") : NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!token || token.length > 4096) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 400 });
  }

  let payload: ReturnType<typeof decodePaymentToken>;
  try {
    payload = decodePaymentToken(token);
  } catch {
    return quotePage(req, token, "stale");
  }
  if (!payload.quoteId || !payload.quoteRevision) {
    return quotePage(req, token, "stale");
  }

  const supabase = createServiceClient();
  let quoteOrder: Awaited<ReturnType<typeof materializeQuoteOrder>>;
  try {
    quoteOrder = await materializeQuoteOrder(
      supabase,
      payload.quoteId,
      payload.amountCents,
      payload.quoteRevision,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[api/pay/quote] materialization refused:", message);
    return quotePage(req, token, /STALE|STRUCTURED|NOT_PAYABLE|NOT_FOUND|reconcil/i.test(message) ? "stale" : "error");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin).replace(/\/$/, "");
  const redirectUrl = `${siteUrl}/order-confirmed?oid=${quoteOrder.orderId}`;
  if (PAID_STATUSES.has(quoteOrder.status)) {
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (quoteOrder.status !== "pending_payment" || quoteOrder.totalCents !== payload.amountCents) {
    return quotePage(req, token, "stale");
  }
  if (quoteOrder.checkoutAction === "wait") {
    return quotePage(req, token, "opened");
  }
  if (quoteOrder.checkoutAction === "create" && !quoteOrder.checkoutReservationId) {
    return quotePage(req, token, "error");
  }

  try {
    const wave = await provisionQuoteWaveInvoice(supabase, quoteOrder.orderId);
    if (wave.action === "wait") {
      if (quoteOrder.checkoutReservationId) {
        await failQuoteCheckoutReservation(supabase, {
          orderId: quoteOrder.orderId,
          reservationId: quoteOrder.checkoutReservationId,
          ambiguous: false,
          error: "Clover checkout held while Wave provisioning is unresolved",
        }).catch((reservationError) => {
          console.error("[api/pay/quote] Clover reservation release failed:", reservationError);
        });
      }
      return quotePage(req, token, "opened");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Wave provisioning error";
    const ambiguous = error instanceof QuoteWaveProvisioningError ? error.ambiguous : true;
    console.error("[api/pay/quote] Wave provisioning failed:", message);

    let cloverReservationReleased = true;
    if (quoteOrder.checkoutReservationId) {
      await failQuoteCheckoutReservation(supabase, {
        orderId: quoteOrder.orderId,
        reservationId: quoteOrder.checkoutReservationId,
        ambiguous: false,
        error: "Clover checkout was not called because Wave provisioning failed",
      }).catch((reservationError) => {
        cloverReservationReleased = false;
        console.error("[api/pay/quote] Clover reservation release failed:", reservationError);
      });
    }

    await recordAuditEvent({
      actor_type: "system",
      actor_id: "api/pay/quote",
      event_type: "wave.quote_provision_failed",
      entity_type: "order",
      entity_id: quoteOrder.orderId,
      detail: {
        quote_id: payload.quoteId,
        ambiguous,
        clover_reservation_released: cloverReservationReleased,
        error: message.slice(0, 1000),
      },
    });
    return quotePage(req, token, ambiguous || !cloverReservationReleased ? "opened" : "retry");
  }

  if (quoteOrder.checkoutAction === "resume" && quoteOrder.checkoutUrl) {
    return NextResponse.redirect(quoteOrder.checkoutUrl, 303);
  }
  if (!quoteOrder.checkoutReservationId) {
    return quotePage(req, token, "error");
  }

  try {
    const result = await createCloverCheckout(
      payload.amountCents,
      payload.description,
      payload.customerEmail,
      redirectUrl,
      quoteOrder.orderId,
    );
    await completeQuoteCheckoutReservation(supabase, {
      orderId: quoteOrder.orderId,
      reservationId: quoteOrder.checkoutReservationId,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
    });
    await recordPaymentAttempt(supabase, {
      order_id: quoteOrder.orderId,
      status: "checkout_opened",
      amount: payload.amountCents / 100,
      clover_checkout_session_id: result.sessionId || null,
      customer_message: "Secure Clover checkout opened. We are waiting for payment confirmation.",
    }).catch((attemptError) => {
      console.error("[api/pay/quote] checkout attempt log failed:", attemptError);
    });
    void recordAuditEvent({
      actor_type: "customer",
      actor_id: payload.customerEmail ?? null,
      event_type: "order.pay_link_clicked",
      entity_type: "order",
      entity_id: quoteOrder.orderId,
      detail: { amount_cents: payload.amountCents, quote_id: payload.quoteId },
    });
    return NextResponse.redirect(result.checkoutUrl, 303);
  } catch (error) {
    console.error("[api/pay/quote] Clover checkout failed:", error);
    const ambiguous = !(error instanceof CloverCheckoutError) || error.outcome === "ambiguous";
    await failQuoteCheckoutReservation(supabase, {
      orderId: quoteOrder.orderId,
      reservationId: quoteOrder.checkoutReservationId,
      ambiguous,
      error: error instanceof Error ? error.message : "Unknown Clover checkout error",
    }).catch((reservationError) => {
      console.error("[api/pay/quote] reservation failure update failed:", reservationError);
    });
    if (ambiguous) {
      await recordPaymentAttempt(supabase, {
        order_id: quoteOrder.orderId,
        status: "ambiguous",
        amount: payload.amountCents / 100,
        failure_label: "Checkout session could not be confirmed",
        failure_detail: error instanceof Error ? error.message : "Unknown Clover checkout error",
        customer_message: "We could not confirm whether Clover opened checkout. Please wait before trying again.",
      }).catch((attemptError) => {
        console.error("[api/pay/quote] ambiguous attempt log failed:", attemptError);
      });
    }
    return quotePage(req, token, ambiguous ? "opened" : "retry");
  }
}
