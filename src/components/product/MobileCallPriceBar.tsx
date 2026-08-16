"use client";

import { Phone, Tag } from "lucide-react";
import { trackPaidCta } from "@/components/paid/PaidProductLink";

// PPC (Google Ads) mobile landing bar for /products/[slug]. ~83% of paid
// search traffic on these pages is mobile — this gives a one-tap call
// option plus a jump to the configurator, stacked ABOVE the existing
// sticky Add to Cart bar (never replacing or covering it). Additive only:
// does not alter ProductPageClient's existing sticky bar or cart flow.

// Deliberately NOT tagged with the Google Ads swap class ("tc-phone"): this bar
// shows "Call Now", never the number itself, and Google's swapper rewrites the
// content of every element carrying that class. Tagging it would replace the
// label and icon with a phone number. The bar is still fully measured — the
// swap rewrites its tel: href (it is client-rendered, so WebsiteCallSwap's
// MutationObserver is what catches it), and CallTracker reports the tap.
const PHONE_DISPLAY = "(306) 954-8688";
const PHONE_TEL = "tel:+13069548688";
const CALL_PLACEMENT = "product_page_mobile_call_bar";

// Fixed, known height of this bar (44px touch target + py-2 padding + border).
// Exported so ProductPageClient can reserve matching space in its bottom
// padding — keeps the two numbers from drifting apart if either changes.
export const MOBILE_CALL_PRICE_BAR_HEIGHT = 64;

interface MobileCallPriceBarProps {
  /** Hidden once the item is added to cart — PaidCartConfirmation owns that moment. */
  visible: boolean;
  /** Live-measured height (px) of the sticky bar/panel this one stacks above. */
  bottomOffset: number;
  onGetPriceClick: () => void;
}

export function MobileCallPriceBar({ visible, bottomOffset, onGetPriceClick }: MobileCallPriceBarProps) {
  if (!visible) return null;

  function handleGetPriceClick() {
    trackPaidCta({
      action: "get_price_click",
      placement: CALL_PLACEMENT,
      destination: "#product-configurator",
    });
    onGetPriceClick();
  }

  return (
    <div
      className="fixed left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ bottom: bottomOffset, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="group"
      aria-label="Call now or get your price"
    >
      <a
        href={PHONE_TEL}
        data-call-placement={CALL_PLACEMENT}
        aria-label={`Call True Color Display Printing at ${PHONE_DISPLAY}`}
        className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--brand)] text-[var(--brand)] font-bold text-sm px-3 py-2.5 transition-colors hover:bg-[var(--brand-50)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <Phone size={17} aria-hidden="true" />
        Call Now
      </a>
      <button
        type="button"
        onClick={handleGetPriceClick}
        className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] text-white font-bold text-sm px-3 py-2.5 transition-colors hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <Tag size={17} aria-hidden="true" />
        Get My Price
      </button>
    </div>
  );
}
