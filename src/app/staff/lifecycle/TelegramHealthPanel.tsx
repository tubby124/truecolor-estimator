/**
 * TelegramHealthPanel — Telegram delivery health.
 *
 * Without this, a rotated bot token = every notification silently disappears.
 * Counts attempts in last 24h by ok/fail and shows the most recent failure
 * so Hasan can spot trouble at a glance.
 */

export interface TelegramHealth {
  total_24h: number;
  ok_24h: number;
  fail_24h: number;
  last_failure_at: string | null;
  last_failure_error: string | null;
  last_failure_category: string | null;
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (hrs < 1) return `${Math.round(hrs * 60)}m ago`;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function TelegramHealthPanel({ h }: { h: TelegramHealth }) {
  const allOk = h.fail_24h === 0;
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Telegram health (24h)</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-700">{h.total_24h} attempts</span>
          <span className="text-emerald-700">· {h.ok_24h} ok</span>
          {h.fail_24h > 0 && <span className={`font-bold ${allOk ? "text-emerald-700" : "text-red-700"}`}>· {h.fail_24h} failed</span>}
        </div>
      </div>
      {h.total_24h === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600">
          No Telegram attempts in the last 24h. If you expect alerts and none are firing — check TRUE_COLOR_TELEGRAM_BOT_TOKEN + CHAT_ID env vars on Railway.
        </div>
      ) : !allOk && h.last_failure_at ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs">
          <p className="text-red-700 font-semibold mb-1">
            Most recent failure {fmtRelative(h.last_failure_at)}
            {h.last_failure_category && <span className="text-red-500 font-normal"> · category: {h.last_failure_category}</span>}
          </p>
          <p className="text-red-600 font-mono">{h.last_failure_error ?? "(no error detail)"}</p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
          All {h.ok_24h} Telegram sends delivered cleanly in the last 24h.
        </div>
      )}
    </section>
  );
}
