import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireSocialBusiness, scopeSocialQuery } from "@/lib/social/business";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { PostQueueTable } from "@/components/social/PostQueueTable";

export const metadata: Metadata = {
  title: "Post Queue — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getPosts(campaignId?: string) {
  const auth = await requireSocialBusiness();
  if (auth instanceof NextResponse) redirect("/staff/login");
  try {
    const supabase = createServiceClient();
    let query = scopeSocialQuery(supabase
      .from("social_posts")
      .select(`
        *,
        campaign:social_campaigns(id, slug, name, campaign_color)
      `)
      .order("created_at", { ascending: false }), auth.businessId);

    if (campaignId) query = query.eq("campaign_id", campaignId);

    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ campaign?: string }>;
}

export default async function QueuePage({ searchParams }: PageProps) {
  const { campaign } = await searchParams;
  const posts = await getPosts(campaign);

  return <PostQueueTable initialPosts={posts} campaignFilter={campaign} />;
}
