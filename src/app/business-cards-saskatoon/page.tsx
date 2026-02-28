import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Business Cards Saskatoon | 250 Cards from $40 | True Color Display Printing",
  description:
    "Custom business card printing in Saskatoon. 250 cards from $40, double-sided 14pt gloss. Same-day rush available. Local pickup at 216 33rd St W. In-house designer.",
  alternates: { canonical: "/business-cards-saskatoon" },
  openGraph: {
    title: "Business Cards Saskatoon | True Color Display Printing",
    description:
      "250 business cards from $40. Double-sided 14pt gloss. Same-day rush. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/business-cards-saskatoon",
    type: "website",
  },
};

export default function BusinessCardsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="business-cards-saskatoon"
      primaryProductSlug="business-cards"
      title="Business Cards Saskatoon"
      subtitle="250 cards from $40. Double-sided, 14pt gloss. Ready in 1–3 business days."
      heroImage="/images/products/product/business-cards-800x600.webp"
      heroAlt="Business card printing in Saskatoon — 250 cards from $40 at True Color"
      description="True Color Display Printing produces professional business cards for Saskatoon businesses. 250 double-sided cards on 14pt gloss stock start at $40 — less than you'd pay at Staples without the corporate markup. We print in-house, which means we control quality and turnaround. Cards are standard 3.5×2 inch size, full-colour both sides, with a high-gloss finish. Same-day rush available for +$40 flat. In-house designer handles layout from your logo and contact info."
      products={[
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
      ]}
      whyPoints={[
        "250 double-sided business cards for $40 — cheaper than Staples, faster turnaround",
        "14pt gloss stock — professional weight and finish that makes an impression",
        "500 for $60, 1000 for $90 — bulk pricing for sales teams and events",
        "In-house designer: bring your logo and contact info, we lay it out from $35",
        "Same-day rush available (+$40 flat) when ordered before 10 AM",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping wait, inspect before you leave",
      ]}
      faqs={[
        {
          q: "How much do business cards cost in Saskatoon?",
          a: "250 double-sided business cards on 14pt gloss stock are $40 at True Color. 500 cards are $60, 1000 are $90. Single-sided is slightly less. Use the calculator at /products/business-cards to see your exact price.",
        },
        {
          q: "How long does business card printing take?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm availability.",
        },
        {
          q: "What stock do you use for business cards?",
          a: "Our standard is 14pt gloss stock — the professional industry standard. It's thick, rigid, and has a glossy finish on both sides. We don't offer matte or soft-touch lamination at this time.",
        },
        {
          q: "Can you design my business cards?",
          a: "Yes — bring your logo (any quality) and contact information and our in-house designer will lay it out for $35–$50. If you have a rough layout in Word or Canva, we can work with that too.",
        },
        {
          q: "What's the minimum order?",
          a: "250 cards is our minimum. It's the sweet spot for quality vs. cost. Going below 250 doesn't save much — the setup cost is the same.",
        },
        {
          q: "Do you beat Staples and FedEx Office pricing?",
          a: "Yes, consistently. 250 double-sided cards at Staples or FedEx Office run $60–$80. We're at $40 — same quality, faster local pickup, with an in-house designer included in the process.",
        },
      ]}
    />
  );
}
