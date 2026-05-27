/**
 * WebhookHealthPanel — combined webhook event panel for wave + clover.
 *
 * Replaces the wave-only WaveWebhookPanel. Both vendors now log to
 * webhook_events with event_source = 'wave' | 'clover'. The fix shipped
 * in bf7f273 (Clover route now logs every event) is only visible here.
 *
 * Per source we render:
 *   - 24h totals + ok=false counts (prominent if any failures)
 *   - last-event timestamp (or "no events in 24h" warning)
 *   - last N events table (same shape both sources)
 */

export interface WebhookEvent {
  id: string;
  received_at: string;
  event_source: string;
  event_type: string;
  resource_id: string | null;
  matched_order_id: string | null;
  matched_order_number: string | null;
  ok: boolean;
  detail: string | null;
}

export interface WebhookSourceGroup {
  source: string;              // "wave" | "clover"
  label: string;               // "Wave" | "Clover"
  events: WebhookEvent[];      // most recent first, capped
  last_event_at: string | null;
  total_24h: number;
  failed_24h: number;
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

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function SourceBlock({ group }: { group: WebhookSourceGroup }) {
  const lastAgeH = hoursSince(group.last_event_at);
  const noEvents24h = lastAgeH === null || lastAgeH > 24;
  const anyFailed = group.failed_24h > 0;

  let statusBadge;
  if (group.failed_24h > 0) {
    statusBadge = (
      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
        {group.failed_24h} FAILED · 24h
      </span>
    );
  } else if (noEvents24h) {
    statusBadge = (
      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200 font-medium">
        no events in 24h
      </span>
    );
  } else {
    statusBadge = (
      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
        {group.total_24h} event{group.total_24h !== 1 ? "s" : ""} · 24h
      </span>
    );
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">{group.label}</span>
          <span className="text-[10px] text-gray-400 font-mono">
            last: {group.last_event_at ? fmtRelative(group.last_event_at) : "never"}
          </span>
        </div>
        {statusBadge}
      </div>

      {group.events.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No {group.label} webhook events recorded. Check the webhook is configured and firing.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-24">When</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-32">Event</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Resource</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-24">Order</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-12">OK</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Detail</th>
              </tr>
            </thead>
            <tbody>
              {group.events.map((e, i) => (
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
                      <span className="font-mono text-blue-600">{e.matched_order_number}</span>
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
    </div>
  );
}

export function WebhookHealthPanel({ groups }: { groups: WebhookSourceGroup[] }) {
  const anyRed = groups.some((g) => g.failed_24h > 0);
  const anyYellow = groups.some((g) => g.last_event_at === null || hoursSince(g.last_event_at)! > 24);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Webhook health
        </h2>
        {anyRed ? (
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
            FAILURES DETECTED
          </span>
        ) : anyYellow ? (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            silent source
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            all sources firing
          </span>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {groups.map((g) => (
          <SourceBlock key={g.source} group={g} />
        ))}
      </div>
    </section>
  );
}
