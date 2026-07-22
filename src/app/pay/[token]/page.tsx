import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { decodePaymentToken } from "@/lib/payment/token";
import { CloverCheckoutError, createCloverCheckout } from "@/lib/payment/clover";
import {
  completeOrderCheckout,
  failOrderCheckout,
  reserveOrderCheckout,
} from "@/lib/payment/order-checkout";
import { createServiceClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { recordPaymentAttempt } from "@/lib/payments/attempts";
import {
  resolveStoredQuotePaymentBreakdown,
  type QuotePaymentBreakdown,
} from "@/lib/payment/quote-order";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ state?: string }>;
}

export function hasDurablyApprovedWaveInvoice(order: {
  wave_invoice_id?: unknown;
  wave_invoice_approved_at?: unknown;
  quote_wave_state?: unknown;
}): boolean {
  return typeof order.wave_invoice_id === "string" && order.wave_invoice_id.trim().length > 0 &&
    typeof order.wave_invoice_approved_at === "string" && order.wave_invoice_approved_at.trim().length > 0 &&
    order.quote_wave_state === "ready";
}

/**
 * Payment gateway page — decodes the signed token from the quote email,
 * resolves a Clover Hosted Checkout session, and redirects immediately.
 *
 * Direct catalog links resume one durable checkout reservation. Quote links
 * use the explicit confirmation form below and their own durable reservation.
 */
export default async function PaymentGatewayPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { state } = await searchParams;

  let amountCents: number;
  let description: string;
  let customerEmail: string | undefined;
  let redirectUrl: string | undefined;
  let quoteId: string | undefined;
  let quoteRevision: number | undefined;
  let signedOrderId: string | undefined;

  try {
    const payload = decodePaymentToken(token);
    amountCents = payload.amountCents;
    description = payload.description;
    customerEmail = payload.customerEmail;
    redirectUrl = payload.redirectUrl;
    quoteId = payload.quoteId;
    quoteRevision = payload.quoteRevision;
    signedOrderId = payload.orderId;
  } catch {
    return <ExpiredPage />;
  }

  // Quote links are deliberately side-effect-free on GET. The customer must
  // explicitly submit the form before an order is materialized or Clover is
  // contacted. Direct order retry links retain their existing gateway behavior.
  if (quoteId) {
    let breakdown: QuotePaymentBreakdown | null;
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("quote_requests")
        .select("quote_subtotal_cents, quote_gst_cents, quote_pst_cents, quote_total_cents, quote_revision")
        .eq("id", quoteId)
        .maybeSingle();
      if (error) throw error;
      breakdown = resolveStoredQuotePaymentBreakdown(data, amountCents, quoteRevision);
    } catch (error) {
      console.error("[pay/token] quote breakdown lookup failed:", error);
      return <ErrorPage />;
    }
    return (
      <QuotePayNowPage
        token={token}
        breakdown={breakdown}
        description={description}
        state={breakdown ? state : "stale"}
      />
    );
  }

  let checkoutUrl: string;
  try {
    const orderId = signedOrderId;
    if (!orderId) return <ExpiredPage />;

    // Stale link check: if the order's current total doesn't match the token amount,
    // a newer pay link was generated (e.g. staff applied a discount). Block payment.
    if (orderId) {
      const supabase = createServiceClient();
      const { data: orderCheck, error: orderCheckError } = await supabase
        .from("orders")
        .select("total, status, conversion_type, wave_invoice_id, wave_invoice_approved_at, quote_wave_state")
        .eq("id", orderId)
        .maybeSingle();
      if (orderCheckError || !orderCheck) {
        console.error("[pay/token] order readiness lookup failed:", orderCheckError?.message ?? "order not found");
        return <ErrorPage />;
      }
      // Block if already paid — prevents duplicate charges when customer clicks link again
      if (["payment_received", "in_production", "ready_for_pickup", "complete"].includes(orderCheck?.status ?? "")) {
        return <AlreadyPaidPage />;
      }
      // Orders are never allowed to create or resume Clover unless the
      // approved Wave invoice is durably linked by the locked provisioning RPC.
      if (!hasDurablyApprovedWaveInvoice(orderCheck)) {
        console.error("[pay/token] Clover blocked: Wave invoice is not durably ready", { orderId });
        return <ErrorPage />;
      }
      if (orderCheck?.status === "pending_payment") {
        const dbAmountCents = Math.round(Number(orderCheck.total) * 100);
        if (dbAmountCents !== amountCents) {
          return <UpdatedLinkPage />;
        }
      }
    }

    let createdSessionId: string | null = null;
    {
      const supabase = createServiceClient();
      const reservation = await reserveOrderCheckout(supabase, orderId);
      if (reservation.action === "resume" && reservation.checkoutUrl) {
        checkoutUrl = reservation.checkoutUrl;
      } else if (reservation.action === "wait" || !reservation.reservationId) {
        return <ErrorPage />;
      } else {
        try {
          const result = await createCloverCheckout(
            amountCents, description, customerEmail, redirectUrl, orderId,
          );
          await completeOrderCheckout(supabase, {
            orderId,
            reservationId: reservation.reservationId,
            checkoutUrl: result.checkoutUrl,
            sessionId: result.sessionId,
            expiresAt: result.expiresAt,
          });
          checkoutUrl = result.checkoutUrl;
          createdSessionId = result.sessionId || null;
        } catch (error) {
          const ambiguous = !(error instanceof CloverCheckoutError) || error.outcome === "ambiguous";
          await failOrderCheckout(supabase, {
            orderId,
            reservationId: reservation.reservationId,
            ambiguous,
            error: error instanceof Error ? error.message : "Unknown Clover checkout error",
          }).catch((reservationError) => {
            console.error("[pay/token] checkout reservation failure update failed:", reservationError);
          });
          return <ErrorPage />;
        }
      }
    }

    if (orderId && createdSessionId !== null) {
      const supabase = createServiceClient();
      await recordPaymentAttempt(supabase, {
        order_id: orderId,
        status: "checkout_opened",
        amount: amountCents / 100,
        clover_checkout_session_id: createdSessionId,
        customer_message: "Secure Clover checkout opened. We are waiting for payment confirmation.",
      });

      void recordAuditEvent({
        actor_type: "customer",
        actor_id: customerEmail ?? null,
        event_type: "order.pay_link_clicked",
        entity_type: "order",
        entity_id: orderId,
        detail: { amount_cents: amountCents, description },
      });
    }
  } catch (err) {
    console.error("[pay/token] Clover checkout failed:", err);
    return <ErrorPage />;
  }

  redirect(checkoutUrl);
}

function QuotePayNowPage({
  token,
  breakdown,
  description,
  state,
}: {
  token: string;
  breakdown: QuotePaymentBreakdown | null;
  description: string;
  state?: string;
}) {
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const message = state === "stale"
    ? "This quote was updated or does not contain a complete tax breakdown. Please use the newest quote email."
    : state === "paid"
      ? "This quote has already been paid. No further payment is needed."
      : state === "retry"
        ? "Please wait a moment, then try again."
        : state === "opened"
          ? "A checkout is already active or being verified. Continue in the original Clover tab; after 16 minutes you can reopen this quote email to start a fresh session safely."
        : state === "error"
          ? "Secure checkout could not be confirmed. Please contact us before trying again."
          : null;
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f1f5f9" }}>
        <main style={{ maxWidth: 480, margin: "80px auto", padding: "40px 32px", background: "white", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <p style={{ fontSize: 42, margin: "0 0 14px" }}>🔒</p>
          <h1 style={{ fontSize: 22, color: "#111827", margin: "0 0 10px" }}>Review and pay your quote</h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 18px" }}>{description}</p>
          {breakdown && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", margin: "0 0 22px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: "#374151", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                <span>Quote subtotal (before tax)</span>
                <span>{money(breakdown.subtotalCents)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: "#6b7280", fontSize: 13, marginBottom: 6 }}>
                <span>GST</span>
                <span>{money(breakdown.gstCents)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
                <span>PST</span>
                <span>{money(breakdown.pstCents)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: "#111827", fontSize: 18, fontWeight: 800, borderTop: "2px solid #e5e7eb", paddingTop: 10 }}>
                <span>Total</span>
                <span>{money(breakdown.totalCents)} CAD</span>
              </div>
            </div>
          )}
          {message && (
            <p style={{ fontSize: 13, color: state === "paid" ? "#047857" : "#b45309", background: state === "paid" ? "#ecfdf5" : "#fffbeb", padding: 12, borderRadius: 8, marginBottom: 18 }}>
              {message}
            </p>
          )}
          {state !== "paid" && state !== "stale" && state !== "opened" && state !== "error" && (
            <form action="/api/pay/quote" method="post">
              <input type="hidden" name="token" value={token} />
              <button type="submit" style={{ border: 0, borderRadius: 8, background: "#059669", color: "white", fontSize: 16, fontWeight: 700, padding: "14px 30px", cursor: "pointer" }}>
                Pay {breakdown ? money(breakdown.totalCents) : "securely"} with Clover →
              </button>
            </form>
          )}
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
            Your order is created only after you continue. Your card details are handled securely by Clover.
          </p>
        </main>
      </body>
    </html>
  );
}

function AlreadyPaidPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>✅</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>
            Payment Already Received
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px" }}>
            This order has already been paid. No further action is needed.
            If you have questions, please contact us.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Payment question"
            style={{
              display: "inline-block",
              background: "#16C2F3",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}>
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}

function UpdatedLinkPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>📩</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>
            Your Invoice Has Been Updated
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px" }}>
            A discount was applied to your order after this link was sent.
            Please check your email for the updated invoice with the new lower total and a fresh payment link.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Updated payment link"
            style={{
              display: "inline-block",
              background: "#16C2F3",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}>
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}

function ExpiredPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⏰</p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Payment Link Expired
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            This payment link is no longer valid. Please contact us and we will
            send you an updated quote.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Payment link expired — please resend quote"
            style={{
              display: "inline-block",
              background: "#e52222",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p
            style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}
          >
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}

function ErrorPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Payment Temporarily Unavailable
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            We could not process your payment link right now. Please contact us
            directly or try again in a moment.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Payment link issue"
            style={{
              display: "inline-block",
              background: "#e52222",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p
            style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}
          >
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}
