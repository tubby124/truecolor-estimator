import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Election Signs Saskatoon & Saskatchewan | Volume Coroplast | True Color",
  description:
    "Coroplast election yard signs in Saskatoon and Saskatchewan. Volume pricing from $7.25/sqft (32+ sqft). H-stakes $2.50 each. Double-sided available. Call (306) 954-8688.",
  alternates: { canonical: "/election-signs" },
  openGraph: {
    title: "Election Signs Saskatoon | True Color",
    description:
      "Custom coroplast election signs from $8/sqft. Double-sided available. Same-day rush. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/election-signs",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ElectionSignsPage() {
  return (
    <IndustryPage
      canonicalSlug="election-signs"
      primaryProductSlug="coroplast-signs"
      title="Election Campaign Signs Saskatoon"
      subtitle="Volume pricing. Fast turnaround. No runaround."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Election campaign coroplast yard signs Saskatoon"
      description="Campaign timing is everything. True Color prints coroplast yard signs with volume pricing — no corporate account, no broker markup. Tier 3 pricing kicks in at 32+ sqft, which is just 10 signs at 24×36 in. H-stakes at $2.50 each. Consistent color across every single sign."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Campaign timing is everything — and in Saskatoon and across Saskatchewan, that means
            getting your{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast yard signs
            </Link>{" "}
            printed, staked, and distributed before your opponent does. True Color Display Printing
            handles election sign runs from 10 signs to 500+, with volume pricing that kicks in
            automatically — no corporate account, no broker markup, no minimum spend.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our Roland UV printer produces consistent, vibrant colour across every sign in your run.
            Tier 3 pricing ($7.25/sqft) applies at 32+ sqft total — that&apos;s only 10 signs at
            24×36&quot;. Double-sided coroplast is available for corner lots and high-visibility
            intersections. H-stakes are $2.50 each. Vehicle magnets for campaign vehicles start
            at $45. All materials are weather-resistant and UV-stable —
            they hold colour through a Saskatchewan summer.
          </p>
          <p className="text-gray-600 leading-relaxed">
            When the writ drops, turnaround time matters. Standard is 1–3 business days after
            artwork approval. Need signs immediately?{" "}
            <Link href="/same-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Same-day printing
            </Link>{" "}
            is available for +$40 flat — order before 10 AM, pick up by 5 PM at 216 33rd St W,
            Saskatoon. Call (306) 954-8688 to confirm capacity for large runs.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
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
        {
          q: "What's the best size for election campaign yard signs?",
          a: "24×36\" is the standard election sign size in Saskatoon and Saskatchewan — visible from the road, fits standard H-stakes, and qualifies for volume pricing at 10+ signs. 18×24\" works for residential lots with less road frontage. 4×8 ft is used for high-traffic intersections and lot corners.",
        },
        {
          q: "Can you deliver election signs to other Saskatchewan cities?",
          a: "Yes — True Color Display Printing ships to customers across Saskatchewan. Shipping cost is the customer's responsibility. For large runs going to multiple cities, call (306) 954-8688 to discuss logistics before ordering.",
        },
      ]}
    />
  );
}
