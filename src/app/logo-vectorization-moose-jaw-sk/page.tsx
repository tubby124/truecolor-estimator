import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Logo Vectorization Moose Jaw SK | From $50 | True Color" },
  description:
    "Convert raster JPG/PNG logos to scalable vector AI/EPS/SVG/PDF for Moose Jaw businesses. From $50 flat per logo. Same-day digital delivery.",
  alternates: { canonical: "/logo-vectorization-moose-jaw-sk" },
  openGraph: {
    title: "Logo Vectorization Moose Jaw SK | True Color Display Printing",
    description:
      "Raster to vector logo conversion. AI, EPS, SVG, PDF output. From $50 flat per logo. Same-day digital delivery to Moose Jaw.",
    url: "https://truecolorprinting.ca/logo-vectorization-moose-jaw-sk",
    images: [{ url: "/images/products/og/logo-vectorization-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LogoVectorizationMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="logo-vectorization-moose-jaw-sk"
      primaryProductSlug="stickers"
      title="Logo Vectorization — Moose Jaw SK"
      subtitle="Convert raster logos to scalable vector files for Moose Jaw businesses. From $50."
      heroImage="/images/products/heroes/logo-vectorization-hero-1200x500.webp"
      heroAlt="Logo vectorization service for Moose Jaw SK businesses by True Color Display Printing"
      description={
        "Convert raster logos (JPG, PNG, GIF) to true vector files (AI, EPS, SVG, PDF, vector PNG) for Moose Jaw businesses. From $50 flat per logo — scales sharp from a business card to a 4×8' banner or 10-storey building wrap. Built for Moose Jaw breweries, distilleries, ranches, restaurants, and small businesses with only a low-resolution web logo that needs vector format for signage, embroidery, or large-format printing. Files delivered same business day via email or Dropbox link."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing converts raster logos to true scalable vector files
            for Moose Jaw businesses. <strong>$50 flat per logo</strong> — output bundle
            includes Adobe Illustrator (.ai), EPS, SVG, PDF, and high-res vector PNG. The
            same logo prints sharp on a business card, beer bottle label, vinyl banner, or
            building wrap. Same-business-day digital delivery — no shipping required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Moose Jaw use cases: <strong>brewery and distillery brand assets</strong>{" "}
            that need vector format for bottle labels and tap-handle engraving, ranches
            needing vector files for vehicle decals and signage, restaurants doing menu and
            signage refreshes, embroidery vendors requesting AI/EPS, and businesses with only
            a tiny website logo that needs to scale up for{" "}
            <Link href="/vehicle-magnets-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            or signs. Pair with{" "}
            <Link href="/image-upscale-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              image upscale
            </Link>{" "}
            if you also have photography to clean up.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: email your logo to{" "}
            <a href="mailto:info@true-color.ca" className="text-[#16C2F3] underline font-medium">
              info@true-color.ca
            </a>{" "}
            or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We send a preview before final delivery. Most jobs returned within 1
            business day. Rush (under 4 hours) +$40 flat.
          </p>
        </>
      }
      products={[
        { name: "Logo Vectorization", from: "from $50 flat", slug: "stickers" },
        { name: "Image Upscaling", from: "from $40 flat", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
      ]}
      whyPoints={[
        "True vector output — scalable from business card to building wrap without loss",
        "Output formats: AI, EPS, SVG, PDF, vector PNG — covers every Moose Jaw sign, print, embroidery vendor",
        "Same-business-day digital delivery to Moose Jaw — no courier required",
        "$50 flat per simple logo — complex gradient/photo logos quoted +$25–$50",
        "Preview before final delivery — verify the vector matches your raster",
        "Combine with True Color print job for one workflow",
        "Rush (under 4 hours) available at +$40 flat",
        "Hand-traced bezier curves, not auto-trace — no jagged edges or artifacts",
      ]}
      faqs={[
        {
          q: "How much does logo vectorization cost in Moose Jaw?",
          a: "$50 flat per simple logo. Complex logos with gradients, photo-realistic elements, or 6+ colours +$25–$50 depending on detail. Rush (under 4 hours) +$40 flat. Digital delivery, no shipping cost.",
        },
        {
          q: "What file formats will I get back?",
          a: "Standard output bundle: AI (Illustrator), EPS, SVG, PDF, and high-res vector PNG (transparent background). Specify if you need additional formats (DXF for CNC, DST for embroidery, etc.).",
        },
        {
          q: "Do you vectorize logos for Moose Jaw breweries and distilleries?",
          a: "Yes — brewery and distillery brand assets are a common vectorization job. The same logo file needs to print sharp on a bottle label, tap handle engraving, hat embroidery, vinyl banner, and storefront sign. One $50 vector file replaces five separate format quotes.",
        },
        {
          q: "How do I send True Color my logo for vectorization?",
          a: "Email the file to info@true-color.ca or call (306) 954-8688. Send the highest-quality raster you have — even a low-res JPG works. Tell us what use cases you need it for so we can output the right format set.",
        },
        {
          q: "What's the turnaround for Moose Jaw vectorization?",
          a: "Same-business-day delivery for orders received before 11 AM. Next-business-day for orders received after. Rush (under 4 hours) +$40 flat as long as file received before 1 PM.",
        },
        {
          q: "Do you do hand-traced or auto-traced vectors?",
          a: "Hand-traced bezier curves done by our in-house designer in Adobe Illustrator. Auto-trace produces jagged edges that look fine on screen but fail when printed large. Hand-traced is why your logo will scale to a 10-storey building wrap and still look sharp.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "logo-vectorization-saskatoon" },
        { name: "Regina", slug: "logo-vectorization-regina" },
        { name: "Prince Albert", slug: "logo-vectorization-prince-albert-sk" },
      ]}
    />
  );
}
