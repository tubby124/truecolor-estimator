import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Product Labels Regina SK | From $5.50/sqft | True Color" },
  description:
    "Retail product labels for Regina artisan food, beverage, packaged goods. From $5.50/sqft. Gloss, matte, soft-touch. Printed in Saskatoon, shipped to Regina.",
  alternates: { canonical: "/product-labels-regina" },
  openGraph: {
    title: "Product Labels Regina SK | True Color Display Printing",
    description:
      "Full-colour retail product labels. Gloss, matte, or soft-touch. From $5.50/sqft. Printed in Saskatoon, shipped to Regina.",
    url: "https://truecolorprinting.ca/product-labels-regina",
    images: [{ url: "/images/products/og/product-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ProductLabelsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="product-labels-regina"
      primaryProductSlug="stickers"
      title="Product Labels — Regina SK"
      subtitle="Retail product labels for Regina food, beverage, packaged-goods brands. From $5.50/sqft."
      heroImage="/images/products/heroes/product-labels-hero-1200x500.webp"
      heroAlt="Retail product labels printed for Regina SK artisan brands by True Color Display Printing"
      description={
        "Custom retail product labels printed in Saskatoon, shipped to Regina 260 km south. From $5.50/sqft on 3mil vinyl — gloss, matte, or soft-touch finish. Built for Regina artisan food brands, craft beverages, packaged goods, soap and candle makers, and any SaskMade product going on a retail shelf. Contour-cut to any shape, no die fee. Same Roland UV print quality, in-house design ($35 flat), 1–3 business day turnaround. Ground courier adds 1–2 days."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints custom retail product labels at our Saskatoon
            shop and ships to Regina businesses 260 km south. Stock options include 3mil
            white vinyl in gloss, matte, or soft-touch finish. Pricing from{" "}
            <strong>$5.50/sqft</strong> with a $25 small-order minimum at checkout charge. Full pricing tiers and
            material spec on our{" "}
            <Link href="/product-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              product labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>SaskMade artisan food</strong> (jams, honey, hot
            sauces, granola), craft beverages (kombucha, sodas, cold-brew coffee), packaged
            goods sold at Regina Farmers&apos; Market and indie retail. Contour cutting to any
            shape is included in the sqft rate. Add{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            or{" "}
            <Link href="/flyer-printing-regina" className="text-[#16C2F3] underline font-medium">
              flyers
            </Link>{" "}
            for a complete retail launch package.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof for approval. Print 1–3 business days + courier 1–2 days.
            No print-ready artwork? In-house Photoshop designer builds label layouts for $35
            flat with same-day proof.
          </p>
        </>
      }
      products={[
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
        { name: "Brochures", from: "100 for $99", slug: "brochures" },
      ]}
      whyPoints={[
        "Gloss, matte, or soft-touch 3mil vinyl — finish choice matches your brand",
        "Contour-cut to any shape — rectangle, oval, circle, custom die — setup included",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4 at 100+ sqft)",
        "$30 minimum charge — no five-digit MOQ",
        "Waterproof BOPP option available for beverage labels and bath products",
        "1–3 business day print + 1–2 day courier to Regina",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order product labels shipped to Regina?",
          a: "Submit artwork at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, courier to Regina. Total: 3–5 business days from artwork approval.",
        },
        {
          q: "How much do product labels cost shipped to Regina?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. Anchor: a 3×4\" label at quantity 500 runs about $300. Regina courier is customer's cost.",
        },
        {
          q: "What finishes do you offer for Regina product labels?",
          a: "Three standard finishes on 3mil vinyl: gloss (high-shine, common for beverages), matte (soft, common for artisan food and natural beauty), soft-touch (premium feel, common for high-end packaging). All three same per-sqft rate. Waterproof BOPP is an option for ice-bath beverages or bath products.",
        },
        {
          q: "Can you contour-cut Regina product labels to a custom shape?",
          a: "Yes — rectangle, rounded corner, oval, circle, or custom die shape (e.g., brand silhouette). Setup included in the sqft rate; no separate die charge. Kiss-cut on a sheet, individual cut, or rolls for automated dispensing.",
        },
        {
          q: "What's the turnaround for Regina product label orders?",
          a: "1–3 business days print + 1–2 business days ground courier to Regina = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Who buys product labels in Regina?",
          a: "SaskMade artisan food brands, craft beverage makers (kombucha, sodas, cold-brew), packaged goods producers, soap and candle makers, supplement brands selling at Regina Farmers' Market and indie retail. First-run startup batches and production-line runs.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "product-labels-saskatoon" },
        { name: "Moose Jaw", slug: "product-labels-moose-jaw-sk" },
        { name: "Prince Albert", slug: "product-labels-prince-albert-sk" },
      ]}
    />
  );
}
