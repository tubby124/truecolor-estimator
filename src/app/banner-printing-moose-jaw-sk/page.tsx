import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Banner Printing Moose Jaw SK | From $8.25/sqft | True Color" },
  description:
    "Custom vinyl banners for Moose Jaw SK businesses and events. From $8.25/sqft, grommeted and hemmed. Printed in Saskatoon — shipped to Moose Jaw.",
  alternates: { canonical: "/banner-printing-moose-jaw-sk" },
  openGraph: {
    title: "Banner Printing Moose Jaw SK | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft shipped to Moose Jaw. Grommets and hemming included. True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/banner-printing-moose-jaw-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BannerPrintingMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="banner-printing-moose-jaw-sk"
      primaryProductSlug="vinyl-banners"
      title="Banner Printing Moose Jaw SK"
      subtitle="Vinyl banners from $8.25/sqft, grommeted and hemmed — shipped from Saskatoon."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banner printing shipped to Moose Jaw SK — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints and ships vinyl banners to Moose Jaw businesses, tourism operators, and event organizers 75 km southwest. From $8.25/sqft with grommets and hemming included. Shipped to Moose Jaw in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              13oz vinyl banners
            </Link>{" "}
            to Moose Jaw businesses, seasonal events, and tourism operations 75 km away.
            Banners start at $8.25/sqft — a 2×6 ft banner is $90, a 3×8 ft is $180 — with
            full-colour Roland UV printing, grommets every 2 ft, and hemmed edges included
            at no extra charge. No hidden fees.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Moose Jaw is home to significant tourism attractions, a strong military community
            at CFB Moose Jaw, and seasonal agricultural activity — all of which drive demand
            for outdoor vinyl banners. Volume discounts apply automatically: 5% off at 5+
            banners, 10% off at 10+ banners. Need{" "}
            <Link href="/coroplast-signs-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for the same event? We can combine both products in one order shipped to Moose Jaw.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed and payment received, we print
            and ship to Moose Jaw via courier. Standard turnaround: 1–3 business days
            print, plus 1–2 days shipping. Shipping from Saskatoon to Moose Jaw runs
            $20–$35 for most banner orders. No file? Designer service from $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "13oz scrim vinyl — outdoor-rated, UV-stable, handles SK wind and temperature",
        "Grommets and hemming included on every banner — no upcharges",
        "Volume pricing: 5% off at 5+ banners, 10% off at 10+ banners",
        "Tourism, military base, and agricultural event experience in Moose Jaw market",
        "Ships to Moose Jaw — 3–5 business days, typical shipping $20–$35",
        "In-house Roland UV press — in-house printing, not outsourced",
      ]}
      faqs={[
        {
          q: "How does banner printing for Moose Jaw work?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once confirmed, we print in Saskatoon and ship to your Moose Jaw address. Standard timeline: 3–5 business days total.",
        },
        {
          q: "How much does it cost to ship banners to Moose Jaw?",
          a: "Shipping from Saskatoon to Moose Jaw (75 km) typically runs $20–$35 for banner orders. We pack in rigid tubes or flat cardboard to prevent damage. Call (306) 954-8688 for a firm shipping quote before ordering.",
        },
        {
          q: "What banner sizes work best for Moose Jaw tourism businesses?",
          a: "For storefronts and attractions, 3×6 ft or 4×8 ft banners work well. For seasonal event banners, 2×8 ft or 3×10 ft are common. Retractable banner stands (33×79\") are popular for lobby and indoor display. All sizes are custom — use the calculator at /products/vinyl-banners.",
        },
        {
          q: "Can you print banners for a Moose Jaw air show or military event?",
          a: "Yes — we print banners for public events, base open houses, and community celebrations. Large-format 4×8 or 4×12 ft banners with grommets are the standard for outdoor event signage. Call for event package pricing.",
        },
        {
          q: "How long do outdoor vinyl banners last in Moose Jaw conditions?",
          a: "Our 13oz scrim vinyl with UV-stable inks is rated for 2–3 years outdoors. Hemmed edges and grommets every 2 ft reduce wind stress. Moose Jaw wind conditions are similar to Saskatoon — the banner holds well in normal weather.",
        },
        {
          q: "Can I order banners and coroplast signs together for one Moose Jaw shipment?",
          a: "Yes — we can combine vinyl banners and coroplast signs in one courier order to Moose Jaw. Bundling often reduces per-item shipping cost. Call (306) 954-8688 to confirm your combined order.",
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
