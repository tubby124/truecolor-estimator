import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Printing Swift Current SK | Signs & Magnets | True Color" },
  description:
    "Custom signs and printing for Swift Current SK. Coroplast from $8/sqft, vinyl banners, vehicle magnets, business cards. Printed in Saskatoon — shipped to Swift Current.",
  alternates: { canonical: "/printing-swift-current-sk" },
  openGraph: {
    title: "Printing Swift Current SK | True Color Display Printing",
    description:
      "Coroplast signs, vinyl banners, vehicle magnets, and business cards for Swift Current SK. Printed in Saskatoon — shipped to Swift Current.",
    url: "https://truecolorprinting.ca/printing-swift-current-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PrintingSwiftCurrentPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-swift-current-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing Swift Current SK"
      subtitle="Coroplast signs, banners, vehicle magnets, and business cards — printed in Saskatoon, shipped to Swift Current."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Signs and printing for Swift Current SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing ships signs, banners, vehicle magnets, and business cards to Swift Current businesses. Southwest Saskatchewan's retail and agriculture hub deserves professional signage — we print it in Saskatoon on Roland UV equipment and ship directly to you. Order online, approve your proof by email, delivered in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, ships professional
            signs and print products to Swift Current businesses serving southwest Saskatchewan.
            Swift Current is a regional hub for agriculture, oil and gas, and retail —
            and businesses there need signage that performs in harsh prairie conditions.{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              Coroplast signs
            </Link>{" "}
            from $8/sqft are UV-printed on our Roland press and weather-resistant for
            2–3 year outdoor use. H-stakes at $2.50 each.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vinyl banners from $8.25/sqft for Swift Current storefronts, events, and job sites —
            hemmed edges, grommets every 2 ft, 13oz outdoor-rated vinyl.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $45 ($24/sqft) for service trucks, delivery vehicles, and ag equipment.
            ACP aluminum signs from $13/sqft for permanent facility and yard signage
            that lasts 10+ years in southwest SK conditions. Business cards 250 for $45.
            Volume pricing on all orders — no account required. Minimum order $30.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for Swift Current delivery: call (306) 954-8688 or submit your quote at
            truecolorprinting.ca. We email a digital proof for approval, then print in Saskatoon
            and ship to Swift Current via courier. Standard timeline: 3–5 business days.
            Shipping is the customer&apos;s responsibility — we quote it before you commit.
            No design file? Our in-house designer preps artwork from any format for $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed, weatherproof, ideal for SW Saskatchewan conditions",
        "Vehicle magnets from $45 — ag equipment and service truck branding",
        "ACP aluminum from $13/sqft — permanent yard and facility signage, 10+ year lifespan",
        "Vinyl banners from $8.25/sqft — grommets included, outdoor-rated 13oz vinyl",
        "Business cards 250 for $45 — shipped flat to Swift Current",
        "Shipped to Swift Current — order online, approve proof by email, 3–5 business days",
      ]}
      faqs={[
        {
          q: "How do I order signs or printing for delivery to Swift Current?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for your approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Swift Current address. Standard timeline is 3–5 business days total.",
        },
        {
          q: "What is the shipping cost to Swift Current?",
          a: "Shipping is the customer's responsibility. We quote shipping before you commit. For a small order (10 or fewer signs), shipping to Swift Current is typically $25–$45 by courier. For large runs, call (306) 954-8688 to discuss.",
        },
        {
          q: "Do you print vehicle magnets for Swift Current farm and service vehicles?",
          a: "Yes — 30mil vehicle magnets from $24/sqft. Custom rectangle or shape. Stick securely to steel doors on service trucks, grain trucks, and equipment cabs. Remove cleanly with no adhesive residue. Great for seasonal and fleet branding.",
        },
        {
          q: "Can you do large ag equipment yard signs for Swift Current?",
          a: "Yes — coroplast up to 4×8 ft and ACP aluminum signs up to 4×8 ft. For larger installations, we print on vinyl banner material. ACP is recommended for permanent yard and gate signs that need to survive 10+ years outdoors.",
        },
        {
          q: "What's the minimum order for Swift Current?",
          a: "Minimum order is $30. A single 24×36\" coroplast sign at $48 clears the minimum on its own. Volume discounts apply automatically — 8% off at 5+ signs, 17% off at 10+ signs, 23% off at 25+ signs.",
        },
        {
          q: "Is there a local print shop in Swift Current that competes with your prices?",
          a: "There are some print shops in Swift Current, but most don't own large-format UV printers in-house, which means higher prices and outsourced production. True Color prints on our own Roland equipment in Saskatoon and ships directly — often at lower total cost even with shipping included.",
        },
      ]}
    />
  );
}
