"use client";

import { useState, useMemo, useRef } from "react";
import type { CustomerRow } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteItem {
  product?: string;
  qty?: string;
  material?: string;
  dimensions?: string;
  sides?: string;
  notes?: string;
}

interface CustomerQuote {
  id: string;
  created_at: string;
  name: string | null;
  items: QuoteItem[];
  replied_at: string | null;
  reply_body: string | null;
  staff_note: string | null;
  file_links: string[] | null;
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

function fmtCad(n: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function buildReplyBody(quote: CustomerQuote, customerName: string | null): string {
  const name = quote.name ?? customerName ?? "there";
  const itemLines = (quote.items ?? [])
    .map((item, i) => {
      const lines: string[] = [`Item ${i + 1}: ${item.product || "Unspecified"}`];
      if (item.qty) lines.push(`  Qty: ${item.qty}`);
      if (item.material) lines.push(`  Material/Stock: ${item.material}`);
      if (item.dimensions) lines.push(`  Size: ${item.dimensions}`);
      if (item.sides) lines.push(`  Sides: ${item.sides === "2" ? "Double-sided" : "Single-sided"}`);
      if (item.notes) lines.push(`  Notes: ${item.notes}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return (
    `Hi ${name},\n\nThanks for reaching out! Here's what we have on file for your request:\n\n${itemLines}\n\n` +
    `---\n[YOUR REPLY / PRICING HERE]\n---\n\n` +
    `Feel free to call us at (306) 954-8688 if it's easier.\n\n` +
    `— True Color Display Printing\n216 33rd St W, Saskatoon | truecolorprinting.ca`
  );
}

// ─── ReplyModal ───────────────────────────────────────────────────────────────

function ReplyModal({
  quote,
  customerEmail,
  customerName,
  onClose,
  onSent,
}: {
  quote: CustomerQuote;
  customerEmail: string;
  customerName: string | null;
  onClose: () => void;
  onSent: (id: string, body: string) => void;
}) {
  const [body, setBody] = useState(() => buildReplyBody(quote, customerName));
  const [subject] = useState("Re: Your print quote — True Color Display Printing");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/quotes/${quote.id}/send-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: customerEmail, subject, body }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Send failed");
      }
      setSent(true);
      onSent(quote.id, body);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1c1712] text-sm">Reply to Quote</p>
            <p className="text-xs text-gray-400 mt-0.5">To: {customerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
          <textarea
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent resize-y"
          />
        </div>

        {error && (
          <p className="px-6 pb-2 text-sm text-red-600">{error}</p>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void send()}
            disabled={sending || sent || !body.trim()}
            className="inline-flex items-center gap-2 bg-[#16C2F3] hover:bg-[#0fa8d6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            {sent ? "✓ Sent!" : sending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SendEmailModal ────────────────────────────────────────────────────────────

function SendEmailModal({
  customerEmail,
  defaultSubject,
  defaultMessage,
  onClose,
}: {
  customerEmail: string;
  defaultSubject?: string;
  defaultMessage?: string;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [message, setMessage] = useState(defaultMessage ?? "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: customerEmail, subject, message }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Send failed");
      }
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1c1712] text-sm">Send Email</p>
            <p className="text-xs text-gray-400 mt-0.5">To: {customerEmail}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent"
              placeholder="Email subject…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
            <textarea
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent resize-y"
              placeholder="Write your message…"
            />
          </div>
        </div>
        {error && <p className="px-6 pb-2 text-sm text-red-600">{error}</p>}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void send()}
            disabled={sending || sent || !subject.trim() || !message.trim()}
            className="inline-flex items-center gap-2 bg-[#16C2F3] hover:bg-[#0fa8d6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            {sent ? "✓ Sent!" : sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SendDiscountModal ─────────────────────────────────────────────────────────

interface DiscountCode {
  code: string;
  discount_amount: number;
  description: string | null;
  is_active: boolean;
}

function SendDiscountModal({
  customerEmail,
  customerName,
  onClose,
}: {
  customerEmail: string;
  customerName: string | null;
  onClose: () => void;
}) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    fetch("/api/staff/coupons")
      .then((r) => r.json() as Promise<{ codes?: DiscountCode[] }>)
      .then((d) => {
        const active = (d.codes ?? []).filter((c) => c.is_active);
        setCodes(active);
        if (active.length > 0) setSelectedCode(active[0].code);
      })
      .catch(() => {})
      .finally(() => setLoadingCodes(false));
  });

  const firstName = customerName?.trim().split(/\s+/)[0] ?? null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  const selected = codes.find((c) => c.code === selectedCode);
  const discountMessage = selected
    ? `${greeting}\n\nHere's a discount code for your next order at True Color Display Printing:\n\n    Code: ${selected.code}\n    Saves you: $${selected.discount_amount} CAD\n\nEnter the code at checkout — no minimum order required.\n\nIf you have any questions, give us a call at (306) 954-8688 or email info@true-color.ca.\n\n— True Color Display Printing\n216 33rd St W, Saskatoon`
    : "";

  async function send() {
    if (!selected) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customerEmail,
          subject: `$${selected.discount_amount} off your next order — True Color Display Printing`,
          message: discountMessage,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Send failed");
      }
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1c1712] text-sm">Send Discount Code</p>
            <p className="text-xs text-gray-400 mt-0.5">To: {customerEmail}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {loadingCodes ? (
            <p className="text-sm text-gray-400">Loading codes…</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-gray-400">No active discount codes found.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Select code to send</label>
                <div className="space-y-2">
                  {codes.map((c) => (
                    <label key={c.code} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedCode === c.code ? "border-[#16C2F3] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="discount-code"
                        value={c.code}
                        checked={selectedCode === c.code}
                        onChange={() => setSelectedCode(c.code)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1c1712] font-mono">{c.code}</span>
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            ${c.discount_amount} OFF
                          </span>
                        </div>
                        {c.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {discountMessage && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Email preview</p>
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-3 whitespace-pre-wrap leading-relaxed font-mono border border-gray-200 max-h-40 overflow-y-auto">
                    {discountMessage}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
        {error && <p className="px-6 pb-2 text-sm text-red-600">{error}</p>}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void send()}
            disabled={sending || sent || !selected || codes.length === 0}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            {sent ? "✓ Sent!" : sending ? "Sending…" : "Send Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CustomerDetail ────────────────────────────────────────────────────────────

function CustomerDetail({ customer }: { customer: CustomerRow }) {
  const [quotes, setQuotes] = useState<CustomerQuote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CustomerQuote | null>(null);
  const [localReplied, setLocalReplied] = useState<Record<string, string>>({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const fetched = useRef(false);

  if (!fetched.current) {
    fetched.current = true;
    setLoading(true);
    fetch(`/api/staff/customer-quotes?email=${encodeURIComponent(customer.email)}`)
      .then((r) => r.json() as Promise<{ quotes?: CustomerQuote[] }>)
      .then((d) => setQuotes(d.quotes ?? []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }

  function handleReplySent(quoteId: string, body: string) {
    setLocalReplied((prev) => ({ ...prev, [quoteId]: body }));
  }

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
        {customer.email && (
          <a href={`mailto:${customer.email}`} className="hover:text-[#16C2F3] transition-colors">
            ✉ {customer.email}
          </a>
        )}
        {customer.phone && <span>📞 {customer.phone}</span>}
        {customer.company && <span>🏢 {customer.company}</span>}
        {customer.order_count > 0 && (
          <span>
            {customer.order_count} order{customer.order_count !== 1 ? "s" : ""} · {fmtCad(customer.total_spend)} total
          </span>
        )}
        {customer.auth_provider && (
          <span className="text-gray-400">via {customer.auth_provider}</span>
        )}
        {!customer.email_confirmed && (
          <span className="text-amber-500 font-semibold">⚠ Email not confirmed</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setShowEmailModal(true)}
          className="inline-flex items-center gap-1.5 bg-[#1c1712] hover:bg-[#2d2419] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          ✉ Send Email
        </button>
        <button
          onClick={() => setShowDiscountModal(true)}
          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          % Send Discount
        </button>
        {customer.order_count > 0 && (
          <a
            href={`/staff/orders?search=${encodeURIComponent(customer.email)}`}
            className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            View Orders
          </a>
        )}
      </div>

      {/* Quotes section */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Quote Requests
      </p>

      {loading && (
        <p className="text-sm text-gray-400 py-2">Loading quotes…</p>
      )}

      {!loading && quotes !== null && quotes.length === 0 && (
        <p className="text-sm text-gray-400 py-2">No quote requests on file.</p>
      )}

      {!loading && quotes !== null && quotes.length > 0 && (
        <div className="space-y-3">
          {quotes.map((q) => {
            const isReplied = !!(q.replied_at || localReplied[q.id]);
            const displayBody = localReplied[q.id] ?? q.reply_body ?? q.staff_note;
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-gray-400">{timeAgo(q.created_at)}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isReplied
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isReplied ? "Replied" : "Pending"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {(q.items ?? []).slice(0, 3).map((item, i) => (
                        <p key={i}>
                          <span className="font-medium">{item.product || "Unspecified"}</span>
                          {item.qty && ` · ${item.qty}`}
                          {item.dimensions && ` · ${item.dimensions}`}
                          {item.material && ` · ${item.material}`}
                        </p>
                      ))}
                      {(q.items ?? []).length > 3 && (
                        <p className="text-gray-400">+{q.items.length - 3} more item{q.items.length - 3 > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>

                  {!isReplied && (
                    <button
                      onClick={() => setReplyTarget(q)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      Reply
                    </button>
                  )}
                  {isReplied && !localReplied[q.id] && (
                    <button
                      onClick={() => setReplyTarget(q)}
                      className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                    >
                      Resend
                    </button>
                  )}
                </div>

                {displayBody && (
                  <div className="px-4 pb-3 bg-green-50 border-t border-green-100">
                    <p className="text-xs font-semibold text-green-700 mt-2 mb-1">
                      {localReplied[q.id] ? "Reply sent ✓" : `Replied ${timeAgo(q.replied_at!)}`}
                    </p>
                    <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {displayBody}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replyTarget && (
        <ReplyModal
          quote={replyTarget}
          customerEmail={customer.email}
          customerName={customer.name}
          onClose={() => setReplyTarget(null)}
          onSent={handleReplySent}
        />
      )}
      {showEmailModal && (
        <SendEmailModal
          customerEmail={customer.email}
          onClose={() => setShowEmailModal(false)}
        />
      )}
      {showDiscountModal && (
        <SendDiscountModal
          customerEmail={customer.email}
          customerName={customer.name}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
    </div>
  );
}

// ─── CustomersTable ────────────────────────────────────────────────────────────

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "spend" | "quotes">("recent");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter(
        (c) =>
          !q ||
          c.name?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortBy === "spend") return b.total_spend - a.total_spend;
        if (sortBy === "quotes") return b.quote_count - a.quote_count;
        // recent: prefer customers with unreplied quotes first, then by created_at
        if (b.unreplied_quotes !== a.unreplied_quotes) return b.unreplied_quotes - a.unreplied_quotes;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [customers, search, sortBy]);

  const totalOrders = customers.reduce((n, c) => n + c.order_count, 0);
  const totalQuotes = customers.reduce((n, c) => n + c.quote_count, 0);
  const totalUnreplied = customers.reduce((n, c) => n + c.unreplied_quotes, 0);
  const newAccounts = customers.filter((c) => c.account_only).length;

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Accounts" value={customers.length} />
        <StatCard label="New (no orders)" value={newAccounts} accent={newAccounts > 0 ? "purple" : undefined} />
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Quotes" value={totalQuotes} />
        <StatCard label="Unreplied" value={totalUnreplied} accent={totalUnreplied > 0 ? "yellow" : undefined} />
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:border-transparent"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
          {(["recent", "spend", "quotes"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                sortBy === s ? "bg-white text-[#1c1712] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "recent" ? "Activity" : s === "spend" ? "Spend" : "Quotes"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          No customers match &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.map((customer, i) => {
            const isExpanded = expandedId === customer.id;
            return (
              <div key={customer.id} className={i > 0 ? "border-t border-gray-100" : ""}>
                <button
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#16C2F3]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#16C2F3]">
                        {(customer.name ?? customer.email)[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1c1712] truncate">
                          {customer.name ?? customer.email}
                        </span>
                        {customer.company && (
                          <span className="text-xs text-gray-400 truncate">{customer.company}</span>
                        )}
                        {customer.account_only && (
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            New account
                          </span>
                        )}
                        {customer.unreplied_quotes > 0 && (
                          <span className="bg-amber-400 text-[#1c1712] text-xs font-bold px-2 py-0.5 rounded-full">
                            {customer.unreplied_quotes} pending
                          </span>
                        )}
                      </div>
                      {customer.name && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{customer.email}</p>
                      )}
                    </div>

                    {/* Right side stats */}
                    <div className="hidden sm:flex items-center gap-5 flex-shrink-0 text-right">
                      {customer.order_count > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Orders</p>
                          <p className="text-sm font-semibold text-[#1c1712]">{customer.order_count}</p>
                        </div>
                      )}
                      {customer.total_spend > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Spend</p>
                          <p className="text-sm font-semibold text-[#1c1712]">{fmtCad(customer.total_spend)}</p>
                        </div>
                      )}
                      {customer.quote_count > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Quotes</p>
                          <p className="text-sm font-semibold text-[#1c1712]">{customer.quote_count}</p>
                        </div>
                      )}
                      {customer.last_order_date && (
                        <div>
                          <p className="text-xs text-gray-400">Last order</p>
                          <p className="text-xs text-gray-500">{timeAgo(customer.last_order_date)}</p>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <span className={`text-gray-300 flex-shrink-0 text-lg transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                      ›
                    </span>
                  </div>
                </button>

                {isExpanded && <CustomerDetail customer={customer} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "yellow" | "purple";
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent === "yellow" ? "text-amber-600" : accent === "purple" ? "text-purple-600" : "text-[#1c1712]"}`}>
        {value}
      </p>
    </div>
  );
}
