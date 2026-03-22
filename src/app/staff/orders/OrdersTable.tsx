"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  NEXT_STATUS,
  NEXT_LABEL,
  DESIGN_LABELS,
  VALID_STATUSES,
} from "@/lib/data/order-constants";
import { CustomerHistoryWidget } from "./CustomerHistoryWidget";

const SUPABASE_STORAGE_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"}/storage/v1/object/public/print-files`;

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

  // Per-order status override select value (in expanded panel)
  const [overrideStatus, setOverrideStatus] = useState<Record<string, string>>({});

  // Staff notes — keyed by order id
  const [staffNoteValues, setStaffNoteValues] = useState<Record<string, string>>(
    () => Object.fromEntries(initialOrders.map((o) => [o.id, o.staff_notes ?? ""]))
  );
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [noteErrors, setNoteErrors] = useState<Record<string, string>>({});

  // Reply state — one reply panel at a time
  const [replyOrderId, setReplyOrderId] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Proof state — one proof panel at a time
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofMessage, setProofMessage] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofSentId, setProofSentId] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // Resend payment link — keyed by order id
  const [resendingPaymentId, setResendingPaymentId] = useState<string | null>(null);
  const [resendSuccessIds, setResendSuccessIds] = useState<Set<string>>(new Set());

  // ── Archive ────────────────────────────────────────────────────────────────────
  const [archiveLoading, setArchiveLoading] = useState<Set<string>>(new Set());
  // Tracks which order has a pending "Mark complete" confirmation (terminal state guard)
  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(null);
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
    setStaffNoteValues((prev) => {
      const updated = { ...prev };
      initialOrders.forEach((o) => {
        if (!(o.id in updated)) updated[o.id] = o.staff_notes ?? "";
      });
      return updated;
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
    setConfirmingComplete(null);
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
      setOverrideStatus((prev) => ({ ...prev, [orderId]: newStatus }));
      showToast(`${orderNumber} → ${STATUS_LABELS[newStatus]}`, "success");
    } catch (err) {
      // Roll back optimistic UI to previous status
      if (prevStatus) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: prevStatus } : o))
        );
        setOverrideStatus((prev) => ({ ...prev, [orderId]: prevStatus }));
      }
      setStatusError(
        `${orderNumber}: ${err instanceof Error ? err.message : "Failed to update status"}`,
      );
    } finally {
      setLoadingStatus(null);
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

  // ── Staff notes save ───────────────────────────────────────────────────────

  async function handleSaveNote(orderId: string) {
    setSavingNoteId(orderId);
    setNoteErrors((prev) => ({ ...prev, [orderId]: "" }));
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_notes: staffNoteValues[orderId] ?? "" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, staff_notes: staffNoteValues[orderId] || null } : o
        )
      );
      setSavedNoteId(orderId);
      setTimeout(
        () => setSavedNoteId((prev) => (prev === orderId ? null : prev)),
        2500
      );
    } catch (err) {
      setNoteErrors((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Save failed",
      }));
    } finally {
      setSavingNoteId(null);
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

  // ── Reply actions ──────────────────────────────────────────────────────────

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

  // ── Proof upload ───────────────────────────────────────────────────────────

  async function handleSendProof(orderId: string) {
    if (proofFiles.length === 0) return;
    setProofUploading(true);
    setProofError(null);
    try {
      const form = new FormData();
      proofFiles.forEach((f) => form.append("files", f));
      if (proofMessage.trim()) form.append("message", proofMessage.trim());
      const res = await fetch(`/api/staff/orders/${orderId}/proof`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        latestProofPath?: string;
        allProofPaths?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setProofSentId(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                proof_storage_path: data.latestProofPath ?? null,
                proof_storage_paths: data.allProofPaths ?? null,
                proof_sent_at: new Date().toISOString(),
              }
            : o
        )
      );
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to send proof");
    } finally {
      setProofUploading(false);
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
            const customer = Array.isArray(order.customers)
              ? order.customers[0]
              : order.customers;
            const nextStatus = NEXT_STATUS[order.status];
            const isExpanded = expandedId === order.id;
            const isLoadingStatus = loadingStatus === order.id;
            const isReplyOpen = replyOrderId === order.id;
            const isProofOpen = proofOrderId === order.id;

            // Artwork files — prefer file_storage_paths[] array, fall back to first order_items path
            const artworkFiles: Array<{ url: string; label: string }> = [];
            if (order.file_storage_paths && order.file_storage_paths.length > 0) {
              order.file_storage_paths.forEach((path, idx) => {
                const filename = path.includes("/") ? path.split("/").pop() : path;
                artworkFiles.push({
                  url: `${SUPABASE_STORAGE_URL}/${path}`,
                  label: `File ${idx + 1}${filename ? ` — ${filename}` : ""}`,
                });
              });
            } else {
              const fileItem = order.order_items?.find((i) => i.file_storage_path);
              if (fileItem?.file_storage_path) {
                artworkFiles.push({
                  url: `${SUPABASE_STORAGE_URL}/${fileItem.file_storage_path}`,
                  label: "Artwork file",
                });
              }
            }

            // Prefer the new array; fall back to the legacy single path for old orders
            const proofUrls: string[] = (
              order.proof_storage_paths && order.proof_storage_paths.length > 0
                ? order.proof_storage_paths
                : order.proof_storage_path
                ? [order.proof_storage_path]
                : []
            ).map((p) => `${SUPABASE_STORAGE_URL}/${p}`);

            const rushFee = order.is_rush
              ? Number(order.total) - Number(order.subtotal) - Number(order.gst)
              : 0;

            // Current value for the status override dropdown
            const currentOverride = overrideStatus[order.id] ?? order.status;

            return (
              <div
                key={order.id}
                className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
                  order.is_archived ? "border-gray-100 opacity-70" : order.is_rush ? "border-orange-300" : "border-gray-200"
                }`}
              >
                {/* ── Summary row ── */}
                <div
                  className={`p-5 cursor-pointer transition-colors ${order.is_archived ? "bg-gray-50 hover:bg-gray-100" : order.is_rush ? "bg-orange-50 hover:bg-orange-100" : "bg-white hover:bg-gray-50"}`}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[#1c1712]">{order.order_number}</span>
                        {order.staff_notes?.startsWith("Manual order") && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 tracking-wide uppercase">
                            Manual
                          </span>
                        )}
                        {order.is_rush && (
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            RUSH
                          </span>
                        )}
                        <span
                          aria-label={`Status: ${STATUS_LABELS[order.status] ?? order.status}`}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                        {artworkFiles.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            📎 {artworkFiles.length > 1 ? `${artworkFiles.length} files` : "Artwork"}
                          </span>
                        )}
                        {proofUrls.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            🖼 {proofUrls.length > 1 ? `${proofUrls.length} proofs sent` : "Proof sent"}
                          </span>
                        )}
                        {order.staff_notes && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            📝 Note
                          </span>
                        )}
                        {order.wave_payment_recorded_at && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            W Paid
                          </span>
                        )}
                        {order.wave_invoice_id && !order.wave_payment_recorded_at &&
                          (order.status === "payment_received" || order.status === "ready_for_pickup") && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            W Unpaid
                          </span>
                        )}
                        {order.is_archived && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            Archived
                          </span>
                        )}
                      </div>

                      {/* Customer — name + company */}
                      <p className="text-sm font-semibold text-gray-800">
                        {customer?.name ?? "Unknown"}
                        {customer?.company ? ` — ${customer.company}` : ""}
                      </p>

                      {/* Product summary — what was ordered */}
                      {order.order_items && order.order_items.length > 0 && (
                        <p className="text-xs font-medium text-gray-600 mt-0.5">
                          {order.order_items[0].product_name}
                          {(order.order_items[0].qty ?? 1) > 1 ? ` × ${order.order_items[0].qty}` : ""}
                          {order.order_items.length > 1 ? ` · +${order.order_items.length - 1} more` : ""}
                        </p>
                      )}

                      {/* Meta row — email · phone · payment · total · date */}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {customer?.email}
                        {customer?.phone ? ` · ${customer.phone}` : ""}
                        {" · "}
                        {order.payment_method === "clover_card" ? "Card" : "e-Transfer"}
                        {" · $"}
                        {Number(order.total).toFixed(2)} CAD
                        {" · "}
                        {new Date(order.created_at).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {nextStatus && !order.is_archived && (
                        confirmingComplete === order.id ? (
                          <>
                            <button
                              onClick={() => setConfirmingComplete(null)}
                              className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void handleStatusUpdate(order.id, nextStatus as (typeof VALID_STATUSES)[number], order.order_number)}
                              disabled={isLoadingStatus}
                              className="bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              {isLoadingStatus ? "Sending…" : "Yes — sends review email"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (nextStatus === "complete") {
                                setConfirmingComplete(order.id);
                              } else {
                                void handleStatusUpdate(order.id, nextStatus as (typeof VALID_STATUSES)[number], order.order_number);
                              }
                            }}
                            disabled={isLoadingStatus}
                            className="bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            {isLoadingStatus ? "Updating…" : NEXT_LABEL[order.status]}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
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

                    {/* Customer info block */}
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Customer</p>
                        <p className="text-sm font-semibold text-gray-800">{customer?.name ?? "—"}</p>
                        {customer?.company && (
                          <p className="text-xs text-gray-500">{customer.company}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                        <a
                          href={`mailto:${customer?.email}`}
                          className="text-sm text-[#16C2F3] hover:underline"
                        >
                          {customer?.email ?? "—"}
                        </a>
                      </div>
                      {customer?.phone && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-sm text-[#16C2F3] hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Payment</p>
                        <p className="text-sm text-gray-700">
                          {order.payment_method === "clover_card" ? "Credit card" : "Interac e-Transfer"}
                        </p>
                      </div>
                    </div>

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

                    {/* Wave Accounting status */}
                    {order.wave_invoice_id && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Wave Accounting
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <a
                            href="https://next.waveapps.com/businesses/0fea8474-b467-4a12-b558-efa4c74c7e3c/invoicing/invoices"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#16C2F3] hover:underline font-semibold"
                          >
                            Open Wave →
                          </a>
                          {order.wave_invoice_approved_at ? (
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                              Invoice approved
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                          {order.wave_payment_recorded_at ? (
                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                              ✓ Payment recorded
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              {order.payment_method === "clover_card"
                                ? "Card — pending webhook"
                                : "Awaiting payment confirmation"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Customer notes — amber */}
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

                    {/* Production notes (staff only — slate) */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Production notes
                        </p>
                        <span className="text-xs text-slate-400">— staff only, never sent to customer</span>
                      </div>
                      <textarea
                        value={staffNoteValues[order.id] ?? ""}
                        onChange={(e) =>
                          setStaffNoteValues((prev) => ({ ...prev, [order.id]: e.target.value }))
                        }
                        rows={3}
                        placeholder="Internal notes: file needs bleed, waiting on design approval, call before pickup, special instructions…"
                        className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 transition-colors resize-none font-sans text-gray-700 placeholder-slate-400"
                      />
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleSaveNote(order.id)}
                          disabled={savingNoteId === order.id}
                          className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {savingNoteId === order.id ? "Saving…" : "Save note"}
                        </button>
                        {savedNoteId === order.id && (
                          <span className="text-xs text-green-600 font-semibold">✓ Saved</span>
                        )}
                        {noteErrors[order.id] && (
                          <span className="text-xs text-red-600">{noteErrors[order.id]}</span>
                        )}
                      </div>
                    </div>

                    {/* Artwork files — all files */}
                    {artworkFiles.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Artwork ({artworkFiles.length} file{artworkFiles.length !== 1 ? "s" : ""})
                        </p>
                        <div className="space-y-1.5">
                          {artworkFiles.map((f, idx) => (
                            <a
                              key={idx}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-[#16C2F3] font-semibold hover:underline"
                            >
                              📎 {f.label} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change status (override — any direction) */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Change status
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <select
                          value={currentOverride}
                          onChange={(e) =>
                            setOverrideStatus((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#16C2F3] bg-white transition-colors"
                        >
                          {VALID_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => void handleStatusUpdate(order.id, currentOverride as (typeof VALID_STATUSES)[number], order.order_number)}
                          disabled={isLoadingStatus || currentOverride === order.status}
                          className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoadingStatus ? "Updating…" : "Update →"}
                        </button>
                        <span className="text-xs text-gray-400">
                          Currently:{" "}
                          <span
                            aria-label={`Status: ${STATUS_LABELS[order.status] ?? order.status}`}
                            className={`font-semibold px-1.5 py-0.5 rounded ${
                              STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Resend payment link — only for pending_payment orders */}
                    {order.status === "pending_payment" && (
                      <div>
                        <button
                          onClick={() => void handleResendPayment(order.id, order.order_number)}
                          disabled={resendingPaymentId === order.id}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                        >
                          {resendingPaymentId === order.id
                            ? "Sending…"
                            : resendSuccessIds.has(order.id)
                            ? "✓ Resent!"
                            : "↩ Resend payment link"}
                        </button>
                        <p className="text-xs text-gray-400 mt-1">
                          Re-emails the customer a fresh payment link
                        </p>
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

                    {/* Customer history */}
                    <div className="pt-2 border-t border-gray-100">
                      <CustomerHistoryWidget orderId={order.id} currentOrderId={order.id} />
                    </div>

                    {/* Archive / Unarchive */}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                      {!order.is_archived ? (
                        <button
                          onClick={() => void handleArchive(order.id, order.order_number, true)}
                          disabled={archiveLoading.has(order.id)}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {archiveLoading.has(order.id) ? "Archiving…" : "Archive order"}
                        </button>
                      ) : (
                        <button
                          onClick={() => void handleArchive(order.id, order.order_number, false)}
                          disabled={archiveLoading.has(order.id)}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                        >
                          {archiveLoading.has(order.id) ? "Restoring…" : "↩ Unarchive order"}
                        </button>
                      )}
                      <span className="text-xs text-gray-300">Orders are never deleted</span>
                    </div>

                    {/* Upload proof */}
                    <div>
                      <button
                        onClick={() => {
                          if (isProofOpen) {
                            setProofOrderId(null);
                          } else {
                            setProofOrderId(order.id);
                            setProofFiles([]);
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

                      {/* Show list of all sent proofs */}
                      {proofUrls.length > 0 && !isProofOpen && (
                        <div className="mt-1.5 space-y-1">
                          {proofUrls.map((url, i) => (
                            <p key={url} className="text-xs text-violet-600">
                              ✓ Proof{proofUrls.length > 1 ? ` ${i + 1}` : ""} sent
                              {i === 0 && order.proof_sent_at
                                ? ` on ${new Date(order.proof_sent_at).toLocaleDateString("en-CA", {
                                    month: "short",
                                    day: "numeric",
                                  })}`
                                : ""}
                              {" · "}
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                View →
                              </a>
                            </p>
                          ))}
                        </div>
                      )}

                      {isProofOpen && (
                        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                              Proof files — select one or more (JPG, PNG, WebP, PDF)
                            </label>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              multiple
                              onChange={(e) => setProofFiles(Array.from(e.target.files ?? []))}
                              disabled={proofSentId === order.id}
                              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                            {proofFiles.length > 1 && (
                              <p className="text-xs text-violet-600 mt-1">
                                {proofFiles.length} files selected
                              </p>
                            )}
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
                              ✓ {proofFiles.length > 1 ? `${proofFiles.length} proofs` : "Proof"} sent to {customer?.email}
                            </p>
                          ) : (
                            <button
                              onClick={() => handleSendProof(order.id)}
                              disabled={proofUploading || proofFiles.length === 0}
                              className="bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {proofUploading
                                ? "Uploading…"
                                : proofFiles.length > 1
                                ? `Send ${proofFiles.length} proofs to customer →`
                                : "Send proof to customer →"}
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
