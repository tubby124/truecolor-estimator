import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Banner Printing Regina SK | From $8.25/sqft | True Color" },
  description:
    "Custom vinyl banner printing for Regina businesses. 13oz vinyl banners from $8.25/sqft, grommets included. Order online — shipped to Regina. True Color Display Printing, Saskatoon.",
  alternates: { canonical: "/banner-printing-regina" },
  openGraph: {
    title: "Banner Printing Regina SK | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft shipped to Regina. Grommets included, full colour, any size. Order online — True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/banner-printing-regina",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BannerPrintingReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="banner-printing-regina"
      primaryProductSlug="vinyl-banners"
      title="Banner Printing Regina SK"
      subtitle="13oz vinyl banners from $8.25/sqft. Printed in Saskatoon — shipped to Regina."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banner printing shipped to Regina, Saskatchewan — True Color Display Printing"
      description="True Color Display Printing in Saskatoon prints vinyl banners, retractable banner stands, and foamboard displays for Regina businesses and organizations. We ship directly to your Regina address — order online, approve your proof by email, and we handle the rest. Grommets and hemming are included at no extra charge."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, prints and ships
            vinyl banners to Regina businesses, event organizers, and organizations across southern
            Saskatchewan. Our{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              13oz vinyl banners
            </Link>{" "}
            start at $8.25/sqft — a 2×6 ft banner is $90, a 3×8 ft banner is $180 — with full-colour
            Roland UV printing, grommets every 2 ft, and hemmed edges included as standard.
            No hidden charges.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Volume discounts apply automatically to your Regina order: 5% off at 5+ banners, 10% off at
            10+ banners, 15% off at 25+ banners. Need{" "}
            <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              retractable banner stands
            </Link>{" "}
            for a trade show or lobby display? A complete stand with full-colour printing
            starts at $219 — shipped to Regina ready to use right out of the box.
            We also print foamboard signs and{" "}
            <Link href="/event-banners" className="text-[#16C2F3] underline font-medium">
              event signage packages
            </Link>{" "}
            that combine banners, stands, and coroplast directionals in one order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Ordering is simple: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We send you a digital proof for approval before printing anything. Once approved and
            payment confirmed, your order goes to print — standard turnaround is 1–3 business days,
            then 1–2 days shipping to Regina via courier. Plan for 3–5 business days total.
            No print-ready file? Our in-house designer preps artwork from any format for $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "13oz scrim vinyl — outdoor-rated, UV-stable, wind-resistant in Saskatchewan conditions",
        "Grommets and hemming included on all banners — no upcharges",
        "Volume pricing: 5% off at 5+ banners, 10% off at 10+ banners, 15% off at 25+ banners",
        "Retractable banner stands from $219 — complete, ready to use",
        "Ships to Regina — order online, approve proof by email, delivered by courier",
        "In-house designer: file prep from any format starting at $35",
      ]}
      faqs={[
        {
          q: "How does banner printing for Regina work?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. We email you a digital proof for approval. Once approved and payment confirmed, we print in-house in Saskatoon and ship your order to your Regina address via courier. Standard total timeline: 3–5 business days.",
        },
        {
          q: "How much does it cost to ship banners to Regina?",
          a: "Shipping is the customer's responsibility. We pack banners in rigid tubes or flat cardboard to prevent damage in transit. We'll quote you shipping at checkout or on the phone before you commit.",
        },
        {
          q: "How long does banner printing take for Regina delivery?",
          a: "Standard production is 1–3 business days after artwork approval, then 1–2 days shipping to Regina. Plan for 3–5 business days total. Rush production (+$40 flat) reduces production to same-day, but doesn't affect shipping time.",
        },
        {
          q: "What's the best banner size for a Regina trade show or event?",
          a: "For trade show booths, 3×8 ft or 4×8 ft banners are standard behind-table sizes. Retractable banner stands (33×79\") are popular for portable display. Outdoor event banners are typically 3×6 ft or 4×8 ft. All sizes are custom — use the calculator at /products/vinyl-banners.",
        },
        {
          q: "Can you print banners in French for Saskatchewan events?",
          a: "Yes — we print any language, including bilingual English/French banners. Provide your text in the order notes and our designer will lay it out. File prep is $35–$50 depending on complexity.",
        },
        {
          q: "Do you ship to other Saskatchewan cities besides Regina?",
          a: "Yes — True Color Display Printing ships to customers across Saskatchewan. Regina, Prince Albert, Moose Jaw, Swift Current, and beyond. Shipping is the customer's responsibility. Call (306) 954-8688 for a shipping quote before ordering.",
        },
      ]}
    />
  );
}
