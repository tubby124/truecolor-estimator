import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Candle & Jar Labels Prince Albert SK | From $5.50/sqft | True Color" },
  description:
    "Heat-resistant candle labels and mason jar labels for Prince Albert candle makers, jam canners, artisan crafters. From $5.50/sqft. Courier to PA.",
  alternates: { canonical: "/candle-jar-labels-prince-albert-sk" },
  openGraph: {
    title: "Candle & Jar Labels Prince Albert SK | True Color Display Printing",
    description:
      "Heat-resistant labels for candles, mason jars, jam jars. From $5.50/sqft. Printed in Saskatoon, couriered to Prince Albert.",
    url: "https://truecolorprinting.ca/candle-jar-labels-prince-albert-sk",
    images: [{ url: "/images/products/og/candle-jar-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CandleJarLabelsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="candle-jar-labels-prince-albert-sk"
      primaryProductSlug="stickers"
      title="Candle & Jar Labels — Prince Albert SK"
      subtitle="Heat-resistant labels for PA candle makers, jam canners, artisan crafters. From $5.50/sqft."
      heroImage="/images/products/heroes/candle-jar-labels-hero-1200x500.webp"
      heroAlt="Heat-resistant candle and mason-jar labels printed for Prince Albert SK crafters by True Color Display Printing"
      description={
        "Custom heat-resistant candle labels and mason-jar labels printed in Saskatoon, couriered to Prince Albert 140 km north. From $5.50/sqft on matte BOPP vinyl with heat-resistant adhesive — bonds to warm glass after hot-wax pour, no curling near the flame, no yellowing over long burns. Built for PA soy and beeswax candle makers, Saskatoon-berry jam canners, indigenous-craft fragrance brands, and farmers market vendors. Saskatoon-to-PA courier is one of our fastest lanes."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints heat-resistant candle and mason-jar labels at
            our Saskatoon shop and couriers to Prince Albert 140 km north. Standard stock is
            matte BOPP vinyl with heat-resistant adhesive — bonds to warm glass without
            bubbling and survives long candle burns without yellowing. Pricing from{" "}
            <strong>$5.50/sqft</strong> with a $25 small-order minimum at checkout charge. Full spec on our{" "}
            <Link href="/candle-jar-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              candle &amp; jar labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common PA use cases: <strong>soy candle wrap-around labels</strong>, mason jar
            lid labels for Saskatoon-berry jam and preserves, indigenous-craft fragrance
            brands featuring traditional ingredients (sweetgrass, sage, birch), and small
            farmers market vendor batches. The Saskatoon-to-Prince-Albert courier corridor
            runs fast — typically next-day.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. Print 1–3 business days + courier 1 day = 2–4 business day total. Bundle
            with{" "}
            <Link href="/business-cards-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for one shipment.
          </p>
        </>
      }
      products={[
        { name: "Candle & Jar Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Heat-resistant adhesive — bonds to warm glass after hot-wax pour without bubbling",
        "Matte BOPP face survives 40+ hour candle burn without yellowing",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4)",
        "$30 minimum charge — perfect for small startup and indigenous-craft batches",
        "Wrap-around bodies, top-of-lid circles, side ingredient panels — any shape included",
        "1–3 business day print + 1 business day courier to Prince Albert",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order candle and jar labels shipped to Prince Albert?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to PA. Total: 2–4 business days from artwork approval.",
        },
        {
          q: "How much do candle labels cost shipped to Prince Albert?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" wrap-around at quantity 250 runs about $200.",
        },
        {
          q: "Will the label survive a candle burn without yellowing?",
          a: "Yes — matte BOPP vinyl is built for it. Doesn't yellow under sustained heat during 40+ hour burns. Heat-resistant adhesive doesn't release as the wax heats and cools.",
        },
        {
          q: "Can you do mason jar lid labels for PA jam canners?",
          a: "Yes — circular top-of-lid labels in 1.5\", 2\", 2.5\" diameter to fit standard mason jar lids. Common for Saskatoon-berry jam, wild-rosehip preserves, and other northern artisan canning. Paired with side ingredient panels.",
        },
        {
          q: "Do you print labels for indigenous-craft fragrance brands in PA?",
          a: "Yes — indigenous-craft home-fragrance brands featuring sweetgrass, sage, birch, and other traditional ingredients are a regular PA print job. Matte BOPP keeps the natural-craft aesthetic; contour cutting available for unique shapes.",
        },
        {
          q: "What's the turnaround for PA candle label orders?",
          a: "1–3 business days print + 1 business day courier = 2–4 business days total. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "candle-jar-labels-saskatoon" },
        { name: "Regina", slug: "candle-jar-labels-regina" },
        { name: "Moose Jaw", slug: "candle-jar-labels-moose-jaw-sk" },
      ]}
    />
  );
}
