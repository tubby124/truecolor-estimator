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
      className="fixed inset-x-4 bottom-4 z-[200] mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
    >
      <h2 className="text-base font-bold text-[#1c1712]">Optional marketing cookies</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        With your permission, we use Meta&apos;s tools to measure advertising and show more relevant ads. Declining will not affect your quote, order, or site experience. See our{" "}
        <Link href="/privacy" className="font-semibold text-[#087fa1] underline underline-offset-2">
          Privacy Policy
        </Link>.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
          className="min-h-11 rounded-lg bg-[#16C2F3] px-4 py-2 text-sm font-bold text-white hover:bg-[#0fb0dd] focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:ring-offset-2"
        >
          Accept marketing cookies
        </button>
      </div>
    </section>
  );
}
