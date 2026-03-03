import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { CampaignCard } from "@/components/social/CampaignCard";
import type { SocialCampaign, SocialPost } from "@/lib/types/social";

export const metadata: Metadata = {
  title: "Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const supabase = createServiceClient();

    const { data: campaigns } = await supabase
      .from("social_campaigns")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false });

    const { data: posts } = await supabase
      .from("social_posts")
      .select("id, campaign_id, status, schedule_time, posted_at")
      .neq("status", "skip");

    return { campaigns: campaigns ?? [], posts: posts ?? [] };
  } catch {
    return { campaigns: [], posts: [] };
  }
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-[#1c1712] mt-1 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function SocialDashboardPage() {
  const { campaigns, posts } = await getData();

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
            <h1 className="text-xl font-black text-[#1c1712]">Command Center</h1>
            <p className="text-sm text-gray-400 mt-0.5">All campaigns · every channel · one view</p>
          </div>
          <Link
            href="/staff/social/compose"
            className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#c8281a] transition-colors"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Posts in queue" value={totalInQueue} />
          <StatCard label="Posting this week" value={postingThisWeek} />
          <StatCard label="Active campaigns" value={activeCampaigns} />
          <StatCard
            label="Last posted"
            value={lastPosted?.posted_at ? timeAgo(lastPosted.posted_at) : "—"}
            sub={!lastPosted ? "No posts yet" : undefined}
          />
        </div>

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
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Active</h2>
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
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Upcoming</h2>
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
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Completed</h2>
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
