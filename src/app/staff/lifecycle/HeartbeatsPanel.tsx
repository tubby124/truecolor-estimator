/**
 * HeartbeatsPanel — cron freshness at the top of /staff/lifecycle.
 * Stale (red) = the cron silently died; the daily harness alerts on this too,
 * but the dashboard makes it visible without waiting for the digest.
 */

export interface Heartbeat {
  name: string;
  last_ran_at: string | null;
  hours_ago: number | null;
  max_age_hours: number;
  ok: boolean;
  stale: boolean;
  detail: string | null;
}

function fmtAge(hours: number | null): string {
  if (hours === null) return "never";
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function HeartbeatsPanel({ heartbeats }: { heartbeats: Heartbeat[] }) {
  if (heartbeats.length === 0) return null;
  const anyStale = heartbeats.some((h) => h.stale);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cron heartbeats</h2>
        {anyStale ? (
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
            STALE CRON DETECTED
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            all fresh
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {heartbeats.map((h) => (
          <div
            key={h.name}
            className={`rounded-lg border p-2.5 ${
              h.stale
                ? "bg-red-50 border-red-200"
                : h.ok
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
            title={h.detail ?? undefined}
          >
            <div className="font-mono text-[11px] font-semibold text-gray-800 truncate">{h.name}</div>
            <div
              className={`text-xs font-medium mt-0.5 ${
                h.stale ? "text-red-700" : h.ok ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {fmtAge(h.hours_ago)}
              {!h.ok && h.last_ran_at && " · failed"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">max {h.max_age_hours}h</div>
          </div>
        ))}
      </div>
    </section>
  );
}
