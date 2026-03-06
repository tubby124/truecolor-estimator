import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Flyer Printing Saskatoon | 100 Flyers from $45 | True Color" },
  description:
    "Flyer printing in Saskatoon from $45/100 on 80lb gloss. Full-colour double-sided, 100lb upgrade available, same-day rush +$40. Custom sizes on request. Pickup at 216 33rd St W.",
  alternates: { canonical: "/flyer-printing-saskatoon" },
  openGraph: {
    title: "Flyer Printing Saskatoon | True Color Display Printing",
    description:
      "Print flyers in Saskatoon from $45/100. 80lb or 100lb gloss, double-sided, same-day rush available.",
    url: "https://truecolorprinting.ca/flyer-printing-saskatoon",
    type: "website",
  },
};

export default function FlyerPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="flyer-printing-saskatoon"
      primaryProductSlug="flyers"
      title="Flyer Printing Saskatoon"
      subtitle="Full-colour flyers from $45/100 on 80lb gloss. Same-day rush +$40. Pickup at 216 33rd St W."
      heroImage="/images/products/product/flyers-stack-800x600.webp"
      heroAlt="Flyer printing in Saskatoon by True Color Display Printing"
      description="True Color Display Printing prints full-colour flyers in Saskatoon on 80lb or 100lb gloss text paper. Minimum 100 flyers. Prices drop significantly at 250 and 500+. Double-sided printing is included as standard. Same-day rush available for +$40 flat."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing prints full-colour flyers in Saskatoon on 80lb or 100lb gloss
            text paper. Standard letter size (8.5×11&quot;), double-sided, minimum 100 flyers.
            Price per flyer drops sharply at 250 and 500+ — the more you order, the lower the unit
            cost. Same-day rush available for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Choose 80lb gloss for everyday flyers — restaurant menus, event programs, door hangers,
            and mailer inserts. The bright white FSC-certified sheet produces sharp colour at a
            cost-effective price per unit. Upgrade to 100lb gloss when the flyer needs to feel
            premium: real estate open house handouts, healthcare brochure-style sheets, and trade
            show materials where quality signals matter. Both options are available at the same
            standard quantities — select your paper weight in the estimator.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Custom sizes (half-letter 5.5×8.5&quot;, legal 8.5×14&quot;, or fully custom dimensions)
            are available on request. Use the estimator to price letter-size runs; for other sizes
            call (306) 954-8688 or{" "}
            <Link href="/quote" className="text-[#16C2F3] underline font-medium">
              request a quote online
            </Link>
            .
          </p>
          <p className="text-gray-600 leading-relaxed">
            Looking for folded print? See:{" "}
            <Link href="/products/brochures" className="text-[#16C2F3] underline font-medium">
              Brochures (tri-fold &amp; half-fold)
            </Link>
            {" · "}
            <Link href="/products/business-cards" className="text-[#16C2F3] underline font-medium">
              Business cards
            </Link>
            {" · "}
            <Link href="/products/postcards" className="text-[#16C2F3] underline font-medium">
              Postcards
            </Link>
            {" — all printed in-house on the same Konica Minolta press."}
          </p>
        </>
      }
      products={[
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Business Cards", from: "from $45", slug: "business-cards" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
      ]}
      whyPoints={[
        "80lb or 100lb gloss — exact pricing for both, no hidden upcharges",
        "Double-sided printing included at no extra charge",
        "100 minimum — price per flyer drops at 250, 500, and 1,000+",
        "In-house Konica Minolta digital press — consistent colour, fast turnaround",
        "Same-day rush for +$40 flat when ordered before 10 AM",
        "In-house designer for layouts, menus, and event programs — from $35",
      ]}
      faqs={[
        {
          q: "How much does flyer printing cost in Saskatoon?",
          a: "Flyers at True Color start at $45 for 100 on 80lb gloss. 250 flyers is $110, 500 is $135, and 1,000 is $185. Upgrading to 100lb paper: 250 is $130, 500 is $185, 1,000 is $325. Use the estimator at /products/flyers for exact pricing.",
        },
        {
          q: "What is the minimum order for flyers?",
          a: "100 flyers is the minimum. For very small runs (under 50), consider printed postcards or business cards instead — both are available with no large minimum.",
        },
        {
          q: "What's the difference between 80lb and 100lb flyer paper?",
          a: "80lb gloss is the standard for everyday flyers — crisp colour, good stiffness, cost-effective. 100lb gloss is noticeably heavier and feels more premium in hand. For restaurant menus, medical office handouts, and real estate materials, 100lb signals quality. Both are available at the same standard quantities.",
        },
        {
          q: "How long does flyer printing take?",
          a: "Standard turnaround is 1–2 business days after artwork approval. Same-day rush is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity.",
        },
        {
          q: "What file format do I need for flyers?",
          a: "PDF at 150 dpi minimum (at the print size) is preferred. High-res PNG or JPG also accepted. Bleed of 1/8\" on all sides for full-bleed designs. No file? Our in-house designer handles layouts from a rough concept — starting at $35.",
        },
        {
          q: "Do flyers come double-sided?",
          a: "Yes — double-sided (front + back) is standard and included in the base price. Single-sided flyers are available on request at a reduced rate.",
        },
        {
          q: "Can I get flyers in custom sizes?",
          a: "Letter (8.5×11\") is our standard size. Half-letter (5.5×8.5\"), legal (8.5×14\"), and fully custom dimensions are available on request. Call (306) 954-8688 or use the quote form online for custom sizes.",
        },
        {
          q: "What's the difference between a flyer and a brochure?",
          a: "Flyers are single flat sheets — no folding. Brochures are folded (tri-fold or half-fold) and printed on heavier 100lb paper with a more polished, professional format. Flyers are better for mass distribution; brochures are better for detailed service menus, property packages, and clinic take-homes.",
        },
      ]}
    />
  );
}
