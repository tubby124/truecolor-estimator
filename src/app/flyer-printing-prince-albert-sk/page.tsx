import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Flyer Printing Prince Albert SK | 100 for $45 | True Color" },
  description:
    "Custom flyer printing for Prince Albert SK businesses and organizations. 100 flyers from $45 on 80lb gloss. Printed in Saskatoon — shipped to Prince Albert.",
  alternates: { canonical: "/flyer-printing-prince-albert-sk" },
  openGraph: {
    title: "Flyer Printing Prince Albert SK | True Color Display Printing",
    description:
      "Full-colour flyers from $45 for 100, shipped to Prince Albert. 80lb gloss, any size. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/flyer-printing-prince-albert-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FlyerPrintingPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="flyer-printing-prince-albert-sk"
      primaryProductSlug="flyers"
      title="Flyer Printing Prince Albert SK"
      subtitle="Full-colour flyers on 80lb gloss from $45 — printed in Saskatoon, shipped to Prince Albert."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Flyer printing for Prince Albert SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints and ships full-colour flyers to Prince Albert businesses, healthcare organizations, and community groups 140 km north. 100 letter-size flyers on 80lb gloss for $45 — shipped in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-colour flyers
            </Link>{" "}
            to Prince Albert businesses and organizations 140 km north. Pricing: 100
            letter-size (8.5×11&quot;) flyers on 80lb gloss for $45, 250 for $85,
            500 for $135, 1,000 for $195. Full colour, double-sided standard.
            Prince Albert&apos;s healthcare facilities, government offices, and
            community organizations create consistent demand for professionally printed flyers.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Half-letter (5.5×8.5&quot;) and tabloid (11×17&quot;) sizes available for
            program booklets and event guides. Bundle with{" "}
            <Link href="/business-cards-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            or{" "}
            <Link href="/banner-printing-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            and ship everything to Prince Albert in one courier order.
            Volume pricing is automatic — no promo code required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Prince Albert. Standard production: 1–3 business days, plus
            1–2 days shipping. Shipping from Saskatoon to Prince Albert (140 km north)
            typically runs $25–$40 for flyer orders. Designer service from $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "100 letter-size flyers for $45 on 80lb gloss — full colour, double-sided",
        "250 for $85, 500 for $135, 1,000 for $195 — volume pricing built in",
        "Half-letter and tabloid sizes for healthcare programs and event guides",
        "Healthcare, government, and community organizations in Prince Albert served",
        "Ships to Prince Albert — 3–5 business days, shipping typically $25–$40",
        "Bundle with business cards or banners — one courier order to Prince Albert",
      ]}
      faqs={[
        {
          q: "How do I order flyers shipped to Prince Albert?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or have our designer create it. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to your Prince Albert address. Total: 3–5 business days.",
        },
        {
          q: "How much does flyer printing cost with delivery to Prince Albert?",
          a: "100 letter-size flyers are $45, 250 are $85, 500 are $135, 1,000 are $195. Shipping from Saskatoon to Prince Albert (140 km) typically runs $25–$40. Call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "Can you print flyers for a Prince Albert healthcare or government campaign?",
          a: "Yes — we print for healthcare facilities, government public awareness campaigns, and nonprofit organizations across Prince Albert. We match institutional brand standards. Provide your logo and brief and our designer handles the layout for $35–$50.",
        },
        {
          q: "What flyer sizes do you offer for Prince Albert customers?",
          a: "Letter (8.5×11\"), half-letter (5.5×8.5\"), and tabloid (11×17\") are standard. Custom sizes available. All are full-colour double-sided on 80lb gloss by default.",
        },
        {
          q: "How long does flyer printing take for Prince Albert delivery?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping from Saskatoon to Prince Albert (140 km north) adds 1–2 business days. Total: 3–5 business days. Rush production available (+$40 flat).",
        },
        {
          q: "Can I combine a flyer order with other prints for one Prince Albert shipment?",
          a: "Yes — flyers, business cards, vinyl banners, and coroplast signs can ship together in one order to Prince Albert. Bundling reduces per-item shipping cost. Call (306) 954-8688 to set up a combined order.",
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
