"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { QuoteRequest, ItemMeta } from "@/app/staff/quotes/page";

type LineItem = { description: string; qty: string; unitPrice: string };

interface QuoteBuilderModalProps {
  quote: QuoteRequest;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function QuoteBuilderModal({ quote, open, onClose, onSent }: QuoteBuilderModalProps) {
  const defaultItems = (): LineItem[] =>
    quote.items.slice(0, 1).map((item) => ({
      description: [item.product, item.dimensions, item.material].filter(Boolean).join(" — "),
      qty: String(item.qty || 1),
      unitPrice: "",
    }));

  const [lineItems, setLineItems] = useState<LineItem[]>(() =>
    quote.items.slice(0, 1).map((item) => ({
      description: [item.product, item.dimensions, item.material].filter(Boolean).join(" — "),
      qty: String(item.qty || 1),
      unitPrice: "",
    }))
  );
  const [quoteSubject, setQuoteSubject] = useState(
    `Your Custom Print Quote — True Color Display Printing`
  );
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

  async function sendQuote() {
    const items = lineItems.filter((li) => li.description.trim() && li.unitPrice.trim());
    if (items.length === 0) {
      setQuoteError("Add at least one line item with a description and price.");
      return;
    }
    setQuoteSending(true);
    setQuoteError(null);
    try {
      const res = await fetch(`/api/staff/quotes/${quote.id}/send-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: quote.email,
          customerName: quote.name,
          subject: quoteSubject,
          lineItems: items,
          note: quoteNote || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setQuoteError(data.error ?? "Failed to send quote");
      } else {
        setQuoteSent(true);
        onSent();
        setTimeout(() => {
          onClose();
          setQuoteSent(false);
          setLineItems(defaultItems());
          setQuoteNote("");
        }, 1500);
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setQuoteSending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
              setQuoteError(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-4"
          >
            {/* Header */}
            <div className="bg-[#1a1a2e] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base">Build Quote for {quote.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{quote.email}{quote.phone ? ` · ${quote.phone}` : ""}</p>
              </div>
              <button
                onClick={() => { onClose(); setQuoteError(null); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer specs reference */}
              {quote.items.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Request</p>
                  <div className="space-y-1">
                    {quote.items.map((item: ItemMeta, i: number) => (
                      <p key={i} className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">{item.product || "Unspecified"}</span>
                        {item.qty ? ` · Qty: ${item.qty}` : ""}
                        {item.dimensions ? ` · ${item.dimensions}` : ""}
                        {item.material ? ` · ${item.material}` : ""}
                        {item.notes ? ` — "${item.notes}"` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={quoteSubject}
                  onChange={(e) => setQuoteSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              {/* Line items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Line Items</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-auto">Description</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">Qty</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-24">Unit Price</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-24">Total</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((li, idx) => {
                        const qty = parseFloat(li.qty) || 0;
                        const unit = parseFloat(li.unitPrice) || 0;
                        const total = qty * unit;
                        return (
                          <tr key={idx}>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={li.description}
                                onChange={(e) => {
                                  const next = [...lineItems];
                                  next[idx] = { ...next[idx], description: e.target.value };
                                  setLineItems(next);
                                }}
                                placeholder="e.g. Vinyl Banner 4×8ft"
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="1"
                                value={li.qty}
                                onChange={(e) => {
                                  const next = [...lineItems];
                                  next[idx] = { ...next[idx], qty: e.target.value };
                                  setLineItems(next);
                                }}
                                className="w-full px-2 py-1 text-sm text-center border border-gray-200 rounded focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={li.unitPrice}
                                  onChange={(e) => {
                                    const next = [...lineItems];
                                    next[idx] = { ...next[idx], unitPrice: e.target.value };
                                    setLineItems(next);
                                  }}
                                  placeholder="0.00"
                                  className="w-full pl-5 pr-2 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {total > 0 ? `$${total.toFixed(2)}` : "—"}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {lineItems.length > 1 && (
                                <button
                                  onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                                  className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => setLineItems([...lineItems, { description: "", qty: "1", unitPrice: "" }])}
                  className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                >
                  + Add line item
                </button>
              </div>

              {/* Subtotal / tax summary */}
              {(() => {
                const subtotal = lineItems.reduce((sum, li) => {
                  return sum + (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
                }, 0);
                const gst = subtotal * 0.05;
                const pst = subtotal * 0.06;
                return subtotal > 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>GST (5%)</span>
                      <span>${gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>PST (6%)</span>
                      <span>${pst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1a1a2e] border-t border-gray-200 pt-1 mt-1">
                      <span>Total (with tax)</span>
                      <span>${(subtotal + gst + pst).toFixed(2)}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Optional note */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Personal message <span className="text-gray-400 font-normal">(optional — shown in email)</span>
                </label>
                <textarea
                  rows={3}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder={`Hi ${quote.name.split(" ")[0]}, thanks for reaching out…`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                />
              </div>

              {quoteError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {quoteError}
                </p>
              )}
              {quoteSent && (
                <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-semibold">
                  ✓ Quote sent! Marked as replied.
                </p>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { onClose(); setQuoteError(null); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendQuote()}
                disabled={quoteSending || quoteSent}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              >
                {quoteSending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Send Branded Quote"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
