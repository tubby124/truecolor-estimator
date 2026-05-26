/**
 * IndustryBlitzPanel — TC industry-blitz cold-email pipeline status.
 *
 * Surfaces: total leads in tc_leads, last 24h send activity, active
 * campaign state. Hasan otherwise has to dig into Brevo + Supabase
 * separately to see if the drip is alive.
 */

export interface BlitzSnapshot {
  total_leads: number;
  emails_sent_24h: number;
  emails_opened_24h: number;
  emails_clicked_24h: number;
  last_send_at: string | null;
  is_stale: boolean;
  active_campaigns: Array<{
    slug: string;
    name: string;
    status: string;
    sent: number;
    opens: number;
    clicks: number;
    orders_generated: number;
  }>;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (hrs < 1) return `${Math.round(hrs * 60)}m ago`;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export function IndustryBlitzPanel({ snap }: { snap: BlitzSnapshot }) {
  if (snap.total_leads === 0 && snap.active_campaigns.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Industry blitz pipeline</h2>
        <div className="flex items-center gap-2">
          {snap.is_stale && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800" title="Active campaign exists but no sends in 48h+">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> stalled
            </span>
          )}
          <span className="text-xs text-gray-600">last send {fmtRelative(snap.last_send_at)}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Tile label="Leads in DB" value={snap.total_leads.toLocaleString()} />
        <Tile label="Sent 24h" value={String(snap.emails_sent_24h)} />
        <Tile label="Opened 24h" value={`${snap.emails_opened_24h} (${pct(snap.emails_opened_24h, snap.emails_sent_24h)})`} />
        <Tile label="Clicked 24h" value={`${snap.emails_clicked_24h} (${pct(snap.emails_clicked_24h, snap.emails_sent_24h)})`} />
      </div>

      {/* Per-campaign rollup */}
      {snap.active_campaigns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Campaign</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Sent</th>
                <th className="px-3 py-2 text-right font-semibold">Opens</th>
                <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                <th className="px-3 py-2 text-right font-semibold">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {snap.active_campaigns.map((c) => (
                <tr key={c.slug} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="text-xs font-medium text-gray-900 truncate max-w-[240px]">{c.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{c.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === "active" ? "bg-emerald-100 text-emerald-800"
                      : c.status === "completed" ? "bg-blue-100 text-blue-800"
                      : c.status === "paused" ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{c.sent.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{c.opens.toLocaleString()} <span className="text-gray-400">({pct(c.opens, c.sent)})</span></td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{c.clicks.toLocaleString()} <span className="text-gray-400">({pct(c.clicks, c.sent)})</span></td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-bold text-emerald-700">{c.orders_generated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}
