export type PaidSearchRecommendedAction =
  | "raise CPC ceiling, auctions lost on price"
  | "raise daily budget, budget-limited"
  | "thin market; bids cannot fix; reach change requires an approved contract change"
  | "insufficient auction data; hold current contract"
  | "hold current contract; weekly evidence does not support a change";

export interface PaidSearchWeeklyDecisionRow {
  week_start: string;
  week_end: string;
  campaign_id: string;
  campaign_name: string;
  weekly_spend_cad: number;
  actual_daily_spend_cad: number;
  pilot_actual_daily_spend_cad: number;
  target_daily_pace_cad: number;
  impressions: number;
  clicks: number;
  bidding_conversions: number;
  bidding_conversion_value_cad: number;
  search_impression_share: number | null;
  search_rank_lost_impression_share: number | null;
  search_budget_lost_impression_share: number | null;
  recommended_action: PaidSearchRecommendedAction;
}

export interface PaidSearchWeeklySnapshot {
  rows: PaidSearchWeeklyDecisionRow[];
  queryFailed: boolean;
}

function campaignLabel(campaignId: string): string {
  if (campaignId === "24048123058") return "Core products";
  if (campaignId === "24048123061") return "Competitor conquest";
  return campaignId;
}

function formatCad(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function actionTone(action: PaidSearchRecommendedAction): string {
  if (action.startsWith("raise CPC") || action.startsWith("raise daily")) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  if (action.startsWith("thin market")) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export function PaidSearchWeeklyPanel({
  snapshot,
}: {
  snapshot: PaidSearchWeeklySnapshot;
}) {
  const pace = snapshot.rows[0];

  return (
    <section className="mb-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
            Paid search weekly decision
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Read-only Google Search evidence · no account changes are made here
          </p>
        </div>
        {pace && (
          <span className="text-xs font-mono text-gray-500">
            {formatDate(pace.week_start)}–{formatDate(pace.week_end)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {snapshot.queryFailed ? (
          <p className="bg-red-50 px-4 py-5 text-sm font-medium text-red-700">
            Weekly paid-search view could not be read. Check the performance sync and published view.
          </p>
        ) : snapshot.rows.length === 0 ? (
          <p className="px-4 py-5 text-sm text-gray-500">
            No completed pilot-week campaign data is published yet.
          </p>
        ) : (
          <>
            <div className="grid gap-3 border-b border-gray-200 bg-[#1c1712] px-4 py-4 text-white sm:grid-cols-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  Pilot actual pace
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {formatCad(pace.pilot_actual_daily_spend_cad)}<span className="text-sm font-medium text-white/60">/day</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  Required pace
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {formatCad(pace.target_daily_pace_cad)}<span className="text-sm font-medium text-white/60">/day</span>
                </div>
              </div>
              <div className="text-xs leading-5 text-white/70">
                CA$600 qualifying-spend target by Sep 16. Brand remains excluded from pilot spend.
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {snapshot.rows.map((row) => (
                <article key={`${row.week_start}:${row.campaign_id}`} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#1c1712]">
                        {campaignLabel(row.campaign_id)}
                      </h3>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                        {row.campaign_name} · {row.campaign_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums text-[#1c1712]">
                        {formatCad(row.actual_daily_spend_cad)}/day
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {formatCad(row.weekly_spend_cad)} this week
                      </div>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {[
                      ["Search IS", formatPercent(row.search_impression_share)],
                      ["Lost IS · rank", formatPercent(row.search_rank_lost_impression_share)],
                      ["Lost IS · budget", formatPercent(row.search_budget_lost_impression_share)],
                      ["Impressions", row.impressions.toLocaleString("en-CA")],
                      ["Clicks", row.clicks.toLocaleString("en-CA")],
                      ["Conversions", row.bidding_conversions.toFixed(1)],
                      ["Conv. value", formatCad(row.bidding_conversion_value_cad)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {label}
                        </dt>
                        <dd className="mt-0.5 font-mono text-sm font-bold text-gray-900">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${actionTone(row.recommended_action)}`}>
                    Recommended review action: {row.recommended_action}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-4 text-gray-500">
        “Raise CPC ceiling” means review the maximum CPC cap under Maximize Clicks; the ceiling is not a bid.
        Any budget, CPC-ceiling, or reach change still requires owner approval and a separate account action.
      </p>
    </section>
  );
}
