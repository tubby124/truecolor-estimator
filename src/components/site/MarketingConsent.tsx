"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getMarketingConsent,
  META_MARKETING_CONSENT_CHANGED_EVENT,
  saveMarketingConsent,
} from "@/lib/analytics/metaConsent";

export function MarketingConsent() {
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, onStoreChange);
      return () => window.removeEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, onStoreChange);
    },
    getMarketingConsent,
    () => "denied",
  );

  function choose(consent: "granted" | "denied") {
    saveMarketingConsent(consent);
  }

  if (consent !== null) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label="Cookie choices"
      // z-[45] sits above the z-40/z-30 sticky bars so the banner is never
      // hidden, but below the z-50 PaidCartConfirmation sheet.
      // Bottom offsets clear the tallest bar stack at each breakpoint:
      //   <768px  product Add-to-Cart bar (~80px) + MobileCallPriceBar (64px
      //           + safe area, md:hidden) = 9rem + safe area
      //   768px+  product Add-to-Cart bar only (~80px, lg:hidden) -> 6rem
      //   1024px+ MultiQuoteCart collapsed bar (~49px, all widths) -> 4rem
      className="fixed inset-x-4 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-[45] mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:p-5 md:bottom-24 lg:bottom-16"
    >
      <h2 className="text-sm font-bold text-[#1c1712] sm:text-base">Optional marketing cookies</h2>
      <p className="mt-1.5 text-xs leading-5 text-gray-600 sm:mt-2 sm:text-sm sm:leading-6">
        Meta&apos;s tools measure our advertising. Declining will not affect your quote or order. See our{" "}
        <Link href="/privacy" className="font-semibold text-[#087fa1] underline underline-offset-2">
          Privacy Policy
        </Link>.
      </p>
      <div className="mt-3 flex flex-row justify-end gap-2 sm:mt-4">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          aria-label="Accept marketing cookies"
          className="min-h-11 rounded-lg bg-[#16C2F3] px-4 py-2 text-sm font-bold text-white hover:bg-[#0fb0dd] focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:ring-offset-2"
        >
          Accept
        </button>
      </div>
    </section>
  );
}
