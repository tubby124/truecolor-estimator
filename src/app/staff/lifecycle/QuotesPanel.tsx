/**
 * QuotesPanel — incoming /quote-request submissions (separate from orders).
 *
 * Tracks the quote_requests table — customers submitting via the public quote
 * form on truecolorprinting.ca. Shows: unreplied count (the most actionable
 * metric), replied-but-not-converted, conversion to orders.
 */

import Link from "next/link";

export interface QuoteRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
  replied_at: string | null;
  is_archived: boolean;
  quote_total_cents: number | null;
  age_hours: number;
  items_summary: string;
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function QuotesPanel({ quotes }: { quotes: QuoteRow[] }) {
  if (quotes.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Quote requests (7d)</h2>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded">none this week</span>
        </div>
      </section>
    );
  }

  const unreplied = quotes.filter((q) => !q.replied_at && !q.is_archived);
  const replied = quotes.filter((q) => q.replied_at && !q.is_archived);
  const stale = unreplied.filter((q) => q.age_hours > 24);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Quote requests (7d)</h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ring-1 ${
            stale.length > 0 ? "text-red-700 bg-red-50 ring-red-200" : "text-emerald-700 bg-emerald-50 ring-emerald-200"
          }`}>
            {unreplied.length} unreplied{stale.length > 0 ? ` · ${stale.length} > 24h` : ""}
          </span>
          <span className="text-xs font-medium text-gray-500">{replied.length} replied</span>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-left font-semibold">Items</th>
              <th className="px-3 py-2 text-center font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
              <th className="px-3 py-2 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map((q) => {
              const status = q.is_archived
                ? "archived"
                : q.replied_at
                ? "replied"
                : "unreplied";
              const tone =
                status === "replied" ? "bg-emerald-100 text-emerald-800"
                : status === "archived" ? "bg-gray-200 text-gray-700"
                : q.age_hours > 24 ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800";
              return (
                <tr key={q.id} className={status === "unreplied" && q.age_hours > 24 ? "bg-red-50/40" : "hover:bg-gray-50"}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 truncate max-w-[200px]">{q.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{q.email}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[260px]" title={q.items_summary}>
                    {q.items_summary || "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tone}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-600">{fmtAge(q.age_hours)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/staff/quotes`} className="text-blue-700 hover:underline text-xs">Open →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
