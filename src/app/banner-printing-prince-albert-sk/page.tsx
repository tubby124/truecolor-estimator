import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Banner Printing Prince Albert SK | From $8.25/sqft | True Color" },
  description:
    "Custom vinyl banners for Prince Albert SK businesses and events. From $8.25/sqft, grommeted and hemmed. Printed in Saskatoon — shipped to Prince Albert.",
  alternates: { canonical: "/banner-printing-prince-albert-sk" },
  openGraph: {
    title: "Banner Printing Prince Albert SK | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft shipped to Prince Albert. Grommets and hemming included. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/banner-printing-prince-albert-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BannerPrintingPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="banner-printing-prince-albert-sk"
      primaryProductSlug="vinyl-banners"
      title="Banner Printing Prince Albert SK"
      subtitle="Vinyl banners from $8.25/sqft, grommeted and hemmed — shipped from Saskatoon."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banner printing shipped to Prince Albert SK — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints and ships vinyl banners to Prince Albert businesses, healthcare organizations, and community events 140 km north. From $8.25/sqft with grommets and hemming included. Shipped in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              13oz vinyl banners
            </Link>{" "}
            to Prince Albert businesses and organizations 140 km north. Our banners start
            at $8.25/sqft — a 2×6 ft banner is $90, a 3×8 ft is $180 — full-colour Roland
            UV printing with grommets every 2 ft and hemmed edges included at no extra charge.
            Rated for northern Saskatchewan outdoor conditions.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Prince Albert&apos;s healthcare sector, forestry industry, and government offices
            create demand for banners across event announcements, facility signage, and
            community campaigns. Volume discounts apply automatically: 5% off at 5+ banners,
            10% off at 10+ banners. Combine with{" "}
            <Link href="/coroplast-signs-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for a complete signage package shipped to Prince Albert in one order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Prince Albert via courier. Standard turnaround: 1–3 business days
            print, plus 1–2 days shipping. Shipping from Saskatoon to Prince Albert
            typically runs $25–$40 for banner orders. Designer service from $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "13oz scrim vinyl — outdoor-rated, UV-stable, built for northern SK conditions",
        "Grommets and hemming included on every banner — no upcharges",
        "Volume pricing: 5% off at 5+ banners, 10% off at 10+ banners",
        "Healthcare, forestry, and government event experience in Prince Albert market",
        "Ships to Prince Albert — 3–5 business days, shipping typically $25–$40",
        "In-house Roland UV press — no outsourcing, reliable turnaround",
      ]}
      faqs={[
        {
          q: "How does banner printing for Prince Albert work?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once confirmed, we print in Saskatoon and ship to your Prince Albert address. Standard timeline: 3–5 business days total.",
        },
        {
          q: "How much does it cost to ship banners to Prince Albert?",
          a: "Shipping from Saskatoon to Prince Albert (140 km north) typically runs $25–$40 for banner orders. We pack in rigid tubes or flat cardboard. Call (306) 954-8688 for a firm shipping quote before ordering.",
        },
        {
          q: "What banner sizes work for healthcare facilities in Prince Albert?",
          a: "For indoor lobby or corridor banners, 2×4 ft or 2×6 ft vinyl banners work well. For outdoor facility signage, 3×8 ft or 4×8 ft are standard. Retractable banner stands (33×79\") are popular for waiting areas and reception. All sizes custom — use /products/vinyl-banners.",
        },
        {
          q: "Can you print banners for a Prince Albert community event or fair?",
          a: "Yes — we print event banners for community fairs, fundraisers, and public celebrations across Prince Albert regularly. 3×6 ft and 4×8 ft outdoor banners with grommets are the standard for festival and event signage.",
        },
        {
          q: "How long do vinyl banners last outdoors in Prince Albert conditions?",
          a: "Our 13oz scrim vinyl with UV-stable inks is rated for 2–3 years outdoors. Hemmed edges and grommets every 2 ft reduce wind stress. Prince Albert sees colder winters than Saskatoon — our vinyl holds well in these conditions.",
        },
        {
          q: "Can I order banners and signs together for Prince Albert?",
          a: "Yes — we can combine vinyl banners, coroplast signs, and other products in one courier order to Prince Albert. Bundling reduces per-item shipping cost. Call (306) 954-8688 to confirm.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
        { name: "Lloydminster", slug: "printing-lloydminster-sk" },
        { name: "Swift Current", slug: "printing-swift-current-sk" },
        { name: "Estevan", slug: "printing-estevan-sk" },
        { name: "Weyburn", slug: "printing-weyburn-sk" },
        { name: "North Battleford", slug: "signs-north-battleford-sk" },
      ]}
    />
  );
}
