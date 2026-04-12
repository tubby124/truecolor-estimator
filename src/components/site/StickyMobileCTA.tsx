"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#16C2F3] p-3 shadow-lg">
      <Link
        href={href}
        className="block text-center text-white font-bold text-base"
      >
        Get My Price →
      </Link>
    </div>
  );
}
