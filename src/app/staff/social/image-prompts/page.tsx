"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import gbpData from "@/lib/data/gbp-products.json";
import nichePrompts from "@/lib/data/niche-image-prompts.json";
import { ImagePromptCard } from "@/components/social/ImagePromptCard";

const gbpProducts = gbpData.products.filter((p) => p.imagePrompt);

function ImagePromptsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = searchParams.get("type");
  const nicheParam = searchParams.get("niche");

  const activeType = nicheParam ? "landing" : typeParam;

  const totalNiche = nichePrompts.sources.reduce((sum, s) => sum + s.prompts.length, 0);
  const totalGbp = gbpProducts.length;
  const totalAll = totalNiche + totalGbp;

  const filteredSources = nicheParam
    ? nichePrompts.sources.filter((s) => s.slug === nicheParam)
    : nichePrompts.sources;

  const filteredNicheCount = filteredSources.reduce((sum, s) => sum + s.prompts.length, 0);

  const showLanding = !activeType || activeType === "landing";
  const showGbp = !activeType || activeType === "gbp";

  const visibleCount = (showLanding ? filteredNicheCount : 0) + (showGbp ? totalGbp : 0);
  const visibleSources = showLanding ? filteredSources.length : 0;

  const nicheSource = nicheParam
    ? nichePrompts.sources.find((s) => s.slug === nicheParam)
    : null;

  function setFilter(type: string | null, niche: string | null) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (niche) params.set("niche", niche);
    const qs = params.toString();
    router.push(`/staff/social/image-prompts${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
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
            {visibleCount} prompts · {visibleSources} landing pages · {showGbp ? totalGbp : 0} GBP products · copy &amp; paste into ChatGPT
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="sticky top-0 z-10 bg-[#f8f8f8] py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(null, null)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                !activeType
                  ? "bg-[#1c1712] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              All ({totalAll})
            </button>
            <button
              onClick={() => setFilter("landing", null)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                activeType === "landing"
                  ? "bg-[#1c1712] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              Landing Pages ({totalNiche})
            </button>
            <button
              onClick={() => setFilter("gbp", null)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                activeType === "gbp"
                  ? "bg-[#1c1712] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              GBP Products ({totalGbp})
            </button>
          </div>

          {nicheSource && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1.5">
                {nicheSource.name}
                <button
                  onClick={() => setFilter("landing", null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors font-bold"
                >
                  &times;
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="py-8 space-y-10">
          {showLanding &&
            filteredSources.map((source) => (
              <section key={source.slug}>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e63020]" />
                  {source.name} ({source.prompts.length})
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Landing page:{" "}
                  <Link href={`/${source.slug}`} className="text-gray-500 font-medium hover:text-[#e63020] transition-colors">
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

          {showGbp && (
            <section>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                GBP Product Photos ({totalGbp})
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
