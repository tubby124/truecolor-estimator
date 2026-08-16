"use client";

import { clearMarketingConsent } from "@/lib/analytics/metaConsent";

/**
 * Withdraws a previously stored marketing-cookie choice. Clearing the cookie
 * fires META_MARKETING_CONSENT_CHANGED_EVENT, which re-opens <MarketingConsent />
 * and unmounts <MetaPixel /> for the rest of the session.
 */
export function MarketingConsentSettingsLink() {
  return (
    <button
      type="button"
      onClick={clearMarketingConsent}
      className="rounded font-semibold text-[#087fa1] underline underline-offset-2 hover:text-[#16C2F3] focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
    >
      Cookie settings
    </button>
  );
}
