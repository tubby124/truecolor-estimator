"use client";

import { useState } from "react";

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

interface Customer {
  name: string;
  email: string;
  company: string | null;
}

// Supabase returns joined rows as arrays even for many-to-one relations
export interface Order {
  id: string;
  order_number: string;
  status: string;
  is_rush: boolean;
  total: number;
  payment_method: string;
  created_at: string;
  customers: Customer[] | null;
}

interface Props {
  initialOrders: Order[];
}

export function OrdersTable({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setLoading(orderId);
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
      setLoading(null);
    }
  }

  const filtered = orders.filter((o) => {
    if (filter === "active") return o.status !== "complete";
    if (filter === "complete") return o.status === "complete";
    return true;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
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
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No orders here yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const nextStatus = NEXT_STATUS[order.status];
            const isLoading = loading === order.id;
            // Supabase returns customers as array for joins; grab first element
            const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;

            return (
              <div
                key={order.id}
                className={`border rounded-xl p-5 ${
                  order.is_rush ? "border-orange-300 bg-orange-50" : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1c1712]">{order.order_number}</span>
                      {order.is_rush && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                          RUSH
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
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

                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, nextStatus)}
                      disabled={isLoading}
                      className="shrink-0 bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {isLoading ? "Updating…" : NEXT_LABEL[order.status]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
