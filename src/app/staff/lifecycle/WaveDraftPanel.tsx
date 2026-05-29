/**
 * WaveDraftPanel — orders that are PAID but the Wave invoice is still DRAFT.
 *
 * The webhook should approve + record payment against the Wave invoice when
 * Clover captures. If `wave_payment_recorded_at` is null on a paid order with
 * a wave_invoice_id, the Wave-side ledger is out of sync.
 *
 * Also catches orders where wave_invoice_id is NULL on a paid order — a hole
 * in the bookkeeping that means Wave has no record of the sale at all.
 */

import Link from "next/link";

export interface WaveDraftRow {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  paid_age_hours: number;
  wave_invoice_id: string | null;
  wave_invoice_number: string | null;
  reason: "draft_unapproved" | "missing_invoice";
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function WaveDraftPanel({ rows }: { rows: WaveDraftRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Bookkeeping</h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">all paid orders reconciled</span>
        </div>
      </section>
    );
  }

  const missing = rows.filter((r) => r.reason === "missing_invoice");
  const drafts = rows.filter((r) => r.reason === "draft_unapproved");

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Bookkeeping — needs attention</h2>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200">
          {missing.length > 0 ? `${missing.length} missing · ` : ""}{drafts.length > 0 ? `${drafts.length} unapproved` : ""}
        </span>
      </div>
      <div className="bg-white border border-amber-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-amber-50/40 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Action</th>
              <th className="px-3 py-2 text-right font-semibold">Paid age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  <Link href={`/staff/orders?focus=${r.id}`} className="text-blue-700 hover:underline">{r.order_number}</Link>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[180px]">{r.customer_name}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-800">${r.total.toFixed(2)}</td>
                <td className="px-3 py-2 text-xs">
                  {r.reason === "missing_invoice" ? (
                    <span className="text-red-700 font-semibold">No invoice on file</span>
                  ) : (
                    <>
                      <span className="font-mono text-amber-700">#{r.wave_invoice_number ?? "?"}</span>
                      <span className="text-gray-500"> · DRAFT (not approved)</span>
                    </>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  {r.reason === "missing_invoice"
                    ? "Create invoice manually in accounting dashboard"
                    : "Open invoice → Approve → Record payment"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-amber-700 font-semibold">{fmtAge(r.paid_age_hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
