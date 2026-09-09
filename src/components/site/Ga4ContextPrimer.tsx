"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearGa4ClientContext, primeGa4ClientContext } from "@/lib/analytics/ga4-client-context";
import { META_MARKETING_CONSENT_CHANGED_EVENT } from "@/lib/analytics/metaConsent";

/** No tag loading or events: reads identifiers from the existing GA4 destination. */
export function Ga4ContextPrimer() {
  const pathname = usePathname();
  useEffect(() => {
    const prime = () => { void primeGa4ClientContext(); };
    const consentChanged = () => { clearGa4ClientContext(); prime(); };
    prime();
    window.addEventListener("focus", prime);
    window.addEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, consentChanged);
    return () => {
      window.removeEventListener("focus", prime);
      window.removeEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, consentChanged);
    };
  }, [pathname]);
  return null;
}
