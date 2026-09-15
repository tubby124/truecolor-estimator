import { NextRequest, NextResponse } from "next/server";
import { decodePaymentToken } from "@/lib/payment/token";
import {
  failQuoteCheckoutReservation,
  materializeQuoteOrder,
} from "@/lib/payment/quote-order";
import {
  provisionQuoteWaveInvoice,
  QuoteWaveProvisioningError,
} from "@/lib/payment/quote-wave";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { recordAuditEvent } from "@/lib/audit/record";
import { resolveWaveOnlineCheckout } from "@/lib/payment/wave-online-checkout";

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

async function releaseUnusedQuoteCheckoutReservation(
  supabase: ReturnType<typeof createServiceClient>,
  quoteOrder: Awaited<ReturnType<typeof materializeQuoteOrder>>,
  error: string,
): Promise<void> {
  if (!quoteOrder.checkoutReservationId) return;
  await failQuoteCheckoutReservation(supabase, {
    orderId: quoteOrder.orderId,
    reservationId: quoteOrder.checkoutReservationId,
    ambiguous: false,
    error,
  });
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
  if (quoteOrder.checkoutAction === "create" && !quoteOrder.checkoutReservationId) {
    return quotePage(req, token, "error");
  }

  // materializeQuoteOrder predates Wave-online routing and reserves a Clover
  // slot transactionally. Release a fresh, never-used reservation before any
  // provider work. Existing resumed/ambiguous Clover state is left intact and
  // the shared resolver blocks it until its provider expiry.
  if (quoteOrder.checkoutAction === "create") {
    try {
      await releaseUnusedQuoteCheckoutReservation(
        supabase,
        quoteOrder,
        "Clover checkout was not used because online payment is routed through Wave",
      );
    } catch (reservationError) {
      console.error("[api/pay/quote] unused Clover reservation release failed:", reservationError);
      return quotePage(req, token, "error");
    }
  }

  let waveInvoiceId: string | null = null;
  try {
    const wave = await provisionQuoteWaveInvoice(supabase, quoteOrder.orderId);
    if (wave.action === "wait") {
      return quotePage(req, token, "opened");
    }
    if (!wave.invoiceId) throw new Error("Wave provisioning returned no invoice ID");
    waveInvoiceId = wave.invoiceId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Wave provisioning error";
    const ambiguous = error instanceof QuoteWaveProvisioningError ? error.ambiguous : true;
    console.error("[api/pay/quote] Wave provisioning failed:", message);

    await recordAuditEvent({
      actor_type: "system",
      actor_id: "api/pay/quote",
      event_type: "wave.quote_provision_failed",
      entity_type: "order",
      entity_id: quoteOrder.orderId,
      detail: {
        quote_id: payload.quoteId,
        ambiguous,
        error: message.slice(0, 1000),
      },
    });
    return quotePage(req, token, ambiguous ? "opened" : "retry");
  }
  if (!waveInvoiceId) return quotePage(req, token, "error");

  try {
    const checkout = await resolveWaveOnlineCheckout(supabase, {
      orderId: quoteOrder.orderId,
      requestedAmountCents: payload.amountCents,
    });
    if (checkout.action === "already_paid") {
      return NextResponse.redirect(redirectUrl, 303);
    }
    if (checkout.action === "updated_link") {
      return quotePage(req, token, "stale");
    }
    void recordAuditEvent({
      actor_type: "customer",
      actor_id: payload.customerEmail ?? null,
      event_type: "order.pay_link_clicked",
      entity_type: "order",
      entity_id: quoteOrder.orderId,
      detail: {
        amount_cents: payload.amountCents,
        quote_id: payload.quoteId,
        provider: "wave",
        invoice_number: checkout.invoiceNumber,
      },
    });
    return NextResponse.redirect(checkout.checkoutUrl, 303);
  } catch (error) {
    console.error("[api/pay/quote] Wave online checkout verification failed:", error);
    return quotePage(req, token, "error");
  }
}
