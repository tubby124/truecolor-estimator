import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Cosmetic Labels Saskatoon | From $25 | True Color" },
  description:
    "Skincare and cosmetic labels printed in Saskatoon. 25 labels from $25, 100 for $55 on 3 mil vinyl. Matte or gloss, 1–3 day turnaround.",
  alternates: { canonical: "/cosmetic-labels-saskatoon" },
  openGraph: {
    title: "Cosmetic Labels Saskatoon | Skincare & Beauty Labels | True Color",
    description:
      "Small-batch cosmetic label printing in Saskatoon. 25 labels from $25, 100 for $55. 3 mil vinyl, matte or gloss. Local pickup 216 33rd St W.",
    url: "https://truecolorprinting.ca/cosmetic-labels-saskatoon",
    images: [{ url: "/images/products/og/cosmetic-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CosmeticLabelsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="cosmetic-labels-saskatoon"
      primaryProductSlug="cosmetic-labels"
      title="Cosmetic Labels — Saskatoon"
      subtitle="Skincare and cosmetic labels. 25 from $25. Waterproof 3 mil vinyl, Saskatoon."
      heroImage="/images/products/heroes/cosmetic-labels-hero-1200x500.webp"
      heroAlt="Cosmetic and skincare labels printed in Saskatoon by True Color"
      description={
        "Cosmetic labels in Saskatoon start at $25 for 25 at True Color, and you can price your exact size and quantity online before ordering. A 2×3\" label — the common size for a 30ml pump bottle — runs $55 for 100, $87.50 for 250, and $150 for 1,000, so the per-label cost falls from $1.00 to $0.15 as your batch grows. That covers full-colour printing on 3 mil white vinyl, the same label stock used by small-batch skincare brands, soap makers, indie cosmetic creators, essential oil bottlers, and perfumers across Saskatchewan. If you are filling amber dropper bottles, frosted pump bottles, aluminum tubes, or glass jars in your kitchen or studio and need labels that look like they came from a retail brand, this is the right product.\n\nThe material is ARLPMF7008 — a 3 mil cast vinyl with a permanent adhesive built to wrap curved bottles without lifting at the edges. Printing is done in-house on our Roland TrueVIS VG2 eco-solvent printer/cutter, and the gloss laminate keeps the ink from smudging under fingertips, oils, or alcohol-based products. Matte and gloss finishes are both available at the same price. For small-batch cosmetics specifically: matte reads as natural and apothecary, gloss reads as clinical and luxury. Saskatchewan winter humidity swings do not bother this stock — it holds up in dry indoor air, fridge storage, and bathroom moisture equally well.\n\nCommon sizes for cosmetic containers: 1.5×2\" for narrow dropper bottles and lip balm tubes, 2×3\" for 30ml pump bottles and small jars, and 2.5×3.5\" for 50–100ml bottles. Any custom rectangle can be entered in the configurator. Labels are die-cut so each one peels cleanly during your fill day. Turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if you place the order before 10 AM.\n\nHealth Canada label requirements for cosmetics (INCI ingredient list, net quantity in metric, manufacturer name and address, lot code, PAO symbol) are your responsibility to supply in the artwork — we print what you send. If your design needs work, our in-house designer is $40 flat for standard layouts with a same-day proof. Pickup at 216 33rd St W, Saskatoon, or shipping across Saskatchewan. Call (306) 954-8688 for sizing or quantity questions, or browse our [stickers](/sticker-printing-saskatoon) and [window decals](/window-decals-saskatoon) for related label work."
      }
      products={[
        { name: "Cosmetic Labels", from: "from $25 / 25", slug: "cosmetic-labels" },
        { name: "Candle & Jar Labels", from: "from $25 / 25", slug: "candle-jar-labels" },
        { name: "Product Labels", from: "from $25 / 25", slug: "product-labels" },
        { name: "Stickers", from: "from $25 / 25", slug: "stickers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
      ]}
      whyPoints={[
        "3 mil cast vinyl (ARLPMF7008) — wraps curved bottles without lifting",
        "Printed in-house on a Roland TrueVIS VG2 eco-solvent printer/cutter",
        "Gloss laminate resists oils, alcohol, and fingertip contact",
        "25 labels from $25 — price your exact size and quantity online",
        "100 labels for $55, 500 for $100, 1,000 for $150 at 2×3\"",
        "Matte or gloss finish — same price, your choice",
        "Die-cut so each label peels cleanly on fill day",
        "1–3 business day turnaround, +$40 flat for same-day rush before 10 AM",
      ]}
      faqs={[
        {
          q: "How much do cosmetic labels cost in Saskatoon?",
          a: "25 labels start at $25. At the common 2×3\" size a run of 100 is $55, 250 is $87.50, 500 is $100, and 1,000 is $150 — so the per-label cost drops from $1.00 to $0.15 as the batch grows. Configure your exact size and quantity on the product page to see the price before you order; there is no quote form and no callback.",
        },
        {
          q: "What material do you use for cosmetic and skincare labels?",
          a: "ARLPMF7008 — a 3 mil cast vinyl with permanent adhesive. It is the same material small-batch skincare brands use because it wraps curved bottles (droppers, pumps, jars) without lifting at the edges. Printed on our Roland TrueVIS VG2 eco-solvent printer/cutter and gloss laminated, so it resists smudging from oils, alcohol, water, and fingertip contact. It holds up in Saskatchewan winter dry air, bathroom humidity, and fridge storage equally well.",
        },
        {
          q: "Will the labels stick to amber dropper bottles and frosted pump bottles?",
          a: "Yes — that is exactly what this 3 mil vinyl is designed for. The permanent adhesive bonds to glass, frosted glass, aluminum tubes, and most rigid plastic cosmetic containers. For very small or tightly curved bottles under 30ml, keep the label height under about 1.5\" to avoid wrinkling. Bring one of your bottles to 216 33rd St W and we will spec the right size against it.",
        },
        {
          q: "Can you handle Health Canada cosmetic label requirements?",
          a: "We print exactly what you supply in your artwork. Health Canada requires an INCI ingredient list, net quantity in metric units, manufacturer name and address, lot code, and PAO symbol — these are your responsibility to include. If your design needs help laying out the required text at legal minimum sizes, our in-house designer is $40 flat for standard layouts with a same-day proof. We do not certify compliance — that is between you and Health Canada — but we will print what you send.",
        },
        {
          q: "Do you offer matte or gloss finish?",
          a: "Both, at the same price. Matte reads as natural and apothecary, which suits soap makers, essential oil bottlers, and botanical skincare. Gloss reads as clinical and luxury, which suits perfumes, serums, and high-end cosmetic lines. If you are unsure, order 25 of each at $25 per set and hold them against your bottles before committing to a full run.",
        },
        {
          q: "What sizes work best for cosmetic containers?",
          a: "1.5×2\" for narrow dropper bottles and lip balm tubes, 2×3\" for 30ml pump bottles and small jars, and 2.5×3.5\" for 50–100ml bottles and aluminum tubes. All three price at $25 for 25. Any other rectangle can be entered as a custom size in the configurator.",
        },
        {
          q: "How fast can I get cosmetic labels printed in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after you approve the proof. Same-day rush is +$40 flat if you place the order before 10 AM and your artwork is print-ready. Call (306) 954-8688 in the morning to confirm same-day capacity — small label runs usually fit alongside other jobs without delaying anything.",
        },
        {
          q: "Where do I pick up cosmetic labels in Saskatoon?",
          a: "True Color Display Printing — 216 33rd St W, Saskatoon SK S7L 0V1. Phone (306) 954-8688. Everything prints in-house, no outsourcing. Local pickup is free; shipping across Saskatchewan is available at cost. Most cosmetic label orders are small enough to pick up the same day you approve the proof.",
        },
      ]}
    />
  );
}
