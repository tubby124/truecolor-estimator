/**
 * WaveWebhookPanel — shows the last N wave webhook events from webhook_events.
 *
 * Answers: "Is Wave actually firing at us?" and "Did it match an order?"
 * An empty table = no events received yet (webhook not configured, or Wave
 * hasn't sent anything since the migration ran).
 * ok=false rows = something went wrong and the order was NOT advanced.
 */

export interface WaveWebhookEvent {
  id: string;
  received_at: string;
  event_type: string;
  resource_id: string | null;
  matched_order_id: string | null;
  matched_order_number: string | null;
  ok: boolean;
  detail: string | null;
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function WaveWebhookPanel({ events }: { events: WaveWebhookEvent[] }) {
  const anyFailed = events.some((e) => !e.ok);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Wave webhook events
        </h2>
        <div className="flex items-center gap-2">
          {events.length === 0 ? (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200 font-medium">
              no events yet — webhook firing?
            </span>
          ) : anyFailed ? (
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
              FAILED EVENTS
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No Wave webhook events recorded yet. If the webhook was just configured, send a test
          payment or wait for Wave to fire. The panel updates on every page load.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-28">When</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-32">Event</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Invoice ID</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-24">Order</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-16">Status</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-b border-gray-100 last:border-0 ${
                    !e.ok ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap font-mono">
                    {fmtRelative(e.received_at)}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">
                    {e.event_type}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-500 truncate max-w-[160px]" title={e.resource_id ?? ""}>
                    {e.resource_id ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.matched_order_number ? (
                      <a
                        href={`/staff/lifecycle/customer/${encodeURIComponent("")}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {e.matched_order_number}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {e.ok ? (
                      <span className="text-emerald-700 font-semibold">✓</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500 truncate max-w-[240px]" title={e.detail ?? ""}>
                    {e.detail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
