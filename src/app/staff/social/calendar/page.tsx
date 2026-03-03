import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { CalendarGrid } from "@/components/social/CalendarGrid";

export const metadata: Metadata = {
  title: "Calendar — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const supabase = createServiceClient();
    const [{ data: posts }, { data: campaigns }] = await Promise.all([
      supabase
        .from("social_posts")
        .select(`*, campaign:social_campaigns(id, slug, name, campaign_color)`)
        .neq("status", "skip"),
      supabase
        .from("social_campaigns")
        .select("*")
        .order("event_date", { ascending: true }),
    ]);
    return { posts: posts ?? [], campaigns: campaigns ?? [] };
  } catch {
    return { posts: [], campaigns: [] };
  }
}

export default async function CalendarPage() {
  const { posts, campaigns } = await getData();
  return <CalendarGrid initialPosts={posts} campaigns={campaigns} />;
}
