"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileStickyBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const obs = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#1c1712] border-t border-white/10 px-4 py-3 flex gap-3">
      <Link
        href="/quote"
        className="flex-1 bg-[#16C2F3] text-white font-bold text-sm py-3 rounded-md text-center hover:bg-[#0fb0dd] transition-colors"
      >
        Get a Price →
      </Link>
      <a
        href="tel:+13069548688"
        className="border border-white/30 text-white text-sm font-medium px-4 py-3 rounded-md hover:border-white transition-colors whitespace-nowrap"
      >
        (306) 954-8688
      </a>
    </div>
  );
}
