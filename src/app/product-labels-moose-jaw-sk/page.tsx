import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Product Labels Moose Jaw | From $5.50/sqft | True Color" },
  description:
    "Retail product labels for Moose Jaw artisan food, brewery, distillery, farmers market. From $5.50/sqft. Printed in Saskatoon, shipped to Moose Jaw.",
  alternates: { canonical: "/product-labels-moose-jaw-sk" },
  openGraph: {
    title: "Product Labels Moose Jaw SK | True Color Display Printing",
    description:
      "Full-colour retail product labels. Gloss, matte, soft-touch. From $5.50/sqft. Printed in Saskatoon, shipped to Moose Jaw.",
    url: "https://truecolorprinting.ca/product-labels-moose-jaw-sk",
    images: [{ url: "/images/products/og/product-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ProductLabelsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="product-labels-moose-jaw-sk"
      primaryProductSlug="stickers"
      title="Product Labels — Moose Jaw SK"
      subtitle="Retail product labels for Moose Jaw artisan food, beverage, craft brands. From $5.50/sqft."
      heroImage="/images/products/heroes/product-labels-hero-1200x500.webp"
      heroAlt="Retail product labels printed for Moose Jaw SK artisan brands by True Color Display Printing"
      description={
        "Custom retail product labels printed in Saskatoon, shipped to Moose Jaw 240 km south. From $5.50/sqft on 3mil vinyl — gloss, matte, or soft-touch finish. Built for Moose Jaw craft brewers, distilleries, farmers market vendors, ranches selling direct-to-consumer beef and lamb, and small artisan brands. Contour-cut to any shape, no die fee. Same Roland UV print quality, in-house design ($35 flat), 1–3 business day turnaround. Ground courier 1–2 days to Moose Jaw."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints custom retail product labels at our Saskatoon
            shop and ships to Moose Jaw 240 km south. Stock options: 3mil vinyl in gloss,
            matte, or soft-touch — plus waterproof BOPP for beverage and bath products.
            Pricing from <strong>$5.50/sqft</strong> with a $30 minimum charge. Full pricing
            and material spec on our{" "}
            <Link href="/product-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              product labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Moose Jaw use cases: <strong>craft brewery and distillery labels</strong>{" "}
            (Moose Jaw has a growing craft scene — beer, spirits, RTD cocktails), ranches
            running direct-to-consumer beef and lamb programs, farmers market food vendors,
            and small artisan brands testing retail. Contour cutting included in the sqft
            rate. Bundle with{" "}
            <Link href="/business-cards-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for one shipment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof. Print 1–3 business days + ground courier 1–2 days to
            Moose Jaw. In-house Photoshop designer builds label layouts for $35 flat with a
            same-day proof.
          </p>
        </>
      }
      products={[
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
      ]}
      whyPoints={[
        "Gloss, matte, or soft-touch 3mil vinyl + waterproof BOPP option",
        "Contour cutting included — rectangle, oval, circle, custom die",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4)",
        "$30 minimum charge — works for small first-run batches",
        "UV-cured ink survives bottle moisture and ice-bath beverage chilling",
        "1–3 business day print + 1–2 day courier to Moose Jaw",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order product labels shipped to Moose Jaw?",
          a: "Submit artwork at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Moose Jaw. Total: 3–5 business days from approval.",
        },
        {
          q: "How much do product labels cost shipped to Moose Jaw?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" label at quantity 500 runs about $300. Moose Jaw courier cost is customer's.",
        },
        {
          q: "Do you print beverage labels for Moose Jaw breweries and distilleries?",
          a: "Yes — beverage labels are a core product. Waterproof BOPP vinyl is the standard for bottles that get ice-bathed at retail. Roland UV ink doesn't smudge or peel from condensation. Contour cutting included for neck labels, wrap-around bodies, and back-of-bottle nutritional panels.",
        },
        {
          q: "Can you do a small first run for a Moose Jaw startup brand?",
          a: "Yes — $30 minimum charge covers small-format jobs (2–4 sqft of label total). No five-digit MOQ. Start with 100–250 labels for a market test, scale up as your brand grows.",
        },
        {
          q: "What's the turnaround for Moose Jaw product label orders?",
          a: "1–3 business days print + 1–2 business days ground courier = 3–5 business days from artwork approval. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Can you contour-cut to a custom shape for Moose Jaw orders?",
          a: "Yes — rectangle, oval, circle, or any custom die shape (brand silhouette, neck label arc, etc.). Setup included in the sqft rate. No separate die charge.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "product-labels-saskatoon" },
        { name: "Regina", slug: "product-labels-regina" },
        { name: "Prince Albert", slug: "product-labels-prince-albert-sk" },
      ]}
    />
  );
}
