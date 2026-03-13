import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/social/LeadsTable";
import { TemplateTimeline } from "@/components/social/TemplateTimeline";
import type { BlitzNiche, BlitzTemplate } from "@/lib/types/blitz";
import nicheImagePrompts from "@/lib/data/niche-image-prompts.json";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }) {
  const { niche } = await params;
  return {
    title: `${niche} — Email Blitz`,
    robots: { index: false },
  };
}

async function getData(nicheSlug: string) {
  const supabase = createServiceClient();

  const { data: nicheData } = await supabase
    .from("tc_niche_registry")
    .select("*")
    .eq("niche_slug", nicheSlug)
    .single();

  if (!nicheData) return null;

  const [templatesRes, activeRes, completedRes, bouncedRes, pausedRes, queuedRes] =
    await Promise.all([
      supabase
        .from("tc_email_templates")
        .select("*")
        .eq("niche_slug", nicheSlug)
        .order("step", { ascending: true }),
      supabase
        .from("tc_leads")
        .select("*", { count: "exact", head: true })
        .contains("industry_tags", [nicheSlug])
        .eq("drip_status", "active"),
      supabase
        .from("tc_leads")
        .select("*", { count: "exact", head: true })
        .contains("industry_tags", [nicheSlug])
        .eq("drip_status", "completed"),
      supabase
        .from("tc_leads")
        .select("*", { count: "exact", head: true })
        .contains("industry_tags", [nicheSlug])
        .eq("drip_status", "bounced"),
      supabase
        .from("tc_leads")
        .select("*", { count: "exact", head: true })
        .contains("industry_tags", [nicheSlug])
        .eq("drip_status", "paused"),
      supabase
        .from("tc_leads")
        .select("*", { count: "exact", head: true })
        .contains("industry_tags", [nicheSlug])
        .eq("drip_status", "queued"),
    ]);

  return {
    niche: nicheData as BlitzNiche,
    templates: (templatesRes.data ?? []) as BlitzTemplate[],
    counts: {
      active: activeRes.count ?? 0,
      completed: completedRes.count ?? 0,
      bounced: bouncedRes.count ?? 0,
      paused: pausedRes.count ?? 0,
      queued: queuedRes.count ?? 0,
    },
  };
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[#1c1712] rounded-2xl px-4 py-3 flex flex-col justify-between min-h-[72px]">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black leading-tight" style={{ color: accent ?? "#ffffff" }}>{value}</p>
    </div>
  );
}

export default async function NicheDetailPage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche: nicheSlug } = await params;
  const data = await getData(nicheSlug);

  if (!data) notFound();

  const { niche, templates, counts } = data;
  const total = counts.active + counts.completed + counts.bounced + counts.paused + counts.queued;
  const bounceRate = counts.active + counts.completed + counts.bounced > 0
    ? ((counts.bounced / (counts.active + counts.completed + counts.bounced)) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-1">
            <Link href="/staff/social" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Command Center
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <Link href="/staff/social/blitz" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Blitz
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600 font-medium">{niche.display_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[#1c1712] tracking-tight">{niche.display_name}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              niche.has_campaign ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {niche.has_campaign ? "Campaign Active" : "No Campaign"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
            {total.toLocaleString()} leads · {niche.niche_slug}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={total.toLocaleString()} accent="#94a3b8" />
          <StatCard label="Active" value={counts.active} accent="#34d399" />
          <StatCard label="Queued" value={counts.queued} accent="#fbbf24" />
          <StatCard label="Completed" value={counts.completed} accent="#22c55e" />
          <StatCard label="Bounced" value={counts.bounced} accent={counts.bounced > 0 ? "#ef4444" : "#94a3b8"} />
          <StatCard label="Bounce rate" value={`${bounceRate}%`} accent={parseFloat(bounceRate) > 5 ? "#ef4444" : "#34d399"} />
        </div>

        {/* Health indicators */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Landing Page</p>
            {niche.has_landing_page && niche.landing_page_slug ? (
              <a
                href={`https://truecolorprinting.ca/${niche.landing_page_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#e63020] hover:underline"
              >
                /{niche.landing_page_slug} →
              </a>
            ) : (
              <p className="text-sm text-gray-300">Not created</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">GBP Posts</p>
            <p className="text-sm font-bold text-[#1c1712]">
              {niche.gbp_posts_generated ? "Generated" : "Not generated"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priority</p>
            <p className="text-sm font-bold text-[#1c1712]">
              {niche.priority === 1 ? "High" : niche.priority === 2 ? "Medium" : "Low"}
            </p>
          </div>
        </div>

        {/* Image prompts link */}
        {(() => {
          const nichePromptSource = nicheImagePrompts.sources.find(
            (s) => s.slug === niche.landing_page_slug
          );
          if (!niche.has_landing_page || !niche.landing_page_slug || !nichePromptSource || nichePromptSource.prompts.length === 0) return null;
          return (
            <Link
              href={`/staff/social/image-prompts?niche=${niche.landing_page_slug}`}
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:border-purple-300 hover:shadow-sm transition-all group/link"
            >
              <div>
                <span className="text-sm font-bold text-[#1c1712]">Image Prompts for {niche.display_name}</span>
                <span className="text-xs text-gray-400 ml-2">{nichePromptSource.prompts.length} prompts available</span>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover/link:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })()}

        {/* Template timeline */}
        {templates.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Email Sequence ({templates.length} steps)
            </h2>
            <TemplateTimeline templates={templates} />
          </section>
        )}

        {/* Leads table */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e63020]" />
            Leads
          </h2>
          {total === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No leads tagged with &ldquo;{niche.niche_slug}&rdquo;</p>
            </div>
          ) : (
            <LeadsTable nicheSlug={nicheSlug} />
          )}
        </section>
      </div>
    </div>
  );
}
