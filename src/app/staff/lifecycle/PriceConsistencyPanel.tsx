/**
 * PriceConsistencyPanel — the safety net for the getProductConfig migration.
 *
 * Runs representative configurations per category through the engine via the
 * `getProductConfig()` path AND compares to:
 *   - Locked SKU prices in products.v1.csv
 *   - Marketing "from $X" anchors in data/PRICING_QUICK_REFERENCE.md
 *
 * Any drift = red row + the next thing to fix BEFORE migrating any consumer.
 * The migration cannot start until this panel is green for that category.
 *
 * See vault: Projects/true-color/2026-05-26-getProductConfig-safe-migration-strategy.md
 */

export type ConsistencyStatus = "match" | "drift" | "blocked" | "skipped";

export interface PriceConsistencyRow {
  category: string;
  config_label: string;
  expected_source: "products_csv" | "marketing_anchor" | "engine_baseline";
  expected_price: number | null;
  actual_price: number | null;
  delta: number | null;
  status: ConsistencyStatus;
  note: string;
}

const STATUS_TONE: Record<ConsistencyStatus, string> = {
  match:   "bg-emerald-100 text-emerald-800",
  drift:   "bg-red-100 text-red-800",
  blocked: "bg-amber-100 text-amber-800",
  skipped: "bg-gray-100 text-gray-600",
};

export function PriceConsistencyPanel({ rows }: { rows: PriceConsistencyRow[] }) {
  if (rows.length === 0) return null;

  const matchCount = rows.filter((r) => r.status === "match").length;
  const driftCount = rows.filter((r) => r.status === "drift").length;
  const blockedCount = rows.filter((r) => r.status === "blocked").length;
  const allGreen = driftCount === 0 && blockedCount === 0;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Price consistency — getProductConfig safety net
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-700 font-medium">{matchCount} match</span>
          {driftCount > 0 && <span className="text-red-700 font-bold">· {driftCount} DRIFT</span>}
          {blockedCount > 0 && <span className="text-amber-700 font-bold">· {blockedCount} blocked</span>}
        </div>
      </div>
      {allGreen ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 mb-2">
          ✓ Every representative config priced through `getProductConfig` matches its expected source. Safe to migrate consumers one at a time per the vault strategy. Run `npm test` to verify the contract test passes in CI too.
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 mb-2">
          🚨 Drift detected. <strong>Do NOT migrate any consumer to getProductConfig until every row below is green.</strong> Each red row is either a CSV-vs-engine bug or a marketing-anchor stale-reference that needs investigation.
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Category</th>
              <th className="px-3 py-2 text-left font-semibold">Config</th>
              <th className="px-3 py-2 text-left font-semibold">Source</th>
              <th className="px-3 py-2 text-right font-semibold">Expected</th>
              <th className="px-3 py-2 text-right font-semibold">Engine</th>
              <th className="px-3 py-2 text-right font-semibold">Δ</th>
              <th className="px-3 py-2 text-center font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, idx) => (
              <tr key={`${r.category}-${idx}`} className={r.status === "drift" ? "bg-red-50/40" : r.status === "blocked" ? "bg-amber-50/30" : ""}>
                <td className="px-3 py-2 text-xs font-mono text-gray-700">{r.category}</td>
                <td className="px-3 py-2 text-xs text-gray-800">{r.config_label}</td>
                <td className="px-3 py-2 text-[10px] text-gray-500 font-mono">{r.expected_source}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{r.expected_price != null ? `$${r.expected_price.toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{r.actual_price != null ? `$${r.actual_price.toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {r.delta != null
                    ? <span className={Math.abs(r.delta) > 0.01 ? "text-red-700 font-bold" : "text-emerald-700"}>{r.delta >= 0 ? "+" : ""}${r.delta.toFixed(2)}</span>
                    : "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_TONE[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 max-w-[280px]" title={r.note}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
