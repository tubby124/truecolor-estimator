import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/statusUpdate";

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
  payment_method: string;
  payment_reference: string | null;
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { oid } = await searchParams;

  let orderSummary: OrderSummary | null = null;

  if (oid) {
    try {
      const supabase = createServiceClient();

      // Auto-confirm payment only for card orders redirected back from Clover.
      // eTransfer orders stay in pending_payment until staff manually marks them paid.
      // .select() lets us detect if the row was actually updated (vs. already confirmed by webhook)
      const { data: updatedOrders } = await supabase
        .from("orders")
        .update({ status: "payment_received", paid_at: new Date().toISOString() })
        .eq("id", oid)
        .eq("status", "pending_payment")     // idempotent — only updates if still pending
        .eq("payment_method", "clover_card") // never auto-confirm eTransfer orders
        .select("order_number, customer_id, total, is_rush, payment_method");

      // Send "payment confirmed" email only if this redirect beat the webhook
      // (if webhook already fired and updated the status, updatedOrders will be empty)
      if (updatedOrders && updatedOrders.length > 0) {
        try {
          const o = updatedOrders[0];
          const { data: customer } = await supabase
            .from("customers")
            .select("email, name")
            .eq("id", o.customer_id)
            .single();
          if (customer) {
            await sendOrderStatusEmail({
              status: "payment_received",
              orderNumber: o.order_number,
              customerName: customer.name,
              customerEmail: customer.email,
              total: o.total,
              isRush: o.is_rush,
              paymentMethod: o.payment_method,
            });
          }
        } catch {
          // non-fatal — page still shows confirmation
        }
      }

      // Fetch order details to show on confirmation page
      const { data } = await supabase
        .from("orders")
        .select("order_number, total, payment_method, payment_reference")
        .eq("id", oid)
        .single();

      if (data) {
        orderSummary = data as OrderSummary;
      }
    } catch {
      // Non-fatal — show generic confirmation
    }
  }

  const isEtransfer = orderSummary?.payment_method === "etransfer";
  // For eTransfer orders, payment_reference holds the /pay/{token} card URL.
  // For clover_card orders, payment_reference is the Clover session ID — not a pay URL.
  const cardPayUrl = isEtransfer ? (orderSummary?.payment_reference ?? null) : null;

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#16C2F3] rounded-full flex items-center justify-center">
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
        </div>

        <h1 className="text-3xl font-bold text-[#1c1712] mb-3">Order received!</h1>

        {/* Order number badge */}
        {orderSummary?.order_number && (
          <div className="inline-flex items-center gap-2 bg-[#f4efe9] border border-[#ddd5c8] rounded-lg px-5 py-2.5 mb-5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order</span>
            <span className="text-lg font-bold text-[#1c1712] tracking-wide">{orderSummary.order_number}</span>
          </div>
        )}

        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          We&apos;ve got your order and will have it ready for pickup at{" "}
          <span className="font-semibold text-[#1c1712]">216 33rd St W, Saskatoon</span>.
        </p>

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

        {/* Account prompt */}
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

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/quote"
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
