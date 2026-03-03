import type { Metadata } from "next";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { ComposeForm } from "@/components/social/ComposeForm";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Compose — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getCampaigns() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("social_campaigns")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false });
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
