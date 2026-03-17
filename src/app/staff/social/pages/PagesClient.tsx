"use client";

import { useState } from "react";
import Link from "next/link";
import { SendToSocialModal } from "@/components/social/SendToSocialModal";

interface LandingPage {
  slug: string;
  title: string;
  keyword: string;
}

export function PagesClient({ pages }: { pages: LandingPage[] }) {
  const [search, setSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.keyword.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">Landing Pages</h1>
            <p className="text-sm text-gray-400 mt-0.5">{pages.length} pages · Create posts from your SEO pages</p>
          </div>
          <Link
            href="/staff/social/queue"
            className="text-sm font-semibold text-gray-500 hover:text-[#1c1712]"
          >
            ← Queue
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pages..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(page => (
            <div
              key={page.slug}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <h3 className="text-sm font-bold text-[#1c1712] mb-1">{page.title}</h3>
              <p className="text-xs text-gray-400 mb-3">/{page.slug}</p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://truecolorprinting.ca/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  View
                </a>
                <button
                  onClick={() => setSelectedPage(page)}
                  className="text-xs font-bold text-[#e63020] hover:text-[#c8281a] px-2.5 py-1.5 rounded-lg border border-[#e63020]/20 hover:bg-[#e63020]/5 transition-colors"
                >
                  Create Post
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No pages match your search.</p>
          </div>
        )}
      </div>

      {selectedPage && (
        <SendToSocialModal
          isOpen={!!selectedPage}
          onClose={() => setSelectedPage(null)}
          initialData={{
            caption: `${selectedPage.title} — professional ${selectedPage.keyword} in Saskatoon. In-house Roland UV printer, from competitive prices. Same-day rush available (+$40).`,
            source: "manual",
          }}
        />
      )}
    </div>
  );
}
