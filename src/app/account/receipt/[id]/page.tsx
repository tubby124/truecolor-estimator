"use client";

/**
 * /account/receipt/[id]
 *
 * Permanent, printable receipt page for a specific order.
 * Auth required — redirects to /account if not logged in.
 * Ownership enforced — 404 if order doesn't belong to this user.
 *
 * Shareable with: truecolorprinting.ca/account/receipt/<order-uuid>
 * Useful for: sending to accountants, bookmarking, browser-print-to-PDF.
 */

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  gst: number;
  pst: number | null;
  total: number;
  is_rush: boolean;
  discount_code: string | null;
  discount_amount: number | null;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/account");
        return;
      }

      setEmail(session.user.email ?? "");

      // Fetch this specific order via the account orders API
      const res = await fetch("/api/account/orders", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json() as { orders?: Order[] };
      const found = data.orders?.find((o) => o.id === id) ?? null;

      if (!found) {
        setNotFound(true);
      } else {
        setOrder(found);
      }
      setLoading(false);
    }
    void load();
  }, [id, router]);

  async function handleEmailReceipt() {
    setEmailSending(true);
    setEmailError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/account/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ orderId: id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Failed to send");
      }
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send receipt");
    } finally {
      setEmailSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4efe9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#16C2F3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-[#f4efe9] flex flex-col items-center justify-center gap-4">
        <p className="text-[#1c1712] font-bold text-lg">Receipt not found</p>
        <Link href="/account" className="text-sm text-[#16C2F3] font-semibold hover:underline">
          ← Back to your orders
        </Link>
      </div>
    );
  }

  const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];
  const isPaid = PAID_STATUSES.includes(order.status);
  const pst = order.pst ?? 0;
  const rushFee = order.is_rush
    ? Math.round((Number(order.total) - Number(order.subtotal) - Number(order.gst) - pst) * 100) / 100
    : 0;

  const orderDate = new Date(order.created_at).toLocaleDateString("en-CA", {
    month: "long", day: "numeric", year: "numeric",
  });

  const paymentLabel =
    order.payment_method === "clover_card"
      ? "Credit / debit card"
      : order.payment_method === "wave"
      ? "Wave Invoice"
      : "Interac e-Transfer";

  return (
    <div className="min-h-screen bg-[#f4efe9] py-10 px-4 print:bg-white print:py-0 print:px-0">

      {/* Back link — hidden on print */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link href="/account" className="text-sm text-gray-400 hover:text-[#16C2F3] transition-colors">
          ← Back to orders
        </Link>
        <span className="text-xs text-gray-300">truecolorprinting.ca/account/receipt/{id}</span>
      </div>

      {/* Receipt card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="bg-[#1c1712] px-8 py-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#16C2F3] font-black text-xl tracking-tight">TRUE COLOR</span>
              <span className="text-white/50 text-xs">Display Printing</span>
            </div>
            <p className="text-white/40 text-xs">216 33rd St W, Saskatoon SK · info@true-color.ca · (306) 954-8688</p>
          </div>
          {isPaid && (
            <span className="bg-[#16C2F3] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              PAID
            </span>
          )}
        </div>

        {/* Title row */}
        <div className="px-8 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c1712] tracking-tight">
              {isPaid ? "Payment Receipt" : "Order Summary"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{orderDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Order</p>
            <p className="text-lg font-black text-[#1c1712]">{order.order_number}</p>
          </div>
        </div>

        {/* Customer + status row */}
        <div className="px-8 py-4 border-b border-gray-100 bg-gray-50 text-sm text-gray-500 flex flex-wrap gap-x-8 gap-y-1">
          <p><span className="font-semibold text-gray-600">Billed to:</span> {email}</p>
          <p>
            <span className="font-semibold text-gray-600">Status:</span>{" "}
            <span className={`inline-block font-semibold px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </p>
          <p><span className="font-semibold text-gray-600">Payment:</span> {paymentLabel}</p>
        </div>

        {/* Items */}
        <div className="px-8 py-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">Description</th>
                <th className="text-right text-xs font-semibold text-gray-400 pb-2 w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.order_items.map((item) => {
                const sizeLabel = item.width_in && item.height_in ? ` — ${item.width_in}×${item.height_in}"` : "";
                const sidesLabel = item.sides === 2 ? " · 2-sided" : "";
                return (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 text-[#1c1712]">
                      <span className="font-semibold block">{item.product_name}</span>
                      <span className="text-xs text-gray-400">Qty {item.qty}{sizeLabel}{sidesLabel}</span>
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums text-[#1c1712]">
                      ${Number(item.line_total).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-6">
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
        <div className="px-8 pb-4">
          <p className="text-xs text-gray-400 text-center">
            True Color Display Printing Ltd. &nbsp;·&nbsp; GST# applies &nbsp;·&nbsp; All amounts in CAD
          </p>
        </div>

        {/* Actions — hidden on print */}
        <div className="px-8 pb-8 space-y-3 print:hidden">
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
          <button
            onClick={() => window.print()}
            className="w-full bg-[#1c1712] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
          >
            Print / Save PDF
          </button>
          <Link
            href="/account"
            className="block text-center text-sm text-gray-400 hover:text-[#16C2F3] transition-colors py-1"
          >
            ← Back to all orders
          </Link>
        </div>

      </div>
    </div>
  );
}
