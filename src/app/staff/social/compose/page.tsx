import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireSocialBusiness, scopeSocialQuery } from "@/lib/social/business";
import type { Metadata } from "next";
import { Suspense } from "react";
import lazyLoad from "next/dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/Skeleton";

const ComposeForm = lazyLoad(
  () => import("@/components/social/ComposeForm").then(m => m.ComposeForm),
  { loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-2xl max-w-3xl mx-auto m-6" /> }
);

export const metadata: Metadata = {
  title: "Compose — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getCampaigns() {
  const auth = await requireSocialBusiness();
  if (auth instanceof NextResponse) redirect("/staff/login");
  try {
    const supabase = createServiceClient();
    const { data } = await scopeSocialQuery(supabase
      .from("social_campaigns")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false }), auth.businessId);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ComposePage() {
  const campaigns = await getCampaigns();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f8f8] p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl mx-auto rounded-2xl" />
      </div>
    }>
      <ComposeForm campaigns={campaigns} />
    </Suspense>
  );
}
