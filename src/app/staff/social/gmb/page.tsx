import type { Metadata } from "next";
import Link from "next/link";
import gbpData from "@/lib/data/gbp-products.json";
import { GBPProductCard } from "@/components/social/GBPProductCard";
import { ImagePromptCard } from "@/components/social/ImagePromptCard";

export const metadata: Metadata = {
  title: "GBP Products — True Color",
  robots: { index: false },
};

const CATEGORIES = [...new Set(gbpData.products.map((p) => p.category))];

export default function GBPDashboardPage() {
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
            <span className="text-xs text-gray-600 font-medium">GBP Products</span>
          </div>
          <h1 className="text-xl font-black text-[#1c1712] tracking-tight">Google Business Profile</h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
            {gbpData.products.length} products · {gbpData.services.length} services · copy-paste reference
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Products by category */}
        {CATEGORIES.map((category) => {
          const products = gbpData.products.filter((p) => p.category === category);
          return (
            <section key={category}>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e63020]" />
                {category} ({products.length})
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <GBPProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Services Reference */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            GBP Services ({gbpData.services.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">#</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Service</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {gbpData.services.map((service, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 text-xs text-gray-400 font-bold">{i + 1}</td>
                    <td className="px-5 py-2.5 font-semibold text-[#1c1712]">{service.name}</td>
                    <td className="px-5 py-2.5 text-gray-500 text-xs">{service.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Image Prompts */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            ChatGPT Image Prompts
          </h2>
          <p className="text-xs text-gray-400 mb-4">Copy a prompt below and paste into ChatGPT or DALL-E to generate a GBP product photo.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {gbpData.products
              .filter((p) => p.imagePrompt)
              .map((product) => (
                <ImagePromptCard
                  key={product.slug}
                  name={product.name}
                  prompt={product.imagePrompt!}
                  imagePath={product.imagePath}
                />
              ))}
          </div>
        </section>

        {/* Post Schedule */}
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            GBP Post Schedule
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Post 1</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Post 2</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Post 3</th>
                </tr>
              </thead>
              <tbody>
                {gbpData.postSchedule.map((schedule, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 font-semibold text-[#1c1712]">{schedule.campaign}</td>
                    {schedule.posts.map((post, j) => (
                      <td key={j} className="px-5 py-2.5 text-xs text-gray-500">{post}</td>
                    ))}
                    {/* Fill empty cells if fewer than 3 posts */}
                    {Array.from({ length: Math.max(0, 3 - schedule.posts.length) }).map((_, j) => (
                      <td key={`empty-${j}`} className="px-5 py-2.5 text-xs text-gray-300">—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
