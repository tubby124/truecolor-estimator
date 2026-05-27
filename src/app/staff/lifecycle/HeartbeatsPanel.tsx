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
  // 24h health: runs where ok=false OR detail contains "errors=N" with N>0.
  // High error rate = the cron is firing but silently failing every invoice
  // it touches (wave-poll has been doing this — heartbeat green, signal red).
  runs_24h: number;
  errored_runs_24h: number;
  error_rate_24h: number | null; // null when runs_24h===0
}

function fmtAge(hours: number | null): string {
  if (hours === null) return "never";
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function isHighErrorRate(h: Heartbeat): boolean {
  return h.error_rate_24h !== null && h.error_rate_24h > 0.5;
}

export function HeartbeatsPanel({ heartbeats }: { heartbeats: Heartbeat[] }) {
  if (heartbeats.length === 0) return null;
  const anyStale = heartbeats.some((h) => h.stale);
  const anyHighError = heartbeats.some(isHighErrorRate);

  let banner;
  if (anyStale) {
    banner = (
      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
        STALE CRON DETECTED
      </span>
    );
  } else if (anyHighError) {
    banner = (
      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
        HIGH ERROR RATE (24h)
      </span>
    );
  } else {
    banner = (
      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
        all fresh
      </span>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cron heartbeats</h2>
        {banner}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {heartbeats.map((h) => {
          const highError = isHighErrorRate(h);
          const errPct = h.error_rate_24h !== null ? Math.round(h.error_rate_24h * 100) : null;
          const tileClass = h.stale || highError
            ? "bg-red-50 border-red-200"
            : h.ok
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200";
          return (
            <div
              key={h.name}
              className={`rounded-lg border p-2.5 ${tileClass}`}
              title={h.detail ?? undefined}
            >
              <div className="font-mono text-[11px] font-semibold text-gray-800 truncate">{h.name}</div>
              <div
                className={`text-xs font-medium mt-0.5 ${
                  h.stale || highError ? "text-red-700" : h.ok ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {fmtAge(h.hours_ago)}
                {!h.ok && h.last_ran_at && " · failed"}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                max {h.max_age_hours}h
                {h.runs_24h > 0 && (
                  <span className={`ml-1 font-mono ${highError ? "text-red-700 font-semibold" : ""}`}>
                    · {errPct}% err / {h.runs_24h}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
