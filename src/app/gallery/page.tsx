import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { GalleryGrid } from "./GalleryGrid";
import { IndustryShowcase } from "./IndustryShowcase";

export const metadata: Metadata = {
  title: "Our Work | Print Shop Gallery Saskatoon",
  description:
    "Real print jobs from True Color in Saskatoon — coroplast signs, vinyl banners, vehicle magnets, business cards. See our gallery and industry design examples.",
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
    "Photo gallery of real print jobs and industry design mockups from True Color Display Printing in Saskatoon — coroplast signs, vinyl banners, vehicle magnets, business cards, and large format prints.",
  url: "https://truecolorprinting.ca/gallery",
  numberOfItems: 45,
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
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: 45,
    itemListElement: [
      { "@type": "ListItem", position: 1, url: "https://truecolorprinting.ca/coroplast-signs-saskatoon", name: "Coroplast Yard Signs" },
      { "@type": "ListItem", position: 2, url: "https://truecolorprinting.ca/banner-printing-saskatoon", name: "Vinyl Banners" },
      { "@type": "ListItem", position: 3, url: "https://truecolorprinting.ca/aluminum-signs-saskatoon", name: "ACP Aluminum Signs" },
      { "@type": "ListItem", position: 4, url: "https://truecolorprinting.ca/retractable-banners-saskatoon", name: "Retractable Banner Stands" },
      { "@type": "ListItem", position: 5, url: "https://truecolorprinting.ca/vehicle-magnets-saskatoon", name: "Vehicle Magnets & Vinyl" },
      { "@type": "ListItem", position: 6, url: "https://truecolorprinting.ca/window-decals-saskatoon", name: "Window Decals" },
      { "@type": "ListItem", position: 7, url: "https://truecolorprinting.ca/vinyl-lettering-saskatoon", name: "Vinyl Lettering" },
      { "@type": "ListItem", position: 8, url: "https://truecolorprinting.ca/business-cards-saskatoon", name: "Business Cards" },
      { "@type": "ListItem", position: 9, url: "https://truecolorprinting.ca/flyer-printing-saskatoon", name: "Flyers" },
      { "@type": "ListItem", position: 10, url: "https://truecolorprinting.ca/postcard-printing-saskatoon", name: "Postcards" },
      { "@type": "ListItem", position: 11, url: "https://truecolorprinting.ca/sticker-printing-saskatoon", name: "Stickers" },
      { "@type": "ListItem", position: 12, url: "https://truecolorprinting.ca/custom-magnets-saskatoon", name: "Calendar Magnets" },
    ],
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
          <p className="text-gray-500 text-lg max-w-xl mb-4">
            Signs, banners, magnets, cards, and more — all designed, printed, and
            picked up at 216 33rd St W, Saskatoon.
          </p>
          <div className="prose prose-gray max-w-2xl text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              Every job below was printed in-house at our Saskatoon shop on our
              Roland UV wide-format printer — from{" "}
              <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] hover:underline">coroplast yard signs</Link>{" "}
              starting at $8/sqft to full-vehicle vinyl wraps and{" "}
              <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] hover:underline">13oz scrim vinyl banners</Link>{" "}
              from $8.25/sqft. Our in-house designer handles layout and proofs
              for a flat $35, same-day turnaround. Need it today? Same-day rush
              is +$40 flat — order before 10 AM.
            </p>
            <p>
              Browse real client projects from Saskatoon businesses, then scroll
              down to see design mockups tailored to specific industries like{" "}
              <Link href="/healthcare-signs-saskatoon" className="text-[#16C2F3] hover:underline">healthcare</Link>,{" "}
              <Link href="/agriculture-signs-saskatoon" className="text-[#16C2F3] hover:underline">agriculture</Link>, and{" "}
              <Link href="/agribusiness-signs-saskatchewan" className="text-[#16C2F3] hover:underline">agribusiness</Link>.
              Every product shown — {" "}
              <Link href="/business-cards-saskatoon" className="text-[#16C2F3] hover:underline">business cards</Link> from $45,{" "}
              <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] hover:underline">retractable banner stands</Link> from $219,{" "}
              <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] hover:underline">vehicle magnets</Link> from $45 — is
              available for pickup or delivery across Saskatchewan.
            </p>
          </div>
        </div>

        {/* Gallery grid — real client work first, product showcase behind View More */}
        <GalleryGrid />

        {/* Industry design examples */}
        <section className="mt-16 pt-14 border-t border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-2">
              Industry Examples
            </h2>
            <p className="text-gray-500 text-sm max-w-lg">
              Design mockups for Saskatchewan businesses — see what we can build
              for your industry, printed in-house on our Roland UV.
            </p>
          </div>
          <IndustryShowcase />
        </section>

        {/* Instagram link */}
        <div className="mt-14 text-center">
          <p className="text-gray-500 text-sm">
            See our latest projects on{" "}
            <a
              href="https://www.instagram.com/truecolorprint"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#16C2F3] hover:underline font-semibold"
            >
              Instagram @truecolorprint →
            </a>
          </p>
        </div>

        {/* FAQ */}
        <section className="mt-16 pt-14 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl">
            {[
              {
                q: "What products does True Color print in-house?",
                a: "We print coroplast yard signs from $8/sqft, 13oz scrim vinyl banners from $8.25/sqft, ACP aluminum signs from $13/sqft, business cards from $45 for 250, flyers from $45 for 100, window decals from $11/sqft, vehicle magnets from $24/sqft, retractable banner stands from $219, foamboard displays from $10/sqft, stickers, postcards, brochures, and photo posters — all on our in-house Roland TrueVIS VG2 UV printer and Konica Minolta production press.",
              },
              {
                q: "Can I see samples before ordering?",
                a: "Yes — visit our shop at 216 33rd St W, Saskatoon (Mon\u2013Fri 9 AM\u20135 PM) to see material samples and finished products. You can also browse the gallery above to see real client projects and industry design mockups.",
              },
              {
                q: "How fast can I get my order?",
                a: "Standard turnaround is 1\u20133 business days from artwork approval. Same-day rush production is available for +$40 flat on orders placed before 10 AM. Our in-house designer provides a same-day proof for $35 flat.",
              },
              {
                q: "Do you ship outside Saskatoon?",
                a: "Yes \u2014 we ship across Saskatchewan. Customer pays shipping; we handle packing and coordination. Local pickup is free at 216 33rd St W, Saskatoon. We also offer installation service at $75 flat rate for most Saskatoon jobs.",
              },
              {
                q: "What file format do I need for printing?",
                a: "We accept PDF, AI, EPS, PSD, PNG, and JPG files. For best results, send vector files (PDF or AI) at full size with 0.125\u201d bleed. No file? Our in-house designer creates print-ready artwork from sketches or low-res images for $35 flat.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border border-gray-100 rounded-xl">
                <summary className="cursor-pointer px-6 py-4 font-semibold text-[#1c1712] text-sm flex items-center justify-between">
                  {q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-5 text-lg">
            Like what you see? Your name could be on the next one.
          </p>
          <Link
            href="/quote-request"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Request a Quote →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
