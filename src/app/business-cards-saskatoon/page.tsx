import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Business Cards Saskatoon | 250 Cards from $45 | True Color" },
  description:
    "Custom business card printing in Saskatoon. 250 cards from $45, double-sided 14pt gloss. Same-day rush available. In-house designer. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/business-cards-saskatoon" },
  openGraph: {
    title: "Business Cards Saskatoon | True Color Display Printing",
    description:
      "250 business cards from $45. Double-sided 14pt gloss. Same-day rush. Local Saskatoon pickup.",
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
      subtitle="250 cards from $45. Double-sided, 14pt gloss. In-house designer. Ready in 1–3 business days."
      heroImage="/images/products/product/business-cards-800x600.webp"
      heroAlt="Business card printing in Saskatoon — 250 cards from $45 at True Color"
      description="True Color Display Printing produces professional business cards for Saskatoon businesses. 250 double-sided cards on 14pt gloss stock start at $45 — less than you'd pay at Staples without the corporate markup. We print in-house, which means we control quality and turnaround. Cards are standard 3.5×2 inch size, full-colour both sides, with a high-gloss finish. Same-day rush available for +$40 flat. In-house designer handles layout from your logo and contact info. Saskatoon contractors, real estate agents, tradespeople, and small business owners order here because design and print happen under one roof — no emailing files back and forth, no waiting for a national courier to deliver a box.

Business cards are the most personal marketing tool you carry. Whether you're passing one to a client on a job site, leaving a stack at a local business, or handing them out at a trade show or Chamber of Commerce event, a well-printed card on good stock makes the right impression. Our 14pt gloss is the industry standard — it's thick, holds the colour, and has the right snap when someone takes it from your hand. Matte finish is available on request.

Volume pricing: 250 for $45, 500 for $58, 1000 for $75. Most orders are ready in 1–3 business days. Same-day rush is available for +$40 flat on orders placed before 10 AM. Pickup at 216 33rd St W — no shipping, inspect your cards before you leave."
      products={[
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
      ]}
      whyPoints={[
        "250 double-sided business cards for $45 — cheaper than Staples or FedEx Office, faster turnaround",
        "14pt gloss stock — professional weight and finish, matte available on request",
        "500 for $58, 1000 for $75 — bulk pricing for sales teams and trade shows",
        "In-house Photoshop designer: bring your logo and info, we build the layout from $35",
        "Same-day rush available (+$40 flat) when ordered before 10 AM",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping wait, inspect before you leave",
        "Popular with contractors, real estate agents, tradespeople, and local retailers",
      ]}
      faqs={[
        {
          q: "How much do business cards cost in Saskatoon?",
          a: "250 double-sided business cards on 14pt gloss stock are $45 at True Color. 500 cards are $58, 1000 are $75. Single-sided is slightly less. Use the calculator at /products/business-cards to see your exact price.",
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
          a: "Yes, consistently. 250 double-sided cards at Staples or FedEx Office run $60–$80. We're at $45 — same quality, faster local pickup, and an in-house designer who handles the layout for $35 flat.",
        },
        {
          q: "What paper stock options are available for business cards?",
          a: "Our standard is 14pt gloss stock — the most common professional choice. It's thick, holds colour accurately, and has a glossy finish on both sides. Matte finish is available on request. If you want a specialty finish like soft-touch lamination or spot UV, ask when you order and we'll quote it.",
        },
        {
          q: "Can you design and print business cards in one shop in Saskatoon?",
          a: "Yes — True Color has an in-house designer who builds business card layouts from your logo, headshot, and contact info. Standard layout fee is $35. Proof comes back same day on most jobs. Once approved, cards go straight to press — no emailing files between vendors.",
        },
      ]}
    />
  );
}
