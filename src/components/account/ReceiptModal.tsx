"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";
import { formatDate } from "./helpers";
import type { Order } from "./types";

export function ReceiptModal({ order, email, onClose }: { order: Order; email: string; onClose: () => void; }) {
  const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];
  const isPaid = PAID_STATUSES.includes(order.status);

  const pst = order.pst ?? 0;
  const rushFee =
    order.is_rush
      ? Math.round((Number(order.total) - Number(order.subtotal) - Number(order.gst) - pst) * 100) / 100
      : 0;

  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleEmailReceipt() {
    setEmailSending(true);
    setEmailError(null);
    try {
      const supabase = createClient();
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch("/api/account/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s?.access_token ?? ""}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send receipt");
    } finally {
      setEmailSending(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:bg-white print:p-0 print:block"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">

        {/* Header */}
        <div className="bg-[#1c1712] px-6 py-5 rounded-t-2xl print:rounded-none flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#16C2F3] font-black text-lg tracking-tight">TRUE COLOR</span>
              <span className="text-white/60 text-xs">Display Printing</span>
            </div>
            <p className="text-white/50 text-xs">216 33rd St W, Saskatoon SK &nbsp;·&nbsp; info@true-color.ca &nbsp;·&nbsp; (306) 954-8688</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none print:hidden"
            aria-label="Close receipt"
          >
            &times;
          </button>
        </div>

        {/* Receipt title */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1c1712] tracking-tight">
              {isPaid ? "Payment Receipt" : "Order Summary"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Order</p>
            <p className="text-base font-black text-[#1c1712]">{order.order_number}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 space-y-0.5">
          <p><span className="font-semibold text-gray-600">Billed to:</span> {email}</p>
          <p>
            <span className="font-semibold text-gray-600">Status:</span>{" "}
            <span className={`inline-block font-semibold px-2 py-0.5 rounded-full text-[11px] ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </p>
          {order.payment_method && (
            <p>
              <span className="font-semibold text-gray-600">Payment method:</span>{" "}
              {order.payment_method === "clover_card" ? "Credit / debit card" : "Interac e-Transfer"}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-2">Description</th>
                <th className="text-right text-xs font-semibold text-gray-400 pb-2 w-20">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.order_items.map((item) => {
                const sizeLabel =
                  item.width_in && item.height_in
                    ? ` — ${item.width_in}×${item.height_in}"`
                    : "";
                const sidesLabel = item.sides === 2 ? " · 2-sided" : "";
                return (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-2 text-[#1c1712]">
                      <span className="font-semibold">{item.product_name}</span>
                      <span className="block text-xs text-gray-400">
                        {`Qty ${item.qty}${sizeLabel}${sidesLabel}`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-[#1c1712]">
                      ${Number(item.line_total).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 pb-4">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {order.is_rush && rushFee > 0 && (
              <div className="flex justify-between px-4 py-2 text-sm bg-orange-50 text-orange-700">
                <span>Rush fee (same-day priority)</span>
                <span className="font-semibold tabular-nums">+${rushFee.toFixed(2)}</span>
              </div>
            )}
            {order.discount_amount && order.discount_amount > 0 ? (
              <div className="flex justify-between px-4 py-2 text-sm bg-green-50 text-green-700">
                <span>Discount{order.discount_code ? ` (${order.discount_code})` : ""}</span>
                <span className="font-semibold tabular-nums">−${Number(order.discount_amount).toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between px-4 py-2 text-sm text-gray-500 border-t border-gray-100">
              <span>Subtotal</span>
              <span className="tabular-nums">${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 text-sm text-gray-500">
              <span>GST (5%)</span>
              <span className="tabular-nums">${Number(order.gst).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 text-sm text-gray-500">
              <span>PST (6%)</span>
              <span className="tabular-nums">${pst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-[#1c1712] text-white font-bold text-base">
              <span>Total (CAD)</span>
              <span className="tabular-nums">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-xs text-gray-400 text-center">
            True Color Display Printing Ltd. &nbsp;·&nbsp; GST# applies &nbsp;·&nbsp; All amounts in CAD
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3 print:hidden">
          {isPaid && (
            <div>
              {emailSent ? (
                <p className="text-center text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl py-3">
                  ✓ Receipt sent to {email}
                </p>
              ) : (
                <button
                  onClick={() => void handleEmailReceipt()}
                  disabled={emailSending}
                  className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors"
                >
                  {emailSending ? "Sending…" : `✉ Email receipt to ${email}`}
                </button>
              )}
              {emailError && (
                <p className="text-xs text-red-600 mt-1.5 text-center">{emailError}</p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#1c1712] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
          <Link
            href={`/account/receipt/${order.id}`}
            className="block text-center text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
            target="_blank"
          >
            Open as full page (shareable link) ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
