import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Printing Weyburn SK | Signs, Magnets & ACP for Potash & Ag | True Color",
  description:
    "Custom signs for Weyburn SK businesses. Coroplast from $8/sqft, ACP aluminum from $13/sqft, vehicle magnets. Printed in Saskatoon — shipped to Weyburn.",
  alternates: { canonical: "/printing-weyburn-sk" },
  openGraph: {
    title: "Printing Weyburn SK | True Color Display Printing",
    description:
      "Coroplast signs, ACP aluminum, vehicle magnets, and vinyl banners for Weyburn SK. Printed in Saskatoon — shipped to Weyburn. From $8/sqft.",
    url: "https://truecolorprinting.ca/printing-weyburn-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PrintingWeyburnPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-weyburn-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing Weyburn SK"
      subtitle="Coroplast signs, ACP aluminum, vehicle magnets, and vinyl banners — printed in Saskatoon, shipped to Weyburn."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Signs and printing for Weyburn SK businesses — True Color Display Printing Saskatoon"
      description="Potash sector contractors, agriculture operations, and retailers in Weyburn shouldn't have to outsource signage through a middleman. True Color prints coroplast from $8/sqft, ACP aluminum from $13/sqft, and vehicle magnets from $24/sqft in-house on Roland UV equipment in Saskatoon — and ships directly to Weyburn, about 240km away. Order online, approve your proof by email, delivered in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Potash sector contractors, agriculture operations, and retail businesses in Weyburn
            often end up waiting on a local shop that routes large-format print jobs through
            a supplier in Regina or Saskatoon anyway — adding cost and time. True Color cuts
            out the middleman: we print in-house in Saskatoon on our Roland UV press and ship
            directly to your Weyburn address.{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              Coroplast signs
            </Link>{" "}
            from $8/sqft are UV-printed and built for prairie outdoor conditions — 2–3 year
            lifespan, H-stakes at $2.50 each. Retail signs, real estate yard signs, and
            ag business signage are the most common orders from the Weyburn area.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Industrial service companies in the potash and energy sectors around Weyburn need
            signage that performs in a demanding environment.{" "}
            <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              ACP aluminum signs
            </Link>{" "}
            from $13/sqft are built for permanent facility and yard signage — rigid composite
            panel, UV-printed on our Roland press, rated 10+ years outdoors in southeast
            Saskatchewan conditions. An 18×24&quot; ACP panel is $39; 24×36&quot; is $66.
            Vehicle magnets from $24/sqft (minimum $45) for service trucks and industrial fleets.
            Vinyl banners from $8.25/sqft for company events and seasonal promotions.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for Weyburn delivery: call (306) 954-8688 or submit at truecolorprinting.ca.
            We email a digital proof before printing. After approval and payment, we print
            in-house and ship to your Weyburn address. Standard timeline: 3–5 business days.
            No design file? Our in-house designer preps artwork from any format for $35 flat,
            same-day proof. Rush production available for +$40 — place by 10 AM.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "In-house Roland UV press — no middleman markup, ships direct to Weyburn from Saskatoon",
        "Coroplast from $8/sqft — UV-printed, H-stakes $2.50 each, 2–3 year outdoor lifespan",
        "ACP aluminum from $13/sqft — permanent facility signage rated 10+ years in SE Saskatchewan",
        "Vehicle magnets from $24/sqft — industrial and potash sector fleet branding, removable and reusable",
        "Vinyl banners from $8.25/sqft — 13oz outdoor vinyl, hemmed and grommeted as standard",
        "Ships to Weyburn — approve proof by email, 3–5 business days to your door",
        "In-house designer — $35 flat, same-day proof, rush production +$40",
      ]}
      faqs={[
        {
          q: "How do I order signs shipped to Weyburn?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for your approval before printing. Once approved and payment confirmed, we print in-house in Saskatoon and ship to your Weyburn address. Standard timeline is 3–5 business days. Weyburn is about 240km from Saskatoon.",
        },
        {
          q: "What does shipping to Weyburn cost?",
          a: "Shipping is the customer's responsibility. We quote it before you commit. For a small order — 10 or fewer coroplast signs or a set of business cards — shipping to Weyburn is typically $25–$40 by courier. For larger orders including ACP panels, call (306) 954-8688 for a freight estimate.",
        },
        {
          q: "Do you supply signage for potash sector and industrial service companies near Weyburn?",
          a: "Yes — ACP aluminum signs from $13/sqft are the standard choice for industrial facility and yard signage in the potash sector. Vehicle magnets from $24/sqft for service truck fleets. Both products are UV-printed on our Roland press in Saskatoon and ship flat to Weyburn.",
        },
        {
          q: "What is the best sign product for Weyburn agricultural businesses?",
          a: "Coroplast signs from $8/sqft are the most popular for ag businesses — yard signs, field signs, and seasonal promotions. H-stakes at $2.50 each for ground mounting. For permanent signs on buildings or gateways, ACP aluminum from $13/sqft (18×24\" = $39, 24×36\" = $66) is the better long-term investment.",
        },
        {
          q: "Are there local print shops in Weyburn that offer the same products?",
          a: "Weyburn has some print services, but large-format UV printing and vehicle magnets are typically outsourced locally. True Color produces everything in-house on our Roland press in Saskatoon. Many Weyburn customers find our pricing competitive even with shipping included, because we don't mark up outsourced production.",
        },
        {
          q: "Is there a minimum order for Weyburn customers?",
          a: "No minimum. You can order a single coroplast sign or one set of vehicle magnets. Volume discounts apply automatically at higher sqft totals. Business cards start at 250 for $40, flyers at 100 for $45, both shipped to Weyburn.",
        },
      ]}
    />
  );
}
