"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { QuoteRequest } from "@/app/staff/quotes/page";
import { buildReplyBody } from "./helpers";

interface QuoteReplyModalProps {
  quote: QuoteRequest;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function QuoteReplyModal({ quote, open, onClose, onSent }: QuoteReplyModalProps) {
  const replySubject = "Re: Your print quote — True Color Display Printing";
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    if (open && !replyBody) {
      setReplyBody(buildReplyBody(quote));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function sendReply(body: string) {
    if (!body.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/staff/quotes/${quote.id}/send-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: quote.email, subject: replySubject, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setReplyError(data.error ?? "Failed to send");
      } else {
        setReplySent(true);
        onSent();
        setTimeout(() => {
          onClose();
          setReplySent(false);
          setReplyBody("");
        }, 1200);
      }
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setReplySending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
              setReplyError(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="bg-[#1c1712] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base">Reply to {quote.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{quote.email}</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setReplyError(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                <textarea
                  rows={12}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent resize-y"
                  placeholder="Type your reply here…"
                />
              </div>
              {replyError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {replyError}
                </p>
              )}
              {replySent && (
                <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-semibold">
                  ✓ Sent! Marked as replied.
                </p>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  onClose();
                  setReplyError(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendReply(replyBody)}
                disabled={replySending || replySent || !replyBody.trim()}
                className="inline-flex items-center gap-2 bg-[#16C2F3] hover:bg-[#0fa8d6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              >
                {replySending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
