/**
 * FailedEmailsPanel — bounced / spam-flagged / complained / delivery-delayed.
 *
 * Empty until the Resend or Brevo webhooks fire on a failure. Once they do,
 * this panel surfaces them with the failure detail so Hasan can react
 * (re-send manually, suppress address in Brevo, etc.).
 */
import Link from "next/link";

export interface FailedEmailRow {
  id: string;
  sent_at: string;
  to_address: string;
  subject: string;
  status: string;
  failure_type: "bounced" | "complained" | "delivery_delayed";
  failure_at: string;
  detail: string | null;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const FAILURE_TONE: Record<FailedEmailRow["failure_type"], string> = {
  bounced:          "bg-red-100 text-red-800",
  complained:       "bg-red-100 text-red-800",
  delivery_delayed: "bg-amber-100 text-amber-800",
};

export function FailedEmailsPanel({ rows }: { rows: FailedEmailRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Email delivery failures</h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">no failures (or webhook not wired yet)</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Email delivery failures — {rows.length}
        </h2>
      </div>
      <div className="bg-white border border-red-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-red-50/40 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-32">When</th>
              <th className="px-3 py-2 text-left font-semibold">Recipient</th>
              <th className="px-3 py-2 text-left font-semibold">Subject</th>
              <th className="px-3 py-2 text-left font-semibold">Failure</th>
              <th className="px-3 py-2 text-left font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap font-mono">{fmtTime(e.failure_at)}</td>
                <td className="px-3 py-2 text-xs">
                  <Link href={`/staff/lifecycle/customer/${encodeURIComponent(e.to_address)}`} className="text-blue-700 hover:underline truncate block max-w-[200px]">{e.to_address}</Link>
                </td>
                <td className="px-3 py-2 text-xs text-gray-800 truncate max-w-[280px]" title={e.subject}>{e.subject}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${FAILURE_TONE[e.failure_type]}`}>
                    {e.failure_type}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[240px]" title={e.detail ?? ""}>{e.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
