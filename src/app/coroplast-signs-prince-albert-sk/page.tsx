import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Coroplast Signs Prince Albert SK | From $8/sqft | True Color" },
  description:
    "Custom coroplast signs for Prince Albert SK. From $8/sqft — yard signs, site signs, event signs. Printed in Saskatoon, shipped to Prince Albert in 3–5 business days.",
  alternates: { canonical: "/coroplast-signs-prince-albert-sk" },
  openGraph: {
    title: "Coroplast Signs Prince Albert SK | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft shipped to Prince Albert. Volume pricing, H-stakes $2.50. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/coroplast-signs-prince-albert-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CoroplastSignsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="coroplast-signs-prince-albert-sk"
      primaryProductSlug="coroplast-signs"
      title="Coroplast Signs Prince Albert SK"
      subtitle="Yard signs, event signs, and job site signs from $8/sqft — shipped from Saskatoon."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast signs for Prince Albert SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints coroplast signs for Prince Albert contractors, healthcare organizations, forestry businesses, and community events. From $8/sqft with volume discounts. Shipped to Prince Albert in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            to Prince Albert businesses and organizations 140 km north. Our UV-printed
            coroplast starts at $8/sqft — an 18×24&quot; sign is $24, a 24×36&quot; is $48,
            H-stakes are $2.50 each. Signs are weatherproof, UV-stable, and rated for
            2–3 years outdoors in northern Saskatchewan conditions. Volume pricing at
            5+ signs (8% off) and 10+ signs (17% off).
          </p>
          <p className="text-gray-600 leading-relaxed">
            Prince Albert&apos;s economy is anchored by forestry, healthcare (Victoria Hospital),
            and government services — sectors that order coroplast for job sites, healthcare
            facility wayfinding, and municipal campaigns. Double-sided coroplast is available
            for{" "}
            <Link href="/election-signs" className="text-[#16C2F3] underline font-medium">
              election campaigns
            </Link>{" "}
            and high-visibility intersections. We also ship{" "}
            <Link href="/banner-printing-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners to Prince Albert
            </Link>{" "}
            that can be combined with a coroplast order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We send a digital proof for email approval. After approval and payment, we print
            and ship to Prince Albert. Standard production: 1–3 business days, plus
            1–2 days shipping. Shipping from Saskatoon to Prince Albert (140 km north)
            typically runs $25–$40 depending on order size. Designer service from $35–$50.
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
        "Coroplast from $8/sqft — UV-printed, weatherproof for northern SK conditions",
        "H-stakes $2.50 each — ships flat to Prince Albert, stake-ready on arrival",
        "Volume pricing auto-applies: 8% off at 5+ signs, 17% off at 10+ signs",
        "Forestry, healthcare, and government sectors in Prince Albert served",
        "Ships to Prince Albert — 3–5 business days, shipping typically $25–$40",
        "In-house Roland UV press — no outsourcing, consistent quality",
      ]}
      faqs={[
        {
          q: "How do I order coroplast signs shipped to Prince Albert?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Prince Albert address. Signs arrive flat and wrapped. Standard timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to ship coroplast signs to Prince Albert?",
          a: "Shipping from Saskatoon to Prince Albert (140 km north) typically runs $25–$40 for small-to-medium sign orders. Call (306) 954-8688 for a shipping estimate before placing your order.",
        },
        {
          q: "Do you ship coroplast signs to northern SK locations near Prince Albert?",
          a: "Yes — we ship to Prince Albert and surrounding communities. For remote locations north of Prince Albert, call (306) 954-8688 to discuss shipping options and costs before ordering.",
        },
        {
          q: "What sizes of coroplast signs do you print for Prince Albert customers?",
          a: "Any custom size up to 4×8 ft. Most popular: 18×24\", 24×36\", 24×48\", and 4×4 ft. Use the calculator at /products/coroplast-signs for exact pricing. H-stakes fit 18×24\" and 24×36\" signs.",
        },
        {
          q: "Can you do healthcare or government wayfinding signs for Prince Albert?",
          a: "Yes — we print directional and wayfinding signs on coroplast for healthcare facilities and government offices. Standard is full-colour 4mm coroplast. For permanent indoor wayfinding, consider ACP aluminum signs from $13/sqft. Call to discuss your project.",
        },
        {
          q: "Can I get election campaign signs shipped to Prince Albert?",
          a: "Yes — coroplast election signs at 23% off ($6.16/sqft) for orders of 25+ signs. H-stakes at $2.50. Double-sided available. We ship bulk orders to Prince Albert via courier — call for large-run logistics.",
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
