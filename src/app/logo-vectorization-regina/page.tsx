import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Logo Vectorization Regina SK | From $50 | True Color" },
  description:
    "Convert raster JPG/PNG logos to scalable vector AI/EPS/SVG/PDF for Regina businesses. From $50 flat per logo. Print-ready at any size. Same-day delivery.",
  alternates: { canonical: "/logo-vectorization-regina" },
  openGraph: {
    title: "Logo Vectorization Regina SK | True Color Display Printing",
    description:
      "Raster to vector logo conversion. AI, EPS, SVG, PDF, PNG output. From $50 flat per logo. Same-day digital delivery to Regina.",
    url: "https://truecolorprinting.ca/logo-vectorization-regina",
    images: [{ url: "/images/products/og/logo-vectorization-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LogoVectorizationReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="logo-vectorization-regina"
      primaryProductSlug="stickers"
      title="Logo Vectorization — Regina SK"
      subtitle="Convert raster logos to scalable vector files for Regina businesses. From $50. Same-day digital delivery."
      heroImage="/images/products/heroes/logo-vectorization-hero-1200x500.webp"
      heroAlt="Logo vectorization service for Regina SK businesses by True Color Display Printing"
      description={
        "Convert raster logos (JPG, PNG, GIF) to true vector files (AI, EPS, SVG, PDF, vector PNG) for Regina businesses. From $50 flat per logo — scalable to any size from a business card to a billboard without losing sharpness. Built for Regina businesses with only a low-resolution web logo, custom-designed brands that need vector files for signage, embroidery, or large-format printing, and any business doing a brand refresh. Files delivered same business day via email or Dropbox link — no courier required."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing converts raster logos (JPG, PNG, GIF) to true scalable
            vector files for Regina businesses. <strong>$50 flat per logo</strong> — output
            includes Adobe Illustrator (.ai), EPS, SVG, PDF, and high-res vector PNG so the
            same logo prints sharp on a business card, a 4×8&apos; vinyl banner, or a
            10-storey building wrap. Same-business-day digital delivery — no shipping
            required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>custom logo design saskatoon</strong> projects
            where the designer only delivered a JPG, brand refreshes where the original
            vector file was lost, embroidery vendors and sign installers requesting AI/EPS,
            and businesses with only a tiny website logo that needs to scale up sharp for a{" "}
            <Link href="/banner-printing-regina" className="text-[#16C2F3] underline font-medium">
              vinyl banner
            </Link>{" "}
            or sign. Pair with{" "}
            <Link href="/image-upscale-regina" className="text-[#16C2F3] underline font-medium">
              image upscale
            </Link>{" "}
            if you also have photography that needs cleanup.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: email your logo to{" "}
            <a href="mailto:info@true-color.ca" className="text-[#16C2F3] underline font-medium">
              info@true-color.ca
            </a>{" "}
            or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We send a preview before final delivery so you can confirm the vector matches
            your raster source. Most jobs returned within 1 business day. Rush (under 4 hours)
            +$40 flat. Complex logos (gradient backgrounds, photo-realistic elements) may add
            $25–$50 depending on detail.
          </p>
        </>
      }
      products={[
        { name: "Logo Vectorization", from: "from $50 flat", slug: "stickers" },
        { name: "Image Upscaling", from: "from $15", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
      ]}
      whyPoints={[
        "True vector output — scalable from business card to billboard without loss",
        "Output formats: AI, EPS, SVG, PDF, vector PNG — covers every Regina sign, print, embroidery vendor",
        "Same-business-day digital delivery to Regina — no courier required",
        "$50 flat per simple logo — complex gradient/photo logos quoted +$25–$50",
        "Preview before final delivery — verify the vector matches your raster",
        "Combine with True Color print job for one workflow (one designer, one quality bar)",
        "Rush (under 4 hours) available at +$40 flat",
        "Hand-traced bezier curves, not auto-trace — no jagged edges or weird artifacts",
      ]}
      faqs={[
        {
          q: "How much does logo vectorization cost in Regina?",
          a: "$50 flat per simple logo (text + basic shapes, 1–4 colours). Complex logos with gradients, photo-realistic elements, or 6+ colours quoted +$25–$50 depending on detail. Rush (under 4 hours) +$40 flat. No shipping — digital delivery.",
        },
        {
          q: "What file formats will I get back?",
          a: "Standard output bundle: AI (Adobe Illustrator), EPS, SVG, PDF, and high-res vector PNG (transparent background). Specify if you need additional formats (DXF for CNC, DST for embroidery, etc.) when you order.",
        },
        {
          q: "How do I send True Color my logo for vectorization?",
          a: "Email the file to info@true-color.ca or call (306) 954-8688. Send the highest-quality raster you have — even a low-res JPG works. Tell us what print/use case you need it for (signs, embroidery, large-format) so we can output the right format set.",
        },
        {
          q: "What's the turnaround for Regina vectorization jobs?",
          a: "Same-business-day delivery for orders received before 11 AM. Next-business-day for orders received after. Rush (under 4 hours) +$40 flat as long as file received before 1 PM.",
        },
        {
          q: "Do you do hand-traced vectors or auto-traced?",
          a: "Hand-traced bezier curves done by our in-house designer in Adobe Illustrator. Auto-trace produces jagged edges and weird artifacts that look fine on screen but fail when printed large. Hand-traced is why your logo will scale to a 10-storey building wrap and still look sharp.",
        },
        {
          q: "Can you vectorize a complex logo with gradients or photo elements?",
          a: "Yes — complex logos with gradients, photo-realistic elements, or 6+ colours add $25–$50 depending on detail. We'll quote the upcharge before starting. Send the file and we'll review and confirm pricing within 1 hour.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "logo-vectorization-saskatoon" },
        { name: "Moose Jaw", slug: "logo-vectorization-moose-jaw-sk" },
        { name: "Prince Albert", slug: "logo-vectorization-prince-albert-sk" },
      ]}
    />
  );
}
