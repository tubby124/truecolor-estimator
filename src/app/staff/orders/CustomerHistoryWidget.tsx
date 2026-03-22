"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";

interface HistoryOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  is_rush: boolean;
  order_items: Array<{ product_name: string; qty: number }> | null;
}

interface CustomerHistory {
  customer: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
  orderCount: number;
  totalSpend: number;
  orders: HistoryOrder[];
}

interface Props {
  orderId: string;
  currentOrderId: string;
}

export function CustomerHistoryWidget({ orderId, currentOrderId }: Props) {
  const [data, setData] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/staff/orders/${orderId}/customer-history`);
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to load");
        }
        const json = (await res.json()) as CustomerHistory;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load customer history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Customer History
        </p>
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Customer History
        </p>
        <p className="text-sm text-red-500">{error ?? "No data"}</p>
      </div>
    );
  }

  const { customer, orderCount, totalSpend, orders } = data;
  const isReturning = orderCount > 1;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Customer History
        </p>
        {isReturning && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Returning customer
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-400">Orders</span>{" "}
          <span className="font-bold text-[#1c1712] tabular-nums">{orderCount}</span>
        </div>
        <div>
          <span className="text-gray-400">Lifetime spend</span>{" "}
          <span className="font-bold text-[#1c1712] tabular-nums">${totalSpend.toFixed(2)} CAD</span>
        </div>
        {customer.phone && (
          <div>
            <span className="text-gray-400">Phone</span>{" "}
            <a
              href={`tel:${customer.phone}`}
              className="font-semibold text-[#16C2F3] hover:underline"
            >
              {customer.phone}
            </a>
          </div>
        )}
        {customer.company && (
          <div>
            <span className="text-gray-400">Company</span>{" "}
            <span className="font-semibold text-gray-700">{customer.company}</span>
          </div>
        )}
      </div>

      {/* Past orders list */}
      {orders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Order</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Items</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">Date</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const isCurrent = o.id === currentOrderId;
                const itemSummary = o.order_items?.length
                  ? o.order_items[0].product_name +
                    (o.order_items[0].qty > 1 ? ` ×${o.order_items[0].qty}` : "") +
                    (o.order_items.length > 1 ? ` +${o.order_items.length - 1}` : "")
                  : "—";

                return (
                  <tr
                    key={o.id}
                    className={isCurrent ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold tabular-nums ${isCurrent ? "text-blue-700" : "text-gray-800"}`}>
                        {o.order_number}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Current
                        </span>
                      )}
                      {o.is_rush && (
                        <span className="ml-1.5 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Rush
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 hidden sm:table-cell max-w-[180px] truncate">
                      {itemSummary}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 hidden md:table-cell whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[o.status as keyof typeof STATUS_COLORS] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-800">
                      ${Number(o.total).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
