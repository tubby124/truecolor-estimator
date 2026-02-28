import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Vehicle Magnets Saskatoon | From $24/sqft | True Color Display Printing",
  description:
    "Custom vehicle magnets in Saskatoon from $24/sqft. 30mil thick, full colour, removable and reusable. Same-day rush available. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/vehicle-magnets-saskatoon" },
  openGraph: {
    title: "Vehicle Magnets Saskatoon | True Color Display Printing",
    description:
      "30mil vehicle magnets from $24/sqft. Full colour, removable, reusable. Same-day available. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/vehicle-magnets-saskatoon",
    type: "website",
  },
};

export default function VehicleMagnetsSaskatoonPage() {
  return (
    <IndustryPage
      title="Vehicle Magnets Saskatoon"
      subtitle="From $24/sqft. 30mil thick. Remove them when you want. Keep your resale value."
      heroImage="/images/products/product/vehicle-magnets-800x600.webp"
      heroAlt="Custom vehicle magnets printed in Saskatoon by True Color Display Printing"
      description="True Color prints 30mil vehicle magnets for Saskatoon tradespeople, sales reps, election campaigns, and small businesses. Full-colour Roland UV printing on heavy-gauge magnetic sheeting — bold enough to read from across a parking lot, thick enough to hold in Saskatchewan wind. Unlike a vinyl wrap, magnets come off in 10 seconds and protect your door paint. No permanent commitment, no resale value hit. Order online, get an instant price, pick up at 216 33rd St W."
      products={[
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
      ]}
      whyPoints={[
        "30mil magnetic sheeting — holds at highway speeds on flat metal surfaces",
        "Volume discount: 2+ magnets save 8%, 5+ save 23% — popular for fleet branding",
        "Removable and reusable — no damage to paint, no permanent commitment",
        "Roland UV full-colour print — sharp logos, vivid brand colours, UV-resistant",
        "Election campaigns use magnets to brand campaign vehicles without leasing restrictions",
        "Same-day rush available (+$40 flat) for orders placed before 10 AM",
      ]}
      faqs={[
        {
          q: "How much do vehicle magnets cost in Saskatoon?",
          a: "Vehicle magnets at True Color start at $24/sqft. A standard 12×18\" magnet is 1.5 sqft — about $36. A 18×24\" magnet is 3 sqft — about $72. Volume discounts apply: 2+ magnets save 8%, 5+ save 23%. Use the calculator at /products/vehicle-magnets to get your exact price.",
        },
        {
          q: "Will vehicle magnets damage my car paint?",
          a: "No — 30mil magnets do not damage paint when used correctly. Remove them every few days, clean under them, and don't apply them to a fresh paint job (wait 90 days). They protect the surface underneath from UV exposure.",
        },
        {
          q: "Will they stay on at highway speeds?",
          a: "Yes — 30mil magnets hold reliably on flat metal panels at highway speeds. Curved surfaces (wheel wells, roofs) reduce holding power. Avoid applying to aluminum body panels, fibreglass, or plastic.",
        },
        {
          q: "What size vehicle magnet should I get?",
          a: "12×18\" is the most common for truck doors and is visible at 20 feet. 18×24\" is a step up — visible from across a parking lot. Larger magnets (24×36\") are used on cargo vans. Use the calculator to price any custom size.",
        },
        {
          q: "Can I get same-day vehicle magnets in Saskatoon?",
          a: "Yes — same-day rush is available for an additional $40 flat fee. Order before 10 AM and call (306) 954-8688 to confirm availability. Standard turnaround is 1–3 business days after artwork approval.",
        },
        {
          q: "What file format do you need?",
          a: "PDF or JPG at 150 dpi minimum. Vector files (AI, EPS) are ideal for logos. If you have a low-res file, our in-house designer can clean it up — usually $35–$50.",
        },
      ]}
    />
  );
}
