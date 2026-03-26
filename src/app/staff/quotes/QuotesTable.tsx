"use client";

import { useState, useOptimistic, useTransition, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { QuoteRequest, ItemMeta } from "./page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildReplyBody(quote: QuoteRequest): string {
  const itemLines = quote.items
    .map((item: ItemMeta, i: number) => {
      const lines: string[] = [
        `Item ${i + 1}: ${item.product || "Unspecified"}`,
      ];
      if (item.qty) lines.push(`  Qty: ${item.qty}`);
      if (item.material) lines.push(`  Material/Stock: ${item.material}`);
      if (item.dimensions) lines.push(`  Size: ${item.dimensions}`);
      if (item.sides)
        lines.push(
          `  Sides: ${item.sides === "2" ? "Double-sided" : "Single-sided"}`
        );
      if (item.notes) lines.push(`  Notes: ${item.notes}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return (
    `Hi ${quote.name},\n\nThanks for reaching out! Here's what we have on file for your request:\n\n${itemLines}\n\n` +
    `---\n[YOUR REPLY / PRICING HERE]\n---\n\n` +
    `Feel free to call us at (306) 954-8688 if it's easier.\n\n` +
    `— True Color Display Printing\n216 33rd St W, Saskatoon | truecolorprinting.ca`
  );
}

/** Build a deep link to the staff estimator pre-filled with customer email */
function buildEstimateLink(quote: QuoteRequest): string {
  const params = new URLSearchParams({ email: quote.email });
  if (quote.name) params.set("customer", quote.name);
  const product = quote.items[0]?.product;
  if (product) params.set("product", product);
  return `/staff?${params.toString()}`;
}

// ─── QuotesTable ──────────────────────────────────────────────────────────────

export function QuotesTable({ quotes }: { quotes: QuoteRequest[] }) {
  type Filter = "all" | "pending" | "recent";
  const [filter, setFilter] = useState<Filter>("pending");

  const pendingCount = quotes.filter((q) => !q.replied_at).length;
  const recentCount = quotes.filter(
    (q) =>
      Date.now() - new Date(q.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const filtered =
    filter === "pending"
      ? quotes.filter((q) => !q.replied_at)
      : filter === "recent"
      ? quotes.filter(
          (q) =>
            Date.now() - new Date(q.created_at).getTime() <
            7 * 24 * 60 * 60 * 1000
        )
      : quotes;

  if (quotes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
        <svg
          className="w-10 h-10 text-gray-300 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
        <p className="text-gray-500 font-medium">No quote requests yet</p>
        <p className="text-gray-400 text-sm mt-1">
          They&apos;ll appear here as customers submit the form
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-[#1c1712] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("recent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "recent"
              ? "bg-[#1c1712] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Last 7 days ({recentCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-[#1c1712] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({quotes.length})
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
        {filtered.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">
              {filter === "pending"
                ? "All caught up — no pending quotes"
                : "No quotes in the last 7 days"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QuoteCard ────────────────────────────────────────────────────────────────

function QuoteCard({ quote }: { quote: QuoteRequest }) {
  const isNew =
    Date.now() - new Date(quote.created_at).getTime() < 24 * 60 * 60 * 1000;
  const fileLinks = (quote.file_links ?? []).filter(Boolean);
  const isMulti = quote.items.length > 1;

  // Optimistic reply state (works before migration runs too — graceful)
  const [isPending, startTransition] = useTransition();
  const [optimisticReplied, setOptimisticReplied] = useOptimistic(
    !!quote.replied_at
  );
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(quote.staff_note ?? "");

  // Reply modal state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState(
    `Re: Your print quote — True Color Display Printing`
  );
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

  // Reset body when modal opens
  useEffect(() => {
    if (replyOpen && !replyBody) {
      setReplyBody(buildReplyBody(quote));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyOpen]);

  async function toggleReplied() {
    const next = !optimisticReplied;
    startTransition(async () => {
      setOptimisticReplied(next);
      try {
        await fetch(`/api/staff/quotes/${quote.id}/reply`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replied: next }),
        });
      } catch {
        // revert handled by useOptimistic on re-render
      }
    });
  }

  async function saveNote() {
    await fetch(`/api/staff/quotes/${quote.id}/reply`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replied: optimisticReplied, staff_note: noteText }),
    });
    setNoteOpen(false);
  }

  async function sendReply() {
    if (!replyBody.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/staff/quotes/${quote.id}/send-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: quote.email,
          subject: replySubject,
          body: replyBody,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setReplyError(data.error ?? "Failed to send");
      } else {
        setReplySent(true);
        // Mark as replied optimistically
        startTransition(async () => {
          setOptimisticReplied(true);
        });
        setTimeout(() => {
          setReplyOpen(false);
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
    <div
      className={`border rounded-xl overflow-hidden transition-opacity ${
        optimisticReplied
          ? "border-gray-200 opacity-60"
          : isNew
          ? "border-[#16C2F3] shadow-sm"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-start justify-between gap-4 ${
          optimisticReplied ? "bg-gray-50" : isNew ? "bg-sky-50" : "bg-gray-50"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1c1712] text-base">
              {quote.name}
            </span>
            {optimisticReplied ? (
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Replied
              </span>
            ) : isNew ? (
              <span className="text-xs font-bold bg-[#16C2F3] text-white px-2 py-0.5 rounded-full">
                New
              </span>
            ) : null}
            {isMulti && (
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {quote.items.length} items
              </span>
            )}
            {fileLinks.length > 0 && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {fileLinks.length} file{fileLinks.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <a
              href={`mailto:${quote.email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {quote.email}
            </a>
            {quote.phone && (
              <a
                href={`tel:${quote.phone}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {quote.phone}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
            {timeAgo(quote.created_at)}
          </span>

          {/* Create Estimate */}
          <a
            href={buildEstimateLink(quote)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            title="Open staff estimator pre-filled with this customer"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Estimate
          </a>

          {/* Reply */}
          <button
            onClick={() => setReplyOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
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
            Reply
          </button>

          {/* Mark replied toggle */}
          <button
            onClick={toggleReplied}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap border ${
              optimisticReplied
                ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            }`}
            title={optimisticReplied ? "Mark as pending" : "Mark as replied"}
          >
            {optimisticReplied ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Done
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Done?
              </>
            )}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-4 bg-white divide-y divide-gray-100">
        {quote.items.map((item: ItemMeta, i: number) => (
          <div key={i} className={i > 0 ? "pt-4 mt-4" : ""}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-[#1c1712] text-sm">
                {isMulti ? `Item ${i + 1}: ` : ""}
                {item.product || (
                  <span className="text-gray-400 italic">Not specified</span>
                )}
              </span>
              {item.qty && (
                <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                  Qty: {item.qty}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {item.material && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Material: </span>
                  {item.material}
                </p>
              )}
              {item.dimensions && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Size: </span>
                  {item.dimensions}
                </p>
              )}
              {item.sides && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Sides: </span>
                  {item.sides === "2" ? "Double-sided" : "Single-sided"}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-gray-600 col-span-2 whitespace-pre-wrap">
                  <span className="text-gray-400">Notes: </span>
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Artwork files */}
      {fileLinks.length > 0 && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100 flex flex-wrap gap-3">
          {fileLinks.map((url: string, i: number) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 hover:underline"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Artwork {fileLinks.length > 1 ? i + 1 : ""}
            </a>
          ))}
        </div>
      )}

      {/* Staff note */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            Received{" "}
            {new Date(quote.created_at).toLocaleString("en-CA", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "America/Regina",
            })}{" "}
            CST
          </span>
          <button
            onClick={() => setNoteOpen((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {noteText ? "Edit note" : "+ Add note"}
          </button>
        </div>

        {noteOpen && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Internal note (not sent to customer)"
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-gray-400"
              onKeyDown={(e) => e.key === "Enter" && saveNote()}
            />
            <button
              onClick={saveNote}
              className="text-xs font-semibold bg-[#1c1712] text-white px-3 py-1.5 rounded hover:bg-[#2d2620] transition-colors"
            >
              Save
            </button>
          </div>
        )}

        {noteText && !noteOpen && (
          <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            Note: {noteText}
          </p>
        )}
      </div>

      {/* Reply modal */}
      <AnimatePresence>
        {replyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setReplyOpen(false);
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
              {/* Modal header */}
              <div className="bg-[#1c1712] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">Reply to {quote.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{quote.email}</p>
                </div>
                <button
                  onClick={() => { setReplyOpen(false); setReplyError(null); }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                  <textarea
                    rows={12}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent resize-y"
                    placeholder="Type your reply here..."
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

              {/* Modal footer */}
              <div className="px-6 pb-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setReplyOpen(false); setReplyError(null); }}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendReply}
                  disabled={replySending || replySent || !replyBody.trim()}
                  className="inline-flex items-center gap-2 bg-[#16C2F3] hover:bg-[#0fa8d6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {replySending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
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
    </div>
  );
}
