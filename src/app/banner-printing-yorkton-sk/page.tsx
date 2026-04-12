import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Banner Printing Yorkton SK | From $8.25/sqft | True Color" },
  description:
    "Custom vinyl banners for Yorkton SK businesses and events. From $8.25/sqft, grommeted and hemmed. Printed in Saskatoon — shipped to Yorkton.",
  alternates: { canonical: "/banner-printing-yorkton-sk" },
  openGraph: {
    title: "Banner Printing Yorkton SK | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft shipped to Yorkton. Grommets and hemming included. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/banner-printing-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BannerPrintingYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="banner-printing-yorkton-sk"
      primaryProductSlug="vinyl-banners"
      title="Banner Printing Yorkton SK"
      subtitle="Vinyl banners from $8.25/sqft, grommeted and hemmed — shipped from Saskatoon."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banner printing shipped to Yorkton SK — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints and ships vinyl banners to Yorkton businesses, retail operators, and community events 180 km east. From $8.25/sqft with grommets and hemming included. Shipped to Yorkton in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              13oz vinyl banners
            </Link>{" "}
            to Yorkton businesses and events 180 km east. Our banners start at $8.25/sqft —
            a 2×6 ft banner is $90, a 3×8 ft is $180 — with grommets every 2 ft and hemmed
            edges included at no extra charge. Full-colour Roland UV printing on outdoor-rated
            13oz scrim vinyl.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Yorkton serves as the retail and service centre for a wide agricultural catchment
            in eastern Saskatchewan. Banner demand peaks for seasonal sales events, agricultural
            trade shows, and community fairs. Volume discounts apply automatically: 5% off
            at 5+ banners, 10% off at 10+ banners. Combine your banner order with{" "}
            <Link href="/coroplast-signs-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for a complete signage package shipped to Yorkton in one order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Yorkton via courier. Standard turnaround: 1–3 business days print,
            plus 1–2 days shipping. Shipping from Saskatoon to Yorkton (180 km east)
            typically runs $25–$45 for banner orders. Designer service from $35–$50.
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
        "13oz scrim vinyl — outdoor-rated, UV-stable for eastern SK conditions",
        "Grommets and hemming included on every banner — no upcharges",
        "Volume pricing: 5% off at 5+ banners, 10% off at 10+ banners",
        "Retail, agricultural trade shows, and seasonal event experience in Yorkton",
        "Ships to Yorkton — 3–5 business days, shipping typically $25–$45",
        "In-house Roland UV press — consistent quality, no outsourcing",
      ]}
      faqs={[
        {
          q: "How does banner printing for Yorkton work?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once confirmed, we print in Saskatoon and ship to your Yorkton address. Standard timeline: 3–5 business days total.",
        },
        {
          q: "How much does it cost to ship banners to Yorkton?",
          a: "Shipping from Saskatoon to Yorkton (180 km east) typically runs $25–$45 for banner orders. We pack in rigid tubes or flat cardboard to prevent damage. Call (306) 954-8688 for a firm shipping quote.",
        },
        {
          q: "What banner sizes work best for Yorkton retail or agricultural events?",
          a: "For storefront sales events, 3×6 ft or 4×8 ft banners are standard. For agricultural trade shows, 3×8 ft or 4×10 ft give better visibility in large venue spaces. Retractable banner stands (33×79\") are popular for indoor retail promotions. All sizes custom.",
        },
        {
          q: "Can I print bilingual banners for a Yorkton community event?",
          a: "Yes — we print bilingual English/French banners and any other language. Provide your text in the order notes and our designer lays it out. File prep is $35–$50 depending on complexity.",
        },
        {
          q: "How long do vinyl banners last outdoors in Yorkton conditions?",
          a: "Our 13oz scrim vinyl with UV-stable inks is rated for 2–3 years outdoors. Hemmed edges and grommets every 2 ft reduce wind stress. Eastern Saskatchewan wind conditions are similar to Saskatoon — the banners hold well in normal weather.",
        },
        {
          q: "Can I order banners and coroplast signs together for one Yorkton shipment?",
          a: "Yes — vinyl banners and coroplast signs can ship together in one courier order to Yorkton. Bundling often reduces per-item shipping cost. Call (306) 954-8688 to confirm your combined order.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Lloydminster", slug: "printing-lloydminster-sk" },
        { name: "Swift Current", slug: "printing-swift-current-sk" },
        { name: "Estevan", slug: "printing-estevan-sk" },
        { name: "Weyburn", slug: "printing-weyburn-sk" },
        { name: "North Battleford", slug: "signs-north-battleford-sk" },
      ]}
    />
  );
}
