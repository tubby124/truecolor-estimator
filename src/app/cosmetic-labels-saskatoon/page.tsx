import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Cosmetic Labels Saskatoon | From $5.50/sqft | True Color" },
  description:
    "Skincare and cosmetic labels printed in Saskatoon. From $5.50/sqft on 3mil vinyl. Full-colour Roland UV, matte or gloss, 1–3 day turnaround.",
  alternates: { canonical: "/cosmetic-labels-saskatoon" },
  openGraph: {
    title: "Cosmetic Labels Saskatoon | Skincare & Beauty Labels | True Color",
    description:
      "Small-batch cosmetic label printing in Saskatoon from $5.50/sqft. 3mil vinyl, full-colour Roland UV, matte or gloss. Local pickup 216 33rd St W.",
    url: "https://truecolorprinting.ca/cosmetic-labels-saskatoon",
    images: [{ url: "/images/products/og/cosmetic-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CosmeticLabelsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="cosmetic-labels-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Cosmetic Labels — Saskatoon"
      subtitle="Skincare and cosmetic labels. From $5.50/sqft. Roland UV print, full-colour, Saskatoon."
      heroImage="/images/products/heroes/cosmetic-labels-hero-1200x500.webp"
      heroAlt="Cosmetic and skincare labels printed in Saskatoon by True Color"
      description={
        "Cosmetic labels in Saskatoon are $5.50/sqft at True Color. A $25 order-total minimum applies at checkout. That covers full-colour Roland UV printing on 3mil white vinyl — the same label stock used by small-batch skincare brands, soap makers, indie cosmetic creators, essential oil bottlers, and perfumers across Saskatchewan. If you're filling amber dropper bottles, frosted pump bottles, aluminum tubes, or glass jars in your kitchen or studio and need labels that look like they came from a retail brand, this is the right product. Tier pricing drops to $5.00/sqft over 12 sqft, $4.30/sqft over 32 sqft, and $3.20/sqft over 100 sqft — useful once your batch sizes scale up.\n\nThe material is ARLPMF7008 — a 3mil cast vinyl with a permanent adhesive built to wrap curved bottles without lifting at the edges. Roland UV inks cure instantly and don't smudge under fingertips, oils, or alcohol-based products. Matte and gloss finishes are both available at the same price. For small-batch cosmetics specifically: matte reads as natural/apothecary, gloss reads as clinical/luxury. Saskatchewan winter humidity swings don't bother this stock — it holds up in dry indoor air, fridge storage, and bathroom moisture equally well.\n\nCommon sizes for cosmetic containers: 1.5×3″ for narrow dropper bottles and lip balm tubes, 2×3″ for 30ml pump bottles and small jars, 2×4″ for 50–100ml bottles. We can cut to any custom dimension you supply — kiss-cut on a backing sheet so each label peels off cleanly during your fill day. Turnaround is 1–3 business days after artwork approval. Same-day rush is available for +$40 flat if you place the order before 10 AM.\n\nHealth Canada label requirements for cosmetics (INCI ingredient list, net quantity in metric, manufacturer name + address, lot code, PAO symbol) are your responsibility to supply in the artwork — we print what you send. If your design needs work, our in-house designer is $35 flat for standard layouts with same-day proof. Print-ready files go straight to our in-house Roland UV printer at 216 33rd St W, Saskatoon. Pickup or shipping across Saskatchewan. Call (306) 954-8688 for sizing or quantity questions, or browse our [stickers](/sticker-printing-saskatoon) and [window decals](/window-decals-saskatoon) for related label work."
      }
      products={[
        { name: "Vinyl Labels (3mil)", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Lettering", from: "from $40", slug: "vinyl-lettering" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
        { name: "Postcards", from: "from $45 / 100", slug: "postcards" },
      ]}
      whyPoints={[
        "3mil cast vinyl (ARLPMF7008) — wraps curved bottles without lifting",
        "Full-colour Roland UV print — cures instantly, won't smudge under oils or alcohol",
        "$5.50/sqft tier 1 (0–12 sqft) — $25 order-total minimum applies",
        "Volume tiers: $5.00/sqft at 12+ sqft, $4.30/sqft at 32+ sqft, $3.20/sqft at 100+ sqft",
        "Matte or gloss finish — same price, your choice",
        "Custom sizes: 1.5×3, 2×3, 2×4 are standard for cosmetic bottles",
        "Kiss-cut on backing sheet — peels cleanly during fill day",
        "1–3 business day turnaround, +$40 flat for same-day rush before 10 AM",
      ]}
      faqs={[
        {
          q: "How much do cosmetic labels cost in Saskatoon?",
          a: "Cosmetic labels at True Color start at $5.50/sqft on 3mil vinyl with a $30 minimum order. Tier pricing drops to $5.00/sqft over 12 sqft, $4.30/sqft over 32 sqft, and $3.20/sqft over 100 sqft. A typical run of 100 labels at 2×3″ works out to about $25 worth of sqft — so the $30 minimum kicks in. Call (306) 954-8688 for an exact quote on your specific size and quantity.",
        },
        {
          q: "What material do you use for cosmetic and skincare labels?",
          a: "We print on ARLPMF7008 — a 3mil cast vinyl with permanent adhesive. It's the same material small-batch skincare brands use because it wraps curved bottles (droppers, pumps, jars) without lifting at the edges. Roland UV inks cure instantly and resist smudging from oils, alcohol, water, and fingertip contact. It holds up in Saskatchewan winter dry air, bathroom humidity, and fridge storage equally well.",
        },
        {
          q: "Will the labels stick to amber dropper bottles and frosted pump bottles?",
          a: "Yes — that's exactly what this 3mil vinyl is designed for. The permanent adhesive bonds to glass, frosted glass, aluminum tubes, and most rigid plastic cosmetic containers. For very small or tightly curved bottles (under 30ml), we recommend a label height under 1.5″ to avoid wrinkle. Sample-test orders welcome — bring us one of your bottles and we'll spec the right size.",
        },
        {
          q: "Can you handle Health Canada cosmetic label requirements?",
          a: "We print exactly what you supply in your artwork. Health Canada requires an INCI ingredient list, net quantity in metric units, manufacturer name + address, lot code, and PAO symbol — these are your responsibility to include. If your design needs help laying out all the required text at legal minimum sizes, our in-house designer is $35 flat for standard layouts with a same-day proof. We don't certify compliance — that's between you and Health Canada — but we'll print what you send.",
        },
        {
          q: "Do you offer matte or gloss finish?",
          a: "Both — and they're the same $5.50/sqft price. Matte reads as natural/apothecary, which suits soap makers, essential oil bottlers, and botanical skincare. Gloss reads as clinical/luxury, which suits perfumes, serums, and high-end cosmetic lines. If you're unsure, we can print a small test of both finishes for $30 minimum so you can hold them against your bottles before committing to a full run.",
        },
        {
          q: "What sizes work best for cosmetic containers?",
          a: "Common sizes: 1.5×3″ for narrow dropper bottles and lip balm tubes, 2×3″ for 30ml pump bottles and small jars, 2×4″ for 50–100ml bottles and aluminum tubes. We cut to any custom dimension you supply. A 2×3″ label uses 0.042 sqft, so a 100-piece run is 4.2 sqft — under the $30 minimum, so you'd pay the $30 floor.",
        },
        {
          q: "How fast can I get cosmetic labels printed in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after you approve the proof. Same-day rush is available for +$40 flat if you place the order before 10 AM and your artwork is print-ready. Call (306) 954-8688 in the morning to confirm same-day capacity — we can usually fit small label runs in alongside other UV jobs without delaying anything.",
        },
        {
          q: "Where do I pick up cosmetic labels in Saskatoon?",
          a: "True Color Display Printing — 216 33rd St W, Saskatoon SK S7L 0V5. Phone (306) 954-8688. We print in-house on our Roland UV printer, no outsourcing. Local pickup is free; shipping across Saskatchewan is available at cost. Most cosmetic label orders are small enough to pick up the same day you approve the proof.",
        },
      ]}
    />
  );
}
