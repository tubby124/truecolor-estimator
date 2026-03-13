import type { Metadata } from "next";
import Link from "next/link";
import gbpData from "@/lib/data/gbp-products.json";
import nichePrompts from "@/lib/data/niche-image-prompts.json";
import { ImagePromptCard } from "@/components/social/ImagePromptCard";

export const metadata: Metadata = {
  title: "Image Prompts — True Color",
  robots: { index: false },
};

const gbpProducts = gbpData.products.filter((p) => p.imagePrompt);

export default function ImagePromptsPage() {
  const totalNiche = nichePrompts.sources.reduce((sum, s) => sum + s.prompts.length, 0);
  const totalAll = gbpProducts.length + totalNiche;

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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Landing Page Design Directions */}
        {nichePrompts.sources.map((source) => (
          <section key={source.slug}>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e63020]" />
              {source.name} ({source.prompts.length})
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Landing page: <span className="text-gray-500 font-medium">/{source.slug}</span>
            </p>

            {/* Group by category */}
            {[...new Set(source.prompts.map((p) => p.category))].map((category) => {
              const items = source.prompts.filter((p) => p.category === category);
              return (
                <div key={category} className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3 pl-4 border-l-2 border-purple-300">
                    {category}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <ImagePromptCard
                        key={item.id}
                        name={item.name}
                        prompt={item.prompt}
                        imagePath={item.imagePath}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ))}

        {/* GBP Product Prompts */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            GBP Product Photos ({gbpProducts.length})
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Google Business Profile product listing images
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {gbpProducts.map((product) => (
              <ImagePromptCard
                key={product.slug}
                name={product.name}
                prompt={product.imagePrompt!}
                imagePath={product.imagePath}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
