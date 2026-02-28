import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Coroplast Signs Saskatoon | From $8/sqft | True Color Display Printing",
  description:
    "Custom coroplast yard signs in Saskatoon from $8/sqft. Yard signs, job site signs, real estate signs. Same-day available. Local pickup at 216 33rd St W. In-house designer.",
  alternates: { canonical: "/coroplast-signs-saskatoon" },
  openGraph: {
    title: "Coroplast Signs Saskatoon | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft. Job site, real estate, and election signs. Same-day available. Saskatoon local pickup.",
    url: "https://truecolorprinting.ca/coroplast-signs-saskatoon",
    type: "website",
  },
};

export default function CoroplastSignsSaskatoonPage() {
  return (
    <IndustryPage
      title="Coroplast Signs Saskatoon"
      subtitle="From $8/sqft. Same-day available. Pick up at 216 33rd St W."
      heroImage="/images/products/product/coroplast-yard-sign-800x600.webp"
      heroAlt="Coroplast yard signs printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing is Saskatoon's go-to shop for coroplast signs. Whether you need 1 yard sign or 500 job site signs, we print in-house on our Roland UV printer and have them ready in 1–3 business days — same day for rush orders placed before 10 AM. Prices start at $8/sqft with volume discounts at 8+ sqft (8% off) and 17+ sqft (17% off). H-stakes at $2.50 each."
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Prices from $8/sqft — volume discount at 8+ sqft (8% off) and 17+ sqft (17% off)",
        "H-stakes at $2.50 each — bundled with any coroplast order",
        "Roland UV print — weatherproof, UV-resistant, 2–3 year outdoor lifespan",
        "Double-sided coroplast available for corner lots and high-traffic placement",
        "In-house designer at 216 33rd St W — bring a sketch, a low-res logo, or a Word doc",
        "Same-day rush available (+$40 flat) when ordered before 10 AM — call to confirm",
      ]}
      faqs={[
        {
          q: "How much does a coroplast sign cost in Saskatoon?",
          a: "Coroplast signs at True Color start at $8/sqft for single-sided printing. An 18×24\" sign is about 3 sqft ($24). A 24×36\" sign is 6 sqft ($48). Volume discounts apply at 8+ sqft (8% off) and 17+ sqft (17% off). H-stakes are $2.50 each.",
        },
        {
          q: "How long do coroplast yard signs last outdoors?",
          a: "2–3 years in Saskatchewan conditions. Our Roland UV ink is UV-resistant and waterproof. Signs survive freeze-thaw cycles, high winds, and rain without peeling or fading.",
        },
        {
          q: "Can I get same-day coroplast signs in Saskatoon?",
          a: "Yes — same-day rush is available for an additional $40 flat fee. Order before 10 AM and call us at (306) 954-8688 to confirm capacity. Standard turnaround is 1–3 business days after artwork approval.",
        },
        {
          q: "What sizes do you print?",
          a: "Any custom size up to 4×8 ft. Most popular sizes: 18×24\", 24×36\", 24×48\", and 4×8 ft. Use the pricing calculator at /products/coroplast-signs to get your exact price in 30 seconds.",
        },
        {
          q: "Do you print double-sided coroplast signs?",
          a: "Yes — double-sided coroplast is approximately 50% more than single-sided. Great for corner lots, election signs, and high-traffic intersections where both sides get seen.",
        },
        {
          q: "What file format do you need?",
          a: "PDF or JPG at 150 dpi minimum. If you only have a Word doc or phone photo, our in-house designer can prep it for print — typically $35–$50 depending on complexity.",
        },
      ]}
    />
  );
}
