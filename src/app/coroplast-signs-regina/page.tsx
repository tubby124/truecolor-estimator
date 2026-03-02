import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Coroplast Signs Regina SK | Yard Signs & Job Site Signs | True Color",
  description:
    "Custom coroplast signs for Regina businesses. From $8/sqft — yard signs, job site signs, real estate signs. Printed in Saskatoon and shipped to Regina. Volume pricing available.",
  alternates: { canonical: "/coroplast-signs-regina" },
  openGraph: {
    title: "Coroplast Signs Regina SK | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft shipped to Regina. Volume pricing at 8+ sqft. H-stakes at $2.50. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/coroplast-signs-regina",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CoroplastSignsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="coroplast-signs-regina"
      primaryProductSlug="coroplast-signs"
      title="Coroplast Signs Regina SK"
      subtitle="Yard signs, job site signs, and real estate signs from $8/sqft. Printed in Saskatoon — shipped to Regina."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast yard signs for Regina SK businesses — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints coroplast yard signs for Regina contractors, real estate agents, businesses, and organizations. From $8/sqft with volume discounts at 8+ sqft. We ship directly to Regina — order online, approve by email, delivered by courier in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships
            coroplast signs to Regina businesses, contractors, and campaigns across Saskatchewan.
            Our{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            start at $8/sqft on our Roland UV printer — weatherproof, UV-stable, and built to
            handle Saskatchewan winters. An 18×24&quot; sign is about $24. A 24×36&quot; sign
            is $48. H-stakes are $2.50 each.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Volume pricing applies automatically to your Regina order — no account needed.
            At 8+ sqft (about 3 signs at 24×36&quot;), you save 8%. At 17+ sqft, you save 17%.
            At 32+ sqft ($7.25/sqft), you hit Tier 3 pricing — ideal for{" "}
            <Link href="/election-signs" className="text-[#16C2F3] underline font-medium">
              election campaigns
            </Link>
            , job site signage packages, or real estate sign runs. Double-sided coroplast
            is available for corner lots and high-traffic intersections.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688. We send
            a digital proof for approval, then print and ship to Regina via courier.
            Standard production is 1–3 business days after artwork approval, plus 1–2 days
            shipping. No print-ready file? Our in-house designer preps artwork for $35–$50.
            H-stakes ship flat and arrive ready to push into prairie soil.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed, weatherproof, 2–3 year outdoor lifespan",
        "H-stakes $2.50 each — ships flat to Regina, ready to stake",
        "Volume pricing auto-applies: 8% off at 8+ sqft, 17% off at 17+ sqft",
        "Double-sided coroplast available — corner lots, election signs, intersections",
        "Ships to Regina — order online, approve proof by email, delivered by courier",
        "In-house designer: file prep from logo, Word doc, or sketch — from $35",
      ]}
      faqs={[
        {
          q: "How does coroplast sign ordering work for Regina?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Regina address. Signs arrive flat, stacked, and wrapped — H-stakes are bundled separately.",
        },
        {
          q: "How much do coroplast signs cost shipped to Regina?",
          a: "Signs start at $8/sqft. An 18×24\" sign is about $24 plus shipping. A 24×36\" sign is $48 plus shipping. H-stakes are $2.50 each. Shipping to Regina is the customer's responsibility — call (306) 954-8688 for a shipping estimate before you order.",
        },
        {
          q: "How long does it take to get signs in Regina?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping to Regina adds 1–2 business days. Plan for 3–5 business days total. Rush production (+$40 flat) reduces production time but doesn't affect shipping speed.",
        },
        {
          q: "Can you do election campaign signs shipped to Regina?",
          a: "Yes — coroplast election signs at $7.25/sqft for runs of 32+ sqft (about 10 signs at 24×36\"). H-stakes at $2.50 each. Double-sided available. We ship to Regina via courier — call for large run logistics.",
        },
        {
          q: "What sizes do you print for Regina customers?",
          a: "Any custom size up to 4×8 ft. Most popular: 18×24\", 24×36\", 24×48\", and 4×8 ft. Use the calculator at /products/coroplast-signs for exact pricing. H-stakes fit standard 18×24\" and 24×36\" signs.",
        },
        {
          q: "Is there a print shop in Regina that can match your pricing?",
          a: "Most print shops in Regina don't own in-house large-format UV printers, which means higher prices and longer lead times. True Color prints on our own Roland UV equipment in Saskatoon, which is why we can offer $8/sqft coroplast and ship it to Regina — often at lower total cost than local competitors.",
        },
      ]}
    />
  );
}
