"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CartItem } from "@/lib/types/cart";
import { printMultiQuote } from "@/lib/quoteDocument";
import { EmailModal } from "@/components/estimator/EmailModal";
import { WaveModal } from "@/components/estimator/WaveModal";

interface Props {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function MultiQuoteCart({ items, onRemoveItem, onClearCart }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [waveOpen, setWaveOpen] = useState(false);

  if (items.length === 0) return null;

  const combinedSubtotal = items.reduce((s, it) => s + (it.result.sell_price ?? 0), 0);
  const combinedDesignFee = items.reduce((s, it) => s + (it.result.design_fee ?? 0), 0);
  const gst = Math.round(combinedSubtotal * 0.05 * 100) / 100;
  const pst = Math.round((combinedSubtotal - combinedDesignFee) * 0.06 * 100) / 100;
  const total = Math.round((combinedSubtotal + gst + pst) * 100) / 100;

  return (
    <>
      {/* Sticky cart bar — z-30 stays below email/wave modals (z-50) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] no-print">

        {/* Handle / summary row */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
          aria-expanded={expanded}
          aria-label="Toggle quote cart"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#16C2F3] text-white text-xs font-bold flex-shrink-0">
              {items.length}
            </span>
            <span className="text-sm font-semibold">Quote Cart</span>
            <span className="text-sm text-gray-400 hidden sm:block">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold tabular-nums">
              ${total.toFixed(2)}{" "}
              <span className="text-xs font-normal text-gray-400">incl. tax</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>

        {/* Expanded panel — show/hide without height animation (performance) */}
        {expanded && (
          <div className="border-t border-gray-100 px-6 pb-5 pt-4 space-y-4">

            {/* Item list */}
            <div className="space-y-1">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate pr-4">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        ${(item.result.sell_price ?? 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.label} from cart`}
                        className="p-2.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Totals summary */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span className="tabular-nums">${combinedSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>GST (5%)</span>
                <span className="tabular-nums">${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>PST (6%)</span>
                <span className="tabular-nums">${pst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)} CAD</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Print PDF */}
              <button
                onClick={() => printMultiQuote(items)}
                className="flex items-center gap-1.5 py-2.5 px-3.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-all cursor-pointer min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print PDF
              </button>

              {/* Email Customer */}
              <button
                onClick={() => setEmailOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-[#16C2F3] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all cursor-pointer min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Customer →
              </button>

              {/* Wave Invoice */}
              <button
                onClick={() => setWaveOpen(true)}
                className="flex items-center gap-1.5 py-2.5 px-3.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all cursor-pointer min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Wave
              </button>

              {/* Clear Cart */}
              <button
                onClick={onClearCart}
                className="py-2.5 px-3.5 border border-gray-200 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer min-h-[44px]"
              >
                Clear
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Email modal — multi-item mode */}
      {emailOpen && (
        <EmailModal
          cartItems={items}
          onClose={() => setEmailOpen(false)}
        />
      )}

      {/* Wave modal — multi-item mode */}
      {waveOpen && (
        <WaveModal
          cartItems={items}
          onClose={() => setWaveOpen(false)}
        />
      )}
    </>
  );
}
