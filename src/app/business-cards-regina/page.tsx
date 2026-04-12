import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Business Cards Regina SK | 250 for $45 | True Color" },
  description:
    "Business cards for Regina SK professionals. 250 cards for $45, double-sided full colour. Printed in Saskatoon — shipped to Regina. True Color Display Printing.",
  alternates: { canonical: "/business-cards-regina" },
  openGraph: {
    title: "Business Cards Regina SK | True Color Display Printing",
    description:
      "250 full-colour business cards for $45, shipped to Regina. Double-sided, gloss or matte finish. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/business-cards-regina",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BusinessCardsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="business-cards-regina"
      primaryProductSlug="business-cards"
      title="Business Cards Regina SK"
      subtitle="Full-colour double-sided cards from $45 — shipped to Regina from Saskatoon."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Business cards for Regina SK professionals — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints and ships business cards to Regina professionals, government workers, and corporate clients across southern Saskatchewan. 250 full-colour double-sided cards for $45 on 16pt gloss stock — shipped to your Regina address in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            to Regina professionals and corporate clients 260 km south. Regina&apos;s
            economy is driven by government, financial services, energy, and legal — sectors
            where a well-printed card still matters at first meetings. Our cards are 16pt gloss
            stock, full-colour double-sided, with a UV coating that resists fingerprints and
            edge wear. 250 cards for $45, 500 for $65, 1,000 for $95.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Need more than business cards? Bundle with{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyer printing
            </Link>{" "}
            or{" "}
            <Link href="/banner-printing-regina" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            for a complete printed package shipped to Regina in one courier order.
            Matte laminate finish is available for a premium feel — popular with
            Regina real estate agents and financial advisors who want a distinct texture.
            Rounded corners are available at a small upcharge.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            Upload your artwork or have our in-house designer build your card from scratch
            for $35–$50. We email a proof before printing. Once approved and payment
            confirmed, we print and ship to Regina. Standard turnaround: 1–3 business days
            print, plus 1–2 days shipping.
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
        "Government, corporate, and real estate clients served across Regina",
        "Ships to Regina — 3–5 business days from artwork approval",
        "Bundle with flyers or banners — one courier order to Regina",
      ]}
      faqs={[
        {
          q: "How do I order business cards shipped to Regina?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or describe what you need. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to your Regina address. Total timeline: 3–5 business days.",
        },
        {
          q: "How much do business cards cost with shipping to Regina?",
          a: "250 cards are $45, 500 are $65, 1,000 are $95 — all double-sided full colour on 16pt gloss. Shipping to Regina is the customer's responsibility. Call (306) 954-8688 for a shipping estimate before you order.",
        },
        {
          q: "What paper stock do you use for business cards?",
          a: "Standard is 16pt gloss coated stock with UV coating. Matte laminate is available for a softer feel. Both are standard business card size (3.5×2\") with optional rounded corners.",
        },
        {
          q: "Can you design business cards for a Regina real estate agent?",
          a: "Yes — our in-house designer handles card layouts from a logo and text brief for $35–$50. We produce cards for realtors, brokers, and property managers across Saskatchewan regularly. Provide your brokerage logo and contact details.",
        },
        {
          q: "How long does it take to get business cards delivered to Regina?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping to Regina (260 km south of Saskatoon) adds 1–2 business days. Plan for 3–5 business days total from when your proof is approved.",
        },
        {
          q: "Can I order business cards and flyers together for one Regina shipment?",
          a: "Yes — we can combine business cards, flyers, banners, and other printed products in a single order shipped to your Regina address. Bundle orders often reduce per-item shipping cost. Call (306) 954-8688 to confirm.",
        },
      ]}
      relatedCities={[
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
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
