"use client";

import { useState, useOptimistic, useTransition, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { QuoteRequest, ItemMeta } from "./page";

type LineItem = { description: string; qty: string; unitPrice: string };

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
      const lines: string[] = [`Item ${i + 1}: ${item.product || "Unspecified"}`];
      if (item.qty) lines.push(`  Qty: ${item.qty}`);
      if (item.material) lines.push(`  Material/Stock: ${item.material}`);
      if (item.dimensions) lines.push(`  Size: ${item.dimensions}`);
      if (item.sides)
        lines.push(`  Sides: ${item.sides === "2" ? "Double-sided" : "Single-sided"}`);
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

function buildEstimateLink(quote: QuoteRequest): string {
  const params = new URLSearchParams({ email: quote.email });
  if (quote.name) params.set("customer", quote.name);
  const product = quote.items[0]?.product;
  if (product) params.set("product", product);
  return `/staff?${params.toString()}`;
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

// ─── QuoteCard ────────────────────────────────────────────────────────────────

function QuoteCard({ quote }: { quote: QuoteRequest }) {
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
  const [replySubject] = useState(`Re: Your print quote — True Color Display Printing`);
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

  // Quote builder modal
  const defaultItems = (): LineItem[] =>
    quote.items.slice(0, 1).map((item) => ({
      description: [item.product, item.dimensions, item.material].filter(Boolean).join(" — "),
      qty: String(item.qty || 1),
      unitPrice: "",
    }));
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>(defaultItems);
  const [quoteSubject, setQuoteSubject] = useState(
    `Your Custom Print Quote — True Color Display Printing`
  );
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

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
              {quote.phone ? ` · ${quote.phone}` : ""}
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
            <a
              href={buildEstimateLink(quote)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              title="Open staff estimator pre-filled"
            >
              Estimate
            </a>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setReplyOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Reply
            </button>

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
            >
              {optimisticReplied ? "✓ Done" : "Done?"}
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

          {/* Footer: timestamp + staff note */}
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

      {/* ── Reply modal ── */}
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
              <div className="bg-[#1c1712] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">Reply to {quote.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{quote.email}</p>
                </div>
                <button
                  onClick={() => {
                    setReplyOpen(false);
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
                    setReplyOpen(false);
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
    </div>
  );
}
