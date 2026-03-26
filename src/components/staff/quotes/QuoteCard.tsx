"use client";

import { useState, useOptimistic, useTransition } from "react";
import type { QuoteRequest, ItemMeta } from "@/app/staff/quotes/page";
import { timeAgo, buildEstimateLink } from "./helpers";
import { QuoteBuilderModal } from "./QuoteBuilderModal";
import { QuoteReplyModal } from "./QuoteReplyModal";

export function QuoteCard({ quote }: { quote: QuoteRequest }) {
  const isNew =
    Date.now() - new Date(quote.created_at).getTime() < 24 * 60 * 60 * 1000;
  const fileLinks = (quote.file_links ?? []).filter(Boolean);
  const isMulti = quote.items.length > 1;

  // New unreplied quotes start expanded; others collapsed
  const [expanded, setExpanded] = useState(isNew && !quote.replied_at);

  // Optimistic reply state
  const [isPending, startTransition] = useTransition();
  const [optimisticReplied, setOptimisticReplied] = useOptimistic(!!quote.replied_at);

  // Staff note
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(quote.staff_note ?? "");

  // Reply modal
  const [replyOpen, setReplyOpen] = useState(false);

  // Quote builder modal
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);

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
        // reverts on re-render via useOptimistic
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

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
        optimisticReplied
          ? "border-gray-100 opacity-70"
          : isNew
          ? "border-[#16C2F3]"
          : "border-gray-200"
      }`}
    >
      {/* ── Summary row — always visible, click to expand ── */}
      <div
        className={`p-5 cursor-pointer transition-colors ${
          optimisticReplied
            ? "bg-gray-50 hover:bg-gray-100"
            : isNew
            ? "bg-sky-50 hover:bg-sky-100/70"
            : "bg-white hover:bg-gray-50"
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badge row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-[#1c1712]">{quote.name}</span>
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
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  📎 {fileLinks.length > 1 ? `${fileLinks.length} files` : "Artwork"}
                </span>
              )}
              {noteText && (
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  📝 Note
                </span>
              )}
            </div>
            {/* Contact + product summary */}
            <p className="text-sm text-gray-600">
              {quote.email}
              {quote.phone ? (
                <> · <a href={`tel:${quote.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#16C2F3] transition-colors">{quote.phone}</a></>
              ) : ""}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {quote.items[0]?.product || "No product specified"}
              {quote.items.length > 1
                ? ` + ${quote.items.length - 1} more item${quote.items.length > 2 ? "s" : ""}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
              {timeAgo(quote.created_at)}
            </span>

            {/* Actions — stopPropagation so clicks don't toggle collapse */}
            {!optimisticReplied && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuoteBuilderOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  title="Send a branded price quote with line items and tax breakdown"
                >
                  Send Price Quote
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  title="Send a free-text reply email to the customer"
                >
                  Reply by Email
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                void toggleReplied();
              }}
              disabled={isPending}
              className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap border ${
                optimisticReplied
                  ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title={optimisticReplied ? "Click to mark as pending again" : "Mark as replied (if you replied via Gmail or phone)"}
            >
              {optimisticReplied ? "✓ Replied" : "Mark Replied"}
            </button>

            {/* Collapse chevron */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-gray-100">
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
            <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex flex-wrap gap-3">
              {fileLinks.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
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

          {/* Reply sent */}
          {quote.replied_at && quote.reply_body && (
            <div className="px-5 py-3 bg-green-50 border-t border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1">
                Replied {timeAgo(quote.replied_at)}
              </p>
              <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed">
                {quote.reply_body}
              </p>
            </div>
          )}
          {quote.replied_at && !quote.reply_body && (
            <div className="px-5 py-3 bg-green-50 border-t border-green-100">
              <p className="text-xs text-green-700 font-semibold">
                Replied {timeAgo(quote.replied_at)} — no message saved
              </p>
            </div>
          )}

          {/* Footer: timestamp + estimator link + staff note */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
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
                <a
                  href={buildEstimateLink(quote)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                  title="Open staff estimator pre-filled with this quote"
                >
                  Open in Estimator ↗
                </a>
              </div>
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
                  onKeyDown={(e) => e.key === "Enter" && void saveNote()}
                />
                <button
                  onClick={() => void saveNote()}
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
        </div>
      )}

      <QuoteBuilderModal
        quote={quote}
        open={quoteBuilderOpen}
        onClose={() => { setQuoteBuilderOpen(false); }}
        onSent={() => startTransition(() => { setOptimisticReplied(true); })}
      />
      <QuoteReplyModal
        quote={quote}
        open={replyOpen}
        onClose={() => { setReplyOpen(false); }}
        onSent={() => startTransition(() => { setOptimisticReplied(true); })}
      />
    </div>
  );
}
