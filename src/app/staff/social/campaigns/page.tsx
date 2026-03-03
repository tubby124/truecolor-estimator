import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { CampaignCard } from "@/components/social/CampaignCard";
import type { SocialCampaign, SocialPost } from "@/lib/types/social";

export const metadata: Metadata = {
  title: "Campaigns — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const supabase = createServiceClient();
    const [{ data: campaigns }, { data: posts }] = await Promise.all([
      supabase.from("social_campaigns").select("*").order("event_date", { ascending: true }),
      supabase.from("social_posts").select("id, campaign_id, status").neq("status", "skip"),
    ]);
    return { campaigns: campaigns ?? [], posts: posts ?? [] };
  } catch {
    return { campaigns: [], posts: [] };
  }
}

export default async function CampaignsPage() {
  const { campaigns, posts } = await getData();

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
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">All Campaigns</h1>
            <p className="text-sm text-gray-400 mt-0.5">{campaigns.length} campaigns · 2026 season</p>
          </div>
          <Link
            href="/staff/social/compose"
            className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#c8281a] transition-colors"
          >
            + New Post
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {enriched.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400">No campaigns yet. Run Phase 1 SQL in Supabase.</p>
            <Link href="/staff/social/settings" className="text-sm font-semibold text-[#e63020] hover:underline mt-3 inline-block">
              Go to Settings →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {enriched.map((c: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number }, i: number) => (
              <CampaignCard key={c.id} campaign={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
