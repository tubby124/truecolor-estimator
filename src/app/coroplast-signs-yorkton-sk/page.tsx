import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Coroplast Signs Yorkton SK | From $8/sqft | True Color" },
  description:
    "Custom coroplast signs for Yorkton SK. From $8/sqft — yard signs, site signs, event signs. Printed in Saskatoon, shipped to Yorkton in 3–5 business days.",
  alternates: { canonical: "/coroplast-signs-yorkton-sk" },
  openGraph: {
    title: "Coroplast Signs Yorkton SK | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft shipped to Yorkton. Volume pricing, H-stakes $2.50. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/coroplast-signs-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CoroplastSignsYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="coroplast-signs-yorkton-sk"
      primaryProductSlug="coroplast-signs"
      title="Coroplast Signs Yorkton SK"
      subtitle="Yard signs, event signs, and job site signs from $8/sqft — shipped from Saskatoon."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast signs for Yorkton SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints coroplast signs for Yorkton contractors, grain and agricultural businesses, retail operators, and community organizations. From $8/sqft with volume discounts. Shipped to Yorkton in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            to Yorkton businesses and organizations 180 km east. Our UV-printed coroplast
            starts at $8/sqft — an 18×24&quot; sign is $24, a 24×36&quot; is $48, H-stakes
            are $2.50 each. Weatherproof and UV-stable for eastern Saskatchewan conditions.
            Volume pricing at 5+ signs (8% off) and 10+ signs (17% off).
          </p>
          <p className="text-gray-600 leading-relaxed">
            Yorkton is eastern Saskatchewan&apos;s commercial and agricultural hub —
            grain elevators, retail services, and construction contractors all use coroplast
            for job site identification, property signage, and seasonal campaigns. Double-sided
            coroplast available for{" "}
            <Link href="/election-signs" className="text-[#16C2F3] underline font-medium">
              election campaigns
            </Link>{" "}
            and corner lot visibility. We also ship{" "}
            <Link href="/banner-printing-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners to Yorkton
            </Link>{" "}
            that can be bundled with your coroplast order for one combined shipment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We send a digital proof for email approval. After approval and payment, we print
            and ship to Yorkton. Standard production: 1–3 business days, plus 1–2 days
            shipping. Shipping from Saskatoon to Yorkton (180 km east) typically runs
            $25–$45 depending on order size. Designer service from $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed, weatherproof for eastern SK conditions",
        "H-stakes $2.50 each — ships flat to Yorkton, stake-ready on arrival",
        "Volume pricing auto-applies: 8% off at 5+ signs, 17% off at 10+ signs",
        "Grain, ag, construction, and retail sectors in Yorkton served",
        "Ships to Yorkton — 3–5 business days, shipping typically $25–$45",
        "In-house Roland UV press — no outsourcing, consistent quality",
      ]}
      faqs={[
        {
          q: "How do I order coroplast signs shipped to Yorkton?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Yorkton address. Signs arrive flat and wrapped. Standard timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to ship coroplast signs to Yorkton?",
          a: "Shipping from Saskatoon to Yorkton (180 km east) typically runs $25–$45 for small-to-medium sign orders. Call (306) 954-8688 for a shipping estimate before placing your order.",
        },
        {
          q: "Can I order coroplast signs for a Yorkton agricultural or grain business?",
          a: "Yes — we print for agricultural operations, grain facilities, and farm businesses across eastern Saskatchewan. Common orders include property signs, gate signs, and seasonal directionals. Any custom size up to 4×8 ft.",
        },
        {
          q: "What sizes of coroplast signs do you print for Yorkton customers?",
          a: "Any custom size up to 4×8 ft. Most popular: 18×24\", 24×36\", 24×48\", and 4×4 ft. Use the calculator at /products/coroplast-signs for exact pricing. H-stakes fit 18×24\" and 24×36\" signs.",
        },
        {
          q: "Can I get election campaign signs shipped to Yorkton?",
          a: "Yes — coroplast election signs at 23% off ($6.16/sqft) for orders of 25+ signs. Double-sided available for corner placements. H-stakes at $2.50. We ship bulk orders to Yorkton via courier — call for large-run logistics.",
        },
        {
          q: "Can I combine coroplast signs and banners in one Yorkton order?",
          a: "Yes — coroplast signs and vinyl banners can ship together in one courier order to Yorkton. Bundling reduces per-item shipping cost. Call (306) 954-8688 to confirm your combined order.",
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
