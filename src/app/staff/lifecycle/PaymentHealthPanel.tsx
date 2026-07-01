export interface PaymentHealthSnapshot {
  open_checkouts_24h: number;
  declines_24h: number;
  captures_24h: number;
  recovered_24h: number;
  abandoned_24h: number;
  ambiguous_24h: number;
  pending_over_threshold: number;
  clover_webhook_last_seen_at: string | null;
  reconcile_last_ran_at: string | null;
  payment_followup_last_ran_at: string | null;
  payment_followup_stale: boolean;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    neutral: "bg-gray-50 border-gray-200 text-gray-800",
    good: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    bad: "bg-red-50 border-red-200 text-red-800",
  }[tone];

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function PaymentHealthPanel({ snapshot }: { snapshot: PaymentHealthSnapshot }) {
  const needsAttention =
    snapshot.pending_over_threshold > 0 ||
    snapshot.ambiguous_24h > 0 ||
    snapshot.payment_followup_stale;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Payment health
        </h2>
        {needsAttention ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200">
            attention needed
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            steady
          </span>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Metric label="Open checkouts" value={snapshot.open_checkouts_24h} />
          <Metric label="Declines" value={snapshot.declines_24h} tone={snapshot.declines_24h > 0 ? "warn" : "neutral"} />
          <Metric label="Captured" value={snapshot.captures_24h} tone={snapshot.captures_24h > 0 ? "good" : "neutral"} />
          <Metric label="Recovered" value={snapshot.recovered_24h} tone={snapshot.recovered_24h > 0 ? "good" : "neutral"} />
          <Metric label="Abandoned" value={snapshot.abandoned_24h} tone={snapshot.abandoned_24h > 0 ? "warn" : "neutral"} />
          <Metric label="Ambiguous" value={snapshot.ambiguous_24h} tone={snapshot.ambiguous_24h > 0 ? "bad" : "neutral"} />
          <Metric label="Pending 30m+" value={snapshot.pending_over_threshold} tone={snapshot.pending_over_threshold > 0 ? "warn" : "neutral"} />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="font-semibold text-gray-500">Clover webhook last seen</span>
            <span className="block mt-0.5 font-mono text-gray-800">{fmtRelative(snapshot.clover_webhook_last_seen_at)}</span>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="font-semibold text-gray-500">Reconcile last ran</span>
            <span className="block mt-0.5 font-mono text-gray-800">{fmtRelative(snapshot.reconcile_last_ran_at)}</span>
          </div>
          <div className={`rounded-lg border px-3 py-2 ${
            snapshot.payment_followup_stale ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"
          }`}>
            <span className="font-semibold text-gray-500">Payment follow-up heartbeat</span>
            <span className={`block mt-0.5 font-mono ${
              snapshot.payment_followup_stale ? "text-amber-800" : "text-gray-800"
            }`}>
              {fmtRelative(snapshot.payment_followup_last_ran_at)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
