import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Real Estate Signs Saskatoon | Yard Signs & Cards | True Color",
  description:
    "Coroplast yard signs for Saskatoon REALTORS. Listing goes live Tuesday — signs ready same week. From $30. In-house designer. Local pickup.",
  alternates: { canonical: "/real-estate-signs-saskatoon" },
};

export default function RealEstatePage() {
  return (
    <IndustryPage
      title="Real Estate Signs Saskatoon"
      subtitle="Your listing goes live Tuesday. Your sign should too."
      heroImage="/images/products/heroes/realestate-hero-1200x500.webp"
      heroAlt="Real estate yard signs Saskatoon"
      description="Saskatoon REALTORS and brokerages use True Color for yard signs, feature sheets, and business cards. Your listing is time-sensitive — we get it. Standard turnaround is 1–3 business days. Rush available. In-house designer handles low-res headshots and brokerage templates."
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Business Cards", from: "from $40", slug: "business-cards" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
      ]}
      whyPoints={[
        "18×24\" coroplast yard sign from $30 — the standard REALTOR size",
        "Double-sided signs available — face traffic from both directions",
        "H-stakes for yard installation — just $2.50 each",
        "Listing feature sheets (flyers) from $45 for 100",
        "Business cards from $40 — 250 cards, 14pt gloss, same-day ready",
      ]}
      faqs={[
        {
          q: "What size do most REALTORS order?",
          a: "18×24\" is the standard yard sign size. 24×36\" is popular for higher-visibility properties or corner lots.",
        },
        {
          q: "Can you print both sides of a yard sign?",
          a: "Yes — double-sided coroplast is available. Price is approximately 50% more than single-sided.",
        },
        {
          q: "I need 20 signs for open house weekend. How fast can you do it?",
          a: "20 signs in 1–3 business days is standard. Rush (same day) available for +$40. Call us at (306) 954-8688 to confirm timing.",
        },
        {
          q: "Do you do brokerage template matching?",
          a: "Yes — bring your brokerage's brand guidelines or existing card/sign as a reference and we'll match the layout.",
        },
      ]}
    />
  );
}
