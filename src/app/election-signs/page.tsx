import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Election Signs Saskatoon | From $8/sqft | True Color" },
  description:
    "Coroplast election yard signs in Saskatoon and Saskatchewan. Volume pricing from $7.25/sqft (32+ sqft). H-stakes $3 each. Double-sided available. Call (306) 954-8688.",
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
      description="Coroplast election yard signs start at $8/sqft at True Color Display Printing in Saskatoon, Saskatchewan — a standard 24×36 inch campaign sign is $48 single-sided. Campaign timing is everything, and we print election signs in-house on our Roland UV printer with 1–3 business day turnaround. Volume pricing kicks in automatically with no corporate account or broker markup: Tier 2 at 12–32 sqft ($7.50/sqft) and Tier 3 at 32+ sqft ($7.25/sqft) — that's only 10 signs at 24×36 inches to qualify for the best rate. Double-sided coroplast is available for corner lots and high-visibility intersections at $14/sqft single sign, $13.13/sqft at Tier 2, and $12.69/sqft at Tier 3. H-stakes are $3 each for installation on lawns and boulevards. For bulk orders, quantity discounts stack on top of tier pricing: 5+ signs save 8%, 10+ save 17%, 25+ save 23%. The standard election sign size across Saskatchewan is 24×36 inches — visible from the road, fits standard H-stakes, and is large enough for a candidate's name, party colours, and riding information. For smaller residential lawns, 18×24 inch signs at $24 each work well. For high-traffic intersections and building lot corners, 4×8 ft coroplast signs at $232 are impossible to miss. Vehicle magnets for campaign vehicles start at $45 on 30mil stock — rated for highway speeds and removable without damaging paint. Business cards for campaign volunteers and door-knocking teams start at 250 for $40. Flyers for policy platforms and riding-specific messaging are available from $45 for 100 copies on 80lb gloss. Our in-house designer handles layouts from your party logo, candidate photo, and campaign colours for $35 flat with same-day proof. Same-day rush printing is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity. When the writ drops, we can have your first batch of signs ready within 24 hours. True Color ships election signs across Saskatchewan — Saskatoon, Regina, Prince Albert, Moose Jaw, North Battleford, Yorkton, Swift Current, and rural ridings. Local Saskatoon pickup at 216 33rd St W."
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
            automatically — no corporate account, no broker markup. Minimum order is $30.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our Roland UV printer produces consistent, vibrant colour across every sign in your run.
            Tier 3 pricing ($7.25/sqft) applies at 32+ sqft total — that&apos;s only 10 signs at
            24×36&quot;. Double-sided coroplast is available for corner lots and high-visibility
            intersections. H-stakes are $3 each.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            for campaign vehicles start at $45.{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              Business cards
            </Link>{" "}
            for door-knocking teams start at 250 for $40. All materials are weather-resistant
            and UV-stable — they hold colour through a Saskatchewan summer.
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
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 from $40", slug: "business-cards" },
        { name: "Flyers", from: "100 from $45", slug: "flyers" },
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
        {
          q: "How much do vehicle magnets cost for campaign cars in Saskatoon?",
          a: "30mil vehicle magnets start at $45 per magnet at True Color Display Printing. A standard 12×18 inch door magnet is $45–60, a 12×24 inch pair runs $60–80. They're rated for highway speeds and remove cleanly without damaging paint — ideal for campaign vehicles that go back to personal use after election day. Bring your candidate's logo or we design from scratch for $35.",
        },
        {
          q: "Can you print campaign flyers and business cards for door-knocking teams?",
          a: "Yes — 80lb gloss flyers for policy platforms start at 100 for $45 (2-sided, 8.5×11 inch). Business cards for campaign volunteers start at 250 for $40 on 14pt gloss. For larger runs, 1000 flyers are $185 and 1000 business cards are $110. Our in-house designer handles the layout from your party branding for $35 flat with same-day proof.",
        },
      ]}
    />
  );
}
