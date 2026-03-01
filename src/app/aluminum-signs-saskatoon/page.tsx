import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Aluminum Signs Saskatoon | ACP Signs From $13/sqft | True Color",
  description:
    "3mm aluminum composite (ACP) signs in Saskatoon from $13/sqft. 10+ year outdoor lifespan. Professional building signs, site signs, and directories. Local pickup.",
  alternates: { canonical: "/aluminum-signs-saskatoon" },
  openGraph: {
    title: "Aluminum Signs Saskatoon | True Color Display Printing",
    description:
      "ACP aluminum signs from $13/sqft. 3mm composite, 10+ year outdoor lifespan. Same-day available. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/aluminum-signs-saskatoon",
    type: "website",
  },
};

export default function AluminumSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="aluminum-signs-saskatoon"
      primaryProductSlug="acp-signs"
      title="Aluminum Signs Saskatoon"
      subtitle="ACP from $13/sqft. 10+ year outdoor lifespan. Professional and permanent."
      heroImage="/images/products/product/acp-aluminum-sign-800x600.webp"
      heroAlt="3mm aluminum composite ACP signs printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces 3mm aluminum composite (ACP) signs for Saskatoon businesses that need something that lasts. ACP is the go-to material for building directories, commercial real estate signs, permanent site signs, and branded exterior signage. Unlike coroplast, ACP does not bend, warp, fade, or flex. Roland UV ink is printed directly to the panel surface — sharp edges, vivid colour, no lamination needed. Prices start at $13/sqft with volume discounts at 8+ sqft (15% off) and 17+ sqft (23% off). Order online and get an exact price in 30 seconds."
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "3mm aluminum composite — rigid, flat, and weatherproof for 10+ years outdoors",
        "Prices from $13/sqft — volume discounts at 8+ sqft (15% off) and 17+ sqft (23% off)",
        "Roland UV print directly on panel — no lamination peeling, no fade",
        "Single-sided and double-sided available — ideal for freestanding sign frames",
        "Professional finish for building directories, real estate, and construction sites",
        "Same-day rush (+$40 flat) when ordered before 10 AM — call to confirm",
      ]}
      faqs={[
        {
          q: "How much do aluminum signs cost in Saskatoon?",
          a: "ACP aluminum composite signs start at $13/sqft at True Color. An 18×24\" sign is 3 sqft — about $39. A 24×36\" sign is 6 sqft — about $78. Volume discounts kick in at 8+ sqft (15% off) and 17+ sqft (23% off). Get your exact price at /products/acp-signs.",
        },
        {
          q: "What is ACP aluminum composite?",
          a: "ACP (aluminum composite panel) is a 3mm rigid panel made of two thin aluminum sheets bonded to a polyethylene core. It's flat, lightweight, and extremely rigid — the standard material for commercial building signs, directory boards, and permanent outdoor signage.",
        },
        {
          q: "How long do aluminum signs last outdoors in Saskatchewan?",
          a: "10+ years under normal Saskatchewan conditions. ACP does not rust, warp, or flex. Roland UV ink is UV-resistant and waterproof. The panels handle freeze-thaw cycles and high UV exposure without fading or delaminating.",
        },
        {
          q: "What's the difference between ACP and coroplast for outdoor signs?",
          a: "Coroplast is corrugated plastic — lightweight and affordable for temporary signs (1–3 years outdoors). ACP is rigid aluminum composite — permanent, flat, and professional-looking for 10+ years. Use coroplast for seasonal and campaign signs; use ACP for building signs, directories, and permanent installations.",
        },
        {
          q: "Can I get double-sided aluminum signs?",
          a: "Yes — double-sided ACP is available for freestanding sign frames and post-mounted installations. Price is approximately 50% more than single-sided. Call (306) 954-8688 for a custom quote on mounted or framed installations.",
        },
        {
          q: "What file format do I need for aluminum signs?",
          a: "PDF or JPG at 150 dpi minimum. Vector files (AI, EPS) are preferred for logos and text-heavy designs. Our in-house designer can clean up or recreate artwork — usually $35–$50 depending on complexity.",
        },
      ]}
    />
  );
}
