import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Cosmetic Labels Moose Jaw SK | From $5.50/sqft | True Color" },
  description:
    "Waterproof cosmetic and skincare labels for Moose Jaw beauty brands and soap makers. BOPP vinyl from $5.50/sqft. Printed in Saskatoon, shipped to Moose Jaw.",
  alternates: { canonical: "/cosmetic-labels-moose-jaw-sk" },
  openGraph: {
    title: "Cosmetic Labels Moose Jaw SK | True Color Display Printing",
    description:
      "Waterproof BOPP vinyl cosmetic labels. Survives bathroom moisture. From $5.50/sqft. Printed in Saskatoon, shipped to Moose Jaw.",
    url: "https://truecolorprinting.ca/cosmetic-labels-moose-jaw-sk",
    images: [{ url: "/images/products/og/cosmetic-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CosmeticLabelsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="cosmetic-labels-moose-jaw-sk"
      primaryProductSlug="stickers"
      title="Cosmetic Labels — Moose Jaw SK"
      subtitle="Waterproof skincare and cosmetic labels for Moose Jaw beauty brands. From $5.50/sqft."
      heroImage="/images/products/heroes/cosmetic-labels-hero-1200x500.webp"
      heroAlt="Waterproof cosmetic and skincare labels printed for Moose Jaw SK beauty brands by True Color Display Printing"
      description={
        "Custom cosmetic and skincare labels printed in Saskatoon, shipped to Moose Jaw 240 km south. From $5.50/sqft on waterproof BOPP vinyl — survives bathroom humidity and product spills without smudging. Built for Moose Jaw handmade soap makers, bath bomb crafters, lotion and balm producers, and farmers market beauty vendors. Roland UV ink doesn't smudge or peel. In-house design ($35 flat), 1–3 business day turnaround. Ground courier 1–2 days."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints custom cosmetic and skincare labels at our
            Saskatoon shop and ships to Moose Jaw 240 km south. Standard cosmetic stock is{" "}
            <strong>waterproof BOPP vinyl</strong> with a clear or white face — survives
            bathroom humidity and accidental product spills on the bottle. Pricing from{" "}
            <strong>$5.50/sqft</strong> with a $30 minimum charge. Full spec on our{" "}
            <Link href="/cosmetic-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              cosmetic labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Moose Jaw use cases: <strong>handmade soap band labels</strong>, bath bomb
            wraps, small-batch lotion bottles, body butter jars, beard balm tins, and natural
            beauty product packaging sold at the Moose Jaw farmers market and Temple Gardens
            retail kiosks. Bundle with{" "}
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
        { name: "Cosmetic Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Product Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Postcards", from: "100 for $45", slug: "postcards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Waterproof BOPP vinyl — survives bathroom humidity and product spills",
        "Roland UV ink cures to a solid film — no smudging or peeling",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4)",
        "$30 minimum charge — perfect for farmers market test batches",
        "Contour cutting included — rectangle, oval, circle, custom die",
        "1–3 business day print + 1–2 day courier to Moose Jaw",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat with same-day proof",
      ]}
      faqs={[
        {
          q: "How do I order cosmetic labels shipped to Moose Jaw?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to Moose Jaw. Total: 3–5 business days from artwork approval.",
        },
        {
          q: "How much do cosmetic labels cost shipped to Moose Jaw?",
          a: "Sqft-tiered: $5.50/sqft (T1, 0–12 sqft), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4 at 100+ sqft). Minimum $30. A 3×4\" oval at quantity 250 runs about $200. Moose Jaw courier is customer's cost.",
        },
        {
          q: "Do you print labels for handmade soap and bath bombs?",
          a: "Yes — handmade soap band labels and bath bomb wraps are a regular Moose Jaw print job. We use waterproof BOPP so the label survives the cure cycle, shrink-wrap heating, and handling at the farmers market booth. Contour cutting included if you want a unique shape.",
        },
        {
          q: "Will the label survive bathroom moisture?",
          a: "Yes — waterproof BOPP vinyl is designed for it. The face material doesn't absorb moisture. The Roland UV ink cures to a solid film so it doesn't bead, smudge, or peel even when soap or lotion gets on the bottle.",
        },
        {
          q: "Can you do a small first run for a Moose Jaw indie brand?",
          a: "Yes — $30 minimum charge covers small format jobs. No five-digit MOQ. Start with 50–100 labels for a farmers market test, scale up as the brand grows.",
        },
        {
          q: "What's the turnaround for Moose Jaw cosmetic label orders?",
          a: "1–3 business days print + 1–2 business days courier = 3–5 business days. Same-day rush (+$40 flat) for orders placed before 10 AM.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "cosmetic-labels-saskatoon" },
        { name: "Regina", slug: "cosmetic-labels-regina" },
        { name: "Prince Albert", slug: "cosmetic-labels-prince-albert-sk" },
      ]}
    />
  );
}
