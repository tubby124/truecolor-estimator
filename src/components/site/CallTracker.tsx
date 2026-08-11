"use client";

import { useEffect } from "react";
import { trackClickToCall } from "@/lib/analytics";

export function CallTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (!anchor) return;

      trackClickToCall({
        placement: anchor.dataset.callPlacement ?? "tel_link",
        page_path: window.location.pathname,
        link_url: anchor.href,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
