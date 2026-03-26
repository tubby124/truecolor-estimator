"use client";

import Link from "next/link";
import type { QuoteRequest } from "./types";

interface QuotesListProps {
  quoteRequests: QuoteRequest[];
  quotesLoading: boolean;
}

export function QuotesList({ quoteRequests, quotesLoading }: QuotesListProps) {
  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold text-[#1c1712] mb-4">Custom quote requests</h2>
      {quotesLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : quoteRequests.length === 0 ? (
        <div className="bg-[#f4efe9] rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-3">No quote requests yet.</p>
          <Link
            href="/quote-request"
            className="inline-block text-sm font-bold text-[#16C2F3] hover:underline"
          >
            Submit a custom quote &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quoteRequests.map((q) => {
            const products = Array.isArray(q.items)
              ? q.items.map((it) => it.product ?? "Item").join(", ")
              : "Custom quote";
            const date = new Date(q.created_at).toLocaleDateString("en-CA", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div key={q.id} className="border border-gray-100 rounded-xl px-4 py-4 bg-white">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1c1712] text-sm truncate">{products}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                    {(q.reply_body || q.staff_note) && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-3">
                        <p className="text-xs font-semibold text-[#16C2F3] uppercase tracking-wide mb-1">Reply from True Color</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.reply_body || q.staff_note}</p>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    q.replied_at
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {q.replied_at ? "Replied" : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
