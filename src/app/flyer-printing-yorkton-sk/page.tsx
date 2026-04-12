import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Flyer Printing Yorkton SK | 100 for $45 | True Color" },
  description:
    "Custom flyer printing for Yorkton SK businesses and events. 100 flyers from $45 on 80lb gloss. Printed in Saskatoon — shipped to Yorkton. True Color Display Printing.",
  alternates: { canonical: "/flyer-printing-yorkton-sk" },
  openGraph: {
    title: "Flyer Printing Yorkton SK | True Color Display Printing",
    description:
      "Full-colour flyers from $45 for 100, shipped to Yorkton. 80lb gloss, any size. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/flyer-printing-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FlyerPrintingYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="flyer-printing-yorkton-sk"
      primaryProductSlug="flyers"
      title="Flyer Printing Yorkton SK"
      subtitle="Full-colour flyers on 80lb gloss from $45 — printed in Saskatoon, shipped to Yorkton."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Flyer printing for Yorkton SK businesses and events — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints and ships full-colour flyers to Yorkton businesses, retail operators, and community events 180 km east. 100 letter-size flyers on 80lb gloss for $45 — shipped to Yorkton in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-colour flyers
            </Link>{" "}
            to Yorkton businesses and organizations 180 km east. Pricing: 100 letter-size
            (8.5×11&quot;) flyers on 80lb gloss for $45, 250 for $85, 500 for $135,
            1,000 for $195. Full colour, double-sided standard. Yorkton&apos;s role as
            the retail and service hub for eastern Saskatchewan drives demand for flyers
            across seasonal sales events, agricultural trade shows, and community fairs.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Half-letter (5.5×8.5&quot;) and tabloid (11×17&quot;) sizes available for
            menus, event guides, and agricultural show programs. Bundle with{" "}
            <Link href="/business-cards-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            or{" "}
            <Link href="/banner-printing-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            and ship everything to Yorkton in one courier order.
            Volume pricing is automatic — no promo code required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Yorkton. Standard production: 1–3 business days, plus 1–2 days
            shipping. Shipping from Saskatoon to Yorkton (180 km east) typically runs
            $25–$45 for flyer orders. Designer service from $35–$50.
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
        "Half-letter and tabloid sizes for agricultural show programs and menus",
        "Retail, agricultural, and community event clients in Yorkton served",
        "Ships to Yorkton — 3–5 business days, shipping typically $25–$45",
        "Bundle with business cards or banners — one courier order to Yorkton",
      ]}
      faqs={[
        {
          q: "How do I order flyers shipped to Yorkton?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or have our designer create it. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to your Yorkton address. Total: 3–5 business days.",
        },
        {
          q: "How much does flyer printing cost with delivery to Yorkton?",
          a: "100 letter-size flyers are $45, 250 are $85, 500 are $135, 1,000 are $195. Shipping from Saskatoon to Yorkton (180 km east) typically runs $25–$45. Call (306) 954-8688 for a firm shipping estimate.",
        },
        {
          q: "Can you print flyers for a Yorkton agricultural trade show or fair?",
          a: "Yes — we print for agricultural trade shows, grain and equipment expos, and community fairs across eastern Saskatchewan. Tabloid (11×17\") is popular for show guides and event schedules. Letter size works for product handouts.",
        },
        {
          q: "What flyer sizes do you offer for Yorkton customers?",
          a: "Letter (8.5×11\"), half-letter (5.5×8.5\"), and tabloid (11×17\") are standard. Custom sizes available. All are full-colour double-sided on 80lb gloss by default.",
        },
        {
          q: "How long does flyer printing take for Yorkton delivery?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping from Saskatoon to Yorkton (180 km east) adds 1–2 business days. Total: 3–5 business days. Rush production available (+$40 flat).",
        },
        {
          q: "Can I combine a flyer and banner order for one Yorkton shipment?",
          a: "Yes — flyers, vinyl banners, coroplast signs, and business cards can ship together in one order to Yorkton. Bundling reduces per-item shipping cost. Call (306) 954-8688 to set up a combined order.",
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
