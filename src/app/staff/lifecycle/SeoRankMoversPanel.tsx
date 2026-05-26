/**
 * SeoRankMoversPanel — biggest GSC rank gainers + losers in last 7d.
 *
 * Reads from seo_gsc_snapshots (4848+ rows, populated daily by gsc-sync cron).
 * Compares the most recent snapshot to the snapshot ~7 days prior per
 * (query, page) pair and surfaces the top movers in both directions.
 *
 * Lower position number = better rank. Delta is computed as
 * prior_position - current_position so positive delta = gain.
 */

export interface SeoMover {
  query: string;
  page: string;
  current_pos: number;
  prior_pos: number;
  delta: number;
  current_clicks: number;
  current_impressions: number;
}

export interface SeoRankMovers {
  winners: SeoMover[];
  losers: SeoMover[];
}

function fmtPos(p: number): string {
  return p < 10 ? p.toFixed(1) : Math.round(p).toString();
}

function trimPage(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/-saskatoon$/, "");
}

export function SeoRankMoversPanel({ movers }: { movers: SeoRankMovers }) {
  if (movers.winners.length === 0 && movers.losers.length === 0) {
    return null;
  }
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">SEO rank movers (vs 7d ago)</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <MoverList title="Top gainers" rows={movers.winners} tone="good" />
        <MoverList title="Top losers" rows={movers.losers} tone="bad" />
      </div>
    </section>
  );
}

function MoverList({ title, rows, tone }: { title: string; rows: SeoMover[]; tone: "good" | "bad" }) {
  const toneClass = tone === "good" ? "border-emerald-200" : "border-red-200";
  const headerTone = tone === "good" ? "bg-emerald-50/50" : "bg-red-50/40";
  return (
    <div className={`bg-white border ${toneClass} rounded-xl overflow-hidden`}>
      <div className={`${headerTone} px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b ${toneClass}`}>
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 p-3">No significant moves in the last 7 days.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((m, idx) => (
            <li key={idx} className="px-3 py-2 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900 truncate" title={m.query}>{m.query}</div>
                  <div className="text-[10px] text-gray-500 font-mono truncate" title={m.page}>{trimPage(m.page)}</div>
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 font-mono">{fmtPos(m.prior_pos)} →</span>
                  <span className="text-sm font-bold font-mono text-gray-900">{fmtPos(m.current_pos)}</span>
                  <span className={`text-xs font-bold font-mono ${m.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {m.delta >= 0 ? "↑" : "↓"}{Math.abs(m.delta).toFixed(1)}
                  </span>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-mono flex-shrink-0 w-16">
                  {m.current_clicks > 0 && <div>{m.current_clicks} clk</div>}
                  <div>{m.current_impressions} imp</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
