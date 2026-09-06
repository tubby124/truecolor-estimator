import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireSocialBusiness, scopeSocialQuery } from "@/lib/social/business";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { CalendarGrid } from "@/components/social/CalendarGrid";

export const metadata: Metadata = {
  title: "Calendar — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  const auth = await requireSocialBusiness();
  if (auth instanceof NextResponse) redirect("/staff/login");
  try {
    const supabase = createServiceClient();
    const [{ data: posts }, { data: campaigns }] = await Promise.all([
      scopeSocialQuery(supabase
        .from("social_posts")
        .select(`*, campaign:social_campaigns(id, slug, name, campaign_color)`)
        .neq("status", "skip"), auth.businessId),
      scopeSocialQuery(supabase
        .from("social_campaigns")
        .select("*")
        .order("event_date", { ascending: true }), auth.businessId),
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
