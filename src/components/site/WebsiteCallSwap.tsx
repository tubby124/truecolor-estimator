"use client";

import { useEffect } from "react";
import {
  WEBSITE_CALL_SWAP_CSS_CLASS,
  WEBSITE_CALL_SWAP_EVENT,
  WEBSITE_CALL_SWAP_GLOBAL,
  websiteCallSwapParams,
  type WebsiteCallSwapNumbers,
} from "@/lib/analytics/google-ads";
import {
  getMarketingConsent,
  META_MARKETING_CONSENT_CHANGED_EVENT,
} from "@/lib/analytics/metaConsent";

// Why a component of its own rather than an extension of CallTracker: CallTracker
// is mounted once per surface (SiteNav, the paid layout, /pay, error, not-found),
// while the swap must be applied exactly once per document — folding it into
// CallTracker would register N observers on any page that mounts more than one.

/** Any (NNN) NNN-NNNN run inside a .tc-phone element is the number to swap. */
const PHONE_TEXT_RE = /\(\d{3}\)\s*\d{3}-\d{4}/g;
/** Google returns e.g. "+13065550134"; reject anything that is not dialable. */
const MOBILE_NUMBER_RE = /^\+?[\d\s().-]{7,20}$/;
const MUTATION_THROTTLE_MS = 250;

/**
 * JSON-LD carries the real business number and is a structured-data contract with
 * Google Search — a forwarding number there would misrepresent the business. HTML
 * parsing already prevents elements from living inside a <script>, so this is
 * belt-and-braces, but the intent is worth making explicit and enforceable.
 */
function isInsideJsonLd(element: Element): boolean {
  return element.closest('script[type="application/ld+json"]') !== null;
}

function swapDisplayedText(formatted: string) {
  const targets = document.querySelectorAll<HTMLElement>(`.${WEBSITE_CALL_SWAP_CSS_CLASS}`);
  for (const target of targets) {
    if (isInsideJsonLd(target)) continue;
    // Text nodes only: rewriting innerHTML/textContent would destroy the icons and
    // screen-reader spans these elements wrap.
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parentTag = node.parentElement?.tagName;
      if (parentTag !== "SCRIPT" && parentTag !== "STYLE" && node.nodeValue) {
        const next = node.nodeValue.replace(PHONE_TEXT_RE, formatted);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
      node = walker.nextNode();
    }
  }
}

function swapTelHrefs(mobile: string) {
  if (!MOBILE_NUMBER_RE.test(mobile)) return;
  const href = `tel:${mobile.replace(/\s+/g, "")}`;
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]');
  for (const anchor of anchors) {
    if (isInsideJsonLd(anchor)) continue;
    if (anchor.getAttribute("href") !== href) anchor.setAttribute("href", href);
  }
}

function readParkedNumbers(): WebsiteCallSwapNumbers | null {
  if (typeof window === "undefined") return null;
  const parked = (window as unknown as Record<string, unknown>)[WEBSITE_CALL_SWAP_GLOBAL];
  if (!parked || typeof parked !== "object") return null;
  const { formatted, mobile } = parked as Partial<WebsiteCallSwapNumbers>;
  if (typeof formatted !== "string" || typeof mobile !== "string") return null;
  if (!formatted || !mobile) return null;
  return { formatted, mobile };
}

interface WebsiteCallSwapProps {
  /** Already validated against CONVERSION_LABEL_RE by the caller. */
  label: string;
  /**
   * True when NEXT_PUBLIC_MARKETING_CONSENT_BANNER is enabled. The root layout
   * then withholds the swap config from the beforeInteractive bootstrap, and this
   * component issues it only once marketing consent is granted — the same posture
   * MetaPixel takes. The GA4 and Google Ads base tags are unaffected either way.
   */
  requiresConsent: boolean;
}

export function WebsiteCallSwap({ label, requiresConsent }: WebsiteCallSwapProps) {
  useEffect(() => {
    let numbers: WebsiteCallSwapNumbers | null = null;
    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function apply() {
      if (disposed || !numbers) return;
      swapDisplayedText(numbers.formatted);
      swapTelHrefs(numbers.mobile);
    }

    // Trailing-edge throttle. The observer watches childList only, and the swap
    // writes nodeValue / href attributes, so it cannot re-trigger itself.
    function scheduleApply() {
      if (disposed || timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        apply();
      }, MUTATION_THROTTLE_MS);
    }

    function adopt(next: WebsiteCallSwapNumbers | null) {
      if (!next) return;
      numbers = next;
      apply();
      if (observer) return;
      // Client-rendered anchors (MobileCallPriceBar, sticky bars, route changes)
      // mount after the swap has already run; without this they keep the original
      // number and the call goes untracked.
      observer = new MutationObserver(scheduleApply);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const onSwapEvent = () => adopt(readParkedNumbers());
    window.addEventListener(WEBSITE_CALL_SWAP_EVENT, onSwapEvent);

    // The bootstrap callback usually fires before hydration, so the numbers are
    // already parked by the time this runs; the listener above covers the rest.
    adopt(readParkedNumbers());

    let onConsentChange: (() => void) | null = null;
    if (requiresConsent) {
      // Registration cannot precede consent by definition, so this config lands
      // after gtag.js has loaded. gtag accepts a repeat config against the same
      // destination and delivers the numbers to the newly supplied callback; if
      // the swap had already resolved, readParkedNumbers above is the fallback.
      let registered = false;
      const register = () => {
        if (registered || disposed) return;
        if (getMarketingConsent() !== "granted") return;
        if (typeof window.gtag !== "function") return;
        registered = true;
        window.gtag(
          "config",
          label,
          websiteCallSwapParams((formatted, mobile) => adopt({ formatted, mobile })),
        );
      };
      onConsentChange = register;
      window.addEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, register);
      register();
    }

    return () => {
      disposed = true;
      window.removeEventListener(WEBSITE_CALL_SWAP_EVENT, onSwapEvent);
      if (onConsentChange) {
        window.removeEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, onConsentChange);
      }
      if (timer !== null) clearTimeout(timer);
      observer?.disconnect();
    };
  }, [label, requiresConsent]);

  return null;
}
