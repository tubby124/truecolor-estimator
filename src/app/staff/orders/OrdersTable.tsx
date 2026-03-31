"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import {
  STATUS_LABELS,
  VALID_STATUSES,
} from "@/lib/data/order-constants";
import { StaffOrderCard } from "@/components/staff/orders/StaffOrderCard";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
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

export interface Order {
  id: string;
  order_number: string;
  status: (typeof VALID_STATUSES)[number];
  is_rush: boolean;
  subtotal: number;
  gst: number;
  total: number;
  payment_method: string;
  wave_invoice_id: string | null;
  wave_invoice_approved_at: string | null;
  wave_payment_recorded_at: string | null;
  created_at: string;
  notes: string | null;
  staff_notes: string | null;
  proof_storage_path: string | null;
  proof_storage_paths: string[] | null;
  proof_sent_at: string | null;
  file_storage_paths: string[] | null;
  is_archived: boolean;
  archived_at: string | null;
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
  accent?: "yellow" | "purple" | "blue" | "green" | "indigo";
}) {
  const colorMap = {
    yellow: "text-yellow-700",
    purple: "text-purple-700",
    blue: "text-blue-700",
    green: "text-green-700",
    indigo: "text-indigo-600",
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
  const [statusError, setStatusError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "complete" | "archived" | "all">("active");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "total_desc" | "status_asc">("newest");

  // Resend payment link — keyed by order id
  const [resendingPaymentId, setResendingPaymentId] = useState<string | null>(null);
  const [resendSuccessIds, setResendSuccessIds] = useState<Set<string>>(new Set());

  // Confirm eTransfer — keyed by order id
  const [confirmingEtransferId, setConfirmingEtransferId] = useState<string | null>(null);
  const [confirmedEtransferIds, setConfirmedEtransferIds] = useState<Set<string>>(new Set());

  // ── Archive ────────────────────────────────────────────────────────────────────
  const [archiveLoading, setArchiveLoading] = useState<Set<string>>(new Set());
  const { toasts, showToast, dismissToast } = useToast();

  // ── Live sync ──────────────────────────────────────────────────────────────────

  const router = useRouter();
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const isFirstRender = useRef(true);

  // When router.refresh() runs and new initialOrders flow in, merge them into local state
  // (avoids resetting local editing state — only adds new orders, removes deleted ones)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOrders((prev) => {
      const existingById = new Map(prev.map((o) => [o.id, o]));
      const merged = initialOrders.map((fresh) => existingById.get(fresh.id) ?? fresh);
      return merged;
    });
    setLastSync(new Date());
  }, [initialOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime subscription — live order status updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("staff-orders-live")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "orders" },
        (payload: { eventType: string; new: Record<string, unknown>; old: { id?: string } }) => {
          if (payload.eventType === "UPDATE") {
            const u = payload.new;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === u.id
                  ? {
                      ...o,
                      status: (u.status as (typeof VALID_STATUSES)[number]) ?? o.status,
                      notes: u.notes !== undefined ? (u.notes as string | null) : o.notes,
                      staff_notes: u.staff_notes !== undefined ? (u.staff_notes as string | null) : o.staff_notes,
                      proof_storage_path: u.proof_storage_path !== undefined ? (u.proof_storage_path as string | null) : o.proof_storage_path,
                      proof_storage_paths: u.proof_storage_paths !== undefined ? (u.proof_storage_paths as string[] | null) : o.proof_storage_paths,
                      proof_sent_at: u.proof_sent_at !== undefined ? (u.proof_sent_at as string | null) : o.proof_sent_at,
                      file_storage_paths: u.file_storage_paths !== undefined ? (u.file_storage_paths as string[] | null) : o.file_storage_paths,
                      wave_invoice_approved_at: u.wave_invoice_approved_at !== undefined ? (u.wave_invoice_approved_at as string | null) : o.wave_invoice_approved_at,
                      wave_payment_recorded_at: u.wave_payment_recorded_at !== undefined ? (u.wave_payment_recorded_at as string | null) : o.wave_payment_recorded_at,
                      is_archived: u.is_archived !== undefined ? (u.is_archived as boolean) : o.is_archived,
                      archived_at: u.archived_at !== undefined ? (u.archived_at as string | null) : o.archived_at,
                    }
                  : o
              )
            );
            setLastSync(new Date());
          } else if (payload.eventType === "INSERT") {
            // New order — refresh server data to get full joins (customers + items)
            setNewOrderAlert(true);
            router.refresh();
          }
        }
      )
      .subscribe();

    // Fallback: poll every 45s in case Realtime isn't enabled on the orders table
    const poll = setInterval(() => router.refresh(), 45_000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [router]);

  // ── Stats ──────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const live = orders.filter((o) => !o.is_archived);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      active: live.filter((o) => o.status !== "complete").length,
      pendingPayment: live.filter((o) => o.status === "pending_payment").length,
      inProduction: live.filter((o) => o.status === "in_production").length,
      revenueToday: live
        .filter((o) => o.created_at.slice(0, 10) === todayStr)
        .reduce((sum, o) => sum + Number(o.total), 0),
      revenueWeek: live
        .filter((o) => new Date(o.created_at) >= weekStart)
        .reduce((sum, o) => sum + Number(o.total), 0),
      revenueMonth: live
        .filter((o) => new Date(o.created_at) >= monthStart)
        .reduce((sum, o) => sum + Number(o.total), 0),
    };
  }, [orders]);

  // ── Filter tab counts ──────────────────────────────────────────────────────────

  const counts = useMemo(
    () => ({
      active: orders.filter((o) => !o.is_archived && o.status !== "complete").length,
      complete: orders.filter((o) => !o.is_archived && o.status === "complete").length,
      archived: orders.filter((o) => o.is_archived).length,
      all: orders.filter((o) => !o.is_archived).length,
    }),
    [orders]
  );

  // ── Filtered + sorted list ──────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let result = orders;

    if (filter === "active") result = result.filter((o) => !o.is_archived && o.status !== "complete");
    else if (filter === "complete") result = result.filter((o) => !o.is_archived && o.status === "complete");
    else if (filter === "archived") result = result.filter((o) => o.is_archived);
    else result = result.filter((o) => !o.is_archived); // "all" = all non-archived

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => {
        const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        return (
          o.order_number.toLowerCase().includes(q) ||
          c?.name?.toLowerCase().includes(q) ||
          c?.email?.toLowerCase().includes(q) ||
          (c?.company ?? "").toLowerCase().includes(q) ||
          (c?.phone ?? "").includes(q)
        );
      });
    }

    const sorted = [...result];
    if (sortBy === "oldest") {
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else if (sortBy === "total_desc") {
      sorted.sort((a, b) => Number(b.total) - Number(a.total));
    } else if (sortBy === "status_asc") {
      sorted.sort(
        (a, b) => VALID_STATUSES.indexOf(a.status) - VALID_STATUSES.indexOf(b.status)
      );
    } else {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return sorted;
  }, [orders, filter, search, sortBy]);

  // ── Status advance / override ──────────────────────────────────────────────

  async function handleStatusUpdate(
    orderId: string,
    newStatus: (typeof VALID_STATUSES)[number],
    orderNumber: string,
  ) {
    const prevStatus = orders.find((o) => o.id === orderId)?.status;
    setLoadingStatus(orderId);
    setStatusError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`${orderNumber} → ${STATUS_LABELS[newStatus]}`, "success");
    } catch (err) {
      // Roll back optimistic UI to previous status
      if (prevStatus) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: prevStatus } : o))
        );
      }
      setStatusError(
        `${orderNumber}: ${err instanceof Error ? err.message : "Failed to update status"}`,
      );
    } finally {
      setLoadingStatus(null);
    }
  }

  // ── Send receipt ─────────────────────────────────────────────────────────────

  const [sendingReceiptId, setSendingReceiptId] = useState<string | null>(null);
  const [receiptSentIds, setReceiptSentIds] = useState<Set<string>>(new Set());

  async function handleSendReceipt(orderId: string, orderNumber: string, customerEmail: string) {
    setSendingReceiptId(orderId);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/receipt`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send receipt");
      setReceiptSentIds((prev) => new Set(prev).add(orderId));
      showToast(`Receipt sent to ${customerEmail} for ${orderNumber}`, "success");
      setTimeout(() => setReceiptSentIds((prev) => { const s = new Set(prev); s.delete(orderId); return s; }), 10000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send receipt — try again", "error");
    } finally {
      setSendingReceiptId(null);
    }
  }

  // ── Resend payment link ─────────────────────────────────────────────────────

  async function handleResendPayment(orderId: string, orderNumber: string) {
    setResendingPaymentId(orderId);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/resend-payment`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Resend failed");
      setResendSuccessIds((prev) => new Set(prev).add(orderId));
      showToast(`Payment link resent for ${orderNumber}`, "success");
      // Clear success indicator after 8 seconds
      setTimeout(() => setResendSuccessIds((prev) => { const s = new Set(prev); s.delete(orderId); return s; }), 8000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to resend — try again", "error");
    } finally {
      setResendingPaymentId(null);
    }
  }

  // ── Confirm eTransfer ─────────────────────────────────────────────────────────

  async function handleConfirmEtransfer(orderId: string, orderNumber: string) {
    setConfirmingEtransferId(orderId);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/confirm-etransfer`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Confirmation failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "payment_received" as (typeof VALID_STATUSES)[number] }
            : o
        )
      );
      setConfirmedEtransferIds((prev) => new Set(prev).add(orderId));
      showToast(`${orderNumber} — eTransfer confirmed, receipt sent`, "success");
      setTimeout(
        () => setConfirmedEtransferIds((prev) => { const s = new Set(prev); s.delete(orderId); return s; }),
        10000
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to confirm — try again", "error");
    } finally {
      setConfirmingEtransferId(null);
    }
  }

  // ── Archive / Unarchive ────────────────────────────────────────────────────

  async function handleArchive(orderId: string, orderNumber: string, archive: boolean) {
    setArchiveLoading((prev) => new Set([...prev, orderId]));
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, is_archived: archive, archived_at: archive ? new Date().toISOString() : null }
          : o
      )
    );
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: archive }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Archive failed");
      if (archive) {
        showToast(`${orderNumber} archived`, "info", {
          label: "Undo",
          onClick: () => void handleArchive(orderId, orderNumber, false),
        });
      } else {
        showToast(`${orderNumber} restored`, "success");
      }
    } catch (err) {
      // Revert optimistic update on error
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, is_archived: !archive, archived_at: null } : o))
      );
      showToast(err instanceof Error ? err.message : "Archive failed", "error");
    } finally {
      setArchiveLoading((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── New order alert ── */}
      {newOrderAlert && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-green-800 font-semibold">🔔 New order received — list updated</p>
          <button
            onClick={() => setNewOrderAlert(false)}
            className="text-green-500 hover:text-green-700 text-lg leading-none ml-4"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Stats bar — 6 cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        <StatCard label="Active orders" value={stats.active} />
        <StatCard label="Pending payment" value={stats.pendingPayment} accent="yellow" />
        <StatCard label="In production" value={stats.inProduction} accent="purple" />
        <StatCard label="Today" value={`$${stats.revenueToday.toFixed(2)}`} accent="blue" />
        <StatCard label="This week" value={`$${stats.revenueWeek.toFixed(2)}`} accent="green" />
        <StatCard label="This month" value={`$${stats.revenueMonth.toFixed(2)}`} accent="indigo" />
      </div>

      {/* ── Search + filter + sort row ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by order #, name, email, phone, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(["active", "complete", "archived", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === f
                  ? f === "archived" ? "bg-gray-500 text-white" : "bg-[#16C2F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "active" ? "Active" : f === "complete" ? "Complete" : f === "archived" ? "Archived" : "All"}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f ? "bg-white/25 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#16C2F3] bg-white transition-colors cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Largest total</option>
            <option value="status_asc">By status</option>
          </select>

          <span className="text-sm text-gray-400 whitespace-nowrap">
            {displayed.length} order{displayed.length !== 1 ? "s" : ""}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · {lastSync.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── Status error banner ── */}
      {statusError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{statusError}</p>
          <button
            onClick={() => setStatusError(null)}
            className="text-red-400 hover:text-red-600 text-lg leading-none ml-4"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Orders list ── */}
      {displayed.length === 0 ? (
        <p className="text-gray-400 text-center py-16">
          {search.trim() ? "No orders match your search." : filter === "archived" ? "No archived orders." : "No orders here yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
            return (
              <StaffOrderCard
                key={order.id}
                order={order}
                isExpanded={expandedId === order.id}
                onToggleExpand={() => setExpandedId(expandedId === order.id ? null : order.id)}
                isLoadingStatus={loadingStatus === order.id}
                onStatusUpdate={(s) => handleStatusUpdate(order.id, s as (typeof VALID_STATUSES)[number], order.order_number)}
                archiveLoading={archiveLoading.has(order.id)}
                onArchive={(a) => handleArchive(order.id, order.order_number, a)}
                resendingPayment={resendingPaymentId === order.id}
                resendSuccess={resendSuccessIds.has(order.id)}
                onResendPayment={() => handleResendPayment(order.id, order.order_number)}
                sendingReceipt={sendingReceiptId === order.id}
                receiptSent={receiptSentIds.has(order.id)}
                onSendReceipt={() => handleSendReceipt(order.id, order.order_number, customer?.email ?? "")}
                confirmingEtransfer={confirmingEtransferId === order.id}
                etransferConfirmed={confirmedEtransferIds.has(order.id)}
                onConfirmEtransfer={() => handleConfirmEtransfer(order.id, order.order_number)}
              />
            );
          })}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
