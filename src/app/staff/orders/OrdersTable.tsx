"use client";

import { useState, useMemo } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  payment_received: "Payment received",
  in_production: "In production",
  ready_for_pickup: "Ready for pickup",
  complete: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  payment_received: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-green-100 text-green-800",
  complete: "bg-gray-100 text-gray-600",
};

const NEXT_STATUS: Record<string, string> = {
  pending_payment: "payment_received",
  payment_received: "in_production",
  in_production: "ready_for_pickup",
  ready_for_pickup: "complete",
};

const NEXT_LABEL: Record<string, string> = {
  pending_payment: "Mark paid",
  payment_received: "Start production",
  in_production: "Mark ready",
  ready_for_pickup: "Mark complete",
};

const DESIGN_LABELS: Record<string, string> = {
  PRINT_READY: "Print-ready",
  MINOR_EDIT: "Minor edit",
  FULL_DESIGN: "Full design",
  LOGO_RECREATION: "Logo recreation",
  NEED_DESIGN: "Design needed",
  NEED_TOUCHUP: "Touch-up",
  NEED_REVISION: "Revision",
};

const SUPABASE_STORAGE_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"}/storage/v1/object/public/print-files`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  name: string;
  email: string;
  company: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  design_status: string;
  line_total: number;
  category: string;
  file_storage_path: string | null;
}

// Supabase returns joined rows as arrays even for many-to-one relations
export interface Order {
  id: string;
  order_number: string;
  status: string;
  is_rush: boolean;
  subtotal: number;
  gst: number;
  total: number;
  payment_method: string;
  created_at: string;
  notes: string | null;
  proof_storage_path: string | null;
  proof_sent_at: string | null;
  file_storage_paths: string[] | null;
  customers: Customer[] | Customer | null;
  order_items: OrderItem[] | null;
}

interface Props {
  initialOrders: Order[];
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "yellow" | "purple" | "blue" | "green";
}) {
  const colorMap = {
    yellow: "text-yellow-700",
    purple: "text-purple-700",
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

// ─── Main component ────────────────────────────────────────────────────────────

export function OrdersTable({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reply state — one reply panel at a time
  const [replyOrderId, setReplyOrderId] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Proof state — one proof panel at a time
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMessage, setProofMessage] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofSentId, setProofSentId] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // ── Stats (computed from all orders, not filtered view) ──────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const dayOfWeek = now.getDay(); // 0=Sun
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    return {
      active: orders.filter((o) => o.status !== "complete").length,
      pendingPayment: orders.filter((o) => o.status === "pending_payment").length,
      inProduction: orders.filter((o) => o.status === "in_production").length,
      revenueToday: orders
        .filter((o) => o.created_at.slice(0, 10) === todayStr)
        .reduce((sum, o) => sum + Number(o.total), 0),
      revenueWeek: orders
        .filter((o) => new Date(o.created_at) >= weekStart)
        .reduce((sum, o) => sum + Number(o.total), 0),
    };
  }, [orders]);

  // ── Filtered + searched list ──────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let result = orders;

    if (filter === "active") result = result.filter((o) => o.status !== "complete");
    else if (filter === "complete") result = result.filter((o) => o.status === "complete");

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => {
        const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        return (
          o.order_number.toLowerCase().includes(q) ||
          c?.name?.toLowerCase().includes(q) ||
          c?.email?.toLowerCase().includes(q) ||
          (c?.company ?? "").toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [orders, filter, search]);

  // ── Status advance ────────────────────────────────────────────────────────────

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setLoadingStatus(orderId);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoadingStatus(null);
    }
  }

  // ── Reply actions ─────────────────────────────────────────────────────────────

  function openReply(orderId: string, orderNumber: string) {
    if (replyOrderId === orderId) {
      setReplyOrderId(null);
      return;
    }
    setReplyOrderId(orderId);
    setReplySubject(`Re: True Color Order ${orderNumber}`);
    setReplyMessage("");
    setReplySending(false);
    setReplySent(false);
    setReplyError(null);
  }

  async function handleSendReply(orderId: string) {
    if (!replySubject.trim() || !replyMessage.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: replySubject.trim(), message: replyMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setReplySent(true);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setReplySending(false);
    }
  }

  // ── Proof upload ──────────────────────────────────────────────────────────────

  async function handleSendProof(orderId: string) {
    if (!proofFile) return;
    setProofUploading(true);
    setProofError(null);
    try {
      const form = new FormData();
      form.append("file", proofFile);
      if (proofMessage.trim()) form.append("message", proofMessage.trim());
      const res = await fetch(`/api/staff/orders/${orderId}/proof`, {
        method: "POST",
        body: form,
      });
      const data = await res.json() as { ok?: boolean; proofPath?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setProofSentId(orderId);
      // Update local order state so the proof badge / "sent on" text appears immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, proof_storage_path: data.proofPath ?? null, proof_sent_at: new Date().toISOString() }
            : o
        )
      );
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to send proof");
    } finally {
      setProofUploading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <StatCard label="Active orders" value={stats.active} />
        <StatCard label="Pending payment" value={stats.pendingPayment} accent="yellow" />
        <StatCard label="In production" value={stats.inProduction} accent="purple" />
        <StatCard
          label="Today"
          value={`$${stats.revenueToday.toFixed(2)}`}
          accent="blue"
        />
        <StatCard
          label="This week"
          value={`$${stats.revenueWeek.toFixed(2)}`}
          accent="green"
        />
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by order #, name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors"
        />
        <div className="flex items-center gap-2">
          {["active", "complete", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === f
                  ? "bg-[#16C2F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "active" ? "Active" : f === "complete" ? "Complete" : "All"}
            </button>
          ))}
          <span className="text-sm text-gray-400 whitespace-nowrap ml-1">
            {displayed.length} order{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Orders list ── */}
      {displayed.length === 0 ? (
        <p className="text-gray-400 text-center py-16">
          {search.trim() ? "No orders match your search." : "No orders here yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const customer = Array.isArray(order.customers)
              ? order.customers[0]
              : order.customers;
            const nextStatus = NEXT_STATUS[order.status];
            const isExpanded = expandedId === order.id;
            const isLoadingStatus = loadingStatus === order.id;
            const isReplyOpen = replyOrderId === order.id;
            const isProofOpen = proofOrderId === order.id;

            // Find artwork file on any item
            const fileItem = order.order_items?.find((i) => i.file_storage_path);
            const fileUrl = fileItem?.file_storage_path
              ? `${SUPABASE_STORAGE_URL}/${fileItem.file_storage_path}`
              : null;

            const proofUrl = order.proof_storage_path
              ? `${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`
              : null;

            const rushFee = order.is_rush
              ? Number(order.total) - Number(order.subtotal) - Number(order.gst)
              : 0;

            return (
              <div
                key={order.id}
                className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
                  order.is_rush ? "border-orange-300" : "border-gray-200"
                }`}
              >
                {/* ── Summary row ── */}
                <div className={`p-5 ${order.is_rush ? "bg-orange-50" : "bg-white"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[#1c1712]">{order.order_number}</span>
                        {order.is_rush && (
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            RUSH
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                        {fileUrl && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            📎 Artwork
                          </span>
                        )}
                        {proofUrl && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            🖼 Proof sent
                          </span>
                        )}
                      </div>

                      {/* Customer */}
                      <p className="text-sm font-semibold text-gray-800">
                        {customer?.name ?? "Unknown"}
                        {customer?.company ? ` — ${customer.company}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {customer?.email} ·{" "}
                        {order.payment_method === "clover_card" ? "Card" : "e-Transfer"} · $
                        {Number(order.total).toFixed(2)} CAD ·{" "}
                        {new Date(order.created_at).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          disabled={isLoadingStatus}
                          className="bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          {isLoadingStatus ? "Updating…" : NEXT_LABEL[order.status]}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : order.id)
                        }
                        className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                        aria-label={isExpanded ? "Collapse order" : "Expand order"}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded section ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-6">

                    {/* Order items table */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Items
                        </p>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                                  Product
                                </th>
                                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500">
                                  Qty
                                </th>
                                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">
                                  Size
                                </th>
                                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">
                                  Design
                                </th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.order_items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-800">
                                    {item.product_name}
                                  </td>
                                  <td className="px-3 py-3 text-center text-gray-600">
                                    {item.qty}
                                  </td>
                                  <td className="px-3 py-3 text-center text-gray-500 text-xs hidden sm:table-cell">
                                    {item.width_in && item.height_in
                                      ? `${(item.width_in / 12).toFixed(1)} × ${(item.height_in / 12).toFixed(1)} ft`
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-3 text-center hidden md:table-cell">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      {DESIGN_LABELS[item.design_status] ?? item.design_status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">
                                    ${Number(item.line_total).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Totals breakdown */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-400">Subtotal</span>{" "}
                        <span className="font-semibold tabular-nums">
                          ${Number(order.subtotal).toFixed(2)}
                        </span>
                      </div>
                      {order.is_rush && rushFee > 0 && (
                        <div>
                          <span className="text-orange-500">Rush</span>{" "}
                          <span className="font-semibold text-orange-600 tabular-nums">
                            +${rushFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">GST</span>{" "}
                        <span className="font-semibold tabular-nums">
                          ${Number(order.gst).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Total</span>{" "}
                        <span className="font-bold text-[#1c1712] tabular-nums">
                          ${Number(order.total).toFixed(2)} CAD
                        </span>
                      </div>
                    </div>

                    {/* Customer notes */}
                    {order.notes && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Customer notes
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-gray-700 italic">
                          &ldquo;{order.notes}&rdquo;
                        </div>
                      </div>
                    )}

                    {/* Artwork file */}
                    {fileUrl && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Artwork file
                        </p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#16C2F3] font-semibold hover:underline"
                        >
                          📎 View artwork file →
                        </a>
                      </div>
                    )}

                    {/* Message customer */}
                    <div>
                      <button
                        onClick={() => openReply(order.id, order.order_number)}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                          isReplyOpen
                            ? "border-gray-300 bg-white text-gray-500"
                            : "border-[#16C2F3] text-[#16C2F3] hover:bg-[#16C2F3] hover:text-white"
                        }`}
                      >
                        {isReplyOpen ? "✕ Close message" : "✉ Message customer"}
                      </button>

                      {isReplyOpen && (
                        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-semibold text-gray-400 text-xs uppercase tracking-widest">
                              To:
                            </span>
                            <span className="font-medium text-gray-700">
                              {customer?.name} &lt;{customer?.email}&gt;
                            </span>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={replySubject}
                              onChange={(e) => setReplySubject(e.target.value)}
                              disabled={replySent}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors disabled:opacity-60"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                              Message
                            </label>
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              disabled={replySent}
                              rows={6}
                              placeholder={`Hi ${customer?.name ?? "there"},\n\nYour order is…`}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors resize-none disabled:opacity-60 font-sans"
                            />
                          </div>

                          {replyError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              {replyError}
                            </p>
                          )}

                          {replySent ? (
                            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 font-semibold">
                              ✓ Message sent to {customer?.email}
                            </p>
                          ) : (
                            <button
                              onClick={() => handleSendReply(order.id)}
                              disabled={
                                replySending ||
                                !replySubject.trim() ||
                                !replyMessage.trim()
                              }
                              className="bg-[#16C2F3] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {replySending ? "Sending…" : "Send message →"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Upload proof */}
                    <div>
                      <button
                        onClick={() => {
                          if (isProofOpen) {
                            setProofOrderId(null);
                          } else {
                            setProofOrderId(order.id);
                            setProofFile(null);
                            setProofMessage("");
                            setProofSentId(null);
                            setProofError(null);
                          }
                        }}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                          isProofOpen
                            ? "border-gray-300 bg-white text-gray-500"
                            : "border-violet-400 text-violet-600 hover:bg-violet-50"
                        }`}
                      >
                        {isProofOpen ? "✕ Close proof panel" : "🖼 Upload proof"}
                      </button>

                      {/* Show existing proof indicator */}
                      {proofUrl && !isProofOpen && (
                        <p className="text-xs text-violet-600 mt-1.5">
                          ✓ Proof sent
                          {order.proof_sent_at
                            ? ` on ${new Date(order.proof_sent_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
                            : ""}
                          {" · "}
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View proof →
                          </a>
                        </p>
                      )}

                      {isProofOpen && (
                        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                              Proof file (JPG, PNG, WebP, or PDF)
                            </label>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                              disabled={proofSentId === order.id}
                              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                              Note to customer (optional)
                            </label>
                            <textarea
                              value={proofMessage}
                              onChange={(e) => setProofMessage(e.target.value)}
                              disabled={proofSentId === order.id}
                              rows={3}
                              placeholder="E.g. Please check the bleed area on the left side."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 transition-colors resize-none disabled:opacity-60 font-sans"
                            />
                          </div>

                          {proofError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              {proofError}
                            </p>
                          )}

                          {proofSentId === order.id ? (
                            <p className="text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 font-semibold">
                              ✓ Proof sent to {customer?.email}
                            </p>
                          ) : (
                            <button
                              onClick={() => handleSendProof(order.id)}
                              disabled={proofUploading || !proofFile}
                              className="bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {proofUploading ? "Uploading…" : "Send proof to customer →"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
