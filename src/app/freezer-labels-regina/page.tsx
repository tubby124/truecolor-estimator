import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Freezer Labels Regina SK | From $25 | True Color" },
  description:
    "Freezer-grade adhesive labels for Regina butchers, food processors, raw pet food makers. From $25 on 3mil vinyl. Printed in Saskatoon, shipped to Regina.",
  alternates: { canonical: "/freezer-labels-regina" },
  openGraph: {
    title: "Freezer Labels Regina SK | True Color Display Printing",
    description:
      "3mil vinyl with freezer-grade adhesive (ARLPMF7008). Holds at -18°C. Printed in Saskatoon, shipped to Regina. From $25. $25 order minimum.",
    url: "https://truecolorprinting.ca/freezer-labels-regina",
    images: [{ url: "/images/products/og/freezer-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FreezerLabelsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="freezer-labels-regina"
      primaryProductSlug="freezer-labels"
      title="Freezer Labels — Regina SK"
      subtitle="Freezer-grade adhesive labels for Regina food businesses. From $25. Shipped from Saskatoon."
      heroImage="/images/products/heroes/freezer-labels-hero-1200x500.webp"
      heroAlt="Freezer adhesive labels printed for Regina SK food businesses by True Color Display Printing"
      description={
        "Freezer-grade adhesive labels printed in Saskatoon, shipped to Regina 260 km south. From $25 on 3mil vinyl with permanent freezer-grade adhesive (ARLPMF7008) — holds at -18°C through condensation cycles. Built for Regina butchers, food processors, raw pet food makers, ice cream makers, and frozen meal manufacturers. Same Roland TrueVIS VG2 eco-solvent print quality, in-house design ($35 flat), 1–3 business day turnaround. Ground courier adds 1–2 days. Same-day rush at +$40 flat if ordered before 10 AM."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing in Saskatoon prints and ships freezer-grade adhesive
            labels to Regina businesses 260 km south. Standard stock is 3mil white vinyl with
            freezer-grade adhesive (ARLPMF7008) — holds at -18°C through condensation cycles
            and survives Saskatchewan winter ambient temperatures down to -40°C. Pricing from{" "}
            <strong>$25 for 25 labels</strong>. A 3×4&quot; label is $67 for 100; a 10×2&quot; label at
            quantity 500 is $280. Full pricing and material spec on our{" "}
            <Link href="/freezer-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              freezer labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>butcher cut sheets</strong>, raw pet food packaging,
            ice cream tubs, frozen meal containers, cold storage inventory tags. Bundle with{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>
            {" "}or{" "}
            <Link href="/banner-printing-regina" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            for one shipment south.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit artwork at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof for approval. Print runs 1–3 business days after sign-off,
            ground courier 1–2 days to Regina. No print-ready artwork? In-house Photoshop
            designer builds a label layout for $35 flat with same-day proof.
          </p>
        </>
      }
      products={[
        { name: "Freezer Labels", from: "from $25 / 25", slug: "freezer-labels" },
        { name: "Stickers", from: "from $25 / 25", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "3mil vinyl + freezer-grade adhesive (ARLPMF7008) — holds at -18°C through frost cycles",
        "Already shipping this stock to Saskatoon raw pet food makers, butchers, food processors",
        "25 labels from $25 — a 3×4\" label is $67 for 100, $167.50 for 250",
        "$25 order-total minimum — no five-digit MOQ from a label converter",
        "Roland TrueVIS VG2 eco-solvent inks cure to a solid film — print survives freezer-thaw cycles",
        "1–3 business day production + 1–2 business day courier to Regina",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat for label layout, same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order freezer labels shipped to Regina?",
          a: "Submit your artwork at truecolorprinting.ca or call (306) 954-8688. We email a proof for approval. Once confirmed, print in Saskatoon, ground courier to your Regina address. Total: 3–5 business days (1–3 print + 1–2 courier).",
        },
        {
          q: "How much do freezer labels cost shipped to Regina?",
          a: "25 labels start at $25. A 3×4\" freezer label is $67 for 100 and $167.50 for 250; a 4×6\" is $133 for 100. Larger formats price by area — a 10×2\" at quantity 500 is $280. Configure your exact size and quantity on the product page to see the price before ordering. Regina courier is customer's cost.",
        },
        {
          q: "Will the adhesive actually hold in a Regina freezer?",
          a: "Yes — 3mil vinyl with freezer-grade adhesive ARLPMF7008. Built for -18°C and below. Holds through condensation cycles when a freezer door opens in a warm kitchen. Same stock we ship to Saskatoon raw pet food and butcher customers.",
        },
        {
          q: "What's the turnaround for Regina freezer label orders?",
          a: "1–3 business days print + 1–2 business days courier to Regina = 3–5 business days total from artwork approval. Same-day rush (+$40 flat) cuts the print side to same-day if ordered before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Who buys freezer labels in Regina?",
          a: "Butchers and meat processors, raw pet food brands, ice cream makers, frozen dessert producers, frozen meal manufacturers, cold storage operators. Government and food-service kitchens too — anyone running a freezer line in a Regina food business.",
        },
        {
          q: "Can you contour-cut a custom label shape for Regina orders?",
          a: "Yes — rectangle, rounded corner, oval, circle, or custom contour shape. Setup is included in the per-sqft rate; no separate die charge. Kiss-cut sheets and perfed tear-off lot codes available.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "freezer-labels-saskatoon" },
        { name: "Moose Jaw", slug: "freezer-labels-moose-jaw-sk" },
        { name: "Prince Albert", slug: "freezer-labels-prince-albert-sk" },
      ]}
    />
  );
}
