"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BUSINESS_INFO } from "@/lib/business-info";

export function StickyMobileCTA({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    // Two tap targets, not one: a paid mobile visitor who has scrolled past the
    // hero has either decided to price the job or decided to phone. The tel:
    // link is instrumented by the document-level CallTracker mounted in SiteNav.
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#16C2F3] p-3 flex items-stretch gap-2 shadow-lg">
      <Link
        href={href}
        className="flex-1 min-h-[44px] flex items-center justify-center rounded-lg text-center text-white font-bold text-base"
      >
        Get My Price →
      </Link>
      <a
        href={BUSINESS_INFO.phone.href}
        data-call-placement="sticky_mobile_cta"
        className="shrink-0 min-h-[44px] px-4 flex items-center justify-center rounded-lg bg-white text-[#0b7fa0] font-bold text-sm"
      >
        Call {BUSINESS_INFO.phone.display}
      </a>
    </div>
  );
}
