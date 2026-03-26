"use client";

import { useState } from "react";
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

function buildMailto(quote: QuoteRequest): string {
  const subject = encodeURIComponent(
    `Re: Your print quote — True Color Display Printing`
  );

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

  const body = encodeURIComponent(
    `Hi ${quote.name},\n\nThanks for reaching out! Here's what we have on file for your request:\n\n${itemLines}\n\n` +
      `---\n[YOUR REPLY / PRICING HERE]\n---\n\n` +
      `Feel free to call us at (306) 954-8688 if it's easier.\n\n` +
      `— True Color Display Printing\n216 33rd St W, Saskatoon | truecolorprinting.ca`
  );

  return `mailto:${quote.email}?subject=${subject}&body=${body}`;
}

// ─── QuotesTable ──────────────────────────────────────────────────────────────

export function QuotesTable({ quotes }: { quotes: QuoteRequest[] }) {
  const [filter, setFilter] = useState<"all" | "recent">("all");

  const recentCount = quotes.filter(
    (q) =>
      Date.now() - new Date(q.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const filtered =
    filter === "recent"
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
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-[#1c1712] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({quotes.length})
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
      </div>

      <div className="space-y-4">
        {filtered.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
        {filtered.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No quotes in the last 7 days</p>
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

  return (
    <div
      className={`border rounded-xl overflow-hidden ${
        isNew ? "border-[#16C2F3] shadow-sm" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-start justify-between gap-4 ${
          isNew ? "bg-sky-50" : "bg-gray-50"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1c1712] text-base">
              {quote.name}
            </span>
            {isNew && (
              <span className="text-xs font-bold bg-[#16C2F3] text-white px-2 py-0.5 rounded-full">
                New
              </span>
            )}
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
            {timeAgo(quote.created_at)}
          </span>
          <a
            href={buildMailto(quote)}
            className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
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
          </a>
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

      {/* Timestamp footer */}
      <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
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
      </div>
    </div>
  );
}
