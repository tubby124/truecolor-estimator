import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createServiceClient } from "@/lib/supabase/server";
import { AccountSignupCard } from "@/components/site/AccountSignupCard";
import { PurchaseEvent } from "@/app/order-confirmed/PurchaseEvent";
import { CloverPaymentWatcher } from "@/app/order-confirmed/CloverPaymentWatcher";
import { REVIEW_COUNT } from "@/lib/reviews";
import type { LatestPaymentAttempt } from "@/lib/payments/attempts";
import { encodePaymentToken } from "@/lib/payment/token";
import { shouldTrackConfirmedPurchase } from "@/lib/analytics/purchase-readiness";

export const metadata: Metadata = {
  title: "Order Confirmed — True Color",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ oid?: string }>;
}

interface OrderSummary {
  order_number: string;
  total: number;
  gst: number | string | null;
  pst: number | string | null;
  status: string;
  paid_at: string | null;
  payment_method: string;
  payment_reference: string | null;
  receipt_token: string | null;
  customers?: { email: string; name: string; company: string | null } | Array<{ email: string; name: string; company: string | null }> | null;
  order_items?: Array<{ product_name: string; category?: string | null; qty: number; line_total: number | string }> | null;
  latest_payment_attempt?: LatestPaymentAttempt | null;
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { oid } = await searchParams;

  let orderSummary: OrderSummary | null = null;

  if (oid) {
    try {
      const supabase = createServiceClient();

      // Read-only: fetch order details to display.
      // Payment confirmation is written exclusively by the Clover webhook
      // (/api/webhooks/clover) when it receives a captured PAYMENT event.
      // We never auto-confirm here — Clover redirects to this URL on both
      // success AND cancellation/timeout, so we can't trust the redirect alone.
      const { data } = await supabase
        .from("orders")
        .select("order_number, total, gst, pst, payment_method, payment_reference, receipt_token, status, paid_at, customers(email, name, company), order_items(product_name, category, qty, line_total)")
        .eq("id", oid)
        .single();

      if (data) {
        orderSummary = data as OrderSummary;
        const { data: latestAttempt } = await supabase
          .from("payment_attempts")
          .select("status, amount, failure_label, failure_detail, customer_message, clover_checkout_session_id, clover_payment_id, created_at")
          .eq("order_id", oid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        orderSummary.latest_payment_attempt = (latestAttempt as LatestPaymentAttempt | null) ?? null;
      }
    } catch {
      // Non-fatal — show generic confirmation
    }
  }

  const customerRaw = orderSummary?.customers;
  const customerEmail = Array.isArray(customerRaw) ? customerRaw[0]?.email : customerRaw?.email;

  const isEtransfer = orderSummary?.payment_method === "etransfer";
  // For eTransfer orders, payment_reference holds the /pay/{token} card URL.
  // For clover_card orders, payment_reference is our Supabase order UUID (used for webhook matching).
  let cardPayUrl = isEtransfer ? (orderSummary?.payment_reference ?? null) : null;
  if (!cardPayUrl && oid && orderSummary?.payment_method === "clover_card" && orderSummary.status === "pending_payment") {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
      const token = encodePaymentToken(
        Number(orderSummary.total),
        `Order ${orderSummary.order_number}`,
        customerEmail ?? undefined,
        `${siteUrl}/order-confirmed?oid=${oid}`,
      );
      cardPayUrl = `/pay/${token}`;
    } catch {
      cardPayUrl = null;
    }
  }

  // Clover orders: payment is confirmed by the webhook, not this redirect.
  // Show a "processing" notice if the webhook hasn't fired yet.
  const isCloverPending =
    orderSummary?.payment_method === "clover_card" &&
    orderSummary?.status === "pending_payment";

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* GA4 purchase event — only fires when payment is confirmed (not while pending) */}
      {oid && orderSummary && shouldTrackConfirmedPurchase({ status: orderSummary.status, paidAt: orderSummary.paid_at }) && (
        <PurchaseEvent
          orderNumber={orderSummary.order_number}
          total={Number(orderSummary.total)}
          paymentMethod={orderSummary.payment_method}
          tax={Number(orderSummary.gst ?? 0) + Number(orderSummary.pst ?? 0)}
          items={(orderSummary.order_items ?? []).map((i) => ({
            item_id: (i.product_name ?? "").slice(0, 100),
            item_name: i.product_name ?? "Unknown",
            item_category: i.category ?? undefined,
            price: i.qty > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
            quantity: Number(i.qty ?? 1),
          }))}
        />
      )}

      <main id="main-content" className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Poll for payment confirmation while webhook catches up — must be first to start polling immediately */}
        {isCloverPending && oid && <CloverPaymentWatcher oid={oid} />}

        {/* Icon — pending clock vs confirmed checkmark */}
        <div className="flex justify-center mb-6">
          {isCloverPending ? (
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="white"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-[#16C2F3] rounded-full flex items-center justify-center check-in-anim">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="white"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-[#1c1712] mb-3">
          {isCloverPending ? "Verifying your payment…" : "Order confirmed!"}
        </h1>

        {/* Order number badge */}
        {orderSummary?.order_number && (
          <div className="inline-flex items-center gap-2 bg-[#f4efe9] border border-[#ddd5c8] rounded-lg px-5 py-2.5 mb-5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order</span>
            <span className="text-lg font-bold text-[#1c1712] tracking-wide">{orderSummary.order_number}</span>
          </div>
        )}

        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          {isCloverPending
            ? "Please wait while we verify your card payment. Do not close this page or pay again."
            : <>We&apos;ve got your order and will have it ready for pickup at{" "}<span className="font-semibold text-[#1c1712]">216 33rd St W, Saskatoon</span>.</>
          }
        </p>

        {/* Clover payment processing notice — shown while webhook hasn't confirmed yet */}
        {isCloverPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-left mb-8">
            <p className="font-bold text-yellow-800 mb-1">Payment being verified</p>
            <p className="text-sm text-yellow-700 leading-relaxed">
              {orderSummary?.latest_payment_attempt?.status === "card_declined"
                ? orderSummary.latest_payment_attempt.customer_message ?? "Your card payment did not complete. Please try again or use e-Transfer."
                : "Your card payment is being processed. You'll receive a confirmation email once it's verified — this usually takes under a minute. You do not need to do anything else."}
            </p>
            {orderSummary?.latest_payment_attempt?.status === "card_declined" && cardPayUrl && (
              <a
                href={cardPayUrl}
                className="inline-flex mt-4 items-center gap-2 rounded-lg bg-[#16C2F3] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0fb0dd] transition-colors"
              >
                Try card again &rarr;
              </a>
            )}
          </div>
        )}

        {/* eTransfer payment reminder — shown only for e-Transfer orders */}
        {isEtransfer && orderSummary && (
          <div className="bg-[#fdf8ee] border border-[#f0d890] rounded-2xl p-6 text-left mb-8">
            <p className="font-bold text-[#7a5a00] mb-2">Complete your payment</p>
            <p className="text-sm text-[#7a5a00] mb-3 leading-relaxed">
              Send{" "}
              <span className="font-bold">${orderSummary.total.toFixed(2)} CAD</span>
              {" "}by Interac e-Transfer to:
            </p>
            <p className="font-mono text-base font-bold text-[#1c1712] mb-3">info@true-color.ca</p>
            <p className="text-xs text-gray-500">
              Auto-deposit enabled — no security question needed. Include your name in the memo.
              We&apos;ll confirm and start production within 1 business day.
            </p>
          </div>
        )}

        {/* Secondary card payment option — silently hidden when no pay URL available */}
        {isEtransfer && cardPayUrl && (
          <div className="text-center mb-8">
            <p className="text-xs text-gray-400 mb-3">Prefer to pay by credit card?</p>
            <a
              href={cardPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 font-medium text-sm px-6 py-2.5 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
              Pay by credit card instead
            </a>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-[#f4efe9] rounded-2xl p-8 text-left mb-10">
          <h2 className="font-bold text-[#1c1712] text-lg mb-5">What happens next</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#16C2F3] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-semibold text-[#1c1712]">We review your order</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Our team confirms specs and checks your file (if submitted).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#16C2F3] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-semibold text-[#1c1712]">We print it</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Standard turnaround: 1–3 business days. Rush orders: same day if placed before 10 AM.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#16C2F3] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-semibold text-[#1c1712]">You pick it up</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  We&apos;ll send you an email when it&apos;s ready. 216 33rd St W — Mon–Fri 9 AM–5 PM.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt download — shown once payment is confirmed */}
        {oid && orderSummary && orderSummary.status !== "pending_payment" && orderSummary.receipt_token && (
          <div className="mb-8 text-center">
            <a
              href={`/api/receipt/${oid}/pdf?token=${orderSummary.receipt_token}`}
              download
              className="inline-flex items-center gap-2 bg-[#1c1712] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Receipt (PDF)
            </a>
            <p className="text-xs text-gray-400 mt-2">For your records or accountant</p>
          </div>
        )}

        {/* Google Review CTA — highest-intent moment */}
        <div className="mb-8 p-5 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
          <p className="text-sm font-semibold text-yellow-900 mb-1">Happy with your experience?</p>
          <p className="text-xs text-yellow-700 mb-3">{REVIEW_COUNT} Saskatoon businesses already left us a review. Takes 30 seconds.</p>
          <a
            href="https://g.page/r/CZH6HlbNejQAEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-yellow-300 text-yellow-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-yellow-50 transition-colors"
          >
            <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Leave a Google Review →
          </a>
        </div>

        {/* Account prompt */}
        {orderSummary?.order_number && customerEmail ? (
          <AccountSignupCard email={customerEmail} orderNumber={orderSummary.order_number} />
        ) : (
          <div className="border border-[#16C2F3]/30 rounded-2xl p-6 mb-8 bg-[#f0fbff]">
            <h2 className="font-bold text-[#1c1712] text-base mb-1">Track this order anytime</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create an account to see your order status and reorder in one click.
            </p>
            <Link
              href="/account"
              className="inline-block bg-[#16C2F3] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#0fb0dd] transition-colors"
            >
              View my orders &rarr;
            </Link>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="bg-[#16C2F3] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Order something else →
          </Link>
          <a
            href="tel:+13069548688"
            className="border border-gray-200 text-gray-600 font-medium px-8 py-3 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            Call us: (306) 954-8688
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Questions? Email{" "}
          <a href="mailto:info@true-color.ca" className="underline hover:text-[#16C2F3]">
            info@true-color.ca
          </a>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
