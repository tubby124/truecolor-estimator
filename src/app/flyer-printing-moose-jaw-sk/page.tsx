import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Flyer Printing Moose Jaw SK | 100 for $45 | True Color" },
  description:
    "Custom flyer printing for Moose Jaw SK businesses and events. 100 flyers from $45 on 80lb gloss. Printed in Saskatoon — shipped to Moose Jaw. True Color Display Printing.",
  alternates: { canonical: "/flyer-printing-moose-jaw-sk" },
  openGraph: {
    title: "Flyer Printing Moose Jaw SK | True Color Display Printing",
    description:
      "Full-colour flyers from $45 for 100, shipped to Moose Jaw. 80lb gloss, any size. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/flyer-printing-moose-jaw-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FlyerPrintingMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="flyer-printing-moose-jaw-sk"
      primaryProductSlug="flyers"
      title="Flyer Printing Moose Jaw SK"
      subtitle="Full-colour flyers on 80lb gloss from $45 — printed in Saskatoon, shipped to Moose Jaw."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Flyer printing for Moose Jaw SK businesses and events — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints and ships full-colour flyers to Moose Jaw businesses, tourism operators, and event organizers 75 km southwest. 100 letter-size flyers on 80lb gloss for $45, shipped to Moose Jaw in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-colour flyers
            </Link>{" "}
            to Moose Jaw businesses and events 75 km to the southwest. Standard pricing:
            100 letter-size (8.5×11&quot;) flyers on 80lb gloss for $45, 250 for $85,
            500 for $135, 1,000 for $195. Full colour, double-sided standard, UV gloss.
            Moose Jaw&apos;s tourism sector and seasonal events create steady demand
            for high-quality printed flyers.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Half-letter (5.5×8.5&quot;) and tabloid (11×17&quot;) sizes available for
            menus and event programs. Pair your flyers with{" "}
            <Link href="/business-cards-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            or{" "}
            <Link href="/banner-printing-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            and we&apos;ll combine everything in one shipment to Moose Jaw.
            Volume pricing is automatic — no promo code needed.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Moose Jaw. Standard production: 1–3 business days, plus 1–2 days
            shipping. Shipping from Saskatoon to Moose Jaw typically $20–$35 for flyer
            orders. Designer service from $35–$50 if no artwork on file.
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
        "Half-letter and tabloid sizes for tourism menus and event programs",
        "Tourism, seasonal events, and small business clients in Moose Jaw served",
        "Ships to Moose Jaw — 3–5 business days, typical shipping $20–$35",
        "Combine with business cards or banners — one courier order to Moose Jaw",
      ]}
      faqs={[
        {
          q: "How do I order flyers shipped to Moose Jaw?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or have our designer create it. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to your Moose Jaw address. Total: 3–5 business days.",
        },
        {
          q: "How much does flyer printing cost with delivery to Moose Jaw?",
          a: "100 letter-size flyers are $45, 250 are $85, 500 are $135, 1,000 are $195. Shipping from Saskatoon to Moose Jaw (75 km) typically runs $20–$35 depending on order weight. Call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "Can you print tourism flyers for a Moose Jaw attraction?",
          a: "Yes — we regularly print tourism flyers for businesses and attractions. Popular formats: letter (8.5×11\") for rack display, half-letter (5.5×8.5\") for pocket takeaways, and tabloid (11×17\") for maps and event guides.",
        },
        {
          q: "What sizes of flyers do you print for Moose Jaw customers?",
          a: "Letter (8.5×11\"), half-letter (5.5×8.5\"), and tabloid (11×17\") are standard. Custom sizes available. All sizes are full-colour double-sided on 80lb gloss by default.",
        },
        {
          q: "How long does flyer printing take for Moose Jaw delivery?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping from Saskatoon to Moose Jaw (75 km) adds 1–2 business days. Plan for 3–5 business days total. Rush production available (+$40 flat).",
        },
        {
          q: "Can I combine a flyer order with banners for a Moose Jaw event?",
          a: "Yes — we can ship flyers, vinyl banners, coroplast signs, and business cards together in one order to Moose Jaw. Bundling reduces per-item shipping. Call (306) 954-8688 to set up a combined event package.",
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
