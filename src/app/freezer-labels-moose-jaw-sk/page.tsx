import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Freezer Labels Moose Jaw | From $5.50/sqft | True Color" },
  description:
    "Freezer-grade adhesive labels for Moose Jaw butchers, breweries, ranches. From $5.50/sqft on 3mil vinyl. Printed in Saskatoon, shipped to Moose Jaw.",
  alternates: { canonical: "/freezer-labels-moose-jaw-sk" },
  openGraph: {
    title: "Freezer Labels Moose Jaw SK | True Color Display Printing",
    description:
      "3mil vinyl with freezer-grade adhesive (ARLPMF7008). Holds at -18°C. Printed in Saskatoon, shipped to Moose Jaw. From $5.50/sqft.",
    url: "https://truecolorprinting.ca/freezer-labels-moose-jaw-sk",
    images: [{ url: "/images/products/og/freezer-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FreezerLabelsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="freezer-labels-moose-jaw-sk"
      primaryProductSlug="stickers"
      title="Freezer Labels — Moose Jaw SK"
      subtitle="Freezer-grade adhesive labels for Moose Jaw food businesses. From $5.50/sqft. Shipped from Saskatoon."
      heroImage="/images/products/heroes/freezer-labels-hero-1200x500.webp"
      heroAlt="Freezer adhesive labels printed for Moose Jaw SK food businesses by True Color Display Printing"
      description={
        "Freezer-grade adhesive labels printed in Saskatoon, shipped to Moose Jaw 240 km south. From $5.50/sqft on 3mil vinyl with permanent freezer-grade adhesive (ARLPMF7008). Built for Moose Jaw butchers, brewers, distilleries, ranches with on-site processing, and smaller food makers selling at the farmers market. Same in-house Roland UV print quality and 1–3 business day turnaround. Ground courier 1–2 business days. Same-day rush at +$40 flat if ordered before 10 AM."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints freezer-grade adhesive labels at our Saskatoon
            shop and ships to Moose Jaw 240 km south. Stock is 3mil white vinyl with
            freezer-grade adhesive (ARLPMF7008) — holds at -18°C through condensation cycles.
            Pricing from <strong>$5.50/sqft</strong> with a $25 small-order minimum at checkout charge. Full pricing
            tiers and material spec on our{" "}
            <Link href="/freezer-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              freezer labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Moose Jaw food businesses we&apos;ve printed for: <strong>local butchers</strong>,
            ranches with on-farm freezer storage, brewers running cold-conditioning tanks,
            distilleries, and farmers market vendors who need freezer-safe labels for
            take-home meals. Roll label quantities for production lines available — see our{" "}
            <Link href="/roll-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              roll labels
            </Link>{" "}
            page.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. Email proof for approval. Print 1–3 business days + courier 1–2 days to
            Moose Jaw. Bundle freezer labels with{" "}
            <Link href="/banner-printing-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            for one shipment.
          </p>
        </>
      }
      products={[
        { name: "Freezer Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "3mil vinyl + freezer-grade adhesive (ARLPMF7008) — holds at -18°C through frost cycles",
        "Already shipping this stock to Saskatoon raw pet food makers and butchers",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4 at 100+ sqft)",
        "$30 minimum charge — no MOQ from a label converter",
        "Roland UV inks cure to a solid film — survives freezer-thaw cycles",
        "1–3 business day print + 1–2 day courier to Moose Jaw",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat for label layout",
      ]}
      faqs={[
        {
          q: "How do I order freezer labels shipped to Moose Jaw?",
          a: "Submit artwork at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Moose Jaw. Total: 3–5 business days from approval.",
        },
        {
          q: "How much do freezer labels cost shipped to Moose Jaw?",
          a: "Sqft-tiered: $5.50/sqft (T1), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 10×2\" label at quantity 500 runs about $300. Moose Jaw courier is customer's cost.",
        },
        {
          q: "Will the adhesive hold in a Moose Jaw freezer?",
          a: "Yes — 3mil vinyl with freezer-grade ARLPMF7008 adhesive. Holds at -18°C and below. Same stock running in Saskatoon raw pet food and butcher operations.",
        },
        {
          q: "What's the turnaround for Moose Jaw freezer label orders?",
          a: "1–3 business days print + 1–2 business days courier = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Who orders freezer labels in Moose Jaw?",
          a: "Local butchers, ranches with on-farm freezer storage, brewers and distilleries running cold-conditioning tanks, farmers market vendors selling take-home frozen meals, ice cream and frozen dessert makers.",
        },
        {
          q: "Can you do a small first run for a Moose Jaw startup?",
          a: "Yes — $30 minimum charge covers small format jobs (2–4 sqft total label area). No five-digit MOQ. Start with 100–250 labels and scale up later.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "freezer-labels-saskatoon" },
        { name: "Regina", slug: "freezer-labels-regina" },
        { name: "Prince Albert", slug: "freezer-labels-prince-albert-sk" },
      ]}
    />
  );
}
