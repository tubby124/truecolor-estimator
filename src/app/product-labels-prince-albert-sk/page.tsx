import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Product Labels Prince Albert SK | From $5.50/sqft | True Color" },
  description:
    "Retail product labels for Prince Albert artisan food, fisheries, craft brands. From $5.50/sqft. Printed in Saskatoon, courier to Prince Albert.",
  alternates: { canonical: "/product-labels-prince-albert-sk" },
  openGraph: {
    title: "Product Labels Prince Albert SK | True Color Display Printing",
    description:
      "Full-colour retail product labels. Gloss, matte, or soft-touch. From $5.50/sqft. Printed in Saskatoon, couriered to Prince Albert.",
    url: "https://truecolorprinting.ca/product-labels-prince-albert-sk",
    images: [{ url: "/images/products/og/product-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ProductLabelsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="product-labels-prince-albert-sk"
      primaryProductSlug="stickers"
      title="Product Labels — Prince Albert SK"
      subtitle="Retail product labels for PA artisan food, fisheries, craft brands. From $5.50/sqft."
      heroImage="/images/products/heroes/product-labels-hero-1200x500.webp"
      heroAlt="Retail product labels printed for Prince Albert SK artisan brands by True Color Display Printing"
      description={
        "Custom retail product labels printed in Saskatoon, couriered to Prince Albert 140 km north. From $5.50/sqft on 3mil vinyl — gloss, matte, or soft-touch finish. Built for Prince Albert artisan food makers, smoked fish and meat operations, hunter/trapper packaging, indigenous-craft producers, and small retail brands. Saskatoon-to-PA courier is one of our fastest lanes — same-day to next-day for most carriers."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints custom retail product labels at our Saskatoon
            shop and couriers to Prince Albert 140 km north. 3mil vinyl in gloss, matte, or
            soft-touch finish — plus waterproof BOPP for beverage and bath products. Pricing
            from <strong>$5.50/sqft</strong> with a $25 order-total minimum at checkout. Full material spec
            and pricing tiers on our{" "}
            <Link href="/product-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              product labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common PA use cases: <strong>smoked fish and game</strong> packaging, artisan food
            (jams, honey, syrups — including SaskMade and indigenous-craft producers), small
            ranch direct-to-consumer programs, and retail launch labels for PA-based startups
            heading into Saskatoon and Prince Albert co-op grocery shelves.
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
            or{" "}
            <Link href="/coroplast-signs-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for one shipment.
          </p>
        </>
      }
      products={[
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Gloss, matte, or soft-touch 3mil vinyl + waterproof BOPP option",
        "Contour cutting included — rectangle, oval, circle, custom die",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4)",
        "$25 order-total minimum — works for small first-run batches",
        "Roland UV inks survive moisture, condensation, and outdoor handling",
        "1–3 business day print + 1 business day courier to Prince Albert",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order product labels shipped to Prince Albert?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, courier to PA. Total: 2–4 business days from artwork approval.",
        },
        {
          q: "How much do product labels cost shipped to Prince Albert?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). $25 order minimum. A 3×4\" label at quantity 500 runs about $300.",
        },
        {
          q: "Do you print labels for smoked fish and game in Prince Albert?",
          a: "Yes — smoked fish (whitefish, pickerel) and wild-game packaging is a regular PA print job. Standard labels show species, source, smoke style, weight, lot, and date. Waterproof BOPP recommended for vacuum-sealed bags that go into ice-bath retail display.",
        },
        {
          q: "What's the turnaround for PA product label orders?",
          a: "1–3 business days print + 1 business day courier = 2–4 business days total. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Can you do a small first run for a PA startup?",
          a: "Yes — $25 order-total minimum covers small format jobs. No five-digit MOQ. Start with 100–250 labels for a co-op grocery test, scale up later.",
        },
        {
          q: "Can you contour-cut PA orders to a custom shape?",
          a: "Yes — rectangle, oval, circle, or any custom die (brand silhouette, neck label, hang-tag). Setup included in the sqft rate. No separate die charge.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "product-labels-saskatoon" },
        { name: "Regina", slug: "product-labels-regina" },
        { name: "Moose Jaw", slug: "product-labels-moose-jaw-sk" },
      ]}
    />
  );
}
