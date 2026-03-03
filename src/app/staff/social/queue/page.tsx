import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { PostQueueTable } from "@/components/social/PostQueueTable";

export const metadata: Metadata = {
  title: "Post Queue — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getPosts(campaignId?: string) {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("social_posts")
      .select(`
        *,
        campaign:social_campaigns(id, slug, name, campaign_color)
      `)
      .order("created_at", { ascending: false });

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
