import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Retractable Banners Saskatoon | Stand + Print From $219 | True Color",
  description:
    "Retractable banner stands in Saskatoon from $219 — stand + full-colour print included. Trade shows, events, storefronts. Same-day rush available. Local pickup.",
  alternates: { canonical: "/retractable-banners-saskatoon" },
  openGraph: {
    title: "Retractable Banners Saskatoon | True Color Display Printing",
    description:
      "Retractable banner stands from $219. Stand + full-colour print. Same-day available. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/retractable-banners-saskatoon",
    type: "website",
  },
};

export default function RetractableBannersSaskatoonPage() {
  return (
    <IndustryPage
      title="Retractable Banners Saskatoon"
      subtitle="Stand + full-colour print from $219. Ready for your next trade show or event."
      heroImage="/images/products/product/retractable-stand-600x900.webp"
      heroAlt="Retractable banner stand with full-colour print in Saskatoon by True Color Display Printing"
      description="True Color produces retractable banner stands for Saskatoon trade shows, grand openings, clinics, storefronts, and events. Each unit includes the premium stand hardware and a full-colour Roland UV printed banner — no upselling, no hidden fees. Set up in 30 seconds, packs down to carry under your arm. Replacement graphics are available if your message changes or your banner wears out. Order online, pick up at 216 33rd St W."
      products={[
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Stand + full-colour print included from $219 — no hidden hardware charges",
        "Sets up in 30 seconds — no tools, no assembly — just pull and click",
        "Roland UV full-colour print — sharp at 3 feet or 30 feet",
        "Replacement graphics available — keep your stand, update the message",
        "Popular for trade shows, clinics, real estate open houses, and grand openings",
        "Same-day rush available (+$40 flat) for orders placed before 10 AM",
      ]}
      faqs={[
        {
          q: "How much does a retractable banner stand cost in Saskatoon?",
          a: "Retractable banner stands at True Color start at $219 — that price includes the stand hardware and a full-colour printed banner. Replacement graphics for existing stands are less. Get your exact price at /products/retractable-banners.",
        },
        {
          q: "What is a retractable banner stand?",
          a: "A retractable banner (also called a pull-up banner or roll-up banner) is a portable display stand with a printed graphic that retracts into the base. It sets up in under 30 seconds, requires no tools, and packs into a carry bag about the size of a golf club bag.",
        },
        {
          q: "What size are retractable banners?",
          a: "The most common size is 33×79\" — about 33 inches wide and 6.5 feet tall. This size is visible from across a trade show floor. We also print custom widths. The standard 33\" wide stand is included in the base price.",
        },
        {
          q: "Can I order a replacement graphic for my existing stand?",
          a: "Yes — if your stand is still in good condition, you can order just the replacement graphic for less. Bring your stand in or email us the brand (most stands use the same cassette width). Call (306) 954-8688 to confirm compatibility.",
        },
        {
          q: "How fast can you produce a retractable banner?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is available for +$40 flat if ordered before 10 AM — call to confirm capacity.",
        },
        {
          q: "What file format do you need?",
          a: "PDF at 150 dpi minimum, sized to print dimensions. Vector artwork (AI, EPS) is preferred for logos. Our in-house designer can build the full layout from your logo and content — usually $35–$50.",
        },
      ]}
    />
  );
}
