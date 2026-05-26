/**
 * OrphanPanel — orders where the customer has no way to pay.
 *
 * The TC-2026-0113 (Damon Miller) class: status=pending_payment, order older
 * than 1h, no Pay Now-style email logged for the customer since the order was
 * created. Severity:
 *   🚨 RED   — orphan > 24h old (customer almost certainly emailed to ask)
 *   🟡 AMBER — orphan 1–24h old (recoverable before customer notices)
 *
 * Pre-2026-05-26 Wave quote-only orders generated this state silently. The
 * post-fix code path always sends a Pay Now link — this panel is here to (a)
 * sweep historical orphans and (b) catch any future code path that slips
 * through.
 */

import Link from "next/link";

export interface Orphan {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  age_hours: number;
  payment_method: string;
  pay_link_url: string; // server-generated recovery URL (HMAC token)
  wave_invoice_number: string | null;
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function OrphanPanel({ orphans }: { orphans: Orphan[] }) {
  if (orphans.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Orphans — orders with no Pay Link</h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">none</span>
        </div>
        <p className="text-xs text-gray-400">Every pending_payment order older than 1h has had a Pay Now email delivered. Clean.</p>
      </section>
    );
  }

  const red = orphans.filter((o) => o.age_hours > 24);
  const amber = orphans.filter((o) => o.age_hours <= 24);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Orphans — orders with no Pay Link
        </h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ring-1 ${
          red.length > 0
            ? "text-red-700 bg-red-50 ring-red-200"
            : "text-amber-700 bg-amber-50 ring-amber-200"
        }`}>
          {red.length > 0 ? `${red.length} RED · ` : ""}{amber.length > 0 ? `${amber.length} AMBER` : ""}
        </span>
      </div>
      <div className="bg-white border border-red-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-red-50/50 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
              <th className="px-3 py-2 text-left font-semibold">Recovery — copy + email this URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orphans.map((o) => (
              <tr key={o.id} className={o.age_hours > 24 ? "bg-red-50/40" : "bg-amber-50/30"}>
                <td className="px-3 py-2 font-mono text-xs text-gray-800 whitespace-nowrap">
                  <Link href={`/staff/orders?focus=${o.id}`} className="text-blue-700 hover:underline">{o.order_number}</Link>
                  {o.wave_invoice_number && (
                    <div className="text-[10px] text-gray-400 mt-0.5">Wave #{o.wave_invoice_number}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{o.customer_name}</div>
                  <Link href={`/staff/lifecycle/customer/${encodeURIComponent(o.customer_email)}`} className="text-xs text-blue-700 hover:underline block">{o.customer_email}</Link>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-800">{fmtCurrency(o.total)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  <span className={`font-semibold ${o.age_hours > 24 ? "text-red-700" : "text-amber-700"}`}>{fmtAge(o.age_hours)}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={o.pay_link_url}
                      className="flex-1 min-w-[280px] px-2 py-1.5 text-[11px] font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <a
                      href={`mailto:${o.customer_email}?subject=${encodeURIComponent(`Your True Color order ${o.order_number} — pay link`)}&body=${encodeURIComponent(`Hi ${o.customer_name.split(" ")[0]},\n\nApologies for the back-and-forth on your order. Here's a clean Pay Now link for ${o.order_number} ($${o.total.toFixed(2)} CAD):\n\n${o.pay_link_url}\n\nIt opens secure Clover checkout. Let me know if anything looks off.\n\nAlbert\nTrue Color Display Printing\n(306) 954-8688`)}`}
                      className="inline-flex items-center px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded whitespace-nowrap"
                    >
                      Email customer
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Recovery URLs are HMAC-signed Clover Pay Now tokens (30-day expiry). Click <span className="font-semibold">Email customer</span> to open a pre-filled email in your mail client — adjust the body if needed before sending.
      </p>
    </section>
  );
}
