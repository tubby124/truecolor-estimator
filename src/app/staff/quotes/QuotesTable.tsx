"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { QuoteRequest } from "./page";
import { QuoteCard } from "@/components/staff/quotes/QuoteCard";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "yellow" | "blue" | "green";
}) {
  const colorMap = {
    yellow: "text-yellow-700",
    blue: "text-blue-700",
    green: "text-green-700",
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 leading-tight">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${accent ? colorMap[accent] : "text-[#1c1712]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── QuotesTable ──────────────────────────────────────────────────────────────

export function QuotesTable({ quotes: initialQuotes }: { quotes: QuoteRequest[] }) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [filter, setFilter] = useState<"pending" | "recent" | "all">("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [newQuoteAlert, setNewQuoteAlert] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const isFirstRender = useRef(true);
  const router = useRouter();

  // Merge server data on router.refresh() without clobbering local card state
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setQuotes((prev) => {
      const byId = new Map(prev.map((q) => [q.id, q]));
      return initialQuotes.map((fresh) => byId.get(fresh.id) ?? fresh);
    });
    setLastSync(new Date());
  }, [initialQuotes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime + 45s poll fallback (mirrors orders page)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("staff-quotes-live")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "quote_requests" },
        (payload: { eventType: string; new: Record<string, unknown>; old: { id?: string } }) => {
          if (payload.eventType === "INSERT") {
            setNewQuoteAlert(true);
            router.refresh();
          } else if (payload.eventType === "UPDATE") {
            const u = payload.new;
            setQuotes((prev) =>
              prev.map((q) =>
                q.id === u.id
                  ? {
                      ...q,
                      replied_at: u.replied_at as string | null,
                      staff_note: u.staff_note as string | null,
                      reply_body: u.reply_body as string | null,
                    }
                  : q
              )
            );
            setLastSync(new Date());
          }
        }
      )
      .subscribe();

    const poll = setInterval(() => router.refresh(), 45_000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [router]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      pending: quotes.filter((q) => !q.replied_at).length,
      repliedToday: quotes.filter((q) => q.replied_at?.slice(0, 10) === today).length,
      thisWeek: quotes.filter((q) => new Date(q.created_at).getTime() > weekCutoff).length,
      total: quotes.length,
    };
  }, [quotes]);

  // Filter tab counts
  const counts = useMemo(
    () => ({
      pending: quotes.filter((q) => !q.replied_at).length,
      recent: quotes.filter(
        (q) => Date.now() - new Date(q.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
      all: quotes.length,
    }),
    [quotes]
  );

  // Filtered + searched + sorted
  const displayed = useMemo(() => {
    let result = quotes;

    if (filter === "pending") result = result.filter((q) => !q.replied_at);
    else if (filter === "recent")
      result = result.filter(
        (q) => Date.now() - new Date(q.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      );

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.name.toLowerCase().includes(q) ||
          quote.email.toLowerCase().includes(q) ||
          (quote.phone ?? "").includes(q) ||
          quote.items.some((item) => item.product?.toLowerCase().includes(q))
      );
    }

    const sorted = [...result];
    if (sortBy === "oldest") sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return sorted;
  }, [quotes, filter, search, sortBy]);

  if (quotes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-500 font-medium">No quote requests yet</p>
        <p className="text-gray-400 text-sm mt-1">
          They&apos;ll appear here as customers submit the form
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* New quote alert */}
      {newQuoteAlert && (
        <div className="mb-4 bg-sky-50 border border-[#16C2F3]/40 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[#0fa8d6] font-semibold">🔔 New quote request received — list updated</p>
          <button
            onClick={() => setNewQuoteAlert(false)}
            className="text-[#16C2F3] hover:text-[#0fa8d6] text-lg leading-none ml-4"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Pending replies" value={stats.pending} accent="yellow" />
        <StatCard label="Replied today" value={stats.repliedToday} accent="green" />
        <StatCard label="This week" value={stats.thisWeek} accent="blue" />
        <StatCard label="All time" value={stats.total} />
      </div>

      {/* Search + filter + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by name, email, phone, product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(["pending", "recent", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-[#16C2F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "pending" ? "Pending" : f === "recent" ? "Last 7 days" : "All"}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f ? "bg-white/25 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#16C2F3] bg-white transition-colors cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <span className="text-sm text-gray-400 whitespace-nowrap">
            {displayed.length} quote{displayed.length !== 1 ? "s" : ""}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · {lastSync.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Quotes list */}
      {displayed.length === 0 ? (
        <p className="text-gray-400 text-center py-16">
          {search.trim()
            ? "No quotes match your search."
            : filter === "pending"
            ? "All caught up — no pending quotes."
            : "No quotes in the last 7 days."}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
