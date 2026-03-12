"use client";

import Link from "next/link";
import { InstagramFeed } from "./InstagramFeed";

export function GalleryStrip() {
  return (
    <section className="bg-[#1c1712] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Our work speaks for itself
        </h2>

        {/* Instagram feed — Trustindex widget injected client-side */}
        <InstagramFeed />

        {/* Bottom row: gallery link + Instagram */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <Link
            href="/gallery"
            className="text-white font-semibold text-sm hover:underline"
          >
            See full gallery →
          </Link>
          <a
            href="https://www.instagram.com/truecolorprint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-gray-200 transition-colors"
          >
            Follow @truecolorprint on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
