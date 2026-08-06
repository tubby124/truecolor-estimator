import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Candle & Jar Labels Moose Jaw SK | From $25 | True Color" },
  description:
    "Heat-resistant candle labels and mason jar labels for Moose Jaw candle crafters and farmers market canners. From $25. Shipped from Saskatoon.",
  alternates: { canonical: "/candle-jar-labels-moose-jaw-sk" },
  openGraph: {
    title: "Candle & Jar Labels Moose Jaw SK | True Color Display Printing",
    description:
      "Heat-resistant labels for candles, mason jars. From $25. Printed in Saskatoon, shipped to Moose Jaw.",
    url: "https://truecolorprinting.ca/candle-jar-labels-moose-jaw-sk",
    images: [{ url: "/images/products/og/candle-jar-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CandleJarLabelsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="candle-jar-labels-moose-jaw-sk"
      primaryProductSlug="candle-jar-labels"
      title="Candle & Jar Labels — Moose Jaw SK"
      subtitle="Heat-resistant labels for Moose Jaw candle crafters, jam jars, mason-jar canners. From $25."
      heroImage="/images/products/heroes/candle-jar-labels-hero-1200x500.webp"
      heroAlt="Heat-resistant candle and mason-jar labels printed for Moose Jaw SK crafters by True Color Display Printing"
      description={
        "Custom heat-resistant candle labels and mason-jar labels printed in Saskatoon, shipped to Moose Jaw 240 km south. From $25 on matte BOPP vinyl with heat-resistant adhesive. Built for Moose Jaw soy candle crafters, beeswax candle makers, farmers market jam canners, and home-fragrance brands. No bubbling on warm glass, no curling near the flame, no yellowing over a long burn. Same Roland TrueVIS VG2 eco-solvent print quality, in-house design ($35 flat), 1–3 business day turnaround. Ground courier 1–2 days."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints heat-resistant candle and mason-jar labels at
            our Saskatoon shop and ships to Moose Jaw 240 km south. Standard stock is matte
            BOPP vinyl with heat-resistant adhesive — bonds to warm glass without bubbling and
            survives long candle burns without yellowing. Pricing from{" "}
            <strong>$25 for 25 labels</strong> — a 2.5×3.5&quot; jar label is $55 for 100 and $122.50 for 250. Full spec on our{" "}
            <Link href="/candle-jar-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              candle &amp; jar labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Moose Jaw use cases: <strong>soy candle wrap-around labels</strong>, mason
            jar lid labels for farmers market jam and preserves canners, jar-side ingredient
            panels, and home-fragrance brand packaging. Bundle with{" "}
            <Link href="/business-cards-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for one shipment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof. Print 1–3 business days + courier 1–2 days. In-house
            Photoshop designer builds label layouts for $35 flat with same-day proof.
          </p>
        </>
      }
      products={[
        { name: "Candle & Jar Labels", from: "from $25 / 25", slug: "candle-jar-labels" },
        { name: "Product Labels", from: "from $25 / 25", slug: "product-labels" },
        { name: "Stickers", from: "from $25 / 25", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Heat-resistant adhesive — bonds to warm glass after hot-wax pour without bubbling",
        "Matte BOPP face survives 40+ hour candle burn without yellowing or curling",
        "25 labels from $25 — a 2.5×3.5\" jar label is $55 for 100, $122.50 for 250",
        "$25 order-total minimum — perfect for small home-fragrance test batches",
        "Wrap-around bodies, top-of-lid circles, side ingredient panels — any shape included",
        "1–3 business day print + 1–2 day courier to Moose Jaw",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order candle and jar labels shipped to Moose Jaw?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Moose Jaw. Total: 3–5 business days from approval.",
        },
        {
          q: "How much do candle labels cost shipped to Moose Jaw?",
          a: "25 labels start at $25. A 2.5×3.5\" jar label is $55 for 100 and $122.50 for 250; a 3×4\" is $67 for 100 and $167.50 for 250. A full 2.5×8\" mason jar wraparound is $1.11 each at any quantity, because a label that size prices by area rather than by the small-label quantity ladder.",
        },
        {
          q: "Will the label survive a candle burn without yellowing?",
          a: "Yes — matte BOPP vinyl is built for it. Doesn't yellow under sustained heat during 40+ hour burns. Heat-resistant adhesive doesn't release as wax heats and cools. Roland TrueVIS VG2 eco-solvent ink stays vivid.",
        },
        {
          q: "Can you do mason jar lid labels for Moose Jaw jam canners?",
          a: "Yes — circular top-of-lid labels in 1.5\", 2\", 2.5\" diameter to fit standard mason jar lids. Paired with rectangular side ingredient panels for a complete farmers market canning look.",
        },
        {
          q: "What's the turnaround for Moose Jaw candle label orders?",
          a: "1–3 business days print + 1–2 business days courier = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM.",
        },
        {
          q: "Can you do a small first batch for a Moose Jaw startup candle brand?",
          a: "Yes — $25 order-total minimum covers small format jobs. No five-digit MOQ. Start with 50–100 labels for a farmers market test, scale up later.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "candle-jar-labels-saskatoon" },
        { name: "Regina", slug: "candle-jar-labels-regina" },
        { name: "Prince Albert", slug: "candle-jar-labels-prince-albert-sk" },
      ]}
    />
  );
}
