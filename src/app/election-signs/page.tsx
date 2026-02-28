import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Election Signs Saskatoon & Saskatchewan | Volume Coroplast | True Color",
  description:
    "Coroplast election yard signs in Saskatoon and Saskatchewan. Volume pricing from $7.25/sqft (32+ sqft). H-stakes $2.50 each. Double-sided available. Call (306) 954-8688.",
  alternates: { canonical: "/election-signs" },
};

export default function ElectionSignsPage() {
  return (
    <IndustryPage
      title="Election Campaign Signs Saskatoon"
      subtitle="Volume pricing. Fast turnaround. No runaround."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Election campaign coroplast yard signs Saskatoon"
      description="Campaign timing is everything. True Color prints coroplast yard signs with volume pricing — no corporate account, no broker markup. Tier 3 pricing kicks in at 32+ sqft, which is just 10 signs at 24×36 in. H-stakes at $2.50 each. Consistent color across every single sign."
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $60", slug: "acp-aluminum-signs" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "Volume discount at 32+ sqft — 10 signs of 24×36\" qualifies for $7.25/sqft",
        "Double-sided coroplast for corner placement — maximum visibility",
        "H-stakes at $2.50 each, bundled pricing available",
        "Consistent Roland UV color across 10, 100, or 500 signs",
        "Vehicle magnets from $45 — campaign vehicle branding without commitment",
      ]}
      faqs={[
        {
          q: "How do I qualify for volume pricing?",
          a: "Tier 3 pricing ($7.25/sqft on coroplast) kicks in at 32+ sqft total. That's 10 signs at 24×36\" or about 21 signs at 18×24\". It's per order, not per sign count.",
        },
        {
          q: "Can you do double-sided signs?",
          a: "Yes — double-sided coroplast is available. Price is approximately 50% more than single-sided. Great for corner lots and high-traffic intersections.",
        },
        {
          q: "How fast can you print 200 signs?",
          a: "200 signs typically takes 3–5 business days. Rush is available for +$40 flat on the order — call us at (306) 954-8688 to confirm capacity.",
        },
        {
          q: "What file format do you need?",
          a: "PDF or JPG at 150 dpi minimum. If you only have a Word doc or low-res image, our in-house designer can prep it for print — usually $35–$50.",
        },
      ]}
    />
  );
}
