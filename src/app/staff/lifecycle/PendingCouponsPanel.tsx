/**
 * PendingCouponsPanel — coupons issued to a customer but not yet redeemed.
 *
 * Surfaces `customers.pending_discount_code` set, never redeemed. The audit
 * found this is currently invisible — staff issues a code, customer never
 * uses it, no one notices. Age column lets Hasan see which are going cold.
 */

export interface PendingCouponRow {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  code: string;
  issued_age_hours: number; // age since customer was last updated (approximation of issuance date)
  customer_order_count: number;
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function PendingCouponsPanel({ rows }: { rows: PendingCouponRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pending coupons</h2>
          <span className="text-xs text-gray-500">none outstanding</span>
        </div>
      </section>
    );
  }

  const stale = rows.filter((r) => r.issued_age_hours > 7 * 24);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Pending coupons — {rows.length} issued, not yet redeemed
        </h2>
        {stale.length > 0 && (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200">
            {stale.length} cold &gt; 7d
          </span>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-center font-semibold">Order history</th>
              <th className="px-3 py-2 text-right font-semibold">Age (approx)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.customer_id} className={r.issued_age_hours > 7 * 24 ? "bg-amber-50/30" : "hover:bg-gray-50"}>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900 truncate max-w-[200px]">{r.customer_name || "—"}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{r.customer_email}</div>
                </td>
                <td className="px-3 py-2">
                  <code className="text-xs font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{r.code}</code>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-700">
                  {r.customer_order_count === 0 ? "new" : `${r.customer_order_count} order${r.customer_order_count !== 1 ? "s" : ""}`}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-600">{fmtAge(r.issued_age_hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
