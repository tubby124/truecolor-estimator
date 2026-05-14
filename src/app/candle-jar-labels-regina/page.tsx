import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Candle & Jar Labels Regina SK | From $5.50/sqft | True Color" },
  description:
    "Heat-resistant candle labels and mason jar labels for Regina candle makers and crafters. From $5.50/sqft. Printed in Saskatoon, shipped to Regina.",
  alternates: { canonical: "/candle-jar-labels-regina" },
  openGraph: {
    title: "Candle & Jar Labels Regina SK | True Color Display Printing",
    description:
      "Heat-resistant labels for candles, mason jars, jam jars. From $5.50/sqft. Printed in Saskatoon, shipped to Regina. No curling near the flame.",
    url: "https://truecolorprinting.ca/candle-jar-labels-regina",
    images: [{ url: "/images/products/og/candle-jar-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CandleJarLabelsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="candle-jar-labels-regina"
      primaryProductSlug="stickers"
      title="Candle & Jar Labels — Regina SK"
      subtitle="Heat-resistant labels for Regina candle makers, jam jars, mason-jar crafters. From $5.50/sqft."
      heroImage="/images/products/heroes/candle-jar-labels-hero-1200x500.webp"
      heroAlt="Heat-resistant candle and mason-jar labels printed for Regina SK crafters by True Color Display Printing"
      description={
        "Custom heat-resistant candle labels and mason-jar labels printed in Saskatoon, shipped to Regina 260 km south. From $5.50/sqft on matte BOPP vinyl with heat-resistant adhesive — bonds to warm glass after hot-wax pour, no bubbling, no curling near the flame, no yellowing over a 40+ hour burn. Built for Regina home-fragrance brands, soy and beeswax candle makers, artisan jam and preserve canners, and farmers market vendors. In-house design ($35 flat), 1–3 business day turnaround. Ground courier adds 1–2 days."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints heat-resistant candle and mason-jar labels at
            our Saskatoon shop and ships to Regina businesses 260 km south. Standard stock is{" "}
            <strong>matte BOPP vinyl with heat-resistant adhesive</strong> — bonds to the
            warm glass surface immediately after a hot-wax pour without bubbling, and survives
            a 40+ hour candle burn without yellowing or curling near the flame. Pricing from{" "}
            <strong>$5.50/sqft</strong> with a $30 minimum charge. Full spec on our{" "}
            <Link href="/candle-jar-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              candle &amp; jar labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>soy and beeswax candle wrap-around labels</strong>,
            mason jar top-of-lid labels for artisan jam and preserve canners, jar-side
            ingredient panels, and home-fragrance brand packaging. Bundle with{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for one shipment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof. Print 1–3 business days + courier 1–2 days to Regina.
            In-house Photoshop designer builds label layouts for $35 flat with same-day
            proof — fragrance names, burn-time spec, ingredient panels, batch codes
            included.
          </p>
        </>
      }
      products={[
        { name: "Candle & Jar Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Heat-resistant adhesive — bonds to warm glass after hot-wax pour without bubbling",
        "Matte BOPP face survives 40+ hour candle burn without yellowing or curling",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4 at 100+ sqft)",
        "$30 minimum charge — perfect for small home-fragrance startup batches",
        "Wrap-around bodies, top-of-lid circles, side ingredient panels — any shape included",
        "1–3 business day print + 1–2 day courier to Regina",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order candle and jar labels shipped to Regina?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Regina. Total: 3–5 business days from artwork approval.",
        },
        {
          q: "How much do candle labels cost shipped to Regina?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" wrap-around candle label at quantity 250 runs about $200. Regina courier is customer's cost.",
        },
        {
          q: "Will the label survive a candle burn without yellowing?",
          a: "Yes — matte BOPP vinyl is the standard for candle labels. The face material doesn't yellow under sustained heat exposure during a 40+ hour burn, and the heat-resistant adhesive doesn't release as the wax heats and cools. Roland UV ink cures to a solid film so the colours stay vivid.",
        },
        {
          q: "Will the adhesive bond to a freshly-poured warm candle jar?",
          a: "Yes — that's exactly what the heat-resistant adhesive is built for. Most candle makers apply labels minutes after the hot-wax pour while the glass is still warm to the touch. The adhesive bonds immediately without bubbling.",
        },
        {
          q: "What's the turnaround for Regina candle label orders?",
          a: "1–3 business days print + 1–2 business days courier = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Can you do mason jar lid labels for Regina jam canners?",
          a: "Yes — circular top-of-lid labels are a common print job. Standard sizes 1.5\", 2\", 2.5\" diameter to fit standard mason jar lids. Paired with side ingredient panels (rectangular or wrap-around) for a complete artisan-canning look.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "candle-jar-labels-saskatoon" },
        { name: "Moose Jaw", slug: "candle-jar-labels-moose-jaw-sk" },
        { name: "Prince Albert", slug: "candle-jar-labels-prince-albert-sk" },
      ]}
    />
  );
}
