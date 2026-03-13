import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { OutreachQueue } from "@/components/social/OutreachQueue";
import type { BlitzLead } from "@/lib/types/blitz";

export const metadata: Metadata = {
  title: "Manual Outreach Queue — Email Blitz",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createServiceClient();

  const { data, count } = await supabase
    .from("tc_leads")
    .select("*", { count: "exact" })
    .eq("manual_outreach_ready", true)
    .in("drip_status", ["active", "completed"])
    .order("score", { ascending: false })
    .limit(100);

  return {
    leads: (data ?? []) as BlitzLead[],
    total: count ?? 0,
  };
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[#1c1712] rounded-2xl px-5 py-4 flex flex-col justify-between min-h-[88px]">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black leading-tight" style={{ color: accent ?? "#ffffff" }}>{value}</p>
    </div>
  );
}

export default async function OutreachPage() {
  const { leads, total } = await getData();

  const contacted = leads.filter((l) => l.manual_outreach_at).length;
  const pending = total - contacted;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/staff/social" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Command Center
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <Link href="/staff/social/blitz" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Email Blitz
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600 font-medium">Manual Outreach</span>
          </div>
          <h1 className="text-xl font-black text-[#1c1712] tracking-tight">Manual Outreach Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
            Leads who received 3+ emails without blocking — ready for a personal DM
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total flagged" value={total} accent="#fbbf24" />
          <StatCard label="Pending DM" value={pending} accent="#f97316" />
          <StatCard label="Contacted" value={contacted} accent="#34d399" />
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400 mb-2">No leads ready for manual outreach yet</p>
            <p className="text-xs text-gray-300">Leads appear here after receiving 3 emails without bouncing</p>
          </div>
        ) : (
          <OutreachQueue leads={leads} />
        )}
      </div>
    </div>
  );
}
