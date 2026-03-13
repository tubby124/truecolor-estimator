import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { CampaignCard } from "@/components/social/CampaignCard";
import type { SocialCampaign, SocialPost } from "@/lib/types/social";
import gbpData from "@/lib/data/gbp-products.json";

export const metadata: Metadata = {
  title: "Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const supabase = createServiceClient();

    const [campaignRes, postRes, blitzTotalRes, blitzActiveRes, blitzCompletedRes, blitzBouncedRes, nichesRes] =
      await Promise.all([
        supabase
          .from("social_campaigns")
          .select("*")
          .order("event_date", { ascending: true, nullsFirst: false }),
        supabase
          .from("social_posts")
          .select("id, campaign_id, status, schedule_time, posted_at")
          .neq("status", "skip"),
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
          .from("tc_niche_registry")
          .select("*", { count: "exact", head: true })
          .eq("has_campaign", true),
      ]);

    return {
      campaigns: campaignRes.data ?? [],
      posts: postRes.data ?? [],
      blitz: {
        totalLeads: blitzTotalRes.count ?? 0,
        activeLeads: blitzActiveRes.count ?? 0,
        completedLeads: blitzCompletedRes.count ?? 0,
        bouncedLeads: blitzBouncedRes.count ?? 0,
        nichesLive: nichesRes.count ?? 0,
      },
    };
  } catch {
    return {
      campaigns: [],
      posts: [],
      blitz: { totalLeads: 0, activeLeads: 0, completedLeads: 0, bouncedLeads: 0, nichesLive: 0 },
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

export default async function SocialDashboardPage() {
  const { campaigns, posts, blitz } = await getData();

  // Compute stats
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const totalInQueue = posts.filter((p: Partial<SocialPost>) => p.status !== "posted" && p.status !== "failed").length;
  const postingThisWeek = posts.filter((p: Partial<SocialPost>) => {
    if (!p.schedule_time) return false;
    const d = new Date(p.schedule_time);
    return d >= now && d <= weekEnd;
  }).length;
  const activeCampaigns = campaigns.filter((c: SocialCampaign) => c.status === "in-progress").length;

  const lastPosted = posts
    .filter((p: Partial<SocialPost>) => p.posted_at)
    .sort((a: Partial<SocialPost>, b: Partial<SocialPost>) =>
      new Date(b.posted_at!).getTime() - new Date(a.posted_at!).getTime()
    )[0];

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (h < 1) return "< 1 hr ago";
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  }

  // Enrich campaigns with post counts
  const enriched = campaigns.map((c: SocialCampaign) => {
    const cp = posts.filter((p: Partial<SocialPost>) => p.campaign_id === c.id);
    return {
      ...c,
      post_count: cp.length,
      posts_ready: cp.filter((p: Partial<SocialPost>) => p.status === "ready" || p.status === "posting").length,
      posts_posted: cp.filter((p: Partial<SocialPost>) => p.status === "posted").length,
    };
  });

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712] tracking-tight">Command Center</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">All campaigns · every channel · one view</p>
          </div>
          <Link
            href="/staff/social/compose"
            className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-black px-5 py-2.5 rounded-xl hover:bg-[#c8281a] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Post
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Posts in queue" value={totalInQueue} accent="#e63020" />
          <StatCard label="Posting this week" value={postingThisWeek} accent="#fbbf24" />
          <StatCard label="Active campaigns" value={activeCampaigns} accent="#34d399" />
          <StatCard
            label="Last posted"
            value={lastPosted?.posted_at ? timeAgo(lastPosted.posted_at) : "—"}
            sub={!lastPosted ? "No posts yet" : undefined}
            accent="#94a3b8"
          />
        </div>

        {/* Email Blitz summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#e63020]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699-2.842a4.5 4.5 0 10-6.364-6.364" />
              </svg>
              Email Blitz
            </h2>
            <Link href="/staff/social/blitz" className="text-xs font-bold text-[#e63020] hover:underline">
              View Dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total leads" value={blitz.totalLeads.toLocaleString()} accent="#94a3b8" />
            <StatCard label="Active drip" value={blitz.activeLeads} accent="#34d399" />
            <StatCard label="Completed" value={blitz.completedLeads} accent="#22c55e" />
            <StatCard label="Bounced" value={blitz.bouncedLeads} accent={blitz.bouncedLeads > 0 ? "#ef4444" : "#94a3b8"} />
            <StatCard label="Niches live" value={blitz.nichesLive} accent="#fbbf24" />
          </div>
        </section>

        {/* GBP Products summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Google Business Profile
            </h2>
            <Link href="/staff/social/gmb" className="text-xs font-bold text-[#e63020] hover:underline">
              View Products →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="GBP products" value={gbpData.products.length} accent="#fbbf24" />
            <StatCard label="GBP services" value={gbpData.services.length} accent="#34d399" />
            <StatCard label="Post schedule" value={`${gbpData.postSchedule.length} campaigns`} accent="#94a3b8" />
          </div>
        </section>

        {/* Campaign grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-bold text-[#1c1712] mb-2">No campaigns yet</h2>
            <p className="text-sm text-gray-400 mb-6">Run the Phase 1 SQL in Supabase to seed the 9 campaigns.</p>
            <Link
              href="/staff/social/settings"
              className="text-sm font-semibold text-[#e63020] hover:underline"
            >
              Go to Settings →
            </Link>
          </div>
        ) : (
          <>
            {/* In-progress first */}
            {enriched.filter((c: SocialCampaign) => c.status === "in-progress").length > 0 && (
              <section>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />Active
              </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {enriched
                    .filter((c: SocialCampaign) => c.status === "in-progress")
                    .map((c: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number }, i: number) => (
                      <CampaignCard key={c.id} campaign={c} index={i} />
                    ))}
                </div>
              </section>
            )}

            {/* Planned */}
            {enriched.filter((c: SocialCampaign) => c.status === "planned").length > 0 && (
              <section>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300" />Upcoming
              </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {enriched
                    .filter((c: SocialCampaign) => c.status === "planned")
                    .map((c: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number }, i: number) => (
                      <CampaignCard key={c.id} campaign={c} index={i + 3} />
                    ))}
                </div>
              </section>
            )}

            {/* Complete / Archived */}
            {enriched.filter((c: SocialCampaign) => c.status === "complete" || c.status === "archived").length > 0 && (
              <section>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />Completed
              </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {enriched
                    .filter((c: SocialCampaign) => c.status === "complete" || c.status === "archived")
                    .map((c: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number }, i: number) => (
                      <CampaignCard key={c.id} campaign={c} index={i + 6} />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
