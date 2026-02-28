import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Banner Printing Saskatoon | Vinyl Banners from $8.25/sqft | True Color",
  description:
    "Custom vinyl banner printing in Saskatoon from $8.25/sqft. Any size, grommets included. Events, storefronts, trade shows. Same-day rush available. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/banner-printing-saskatoon" },
  openGraph: {
    title: "Banner Printing Saskatoon | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft in Saskatoon. Any size, grommets included, same-day rush available.",
    url: "https://truecolorprinting.ca/banner-printing-saskatoon",
    type: "website",
  },
};

export default function BannerPrintingSaskatoonPage() {
  return (
    <IndustryPage
      title="Banner Printing Saskatoon"
      subtitle="13oz vinyl banners from $8.25/sqft. Any size. Grommets included. Same-day rush available."
      heroImage="/images/products/product/banner-vinyl-colorful-800x600.webp"
      heroAlt="Vinyl banner printing in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces 13oz vinyl banners for Saskatoon businesses, events, and organizations. Any custom size, full colour, grommets included as standard. Volume pricing applies automatically — 5% off at 5+ sqft, 10% off at 10+ sqft, 15% off at 15+ sqft. We print in-house on our Roland UV printer, which means faster turnaround and colour consistency you can rely on. Same-day rush available for +$40 flat."
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "13oz scrim vinyl — outdoor-rated, wind-resistant, no curling or peeling",
        "Grommets included as standard every 2 ft — no extra charge",
        "Volume discount: 5% off at 5+ sqft, 10% off at 10+ sqft, 15% off at 15+ sqft",
        "Any custom size up to 4 ft wide by any length (split-panel for wider prints)",
        "Same-day rush for +$40 flat when ordered before 10 AM — call to confirm",
        "In-house Roland UV printer — we control colour and timeline, no outsourcing",
      ]}
      faqs={[
        {
          q: "How much does banner printing cost in Saskatoon?",
          a: "Vinyl banners at True Color start at $8.25/sqft. A 2×6 ft banner is $90. A 3×8 ft banner is $178. Volume discounts: 5% off at 5+ sqft, 10% at 10+, 15% at 15+. Use the calculator at /products/vinyl-banners to get your exact price.",
        },
        {
          q: "What's included in the banner price?",
          a: "Full-colour printing on 13oz vinyl and grommets every 2 ft are included as standard. Hemming is included. Pole pockets are available on request — mention it in your order notes.",
        },
        {
          q: "How long does banner printing take in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is available for +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm capacity.",
        },
        {
          q: "What's the maximum banner size you print?",
          a: "Standard roll width is 4 ft. For banners wider than 4 ft, we can print in panels and stitch them together. There's no practical length limit. Most event banners are 2–3 ft high by 4–10 ft wide.",
        },
        {
          q: "Can I get a retractable banner stand?",
          a: "Yes — a retractable banner stand with full-colour printing starts at $219. Popular for trade shows, events, and in-store displays. Standard banner stands take a 33×79\" print.",
        },
        {
          q: "What file format do you need for banners?",
          a: "PDF at 150 dpi minimum (at print size). JPG files are accepted for simpler designs. If you have a low-res logo or rough layout, our in-house designer can prep it for $35–$50.",
        },
      ]}
    />
  );
}
