import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { LOGO_PATH } from "@/lib/config";
import {
  getPageTwoOpportunities,
  getLowCtrTitleCandidates,
  getDecayAlerts,
  getLastSyncStatus,
  type Opportunity,
  type DecayAlert,
} from "@/lib/seo/queries";

export const metadata: Metadata = {
  title: "SEO — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function StaffSeoPage() {
  const supabase = createServiceClient();

  const [opps, titleCandidates, decay, sync] = await Promise.all([
    getPageTwoOpportunities(supabase, 25),
    getLowCtrTitleCandidates(supabase, 20),
    getDecayAlerts(supabase, 15),
    getLastSyncStatus(supabase),
  ]);

  const noData =
    opps.length === 0 && titleCandidates.length === 0 && decay.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt="True Color" className="h-8 w-auto object-contain" />
            <span className="text-sm font-semibold text-[#1c1712]">SEO</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/staff/orders" className="text-gray-600 hover:text-[#e63020]">Orders</Link>
            <Link href="/staff/quotes" className="text-gray-600 hover:text-[#e63020]">Quotes</Link>
            <Link href="/staff/social" className="text-gray-600 hover:text-[#e63020]">Social</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <SyncBanner sync={sync} />

        {noData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            No GSC data yet. Run the daily sync once it&apos;s set up:
            {" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded">
              curl -H &quot;Authorization: Bearer $CRON_SECRET&quot; https://truecolorprinting.ca/api/cron/gsc-sync
            </code>
          </div>
        )}

        <Section
          title="Page-2 opportunities"
          subtitle="Positions 11–20, last 28 days. Beef up content + add FAQs to push to page 1."
          empty="No page-2 keywords yet."
          items={opps}
          render={(o, i) => (
            <OpportunityRow key={`${o.query}-${o.page}-${i}`} o={o} kind="page-2" />
          )}
        />

        <Section
          title="Title-rewrite candidates"
          subtitle="High impressions but low CTR — usually a title/meta problem."
          empty="No low-CTR candidates yet."
          items={titleCandidates}
          render={(o, i) => (
            <OpportunityRow key={`${o.query}-${o.page}-${i}`} o={o} kind="ctr" />
          )}
        />

        <Section
          title="Decay alerts"
          subtitle="Pages losing rank vs. their 30-day baseline. Investigate before deploying further changes."
          empty="No decay detected — rankings stable."
          items={decay}
          render={(d, i) => <DecayRow key={`${d.query}-${d.page}-${i}`} d={d} />}
        />
      </main>
    </div>
  );
}

function SyncBanner({
  sync,
}: {
  sync: { ran_at: string; status: string; rows_inserted: number; date_to: string } | null;
}) {
  if (!sync) {
    return (
      <div className="text-xs text-gray-500">
        Last GSC sync: <span className="text-gray-700">never</span>
      </div>
    );
  }
  const dt = new Date(sync.ran_at);
  const ago = humanAgo(dt);
  const statusColor =
    sync.status === "ok"
      ? "text-green-700"
      : sync.status === "partial"
        ? "text-amber-700"
        : "text-red-700";
  return (
    <div className="text-xs text-gray-500">
      Last sync <span className="text-gray-700">{ago}</span>
      {" · "}
      <span className={statusColor}>{sync.status}</span>
      {" · "}
      <span>{sync.rows_inserted.toLocaleString()} rows</span>
      {" · "}
      <span>through {sync.date_to}</span>
    </div>
  );
}

function Section<T>({
  title,
  subtitle,
  empty,
  items,
  render,
}: {
  title: string;
  subtitle: string;
  empty: string;
  items: T[];
  render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-[#1c1712]">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-400 italic">{empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Query</th>
                <th className="px-4 py-2 text-left">Page</th>
                <th className="px-4 py-2 text-right">Pos</th>
                <th className="px-4 py-2 text-right">Imp</th>
                <th className="px-4 py-2 text-right">Clicks</th>
                <th className="px-4 py-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(render)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OpportunityRow({ o, kind }: { o: Opportunity; kind: "page-2" | "ctr" }) {
  const slug = o.page.replace(/^https?:\/\/[^/]+/, "") || "/";
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium text-[#1c1712]">{o.query}</td>
      <td className="px-4 py-2">
        <a
          href={o.page}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e63020] hover:underline font-mono text-xs"
        >
          {slug}
        </a>
      </td>
      <td className={`px-4 py-2 text-right font-mono ${kind === "page-2" ? "text-amber-700" : ""}`}>
        {o.position.toFixed(1)}
      </td>
      <td className="px-4 py-2 text-right font-mono">{o.impressions.toLocaleString()}</td>
      <td className="px-4 py-2 text-right font-mono">{o.clicks.toLocaleString()}</td>
      <td className="px-4 py-2 text-right font-mono">{(o.ctr * 100).toFixed(1)}%</td>
    </tr>
  );
}

function DecayRow({ d }: { d: DecayAlert }) {
  const slug = d.page.replace(/^https?:\/\/[^/]+/, "") || "/";
  const delta = d.position_recent - d.position_baseline;
  const deltaColor = delta >= 3 ? "text-red-700" : "text-amber-700";
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium text-[#1c1712]">{d.query}</td>
      <td className="px-4 py-2">
        <a
          href={d.page}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e63020] hover:underline font-mono text-xs"
        >
          {slug}
        </a>
      </td>
      <td className={`px-4 py-2 text-right font-mono ${deltaColor}`}>
        {d.position_baseline.toFixed(1)} → {d.position_recent.toFixed(1)}
      </td>
      <td className="px-4 py-2 text-right font-mono">{d.impressions_recent.toLocaleString()}</td>
      <td className="px-4 py-2 text-right font-mono">{d.clicks_recent.toLocaleString()}</td>
      <td className={`px-4 py-2 text-right font-mono ${deltaColor}`}>
        {delta > 0 ? "+" : ""}
        {delta.toFixed(1)}
      </td>
    </tr>
  );
}

function humanAgo(dt: Date): string {
  const diffMs = Date.now() - dt.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
