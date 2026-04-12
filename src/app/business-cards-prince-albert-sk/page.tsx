import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Business Cards Prince Albert SK | 250 for $45 | True Color" },
  description:
    "Business cards for Prince Albert SK professionals. 250 cards for $45, double-sided full colour. Printed in Saskatoon — shipped to Prince Albert. True Color Display Printing.",
  alternates: { canonical: "/business-cards-prince-albert-sk" },
  openGraph: {
    title: "Business Cards Prince Albert SK | True Color Display Printing",
    description:
      "250 full-colour business cards for $45, shipped to Prince Albert. Double-sided, gloss or matte finish. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/business-cards-prince-albert-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BusinessCardsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="business-cards-prince-albert-sk"
      primaryProductSlug="business-cards"
      title="Business Cards Prince Albert SK"
      subtitle="Full-colour double-sided cards from $45 — printed in Saskatoon, shipped to Prince Albert."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Business cards for Prince Albert SK professionals — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints and ships business cards to Prince Albert professionals, healthcare workers, and government employees 140 km north. 250 full-colour double-sided cards for $45 on 16pt gloss stock."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            to Prince Albert professionals 140 km north. Our cards are 16pt gloss stock,
            full-colour double-sided, with a UV coating. 250 cards for $45, 500 for $65,
            1,000 for $95. Prince Albert&apos;s healthcare, government, and forestry sectors
            generate steady demand for professional printed cards.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Matte laminate finish is available for a premium texture — popular with
            healthcare professionals and government workers who want a more subdued finish.
            Bundle your card order with{" "}
            <Link href="/flyer-printing-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              flyer printing
            </Link>{" "}
            or{" "}
            <Link href="/vehicle-magnets-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            for a complete printed package shipped to Prince Albert in one order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            Upload your artwork or have our designer build your card for $35–$50. We email
            a proof before printing. Standard turnaround: 1–3 business days print, plus
            1–2 days shipping to Prince Albert. Shipping typically runs $20–$30 for card orders.
          </p>
        </>
      }
      products={[
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "250 full-colour double-sided cards for $45 — 16pt gloss stock, UV-coated",
        "500 cards for $65 / 1,000 for $95 — volume pricing built in",
        "Matte laminate and rounded corners available for premium finish",
        "Healthcare, government, and forestry professionals in Prince Albert served",
        "Ships to Prince Albert — 3–5 business days, shipping typically $20–$30",
        "Bundle with flyers or vehicle magnets — one courier order to Prince Albert",
      ]}
      faqs={[
        {
          q: "How do I order business cards shipped to Prince Albert?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or describe what you need. We email a proof for approval, then print and ship to your Prince Albert address. Total timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to get business cards delivered to Prince Albert?",
          a: "250 cards are $45, 500 are $65, 1,000 are $95 — all double-sided full colour on 16pt gloss. Shipping from Saskatoon to Prince Albert (140 km north) typically runs $20–$30 for business card orders.",
        },
        {
          q: "Can I order matte business cards for Prince Albert healthcare professionals?",
          a: "Yes — matte laminate finish is available and popular with healthcare and government professionals in Prince Albert who prefer a softer, non-glossy card. Same pricing and turnaround as gloss.",
        },
        {
          q: "Can you design business cards for a Prince Albert government or healthcare office?",
          a: "Yes — our designer builds card layouts from a logo, position title, and contact info for $35–$50. We handle government brand standards and institutional identity requirements. Provide your organization&apos;s logo and we&apos;ll match the style.",
        },
        {
          q: "How long does it take to get business cards in Prince Albert?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping from Saskatoon to Prince Albert (140 km north) adds 1–2 business days. Total: 3–5 business days from proof approval.",
        },
        {
          q: "Can I combine business cards and flyers in one Prince Albert shipment?",
          a: "Yes — business cards, flyers, and other print products can ship together to Prince Albert in one courier order. Bundling often reduces per-item shipping cost. Call (306) 954-8688 to confirm.",
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
