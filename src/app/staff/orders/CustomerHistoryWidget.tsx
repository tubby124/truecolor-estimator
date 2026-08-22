"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";
import { collectOrderAssetPaths } from "@/lib/orders/order-assets";

const STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"}/storage/v1/object/public/print-files`;

type HistoryItem = {
  id: string;
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  design_status: string;
  line_total: number;
  category: string;
  material_code: string | null;
  addons: string[] | null;
  file_storage_path: string | null;
};

interface HistoryOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  subtotal: number;
  gst: number;
  pst: number | null;
  total: number;
  is_rush: boolean;
  payment_method: string | null;
  notes: string | null;
  staff_notes: string | null;
  file_storage_paths: string[] | null;
  proof_storage_path: string | null;
  proof_storage_paths: string[] | null;
  proof_sent_at: string | null;
  order_items: HistoryItem[] | null;
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

function assetLabel(path: string, index: number, kind: "Artwork" | "Proof"): string {
  const filename = path.split("/").pop();
  return `${kind} ${index + 1}${filename ? ` — ${filename}` : ""}`;
}

function JobRecord({ order, customer }: { order: HistoryOrder; customer: CustomerHistory["customer"] }) {
  const artwork = collectOrderAssetPaths(order);
  const proofs = collectOrderAssetPaths(order, "proof");
  const items = order.order_items ?? [];

  function recreateOrder() {
    window.dispatchEvent(new CustomEvent("tc:recreate-order", { detail: { customer, order } }));
  }

  return (
    <section className="mt-3 rounded-xl border border-[#16C2F3] bg-[#f8fdff] p-4 sm:p-5" aria-label={`Job record for ${order.order_number}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#168eb2]">Full job record</p>
          <h3 className="mt-1 text-base font-bold text-[#1c1712]">{order.order_number}</h3>
          <p className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
            {order.payment_method ? ` · ${order.payment_method.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={recreateOrder}
          className="min-h-10 rounded-lg bg-[#16C2F3] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0fa8d6]"
        >
          Recreate this job →
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No item detail was retained for this older order.</p>
        ) : items.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1c1712]">{item.product_name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {item.width_in && item.height_in ? `${item.width_in}×${item.height_in}" · ` : ""}
                  {item.sides === 2 ? "Double-sided" : "Single-sided"} · Qty {item.qty}
                  {item.material_code ? ` · ${item.material_code}` : ""}
                </p>
                {item.addons && item.addons.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">Add-ons: {item.addons.join(", ")}</p>
                )}
              </div>
              <p className="shrink-0 font-bold tabular-nums text-[#1c1712]">${Number(item.line_total).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Charges on this job</p>
          <dl className="mt-2 space-y-1.5 text-gray-600">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">${Number(order.subtotal).toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt>GST</dt><dd className="tabular-nums">${Number(order.gst).toFixed(2)}</dd></div>
            {Number(order.pst ?? 0) > 0 && <div className="flex justify-between"><dt>PST</dt><dd className="tabular-nums">${Number(order.pst).toFixed(2)}</dd></div>}
            <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-[#1c1712]"><dt>Total</dt><dd className="tabular-nums">${Number(order.total).toFixed(2)} CAD</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Stored files</p>
          {artwork.length === 0 && proofs.length === 0 ? (
            <p className="mt-2 text-gray-500">No artwork or proof was stored with this order.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {artwork.map((path, index) => <a key={path} href={`${STORAGE_URL}/${path}`} target="_blank" rel="noopener noreferrer" className="block font-semibold text-[#16C2F3] hover:underline">📎 {assetLabel(path, index, "Artwork")} →</a>)}
              {proofs.map((path, index) => <a key={path} href={`${STORAGE_URL}/${path}`} target="_blank" rel="noopener noreferrer" className="block font-semibold text-violet-700 hover:underline">🖼 {assetLabel(path, index, "Proof")} →</a>)}
            </div>
          )}
        </div>
      </div>

      {(order.notes || order.staff_notes) && (
        <div className="mt-4 space-y-2 text-sm">
          {order.notes && <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-900"><strong>Customer notes:</strong> {order.notes}</p>}
          {order.staff_notes && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700"><strong>Internal notes:</strong> {order.staff_notes}</p>}
        </div>
      )}
    </section>
  );
}

export function CustomerHistoryWidget({ orderId, currentOrderId }: Props) {
  const [data, setData] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/staff/orders/${orderId}/customer-history`);
        const body = (await res.json()) as CustomerHistory & { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Failed to load");
        if (!cancelled) {
          setData(body);
          setSelectedOrderId(currentOrderId);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load customer history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [orderId, currentOrderId]);

  if (loading) return <div><p className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer history</p><p className="mt-3 animate-pulse text-sm text-gray-400">Loading…</p></div>;
  if (error || !data) return <div><p className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer history</p><p className="mt-3 text-sm text-red-500">{error ?? "No data"}</p></div>;

  const { customer, orderCount, totalSpend, orders } = data;
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer history</p>
        {orderCount > 1 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Returning customer</span>}
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span><span className="text-gray-400">Orders </span><strong className="tabular-nums text-[#1c1712]">{orderCount}</strong></span>
        <span><span className="text-gray-400">Lifetime spend </span><strong className="tabular-nums text-[#1c1712]">${totalSpend.toFixed(2)} CAD</strong></span>
        {customer.company && <span><span className="text-gray-400">Company </span><strong className="text-gray-700">{customer.company}</strong></span>}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {orders.map((order) => {
          const isCurrent = order.id === currentOrderId;
          const selected = order.id === selectedOrderId;
          const summary = order.order_items?.length ? `${order.order_items[0].product_name}${order.order_items[0].qty > 1 ? ` ×${order.order_items[0].qty}` : ""}${order.order_items.length > 1 ? ` +${order.order_items.length - 1}` : ""}` : "No retained item details";
          return <button key={order.id} type="button" onClick={() => setSelectedOrderId(selected ? null : order.id)} aria-expanded={selected} className={`flex min-h-14 w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#16C2F3] ${selected ? "bg-[#f0fbff]" : "hover:bg-gray-50"}`}>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><strong className="text-sm text-[#1c1712]">{summary}</strong>{isCurrent && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">Current</span>}{order.is_rush && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-700">Rush</span>}</span><span className="mt-0.5 block text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} · {order.order_number}</span></span>
            <span className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:block ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status}</span>
            <strong className="shrink-0 text-sm tabular-nums text-[#1c1712]">${Number(order.total).toFixed(2)}</strong><span className="text-gray-400" aria-hidden="true">{selected ? "▲" : "▼"}</span>
          </button>;
        })}
      </div>
      {selectedOrder && <JobRecord order={selectedOrder} customer={customer} />}
    </div>
  );
}
