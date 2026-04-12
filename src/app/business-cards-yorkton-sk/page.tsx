import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Business Cards Yorkton SK | 250 for $45 | True Color" },
  description:
    "Business cards for Yorkton SK professionals. 250 cards for $45, double-sided full colour. Printed in Saskatoon — shipped to Yorkton. True Color Display Printing.",
  alternates: { canonical: "/business-cards-yorkton-sk" },
  openGraph: {
    title: "Business Cards Yorkton SK | True Color Display Printing",
    description:
      "250 full-colour business cards for $45, shipped to Yorkton. Double-sided, gloss or matte finish. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/business-cards-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BusinessCardsYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="business-cards-yorkton-sk"
      primaryProductSlug="business-cards"
      title="Business Cards Yorkton SK"
      subtitle="Full-colour double-sided cards from $45 — printed in Saskatoon, shipped to Yorkton."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Business cards for Yorkton SK professionals — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints and ships business cards to Yorkton professionals, agricultural businesses, and retail operators 180 km east. 250 full-colour double-sided cards for $45 on 16pt gloss stock."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            to Yorkton professionals and businesses 180 km east. Our cards are 16pt gloss
            stock, full-colour double-sided, with a UV coating. 250 cards for $45, 500 for
            $65, 1,000 for $95. Yorkton serves as the commercial hub for eastern
            Saskatchewan — agricultural suppliers, retail businesses, and service trades
            all order regularly.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Matte laminate finish is available for a premium feel — popular with
            agricultural consultants and professional service businesses in the Yorkton
            area. Bundle with{" "}
            <Link href="/flyer-printing-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              flyer printing
            </Link>{" "}
            or{" "}
            <Link href="/vehicle-magnets-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            for a complete printed package shipped to Yorkton in one courier order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            Upload your artwork or have our designer build your card for $35–$50. We email
            a proof before printing. Standard turnaround: 1–3 business days print, plus
            1–2 days shipping to Yorkton. Shipping typically runs $20–$35 for card orders.
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
        "Agricultural, retail, and professional services in Yorkton served",
        "Ships to Yorkton — 3–5 business days, shipping typically $20–$35",
        "Bundle with flyers or vehicle magnets — one courier order to Yorkton",
      ]}
      faqs={[
        {
          q: "How do I order business cards shipped to Yorkton?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or describe what you need. We email a proof for approval, then print and ship to your Yorkton address. Total timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to get business cards delivered to Yorkton?",
          a: "250 cards are $45, 500 are $65, 1,000 are $95 — all double-sided full colour on 16pt gloss. Shipping from Saskatoon to Yorkton (180 km east) typically runs $20–$35 for business card orders.",
        },
        {
          q: "Can you print business cards for Yorkton agricultural or grain businesses?",
          a: "Yes — we print for agricultural suppliers, grain consultants, and farm equipment dealers across eastern Saskatchewan regularly. Our designer can work with your brand or build a card from a business name and logo. Design from $35–$50.",
        },
        {
          q: "Can I get matte business cards for a Yorkton professional services firm?",
          a: "Yes — matte laminate finish is available and popular with professional services firms and agricultural consultants in the Yorkton area. Same pricing and turnaround as gloss cards. Rounded corners also available.",
        },
        {
          q: "How long does it take to get business cards in Yorkton?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping from Saskatoon to Yorkton (180 km east) adds 1–2 business days. Total: 3–5 business days from proof approval.",
        },
        {
          q: "Can I combine business cards and flyers in one Yorkton shipment?",
          a: "Yes — business cards, flyers, and other print products can ship together to Yorkton in one courier order. Bundling often reduces per-item shipping. Call (306) 954-8688 to confirm your combined order.",
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
