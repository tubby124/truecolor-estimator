import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Custom Labels Saskatoon | From $25 | True Color" },
  description:
    "Custom adhesive labels printed in Saskatoon — freezer, product, cosmetic, candle, and roll labels. From $25 on 3mil vinyl. 1–3 day turnaround.",
  alternates: { canonical: "/labels-saskatoon" },
  openGraph: {
    title: "Custom Label Printing Saskatoon | True Color Display Printing",
    description:
      "Freezer labels, product labels, cosmetic labels, candle labels, roll labels — all printed in-house at 216 33rd St W, Saskatoon. From $25.",
    url: "https://truecolorprinting.ca/labels-saskatoon",
    images: [{ url: "/images/products/og/labels-saskatoon-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LabelsSaskatoonHubPage() {
  return (
    <IndustryPage
      canonicalSlug="labels-saskatoon"
      primaryProductSlug="product-labels"
      title="Custom Labels — Saskatoon"
      subtitle="Freezer, product, cosmetic, candle, and roll labels. From $25. Printed in Saskatoon."
      heroImage="/images/products/heroes/freezer-labels-hero-1200x500.webp"
      heroAlt="Custom adhesive labels printed in Saskatoon by True Color Display Printing"
      description={
        "Custom adhesive labels printed in Saskatoon, starting at $25 for 25 on 3 mil vinyl. Whether you need freezer-grade labels that survive -18°C deep freezers, retail product labels for a Saskatchewan-made artisan brand, waterproof cosmetic labels for a skincare line, heat-resistant labels for candle jars, or thousands of identical labels delivered on a continuous roll for an automated packaging line — we print all of it in-house at 216 33rd St W on our Roland TrueVIS VG2 eco-solvent printer/cutter. No outsourcing, no five-digit case quantities, no waiting on a label broker. Same-day rush available at +$40 flat for orders placed before 10 AM. In-house Photoshop designer builds label layouts at $40 flat with a same-day proof."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints five categories of custom adhesive labels in
            Saskatoon, all on our in-house Roland TrueVIS VG2 eco-solvent printer/cutter at 216 33rd St W. Pricing starts
            at <strong>$25 for 25 labels</strong> on 3 mil vinyl. A 3×4&quot; label is $67 for 100 and
            $165 for 500; a 2.5×3.5&quot; is $55 for 100. Labels price per unit on the same
            quantity ladder we use for stickers, because a small label costs about the same to
            set up and cut whatever its area. No five-digit MOQ from
            a label converter. Pay for what you order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Pick the right label for the job:
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc list-outside ml-6 space-y-2">
            <li>
              <Link href="/freezer-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
                Freezer labels
              </Link>{" "}
              — 3mil vinyl with freezer-grade adhesive (ARLPMF7008). Holds at -18°C through
              condensation cycles. Used by Saskatoon raw pet food makers, butchers, and frozen
              food manufacturers.
            </li>
            <li>
              <Link href="/product-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
                Product labels
              </Link>{" "}
              — full-colour retail labels for artisan food, beverage, packaged goods. Gloss,
              matte, or soft-touch finish. Contour-cut to any shape.
            </li>
            <li>
              <Link href="/cosmetic-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
                Cosmetic labels
              </Link>{" "}
              — waterproof BOPP vinyl labels for skincare bottles, jars, droppers, tubes. UV
              inks survive bathroom moisture without smudging.
            </li>
            <li>
              <Link href="/candle-jar-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
                Candle &amp; jar labels
              </Link>{" "}
              — heat-resistant adhesive for hot-wax-poured candles. Wrap-around or lid-top
              shapes. No curling near the flame.
            </li>
            <li>
              <Link href="/roll-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
                Roll labels
              </Link>{" "}
              — thousands of identical labels supplied on a continuous backing roll for
              automated dispensing on a packaging line. Custom-quoted per run.
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Need help deciding? Call <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">(306) 954-8688</a> or
            walk into 216 33rd St W. We&apos;ll match the material and adhesive to your use
            case — there&apos;s no single &quot;label&quot; — and quote in the same
            conversation.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Turnaround is <strong>1–3 business days</strong> after artwork approval. Same-day
            rush available at <strong>+$40 flat</strong> when ordered before 10 AM. Don&apos;t
            have artwork? Our in-house Photoshop designer builds label layouts at{" "}
            <strong>$40 flat</strong> with a same-day proof — logos, ingredient panels, batch
            codes, barcodes all included.
          </p>
        </>
      }
      products={[
        { name: "Freezer Labels", from: "from $25 / 25", slug: "freezer-labels" },
        { name: "Product Labels", from: "from $25 / 25", slug: "product-labels" },
        { name: "Cosmetic Labels", from: "from $25 / 25", slug: "cosmetic-labels" },
        { name: "Candle & Jar Labels", from: "from $25 / 25", slug: "candle-jar-labels" },
        { name: "Roll Labels", from: "from $25 / 25", slug: "roll-labels" },
        { name: "Stickers", from: "from $25 / 25", slug: "stickers" },
      ]}
      whyPoints={[
        "Five label categories under one roof — freezer, product, cosmetic, candle, roll — no need to source from multiple suppliers",
        "3mil vinyl + UV-cured ink — print survives moisture, frost, and bathroom humidity without smudging",
        "25 labels from $25 — a 3×4\" label is $67 for 100, $165 for 500",
        "$25 order-total minimum — no five-digit MOQ like a commercial label converter",
        "Contour cut to rectangle, oval, circle, or custom shape — setup included in the sqft rate",
        "In-house Roland TrueVIS VG2 eco-solvent printer/cutter at 216 33rd St W — no outsourcing, no file handoffs",
        "1–3 business day turnaround after artwork approval, +$40 flat for same-day rush",
        "In-house Photoshop designer at $40 flat with same-day proof — label layouts built from your logo + brief",
      ]}
      faqs={[
        {
          q: "Which type of label do I need?",
          a: "It depends on the environment. Freezer? Use freezer labels (ARLPMF7008 adhesive for -18°C). Retail shelf? Product labels work — gloss, matte, or soft-touch finish. Skincare or bath product? Cosmetic labels on waterproof BOPP vinyl. Candle jar with hot wax? Candle labels with heat-resistant adhesive. Need thousands on a roll for automated dispensing? Roll labels. Call (306) 954-8688 and describe the job — we'll pick the material for you.",
        },
        {
          q: "How much do custom labels cost in Saskatoon?",
          a: "25 labels start at $25. A 3×4\" label is $67 for 100, $167.50 for 250, and $165 for 500; a 2.5×3.5\" is $55 for 100. Larger formats price by area — a 10×2\" at quantity 500 is $280. Configure your exact size and quantity on any label product page to see the price before ordering. Roll labels are custom-quoted because the run size, die shape, and material core all affect setup.",
        },
        {
          q: "What's the turnaround on custom labels?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat as long as the order is placed before 10 AM and the artwork is approved by mid-morning. Both print and design happen in the same building so there's no file-handoff delay between vendors.",
        },
        {
          q: "Can you contour-cut labels to a custom shape?",
          a: "Yes — we cut to rectangle, rounded corner, oval, circle, or custom contour shape on the same job. Setup is included in the per-sqft rate; there's no separate die charge. Kiss-cut sheets, perfed tear-off lot codes, and unusual shapes are all available. Describe what you need when you call (306) 954-8688 or visit 216 33rd St W.",
        },
        {
          q: "Do I need print-ready artwork?",
          a: "If you have it (AI, PDF, PSD, PNG, JPG, even a high-quality photo of what you're trying to recreate), send it and we'll proof it. If you don't, our in-house Photoshop designer builds a label layout for $40 flat with a same-day proof. Logos, ingredient panels, weight/lot tracking fields, barcodes — all standard label work, all included in the $35.",
        },
        {
          q: "Can True Color print labels for a packaging line?",
          a: "Yes — for automated packaging lines we supply roll labels on a continuous backing roll with a 3\" core (or specify your dispenser core size). Roll labels are custom-quoted per run because die shape, label gap, and total quantity all affect setup. Call (306) 954-8688 with your label dimensions, dispenser specs, and quantity and we'll quote in the same conversation.",
        },
        {
          q: "Where do you ship labels?",
          a: "Most orders are picked up at 216 33rd St W, Saskatoon. We can also courier or mail across Saskatchewan — Regina, Moose Jaw, Prince Albert, Yorkton, Lloydminster — at the customer's shipping cost. Local pickup adds no fee and is fastest.",
        },
        {
          q: "What materials do you use for labels?",
          a: "Standard stock is 3mil white vinyl with a permanent pressure-sensitive adhesive. For freezer use we switch to freezer-grade adhesive (ARLPMF7008) that holds at -18°C. For cosmetics we use BOPP vinyl which is waterproof against bathroom humidity. For candles we use a heat-resistant adhesive that bonds to warm glass without bubbling. UV-cured inks across all — they cure to a solid film rather than soaking into the substrate, which is why the print stays sharp through moisture, frost, and thaw cycles.",
        },
      ]}
    />
  );
}
