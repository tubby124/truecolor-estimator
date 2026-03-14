"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import gbpData from "@/lib/data/gbp-products.json";
import nichePrompts from "@/lib/data/niche-image-prompts.json";
import { ImagePromptCard } from "@/components/social/ImagePromptCard";

const gbpProducts = gbpData.products.filter((p) => p.imagePrompt);

type NicheStatus = "pending" | "generated" | "live";

const STATUS_CONFIG: Record<NicheStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending: {
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-500",
    label: "Pending",
  },
  generated: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Generated",
  },
  live: {
    dot: "bg-green-400",
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Live",
  },
};

function StatusBadge({ status }: { status: NicheStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function NicheCard({
  slug,
  name,
  promptCount,
  status,
  isActive,
  onClick,
}: {
  slug: string;
  name: string;
  promptCount: number;
  status: NicheStatus;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
        isActive
          ? "bg-[#1c1712] border-[#1c1712] text-white shadow-md"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-[#1c1712]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-[#e63020]" : "bg-[#e63020]"}`} />
          <span className="text-xs font-black truncate leading-tight">{name}</span>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {promptCount}
        </span>
      </div>
      <p className={`text-[10px] mb-2 truncate ${isActive ? "text-white/60" : "text-gray-400"}`}>
        /{slug}
      </p>
      <StatusBadge status={status} />
    </button>
  );
}

function GbpCard({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? "bg-[#1c1712] border-[#1c1712] text-white shadow-md"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-[#1c1712]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-purple-500" />
          <span className="text-xs font-black truncate leading-tight">GBP Products</span>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {gbpProducts.length}
        </span>
      </div>
      <p className={`text-[10px] ${isActive ? "text-white/60" : "text-gray-400"}`}>
        Google Business Profile photos
      </p>
    </button>
  );
}

function ImagePromptsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const nicheParam = searchParams.get("niche");
  const typeParam = searchParams.get("type");

  const isGbpActive = typeParam === "gbp";
  const activeNiche = !isGbpActive ? nicheParam : null;

  function selectNiche(slug: string) {
    router.push(`/staff/social/image-prompts?niche=${slug}`, { scroll: false });
  }

  function selectGbp() {
    router.push(`/staff/social/image-prompts?type=gbp`, { scroll: false });
  }

  function clearFilter() {
    router.push(`/staff/social/image-prompts`, { scroll: false });
  }

  const activeNicheSource = activeNiche
    ? nichePrompts.sources.find((s) => s.slug === activeNiche)
    : null;

  const showAllNiches = !activeNiche && !isGbpActive;
  const nicheSourcesToShow = activeNiche
    ? nichePrompts.sources.filter((s) => s.slug === activeNiche)
    : nichePrompts.sources;

  const totalAll =
    nichePrompts.sources.reduce((sum, s) => sum + s.prompts.length, 0) + gbpProducts.length;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/staff/social" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Command Center
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600 font-medium">Image Prompts</span>
          </div>
          <h1 className="text-xl font-black text-[#1c1712] tracking-tight">ChatGPT Image Prompts</h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
            {totalAll} prompts · {nichePrompts.sources.length} landing pages · {gbpProducts.length} GBP products · copy &amp; paste into ChatGPT
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Niche Overview Grid */}
        <div className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Niches &amp; Status
            </h2>
            {(activeNiche || isGbpActive) && (
              <button
                onClick={clearFilter}
                className="text-[10px] font-bold text-gray-400 hover:text-[#e63020] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>&times;</span> Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {nichePrompts.sources.map((source) => (
              <NicheCard
                key={source.slug}
                slug={source.slug}
                name={source.name}
                promptCount={source.prompts.length}
                status={(source.status as NicheStatus) ?? "pending"}
                isActive={activeNiche === source.slug}
                onClick={() => selectNiche(source.slug)}
              />
            ))}
            <GbpCard isActive={isGbpActive} onClick={selectGbp} />
          </div>
        </div>

        {/* Active filter breadcrumb */}
        {(activeNicheSource || isGbpActive) && (
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1.5">
              {isGbpActive ? "GBP Products" : activeNicheSource?.name}
              <button
                onClick={clearFilter}
                className="text-gray-400 hover:text-gray-600 transition-colors font-bold cursor-pointer"
              >
                &times;
              </button>
            </span>
          </div>
        )}

        {/* Prompt Detail Zone */}
        <div className="py-8 space-y-10">
          {/* Landing page niche prompts */}
          {!isGbpActive &&
            nicheSourcesToShow.map((source) => (
              <section key={source.slug}>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e63020]" />
                  {source.name} ({source.prompts.length})
                  <StatusBadge status={(source.status as NicheStatus) ?? "pending"} />
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Landing page:{" "}
                  <Link
                    href={`/${source.slug}`}
                    className="text-gray-500 font-medium hover:text-[#e63020] transition-colors"
                  >
                    /{source.slug}
                  </Link>
                </p>

                {[...new Set(source.prompts.map((p) => p.category))].map((category) => {
                  const items = source.prompts.filter((p) => p.category === category);
                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3 pl-4 border-l-2 border-red-300">
                        {category}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <ImagePromptCard
                            key={item.id}
                            name={item.name}
                            prompt={item.prompt}
                            borderColor="border-l-red-500"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}

          {/* GBP product prompts */}
          {(isGbpActive || showAllNiches) && (
            <section>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                GBP Product Photos ({gbpProducts.length})
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Google Business Profile product listing images
              </p>

              {[...new Set(gbpProducts.map((p) => p.category))].map((category) => {
                const items = gbpProducts.filter((p) => p.category === category);
                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3 pl-4 border-l-2 border-purple-300">
                      {category}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {items.map((product) => (
                        <ImagePromptCard
                          key={product.slug}
                          name={product.name}
                          prompt={product.imagePrompt!}
                          borderColor="border-l-purple-500"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImagePromptsPage() {
  return (
    <Suspense>
      <ImagePromptsContent />
    </Suspense>
  );
}
