import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Cosmetic Labels Regina SK | From $5.50/sqft | True Color" },
  description:
    "Waterproof cosmetic and skincare labels for Regina beauty brands. BOPP vinyl from $5.50/sqft. Printed in Saskatoon, shipped to Regina.",
  alternates: { canonical: "/cosmetic-labels-regina" },
  openGraph: {
    title: "Cosmetic Labels Regina SK | True Color Display Printing",
    description:
      "Waterproof BOPP vinyl cosmetic labels. Survives bathroom moisture and ice-bath chilling. From $5.50/sqft. Printed in Saskatoon, shipped to Regina.",
    url: "https://truecolorprinting.ca/cosmetic-labels-regina",
    images: [{ url: "/images/products/og/cosmetic-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CosmeticLabelsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="cosmetic-labels-regina"
      primaryProductSlug="stickers"
      title="Cosmetic Labels — Regina SK"
      subtitle="Waterproof skincare and cosmetic labels for Regina beauty brands. From $5.50/sqft."
      heroImage="/images/products/heroes/cosmetic-labels-hero-1200x500.webp"
      heroAlt="Waterproof cosmetic and skincare labels printed for Regina SK beauty brands by True Color Display Printing"
      description={
        "Custom cosmetic and skincare labels printed in Saskatoon, shipped to Regina 260 km south. From $5.50/sqft on waterproof BOPP vinyl — survives bathroom humidity, hand soap residue, and product spills without smudging the print. Built for Regina indie beauty brands, soap and bath bomb makers, lotion and serum producers, and natural-product startups. Roland UV inks bond directly to the vinyl. Same in-house design ($35 flat), 1–3 business day turnaround. Ground courier adds 1–2 days."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints custom cosmetic and skincare labels at our
            Saskatoon shop and ships to Regina businesses 260 km south. Standard cosmetic
            stock is <strong>waterproof BOPP vinyl</strong> with a clear or white face — survives
            bathroom humidity, accidental product spills on the bottle, and the moisture cycle
            that happens every time someone uses a hand soap or face serum. Roland UV ink
            cures to a solid film so colours stay vivid and the print doesn&apos;t bead off.
            Pricing from <strong>$5.50/sqft</strong> with a $25 small-order minimum at checkout charge. Full spec on
            our{" "}
            <Link href="/cosmetic-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              cosmetic labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>amber glass serum bottles</strong>, frosted-white
            pump bottles, aluminum lotion tubes, jar-lid top labels, and cardboard outer
            cartons. Indie skincare lines launching in Regina&apos;s spa and wellness market
            use small-batch label runs to test branding before scaling. Bundle with{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for one shipment.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. We email a proof. Print 1–3 business days + courier 1–2 days. No
            print-ready artwork? In-house Photoshop designer builds label layouts for $35 flat
            with same-day proof — ingredient panels, batch codes, INCI lists, barcodes
            included.
          </p>
        </>
      }
      products={[
        { name: "Cosmetic Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
        { name: "Brochures", from: "100 for $99", slug: "brochures" },
      ]}
      whyPoints={[
        "Waterproof BOPP vinyl — survives bathroom humidity and product spills without smudging",
        "Roland UV ink bonds to the vinyl as a solid film — colours stay vivid",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4 at 100+ sqft)",
        "$30 minimum charge — perfect for small-batch indie launches",
        "Contour-cut to any shape — rectangle, oval, circle, custom die for unique bottles",
        "1–3 business day print + 1–2 day courier to Regina",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat for label layout (INCI lists, batch codes, barcodes)",
      ]}
      faqs={[
        {
          q: "How do I order cosmetic labels shipped to Regina?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Regina. Total: 3–5 business days from artwork approval.",
        },
        {
          q: "How much do cosmetic labels cost shipped to Regina?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" oval label at quantity 250 runs about $200. Regina courier is customer's cost.",
        },
        {
          q: "Will the label survive bathroom moisture?",
          a: "Yes — that's the entire reason we use waterproof BOPP vinyl for cosmetic labels. The face material doesn't absorb moisture. The Roland UV ink cures to a solid film so it doesn't bead, smudge, or peel even when soap or serum gets on the bottle. Tested in our shop with water immersion before ship.",
        },
        {
          q: "Can you do a small first run for a Regina indie skincare brand?",
          a: "Yes — $30 minimum charge covers small format jobs. No five-digit MOQ. Start with 100–250 labels for a market test, then scale to production runs as your brand grows. Reorders use the same artwork file — no setup fee.",
        },
        {
          q: "What's the turnaround for Regina cosmetic label orders?",
          a: "1–3 business days print + 1–2 business days courier = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Can you contour-cut to a unique bottle shape?",
          a: "Yes — rectangle, oval, circle, neck label arc, or any custom die. Setup included in the sqft rate. For unusual bottle shapes (frosted curves, embossed glass), send a photo or template and we'll match the curvature.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "cosmetic-labels-saskatoon" },
        { name: "Moose Jaw", slug: "cosmetic-labels-moose-jaw-sk" },
        { name: "Prince Albert", slug: "cosmetic-labels-prince-albert-sk" },
      ]}
    />
  );
}
