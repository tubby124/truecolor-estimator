import { requireSocialBusiness, DEFAULT_SOCIAL_BUSINESS_ID } from "@/lib/social/business";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { BlitzStats } from "@/lib/types/blitz";

export async function GET(req?: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.businessId !== DEFAULT_SOCIAL_BUSINESS_ID) return NextResponse.json({ error: "Blitz is only available for True Color" }, { status: 403 });

  const supabase = createServiceClient();

  const [totalRes, activeRes, completedRes, bouncedRes, pausedRes, nichesRes, campaignRes] =
    await Promise.all([
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
        .from("tc_niche_registry")
        .select("*", { count: "exact", head: true })
        .eq("has_campaign", true),
      supabase
        .from("tc_campaigns")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  const stats: BlitzStats = {
    totalLeads: totalRes.count ?? 0,
    activeLeads: activeRes.count ?? 0,
    completedLeads: completedRes.count ?? 0,
    bouncedLeads: bouncedRes.count ?? 0,
    pausedLeads: pausedRes.count ?? 0,
    nichesLive: nichesRes.count ?? 0,
    lastEngineRun: campaignRes.data?.[0]?.updated_at ?? null,
  };

  return NextResponse.json(stats);
}
