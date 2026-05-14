import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Logo Vectorization Prince Albert SK | From $50 | True Color" },
  description:
    "Convert raster JPG/PNG logos to scalable vector AI/EPS/SVG/PDF for Prince Albert businesses. From $50 flat per logo. Same-day digital delivery.",
  alternates: { canonical: "/logo-vectorization-prince-albert-sk" },
  openGraph: {
    title: "Logo Vectorization Prince Albert SK | True Color Display Printing",
    description:
      "Raster to vector logo conversion. AI, EPS, SVG, PDF output. From $50 flat per logo. Same-day digital delivery to Prince Albert.",
    url: "https://truecolorprinting.ca/logo-vectorization-prince-albert-sk",
    images: [{ url: "/images/products/og/logo-vectorization-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LogoVectorizationPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="logo-vectorization-prince-albert-sk"
      primaryProductSlug="stickers"
      title="Logo Vectorization — Prince Albert SK"
      subtitle="Convert raster logos to scalable vector files for PA businesses. From $50."
      heroImage="/images/products/heroes/logo-vectorization-hero-1200x500.webp"
      heroAlt="Logo vectorization service for Prince Albert SK businesses by True Color Display Printing"
      description={
        "Convert raster logos (JPG, PNG, GIF) to true vector files (AI, EPS, SVG, PDF, vector PNG) for Prince Albert businesses. From $50 flat per logo — scales sharp from a business card to a vinyl banner or storefront sign. Built for PA tourism operators, hunting/fishing outfitters, indigenous-craft brands, fisheries, and small businesses with only a low-resolution web logo. Files delivered same business day via email or Dropbox link — distance is irrelevant for digital deliverables."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing converts raster logos to true scalable vector files
            for Prince Albert businesses. <strong>$50 flat per logo</strong> — output bundle
            includes Adobe Illustrator (.ai), EPS, SVG, PDF, and high-res vector PNG. Same
            logo prints sharp on a business card, fishing-lodge sign, vinyl banner, or
            outfitter vehicle decal. Same-business-day digital delivery to PA — distance
            doesn&apos;t matter for digital files.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common PA use cases: <strong>tourism and outfitter brand assets</strong> (fishing
            lodges, hunting camps, eco-tour operators with only old web logos that need to
            print on vehicle decals, signs, and merchandise), indigenous-craft brand
            vectorization for signage and product labels, fisheries needing vector files for
            packaging printing. Pair with{" "}
            <Link href="/image-upscale-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
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
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "True vector output — scalable from business card to storefront sign without loss",
        "Output formats: AI, EPS, SVG, PDF, vector PNG — every PA sign, print, embroidery vendor covered",
        "Digital delivery — distance is irrelevant, same turnaround as a downtown Saskatoon customer",
        "$50 flat per simple logo — complex gradient/photo logos quoted +$25–$50",
        "Preview before final delivery — verify the vector matches your raster",
        "Combine with True Color print job for one workflow",
        "Rush (under 4 hours) available at +$40 flat",
        "Hand-traced bezier curves, not auto-trace — no jagged edges or artifacts",
      ]}
      faqs={[
        {
          q: "How much does logo vectorization cost in Prince Albert?",
          a: "$50 flat per simple logo. Complex logos with gradients, photo-realistic elements, or 6+ colours +$25–$50 depending on detail. Rush (under 4 hours) +$40 flat. Digital delivery, no shipping cost.",
        },
        {
          q: "Do you charge more because Prince Albert is further north?",
          a: "No — there's no shipping cost on a digital deliverable. The file goes via email or Dropbox in seconds. Same turnaround, same price as a Saskatoon customer.",
        },
        {
          q: "Do you vectorize logos for PA tourism operators and outfitters?",
          a: "Yes — PA fishing lodges, hunting camps, and eco-tour operators often have only old web logos that look fine on a website but pixelate when printed on a vehicle decal, sign, or merchandise. A $50 vector file works across every use case.",
        },
        {
          q: "What file formats will I get back?",
          a: "Standard output bundle: AI (Illustrator), EPS, SVG, PDF, and high-res vector PNG (transparent background). Specify if you need additional formats (DXF for CNC, DST for embroidery, etc.).",
        },
        {
          q: "What's the turnaround for PA vectorization?",
          a: "Same-business-day delivery for orders received before 11 AM. Next-business-day for orders received after. Rush (under 4 hours) +$40 flat as long as file received before 1 PM.",
        },
        {
          q: "Do you do hand-traced or auto-traced vectors?",
          a: "Hand-traced bezier curves done by our in-house designer in Adobe Illustrator. Auto-trace produces jagged edges that fail when printed large. Hand-traced scales to any size without artifacts.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "logo-vectorization-saskatoon" },
        { name: "Regina", slug: "logo-vectorization-regina" },
        { name: "Moose Jaw", slug: "logo-vectorization-moose-jaw-sk" },
      ]}
    />
  );
}
