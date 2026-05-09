/**
 * SEO dashboard + skill queries against seo_gsc_snapshots.
 *
 * All functions take a Supabase ServiceClient (RLS bypassed — staff/cron context only).
 * Aggregations are done in JS rather than SQL so we can keep the migration simple
 * and the data volume is small (~500-2000 rows per day).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Opportunity = {
  query: string;
  page: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
};

export type DecayAlert = {
  query: string;
  page: string;
  position_baseline: number;
  position_recent: number;
  impressions_recent: number;
  clicks_recent: number;
};

type Row = {
  snapshot_date: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number;
};

async function fetchWindow(
  supabase: SupabaseClient,
  daysBack: number,
): Promise<Row[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - daysBack);
  const sinceStr = since.toISOString().slice(0, 10);

  // Pull in pages of 1000 (Supabase default cap).
  const out: Row[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("seo_gsc_snapshots")
      .select("snapshot_date,query,page,clicks,impressions,position")
      .gte("snapshot_date", sinceStr)
      .order("snapshot_date", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`seo_gsc_snapshots fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as Row[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function aggregate(rows: Row[]): Map<string, Opportunity> {
  const acc = new Map<string, { clicks: number; impressions: number; positionSum: number; positionCount: number; query: string; page: string }>();
  for (const r of rows) {
    const key = `${r.query}\u0000${r.page}`;
    const entry = acc.get(key) ?? {
      clicks: 0,
      impressions: 0,
      positionSum: 0,
      positionCount: 0,
      query: r.query,
      page: r.page,
    };
    entry.clicks += r.clicks;
    entry.impressions += r.impressions;
    entry.positionSum += r.position * r.impressions; // impression-weighted
    entry.positionCount += r.impressions;
    acc.set(key, entry);
  }
  const out = new Map<string, Opportunity>();
  for (const [key, e] of acc) {
    const position = e.positionCount > 0 ? e.positionSum / e.positionCount : 0;
    const ctr = e.impressions > 0 ? e.clicks / e.impressions : 0;
    out.set(key, {
      query: e.query,
      page: e.page,
      position,
      impressions: e.impressions,
      clicks: e.clicks,
      ctr,
    });
  }
  return out;
}

/**
 * Page-2 keywords (positions 11-20) — biggest ranking-lift opportunities.
 * Requires at least 30 impressions over the window to filter noise.
 */
export async function getPageTwoOpportunities(
  supabase: SupabaseClient,
  limit = 25,
): Promise<Opportunity[]> {
  const rows = await fetchWindow(supabase, 28);
  const agg = aggregate(rows);
  return [...agg.values()]
    .filter((o) => o.position >= 11 && o.position <= 20 && o.impressions >= 30)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

/**
 * High impressions, low CTR — usually a title/meta description problem.
 * Filters for queries already on page 1 (position <= 10) where CTR is below
 * the typical curve for that position.
 */
export async function getLowCtrTitleCandidates(
  supabase: SupabaseClient,
  limit = 20,
): Promise<Opportunity[]> {
  const rows = await fetchWindow(supabase, 28);
  const agg = aggregate(rows);
  // Expected CTR curve (rough industry averages): pos 1=28%, 2=15%, 3=11%, 4=8%, 5=7%, 6=5%, 7=4%, 8=3%, 9=2.5%, 10=2%.
  const expectedCtr = (pos: number) => {
    if (pos <= 1) return 0.28;
    if (pos <= 2) return 0.15;
    if (pos <= 3) return 0.11;
    if (pos <= 4) return 0.08;
    if (pos <= 5) return 0.07;
    if (pos <= 6) return 0.05;
    if (pos <= 7) return 0.04;
    if (pos <= 8) return 0.03;
    if (pos <= 9) return 0.025;
    return 0.02;
  };
  return [...agg.values()]
    .filter(
      (o) =>
        o.position <= 10 &&
        o.impressions >= 50 &&
        o.ctr < expectedCtr(o.position) * 0.6,
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

/**
 * Decay alerts: queries whose recent (last 14 days) average position is
 * meaningfully worse than the prior 14-day baseline.
 * Threshold: dropped 2+ positions AND lost at least 20% of clicks.
 */
export async function getDecayAlerts(
  supabase: SupabaseClient,
  limit = 15,
): Promise<DecayAlert[]> {
  const rows = await fetchWindow(supabase, 28);
  const today = new Date();
  const split = new Date(today);
  split.setUTCDate(today.getUTCDate() - 14);
  const splitStr = split.toISOString().slice(0, 10);

  const recent = rows.filter((r) => r.snapshot_date >= splitStr);
  const baseline = rows.filter((r) => r.snapshot_date < splitStr);

  const recentAgg = aggregate(recent);
  const baselineAgg = aggregate(baseline);

  const out: DecayAlert[] = [];
  for (const [key, r] of recentAgg) {
    const b = baselineAgg.get(key);
    if (!b) continue;
    if (r.impressions < 20 || b.impressions < 20) continue;
    const delta = r.position - b.position;
    const clickRatio = b.clicks > 0 ? r.clicks / b.clicks : 1;
    if (delta >= 2 && clickRatio <= 0.8) {
      out.push({
        query: r.query,
        page: r.page,
        position_baseline: b.position,
        position_recent: r.position,
        impressions_recent: r.impressions,
        clicks_recent: r.clicks,
      });
    }
  }
  return out
    .sort((a, b) => b.position_recent - b.position_baseline - (a.position_recent - a.position_baseline))
    .slice(0, limit);
}

export async function getLastSyncStatus(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("seo_gsc_sync_log")
    .select("ran_at,status,rows_inserted,date_to")
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    ran_at: string;
    status: string;
    rows_inserted: number;
    date_to: string;
  };
}
