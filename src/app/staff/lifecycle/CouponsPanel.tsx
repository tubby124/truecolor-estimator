/**
 * CouponsPanel — discount code redemptions in the last 7d.
 *
 * Shows who used a coupon, on which order, how much it saved. Roll-up: total
 * discount value given out this week.
 */

import Link from "next/link";

export interface CouponRedemption {
  id: string;
  redeemed_at: string;
  code: string;
  code_type: string | null;
  customer_email: string;
  order_id: string | null;
  order_number: string | null;
  amount_saved: number;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CouponsPanel({ redemptions }: { redemptions: CouponRedemption[] }) {
  if (redemptions.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Coupon redemptions (7d)</h2>
          <span className="text-xs text-gray-500">none</span>
        </div>
      </section>
    );
  }

  const total = redemptions.reduce((sum, r) => sum + (r.amount_saved || 0), 0);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Coupon redemptions (7d)</h2>
        <span className="text-xs font-medium text-gray-700">{redemptions.length} used · $${total.toFixed(2)} given</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-32">When</th>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-right font-semibold">Saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {redemptions.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap font-mono">{fmtTime(r.redeemed_at)}</td>
                <td className="px-3 py-2">
                  <code className="text-xs font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{r.code}</code>
                  {r.code_type && <span className="ml-2 text-[10px] text-gray-500">{r.code_type}</span>}
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[220px]">{r.customer_email}</td>
                <td className="px-3 py-2 text-xs">
                  {r.order_number ? (
                    <Link href={`/staff/orders?focus=${r.order_id}`} className="font-mono text-blue-700 hover:underline">{r.order_number}</Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-emerald-700 font-semibold">-${r.amount_saved.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
