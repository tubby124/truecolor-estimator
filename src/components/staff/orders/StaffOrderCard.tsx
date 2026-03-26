"use client";

import { useState } from "react";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  NEXT_STATUS,
  NEXT_LABEL,
  DESIGN_LABELS,
  VALID_STATUSES,
} from "@/lib/data/order-constants";
import { CustomerHistoryWidget } from "@/app/staff/orders/CustomerHistoryWidget";
import type { Order } from "@/app/staff/orders/OrdersTable";

const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"}/storage/v1/object/public/print-files`;

interface StaffOrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLoadingStatus: boolean;
  onStatusUpdate: (newStatus: string) => void;
  archiveLoading: boolean;
  onArchive: (archive: boolean) => void;
  resendingPayment: boolean;
  resendSuccess: boolean;
  onResendPayment: () => void;
  sendingReceipt: boolean;
  receiptSent: boolean;
  onSendReceipt: () => void;
}

export function StaffOrderCard({
  order,
  isExpanded,
  onToggleExpand,
  isLoadingStatus,
  onStatusUpdate,
  archiveLoading,
  onArchive,
  resendingPayment,
  resendSuccess,
  onResendPayment,
  sendingReceipt,
  receiptSent,
  onSendReceipt,
}: StaffOrderCardProps) {
  const [overrideStatus, setOverrideStatus] = useState<string>(order.status);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [staffNoteValue, setStaffNoteValue] = useState(order.staff_notes ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofMessage, setProofMessage] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofSentId, setProofSentId] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const nextStatus = NEXT_STATUS[order.status];

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
  const currentOverride = overrideStatus;

  async function saveNote() {
    setSavingNote(true);
    setNoteError("");
    try {
      const res = await fetch(`/api/staff/orders/${order.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_notes: staffNoteValue }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2500);
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingNote(false);
    }
  }

  function toggleReply() {
    if (replyOpen) {
      setReplyOpen(false);
      return;
    }
    setReplyOpen(true);
    setReplySubject(`Re: True Color Order ${order.order_number}`);
    setReplyMessage("");
    setReplySending(false);
    setReplySent(false);
    setReplyError(null);
  }

  async function sendReply() {
    if (!replySubject.trim() || !replyMessage.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/staff/orders/${order.id}/reply`, {
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

  async function sendProof() {
    if (proofFiles.length === 0) return;
    setProofUploading(true);
    setProofError(null);
    try {
      const form = new FormData();
      proofFiles.forEach((f) => form.append("files", f));
      if (proofMessage.trim()) form.append("message", proofMessage.trim());
      const res = await fetch(`/api/staff/orders/${order.id}/proof`, { method: "POST", body: form });
      const data = (await res.json()) as { ok?: boolean; latestProofPath?: string; allProofPaths?: string[]; error?: string; };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setProofSentId(order.id);
      // Note: proof paths update happens via Realtime in parent — no local state update needed
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to send proof");
    } finally {
      setProofUploading(false);
    }
  }

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
        order.is_archived ? "border-gray-100 opacity-70" : order.is_rush ? "border-orange-300" : "border-gray-200"
      }`}
    >
      {/* ── Summary row ── */}
      <div
        className={`p-5 cursor-pointer transition-colors ${order.is_archived ? "bg-gray-50 hover:bg-gray-100" : order.is_rush ? "bg-orange-50 hover:bg-orange-100" : "bg-white hover:bg-gray-50"}`}
        onClick={() => onToggleExpand()}
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
              confirmingComplete ? (
                <>
                  <button
                    onClick={() => setConfirmingComplete(false)}
                    className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onStatusUpdate(nextStatus)}
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
                      setConfirmingComplete(true);
                    } else {
                      onStatusUpdate(nextStatus);
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
              onClick={() => onToggleExpand()}
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
              value={staffNoteValue}
              onChange={(e) => setStaffNoteValue(e.target.value)}
              rows={3}
              placeholder="Internal notes: file needs bleed, waiting on design approval, call before pickup, special instructions…"
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 transition-colors resize-none font-sans text-gray-700 placeholder-slate-400"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => void saveNote()}
                disabled={savingNote}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {savingNote ? "Saving…" : "Save note"}
              </button>
              {savedNote && (
                <span className="text-xs text-green-600 font-semibold">✓ Saved</span>
              )}
              {noteError && (
                <span className="text-xs text-red-600">{noteError}</span>
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
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#16C2F3] bg-white transition-colors"
              >
                {VALID_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onStatusUpdate(currentOverride)}
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
                onClick={() => onResendPayment()}
                disabled={resendingPayment}
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
              >
                {resendingPayment
                  ? "Sending…"
                  : resendSuccess
                  ? "✓ Resent!"
                  : "↩ Resend payment link"}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Re-emails the customer a fresh payment link
              </p>
            </div>
          )}

          {/* Send receipt — only for paid orders */}
          {order.status !== "pending_payment" && customer?.email && (
            <div>
              <button
                onClick={() => onSendReceipt()}
                disabled={sendingReceipt}
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-violet-400 text-violet-600 hover:bg-violet-50 disabled:opacity-50 transition-colors"
              >
                {sendingReceipt
                  ? "Sending…"
                  : receiptSent
                  ? "✓ Receipt sent!"
                  : "🧾 Send receipt"}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Emails a payment receipt to {customer.email}
              </p>
            </div>
          )}

          {/* Message customer */}
          <div>
            <button
              onClick={() => toggleReply()}
              className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                replyOpen
                  ? "border-gray-300 bg-white text-gray-500"
                  : "border-[#16C2F3] text-[#16C2F3] hover:bg-[#16C2F3] hover:text-white"
              }`}
            >
              {replyOpen ? "✕ Close message" : "✉ Message customer"}
            </button>

            {replyOpen && (
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
                    onClick={() => void sendReply()}
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
                onClick={() => onArchive(true)}
                disabled={archiveLoading}
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {archiveLoading ? "Archiving…" : "Archive order"}
              </button>
            ) : (
              <button
                onClick={() => onArchive(false)}
                disabled={archiveLoading}
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-colors"
              >
                {archiveLoading ? "Restoring…" : "↩ Unarchive order"}
              </button>
            )}
            <span className="text-xs text-gray-300">Orders are never deleted</span>
          </div>

          {/* Upload proof */}
          <div>
            <button
              onClick={() => {
                if (proofOpen) {
                  setProofOpen(false);
                } else {
                  setProofOpen(true);
                  setProofFiles([]);
                  setProofMessage("");
                  setProofSentId(null);
                  setProofError(null);
                }
              }}
              className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                proofOpen
                  ? "border-gray-300 bg-white text-gray-500"
                  : "border-violet-400 text-violet-600 hover:bg-violet-50"
              }`}
            >
              {proofOpen ? "✕ Close proof panel" : "🖼 Upload proof"}
            </button>

            {/* Show list of all sent proofs */}
            {proofUrls.length > 0 && !proofOpen && (
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

            {proofOpen && (
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
                    disabled={proofSentId !== null}
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
                    disabled={proofSentId !== null}
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

                {proofSentId !== null ? (
                  <p className="text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 font-semibold">
                    ✓ {proofFiles.length > 1 ? `${proofFiles.length} proofs` : "Proof"} sent to {customer?.email}
                  </p>
                ) : (
                  <button
                    onClick={() => void sendProof()}
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
}
