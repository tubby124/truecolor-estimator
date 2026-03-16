import type { Metadata } from "next";
import Link from "next/link";
import lazyLoad from "next/dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { TriggerButton } from "@/components/social/TriggerButton";
import type { BlitzNiche, BlitzCampaign } from "@/lib/types/blitz";

const BlitzPipeline = lazyLoad(
  () => import("@/components/social/BlitzPipeline").then(m => m.BlitzPipeline),
  { loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-2xl" /> }
);

const NicheTable = lazyLoad(
  () => import("@/components/social/NicheTable").then(m => m.NicheTable),
  { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> }
);

export const metadata: Metadata = {
  title: "Email Blitz — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const supabase = createServiceClient();

    const [campaignRes, nicheRes, totalRes, activeRes, completedRes, bouncedRes, pausedRes, outreachRes, engagementRes] =
      await Promise.all([
        supabase
          .from("tc_campaigns")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("tc_niche_registry")
          .select("*")
          .order("lead_count", { ascending: false }),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true })
          .eq("drip_status", "active"),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true })
          .eq("drip_status", "completed"),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true })
          .eq("drip_status", "bounced"),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true })
          .eq("drip_status", "paused"),
        supabase
          .from("tc_leads")
          .select("*", { count: "exact", head: true })
          .eq("manual_outreach_ready", true)
          .is("manual_outreach_at", null),
        supabase
          .from("tc_leads")
          .select("drip_niche, emails_sent, emails_opened, emails_clicked")
          .not("drip_status", "eq", "queued"),
      ]);

    const engagementData = engagementRes.data ?? [];
    const totalEmailsSent = engagementData.reduce((sum, l) => sum + (l.emails_sent ?? 0), 0);
    const totalOpened = engagementData.reduce((sum, l) => sum + (l.emails_opened ?? 0), 0);
    const totalClicked = engagementData.reduce((sum, l) => sum + (l.emails_clicked ?? 0), 0);

    const nicheEngagement = engagementData.reduce<Record<string, { sent: number; opened: number; clicked: number }>>((acc, l) => {
      const niche = l.drip_niche ?? "unknown";
      if (!acc[niche]) acc[niche] = { sent: 0, opened: 0, clicked: 0 };
      acc[niche].sent += l.emails_sent ?? 0;
      acc[niche].opened += l.emails_opened ?? 0;
      acc[niche].clicked += l.emails_clicked ?? 0;
      return acc;
    }, {});

    return {
      campaigns: (campaignRes.data ?? []) as BlitzCampaign[],
      niches: (nicheRes.data ?? []) as BlitzNiche[],
      stats: {
        totalLeads: totalRes.count ?? 0,
        activeLeads: activeRes.count ?? 0,
        completedLeads: completedRes.count ?? 0,
        bouncedLeads: bouncedRes.count ?? 0,
        pausedLeads: pausedRes.count ?? 0,
        outreachPending: outreachRes.count ?? 0,
      },
      engagement: { totalEmailsSent, totalOpened, totalClicked },
      nicheEngagement,
      lastEngineRun: campaignRes.data?.[0]?.updated_at ?? null,
    };
  } catch {
    return {
      campaigns: [],
      niches: [],
      stats: { totalLeads: 0, activeLeads: 0, completedLeads: 0, bouncedLeads: 0, pausedLeads: 0, outreachPending: 0 },
      engagement: { totalEmailsSent: 0, totalOpened: 0, totalClicked: 0 },
      nicheEngagement: {},
      lastEngineRun: null,
    };
  }
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-[#1c1712] rounded-2xl px-5 py-4 flex flex-col justify-between min-h-[88px]">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      <div>
        <p className="text-2xl font-black leading-tight" style={{ color: accent ?? "#ffffff" }}>{value}</p>
        {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "< 1 hr ago";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default async function BlitzDashboardPage() {
  const { campaigns, niches, stats, engagement, lastEngineRun } = await getData();

  const bounceRate = stats.activeLeads + stats.completedLeads + stats.bouncedLeads > 0
    ? ((stats.bouncedLeads / (stats.activeLeads + stats.completedLeads + stats.bouncedLeads)) * 100).toFixed(1)
    : "0";

  const openRate = engagement.totalEmailsSent > 0
    ? ((engagement.totalOpened / engagement.totalEmailsSent) * 100).toFixed(1)
    : "0.0";
  const clickRate = engagement.totalEmailsSent > 0
    ? ((engagement.totalClicked / engagement.totalEmailsSent) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/staff/social" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Command Center
              </Link>
              <span className="text-xs text-gray-300">/</span>
              <span className="text-xs text-gray-600 font-medium">Email Blitz</span>
            </div>
            <h1 className="text-xl font-black text-[#1c1712] tracking-tight">Email Blitz Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
              {stats.totalLeads.toLocaleString()} leads · {niches.length} niches · n8n drip engine
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.outreachPending > 0 && (
              <Link
                href="/staff/social/blitz/outreach"
                className="text-xs bg-amber-100 text-amber-800 px-3 py-2 rounded-lg font-semibold hover:bg-amber-200 transition-colors"
              >
                {stats.outreachPending} ready for DM
              </Link>
            )}
            <TriggerButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-3">
          <StatCard label="Total leads" value={stats.totalLeads.toLocaleString()} accent="#94a3b8" />
          <StatCard label="Active drip" value={stats.activeLeads} accent="#34d399" />
          <StatCard label="Completed" value={stats.completedLeads} accent="#22c55e" />
          <StatCard label="Bounced" value={stats.bouncedLeads} accent={stats.bouncedLeads > 0 ? "#ef4444" : "#94a3b8"} />
          <StatCard label="Bounce rate" value={`${bounceRate}%`} accent={parseFloat(bounceRate) > 5 ? "#ef4444" : "#34d399"} />
          <StatCard label="DM Queue" value={stats.outreachPending} accent="#f97316" sub="manual outreach" />
          <StatCard
            label="Last engine run"
            value={lastEngineRun ? timeAgo(lastEngineRun) : "—"}
            sub={!lastEngineRun ? "No runs yet" : undefined}
            accent="#fbbf24"
          />
          <StatCard label="Emails Sent" value={engagement.totalEmailsSent.toLocaleString()} accent="#94a3b8" />
          <StatCard label="Open Rate" value={`${openRate}%`} accent={parseFloat(openRate) >= 20 ? "#34d399" : "#fbbf24"} />
          <StatCard label="Click Rate" value={`${clickRate}%`} accent={parseFloat(clickRate) >= 3 ? "#34d399" : "#fbbf24"} />
        </div>

        {/* Campaign pipeline */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e63020]" />
            Campaign Pipeline
          </h2>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400 mb-2">No campaigns created yet</p>
              <p className="text-xs text-gray-300">Run /industry-blitz to launch your first niche campaign</p>
            </div>
          ) : (
            <BlitzPipeline campaigns={campaigns} />
          )}
        </section>

        {/* Niche registry */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Niche Registry ({niches.length})
          </h2>
          {niches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No niches registered yet</p>
            </div>
          ) : (
            <NicheTable niches={niches} />
          )}
        </section>
      </div>
    </div>
  );
}
