import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { GalleryGrid } from "./GalleryGrid";
import { InstagramFeed } from "@/components/home/InstagramFeed";

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

const gallerySchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Print Work Gallery — True Color Display Printing",
  description:
    "Photo gallery of real print jobs from True Color Display Printing in Saskatoon — coroplast signs, vinyl banners, vehicle magnets, business cards, and large format prints.",
  url: "https://truecolorprinting.ca/gallery",
  provider: {
    "@type": "LocalBusiness",
    name: "True Color Display Printing",
    url: "https://truecolorprinting.ca",
    address: {
      "@type": "PostalAddress",
      streetAddress: "216 33rd St W",
      addressLocality: "Saskatoon",
      addressRegion: "SK",
      postalCode: "S7L 0V5",
      addressCountry: "CA",
    },
  },
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
      />
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

        {/* Live Instagram feed */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-4">
            Latest from Instagram
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Follow{" "}
            <a
              href="https://www.instagram.com/truecolorprint"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#16C2F3] hover:underline"
            >
              @truecolorprint
            </a>{" "}
            for daily project updates.
          </p>
          <InstagramFeed />
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-5 text-lg">
            Like what you see? Your name could be on the next one.
          </p>
          <Link
            href="/products"
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
