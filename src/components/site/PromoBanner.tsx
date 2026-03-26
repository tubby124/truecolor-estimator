"use client";

/**
 * PromoBanner — site-wide announcement bar above SiteNav.
 *
 * Shown only to logged-out users. Dismissed state persists in localStorage.
 * Uses motion/react for slide-in/out animation.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "tc_promo_banner_v1";

export function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Check auth — hide for logged-in users
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setVisible(true);
    });

    // Also react to live auth changes (e.g. user signs in on same tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setVisible(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <div className="relative bg-[#1c1712] text-white">
            <div className="max-w-5xl mx-auto px-10 py-2.5 flex items-center justify-center gap-2 text-center">

              {/* Badge */}
              <span className="hidden sm:inline-flex items-center bg-[#16C2F3]/15 border border-[#16C2F3]/30 text-[#16C2F3] text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full shrink-0">
                New customers
              </span>

              {/* Message */}
              <p className="text-xs sm:text-sm text-[#e8e0d8] leading-snug">
                Get{" "}
                <span className="font-bold text-white">$10 off</span>{" "}
                your first order when you create a free account.
              </p>

              {/* CTA */}
              <Link
                href="/account?signup=1"
                className="shrink-0 inline-flex items-center gap-1 bg-[#16C2F3] hover:bg-[#0fb0dd] text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:ring-offset-2 focus:ring-offset-[#1c1712]"
                onClick={dismiss}
              >
                Claim it
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss promotion banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a60] hover:text-white transition-colors duration-150 p-1.5 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
            >
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
