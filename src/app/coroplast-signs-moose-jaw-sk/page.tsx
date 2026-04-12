import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Coroplast Signs Moose Jaw SK | From $8/sqft | True Color" },
  description:
    "Custom coroplast signs for Moose Jaw SK. From $8/sqft — yard signs, site signs, event signs. Printed in Saskatoon, shipped to Moose Jaw in 3–5 business days.",
  alternates: { canonical: "/coroplast-signs-moose-jaw-sk" },
  openGraph: {
    title: "Coroplast Signs Moose Jaw SK | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft shipped to Moose Jaw. Volume pricing, H-stakes $2.50. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/coroplast-signs-moose-jaw-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CoroplastSignsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="coroplast-signs-moose-jaw-sk"
      primaryProductSlug="coroplast-signs"
      title="Coroplast Signs Moose Jaw SK"
      subtitle="Yard signs, event signs, and job site signs from $8/sqft — shipped from Saskatoon."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast yard signs for Moose Jaw SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints coroplast signs for Moose Jaw contractors, tourism businesses, agricultural operations, and community events. From $8/sqft with volume discounts at 5+ signs. Shipped to Moose Jaw in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            to Moose Jaw businesses, events, and organizations 75 km southwest of Saskatoon.
            Our UV-printed coroplast starts at $8/sqft — an 18×24&quot; sign is $24, a
            24×36&quot; sign is $48. H-stakes are $2.50 each. Signs are weatherproof and
            UV-stable for Saskatchewan outdoor conditions. Volume pricing applies at 5+ signs
            (8% off) and 10+ signs (17% off).
          </p>
          <p className="text-gray-600 leading-relaxed">
            Moose Jaw&apos;s mix of tourism, agriculture, military (CFB Moose Jaw), and seasonal
            events creates consistent demand for yard signs, directional signs, and
            campaign signage. Double-sided coroplast is available for{" "}
            <Link href="/election-signs" className="text-[#16C2F3] underline font-medium">
              election campaigns
            </Link>{" "}
            and high-visibility corner placements. H-stakes ship flat and are ready to
            push into ground on arrival. We also print{" "}
            <Link href="/banner-printing-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners for Moose Jaw
            </Link>{" "}
            events that can be bundled with your coroplast order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We send a digital proof for email approval. After approval and payment, we print
            and ship to Moose Jaw — standard production is 1–3 business days, plus 1–2 days
            shipping. Shipping from Saskatoon to Moose Jaw typically runs $20–$35 depending
            on order size. No print-ready file? Our designer preps artwork for $35–$50.
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
        "Coroplast from $8/sqft — UV-printed, weatherproof, 2–3 year outdoor lifespan",
        "H-stakes $2.50 each — ships flat to Moose Jaw, stake-ready on arrival",
        "Volume pricing auto-applies: 8% off at 5+ signs, 17% off at 10+ signs",
        "Double-sided coroplast — corner lots, election signs, tourist directionals",
        "Ships to Moose Jaw — 3–5 business days, shipping typically $20–$35",
        "In-house Roland UV press — no outsourcing, consistent quality",
      ]}
      faqs={[
        {
          q: "How do I order coroplast signs shipped to Moose Jaw?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Moose Jaw address. Signs arrive flat, wrapped, and staked separately. Standard timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to ship coroplast signs to Moose Jaw?",
          a: "Shipping from Saskatoon to Moose Jaw (75 km) typically runs $20–$35 for small orders. Larger orders may be higher. Call (306) 954-8688 for a shipping estimate before placing your order. Shipping is the customer's responsibility.",
        },
        {
          q: "Can I order election signs for a Moose Jaw campaign?",
          a: "Yes — we print election signs at $6.16/sqft (23% off) for orders of 25+ signs. Double-sided available for corner placements. H-stakes at $2.50 each. We ship bulk orders to Moose Jaw via courier — call for large-run logistics.",
        },
        {
          q: "What sizes of coroplast signs do you print for Moose Jaw customers?",
          a: "Any custom size up to 4×8 ft. Most popular: 18×24\", 24×36\", 24×48\", and 4×4 ft. Use the calculator at /products/coroplast-signs for exact pricing. H-stakes fit 18×24\" and 24×36\" signs.",
        },
        {
          q: "How long do coroplast signs last outdoors in Moose Jaw?",
          a: "Our UV-printed coroplast is rated for 2–3 years outdoors in Saskatchewan conditions. UV-stable inks resist fading. Double-sided printing is on 4mm coroplast that handles wind and temperature swings well. For permanent signage, consider our ACP aluminum signs from $13/sqft.",
        },
        {
          q: "Can you do event directional signs for a Moose Jaw festival?",
          a: "Yes — we print event directional and wayfinding signs on coroplast regularly. Common sizes: 18×24\" with H-stake or 24×36\" staked. We can also print vinyl banners for the same event to combine in one order. Call (306) 954-8688 for event packages.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
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
