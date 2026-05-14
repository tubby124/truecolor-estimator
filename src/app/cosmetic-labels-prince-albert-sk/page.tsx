import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Cosmetic Labels Prince Albert SK | From $5.50/sqft | True Color" },
  description:
    "Waterproof cosmetic and skincare labels for Prince Albert beauty brands and natural-product makers. BOPP vinyl from $5.50/sqft. Courier to PA.",
  alternates: { canonical: "/cosmetic-labels-prince-albert-sk" },
  openGraph: {
    title: "Cosmetic Labels Prince Albert SK | True Color Display Printing",
    description:
      "Waterproof BOPP vinyl cosmetic labels. Survives bathroom moisture. From $5.50/sqft. Printed in Saskatoon, couriered to Prince Albert.",
    url: "https://truecolorprinting.ca/cosmetic-labels-prince-albert-sk",
    images: [{ url: "/images/products/og/cosmetic-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CosmeticLabelsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="cosmetic-labels-prince-albert-sk"
      primaryProductSlug="stickers"
      title="Cosmetic Labels — Prince Albert SK"
      subtitle="Waterproof skincare and cosmetic labels for PA natural-product brands. From $5.50/sqft."
      heroImage="/images/products/heroes/cosmetic-labels-hero-1200x500.webp"
      heroAlt="Waterproof cosmetic and skincare labels printed for Prince Albert SK beauty brands by True Color Display Printing"
      description={
        "Custom cosmetic and skincare labels printed in Saskatoon, couriered to Prince Albert 140 km north. From $5.50/sqft on waterproof BOPP vinyl — survives bathroom humidity and product spills without smudging. Built for Prince Albert natural-product makers, indigenous-craft skincare brands, handmade soap and balm crafters, and small farmers market beauty vendors. Saskatoon-to-PA courier is one of our fastest lanes — same-day to next-day for most carriers."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints cosmetic and skincare labels at our Saskatoon
            shop and couriers to Prince Albert 140 km north. Standard cosmetic stock is{" "}
            <strong>waterproof BOPP vinyl</strong> — survives bathroom humidity, product
            spills on the bottle, and the moisture cycle that happens with any hand soap or
            lotion. Pricing from <strong>$5.50/sqft</strong> with a $30 minimum charge. Full
            spec on our{" "}
            <Link href="/cosmetic-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              cosmetic labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common PA use cases: <strong>natural-product skincare</strong> (cold-pressed soap,
            tallow balms, herbal salves), indigenous-craft beauty brands featuring traditional
            ingredients, small-batch lotion bottles, body butter jars, and farmers market
            natural-beauty vendors. The Saskatoon-to-Prince-Albert courier corridor runs fast —
            typically next-day.
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
        { name: "Cosmetic Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Waterproof BOPP vinyl — survives bathroom humidity and product spills",
        "Roland UV ink cures to a solid film — no smudging or peeling",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4)",
        "$30 minimum charge — perfect for indigenous-craft and indie test batches",
        "Contour cutting included — rectangle, oval, circle, custom die",
        "1–3 business day print + 1 business day courier to Prince Albert",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order cosmetic labels shipped to Prince Albert?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to PA. Total: 2–4 business days from artwork approval.",
        },
        {
          q: "How much do cosmetic labels cost shipped to Prince Albert?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" oval at quantity 250 runs about $200.",
        },
        {
          q: "Do you print labels for indigenous-craft and natural-product brands in PA?",
          a: "Yes — PA has a growing indigenous-craft beauty scene featuring traditional ingredients (Saskatoon berry, birch bark extract, sweetgrass). We print waterproof BOPP labels that respect the craft aesthetic — natural-look matte or premium soft-touch finish, contour-cut to unique shapes.",
        },
        {
          q: "Will the label survive bathroom moisture?",
          a: "Yes — waterproof BOPP vinyl. The face material doesn't absorb moisture. Roland UV ink cures to a solid film so it doesn't bead, smudge, or peel even when soap or lotion contacts the bottle.",
        },
        {
          q: "What's the turnaround for PA cosmetic label orders?",
          a: "1–3 business days print + 1 business day courier = 2–4 business days total. Same-day rush (+$40 flat) for orders placed before 10 AM with artwork approved by mid-morning.",
        },
        {
          q: "Can you contour-cut to a unique bottle shape for PA orders?",
          a: "Yes — rectangle, oval, circle, neck label arc, or any custom die. Setup included in the sqft rate. Send a photo or template for unusual bottle shapes and we'll match the curvature.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "cosmetic-labels-saskatoon" },
        { name: "Regina", slug: "cosmetic-labels-regina" },
        { name: "Moose Jaw", slug: "cosmetic-labels-moose-jaw-sk" },
      ]}
    />
  );
}
