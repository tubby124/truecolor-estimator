/**
 * CartAbandonPanel — checkout_sessions that never converted to an order.
 *
 * A row in checkout_sessions = a customer started checkout, gave us their
 * email + name, but no order was created within a reasonable window.
 * payment-followup cron sends "you left something" reminders; this panel
 * surfaces the leakage so Hasan can see how big the funnel hole is.
 */
import Link from "next/link";

export interface CartAbandonRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  age_hours: number;
  followup_sent: boolean;
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function CartAbandonPanel({ rows }: { rows: CartAbandonRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Abandoned carts</h2>
          <span className="text-xs text-gray-500">none in window</span>
        </div>
      </section>
    );
  }

  const followedUp = rows.filter((r) => r.followup_sent).length;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Abandoned carts — {rows.length} email captured, no order
        </h2>
        <span className="text-xs font-medium text-gray-600">{followedUp} got followup · {rows.length - followedUp} silent</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-center font-semibold">Followup sent?</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs">
                  <Link href={`/staff/lifecycle/customer/${encodeURIComponent(r.email)}`} className="text-blue-700 hover:underline">{r.email}</Link>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[200px]">{r.name || "—"}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${r.followup_sent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {r.followup_sent ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-600">{fmtAge(r.age_hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
