/**
 * RefundsPendingPanel — orders flagged for a manual Clover refund.
 *
 * Today's reprice flow (commit 1f7d8b4 + 6456662) sends the customer a
 * "refund processing 3-5 days" email on the DECREASE path but does NOT
 * fire the actual Clover refund API call — that's an explicit-owner-approval
 * gate. This panel surfaces every order in that limbo state so Albert /
 * Hasan can see the manual-refund queue + age + amount, and mark each as
 * refunded after processing in Clover.
 *
 * Data source: audit_events rows with event_type='order.repriced' AND
 * detail.delta < 0. Joined with orders for context.
 *
 * Marking refunded: writes a follow-up audit_events row event_type=
 * 'order.refund_processed' so the original repriced event drops off this
 * panel.
 */

import Link from "next/link";

export interface RefundPendingRow {
  audit_id: string;
  audit_at: string;
  order_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  refund_amount: number;
  new_total: number;
  original_total: number;
  reason: string;
  age_hours: number;
  already_processed: boolean;
}

function fmtAge(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function RefundsPendingPanel({ rows }: { rows: RefundPendingRow[] }) {
  const pending = rows.filter((r) => !r.already_processed);
  if (pending.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Refunds pending</h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">no manual refunds queued</span>
        </div>
      </section>
    );
  }

  const totalAmount = pending.reduce((sum, r) => sum + r.refund_amount, 0);
  const stale = pending.filter((r) => r.age_hours > 72);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Refunds pending — {pending.length} · ${totalAmount.toFixed(2)} total
        </h2>
        {stale.length > 0 && (
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
            {stale.length} &gt; 72h
          </span>
        )}
      </div>
      <div className="bg-white border border-amber-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-amber-50/40 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-right font-semibold">Refund</th>
              <th className="px-3 py-2 text-left font-semibold">Reason</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
              <th className="px-3 py-2 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.map((r) => (
              <tr key={r.audit_id} className={r.age_hours > 72 ? "bg-red-50/30" : "hover:bg-gray-50"}>
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  <Link href={`/staff/orders?focus=${r.order_id}`} className="text-blue-700 hover:underline">{r.order_number}</Link>
                  <div className="text-[10px] text-gray-500 mt-0.5">${r.original_total.toFixed(2)} → ${r.new_total.toFixed(2)}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{r.customer_name}</div>
                  <Link href={`/staff/lifecycle/customer/${encodeURIComponent(r.customer_email)}`} className="text-xs text-blue-700 hover:underline truncate max-w-[180px] block">{r.customer_email}</Link>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold text-amber-800">${r.refund_amount.toFixed(2)}</td>
                <td className="px-3 py-2 text-xs text-gray-700 max-w-[200px]" title={r.reason}>{r.reason}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  <span className={r.age_hours > 72 ? "font-bold text-red-700" : "text-gray-600"}>{fmtAge(r.age_hours)}</span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  Process refund in Clover for ${r.refund_amount.toFixed(2)} → then mark via the API (POST /api/staff/orders/{r.order_id.slice(0,8)}…/refund-processed)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Manual refund flow: open the Clover dashboard → find the original payment → refund the line for the amount shown → POST to <code className="bg-white px-1 rounded">/api/staff/orders/[id]/refund-processed</code> to clear the row.
        Auto-Clover-refund integration is deferred until explicit owner sign-off (it's a real money operation that needs careful testing).
      </p>
    </section>
  );
}
