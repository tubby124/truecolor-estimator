import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Flyer Printing Regina SK | 100 for $45 | True Color" },
  description:
    "Custom flyer printing for Regina SK businesses. 100 flyers from $45 on 80lb gloss. Printed in Saskatoon — shipped to Regina. True Color Display Printing.",
  alternates: { canonical: "/flyer-printing-regina" },
  openGraph: {
    title: "Flyer Printing Regina SK | True Color Display Printing",
    description:
      "Full-colour flyer printing from $45 for 100, shipped to Regina. 80lb gloss, any size. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/flyer-printing-regina",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FlyerPrintingReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="flyer-printing-regina"
      primaryProductSlug="flyers"
      title="Flyer Printing Regina SK"
      subtitle="Full-colour flyers on 80lb gloss from $45 — printed in Saskatoon, shipped to Regina."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Flyer printing for Regina SK businesses — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints and ships full-colour flyers to Regina businesses, event organizers, and government offices. 100 letter-size flyers on 80lb gloss for $45 — shipped to your Regina address in 3–5 business days. Volume pricing available for larger runs."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-colour flyers
            </Link>{" "}
            to Regina businesses and organizations 260 km south. Our standard flyer is letter
            size (8.5×11&quot;) on 80lb gloss — full colour, single or double-sided. Pricing:
            100 for $45, 250 for $85, 500 for $135, 1,000 for $195. Regina&apos;s mix of
            government offices, retail, and events makes flyers one of the most-ordered
            products we ship south.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Half-letter (5.5×8.5&quot;) and tabloid (11×17&quot;) sizes are available for
            menu-style or event program formats. Combine your flyer order with{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            or{" "}
            <Link href="/banner-printing-regina" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            for a complete printed package shipped to Regina in one shipment. Volume
            discounts apply automatically — no account or promo code needed.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We send a digital proof by email before printing. Once approved and payment
            confirmed, we print and ship to your Regina address. Standard turnaround:
            1–3 business days print, plus 1–2 days shipping. No file? Our in-house
            designer builds from your brand assets for $35–$50.
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
        "100 letter-size flyers for $45 on 80lb gloss — full colour, single or double-sided",
        "250 for $85, 500 for $135, 1,000 for $195 — volume pricing built in",
        "Half-letter and tabloid sizes available for menus and event programs",
        "Government, retail, and event clients served across Regina and southern SK",
        "Ships to Regina — 3–5 business days from artwork approval",
        "Bundle with business cards or banners — one courier order to Regina",
      ]}
      faqs={[
        {
          q: "How do I order flyers shipped to Regina?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Upload your artwork or have our designer create it. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to your Regina address. Total timeline: 3–5 business days.",
        },
        {
          q: "How much does flyer printing cost with shipping to Regina?",
          a: "100 letter-size flyers are $45, 250 are $85, 500 are $135, 1,000 are $195 — full colour on 80lb gloss. Shipping to Regina is the customer's responsibility. Call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "What sizes of flyers do you print for Regina customers?",
          a: "Letter (8.5×11\"), half-letter (5.5×8.5\"), and tabloid (11×17\") are standard. Custom sizes available. Double-sided printing is the same price as single-sided — our standard includes both faces.",
        },
        {
          q: "Can you print event flyers for a Regina venue or festival?",
          a: "Yes — event flyers are one of our most common Regina orders. We print for seasonal festivals, concerts, community events, and government public engagement. Tabloid size is popular for event schedules and programs. Rush production available for time-sensitive events.",
        },
        {
          q: "How long does flyer printing take for Regina delivery?",
          a: "Standard production is 1–3 business days after artwork approval. Shipping to Regina adds 1–2 business days. Plan for 3–5 business days total. Rush production (+$40 flat) reduces print time to same-day.",
        },
        {
          q: "Can you design a flyer for my Regina business from scratch?",
          a: "Yes — our in-house designer builds flyer layouts from a logo, colour palette, and brief for $35–$50. Common requests: grand openings, seasonal sales, service menus, and event announcements. Provide your logo and key text and we handle the layout.",
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
