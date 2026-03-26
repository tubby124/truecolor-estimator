"use client";

import Link from "next/link";

export function WelcomeBanner() {
  return (
    <div className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-orange-900 mb-1">You&rsquo;ve got $10 off your first order</p>
          <p className="text-sm text-orange-800 mb-3">
            Use code <span className="font-mono font-bold tracking-wider bg-orange-100 px-1.5 py-0.5 rounded">WELCOME10</span> at checkout — it applies automatically when you&rsquo;re signed in.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#1c1712] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-black transition-colors"
          >
            Get a quote &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
