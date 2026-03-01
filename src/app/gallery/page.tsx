import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { GalleryGrid } from "./GalleryGrid";

export const metadata: Metadata = {
  title: "Our Work | Print Shop Gallery Saskatoon",
  description:
    "See real jobs from True Color Display Printing — coroplast signs, vinyl banners, vehicle magnets, business cards and more. Local Saskatoon print shop.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Our Work | Saskatoon Print Shop Gallery",
    description:
      "Real jobs from True Color — coroplast signs, vinyl banners, vehicle magnets, business cards and more. Saskatoon print shop at 216 33rd St W.",
    url: "https://truecolorprinting.ca/gallery",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1712] mb-3">Our Work</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Signs, banners, magnets, cards, and more — all designed, printed, and
            picked up at 216 33rd St W, Saskatoon.
          </p>
        </div>

        {/* Gallery grid — real client work first, product showcase behind View More */}
        <GalleryGrid />

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-5 text-lg">
            Like what you see? Your name could be on the next one.
          </p>
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get My Price →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
