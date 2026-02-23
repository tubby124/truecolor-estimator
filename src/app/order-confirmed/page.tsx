import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order Confirmed — True Color",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ oid?: string }>;
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { oid } = await searchParams;

  // Auto-confirm payment when Clover redirects back with orderId
  if (oid) {
    try {
      const supabase = createServiceClient();
      await supabase
        .from("orders")
        .update({ status: "payment_received", paid_at: new Date().toISOString() })
        .eq("id", oid)
        .eq("status", "pending_payment"); // idempotent — only updates if still pending
    } catch {
      // Non-fatal — order stays pending, staff can confirm manually
    }
  }

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
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          We&apos;ve got your order and will have it ready for pickup at{" "}
          <span className="font-semibold text-[#1c1712]">216 33rd St W, Saskatoon</span>.
        </p>

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
            See your order status and reorder in one click &mdash; we&apos;ll email you a login link, no password needed.
          </p>
          <Link
            href="/account"
            className="inline-block bg-[#16C2F3] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            View my orders &rarr;
          </Link>
        </div>

        {/* eTransfer note for those paying by eTransfer */}
        <div className="border border-gray-100 rounded-xl p-5 text-left mb-10">
          <p className="text-sm font-semibold text-[#1c1712] mb-1">Paying by e-Transfer?</p>
          <p className="text-sm text-gray-500">
            Send to{" "}
            <span className="font-mono font-semibold">info@true-color.ca</span> — auto-deposit
            enabled, no security question. Include your name in the memo.
          </p>
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
