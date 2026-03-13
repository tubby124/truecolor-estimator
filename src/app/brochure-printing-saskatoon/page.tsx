import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Brochure Printing Saskatoon | Tri-Fold | True Color" },
  description:
    "Brochure printing in Saskatoon from $70/100. Tri-fold & half-fold on 100lb gloss, scored & folded in-house. Same-day rush available. Pickup 216 33rd St W.",
  alternates: { canonical: "/brochure-printing-saskatoon" },
  openGraph: {
    title: "Brochure Printing Saskatoon | True Color Display Printing",
    description:
      "Tri-fold and half-fold brochure printing in Saskatoon from $70/100 on 100lb gloss. In-house folding, same-day rush available.",
    url: "https://truecolorprinting.ca/brochure-printing-saskatoon",
    type: "website",
  },
};

export default function BrochurePrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="brochure-printing-saskatoon"
      primaryProductSlug="brochures"
      title="Brochure Printing Saskatoon"
      subtitle="Tri-fold & half-fold brochures from $70/100 on 100lb gloss. Folded and scored in-house."
      heroImage="/images/products/product/brochures-800x600.webp"
      heroAlt="Brochure printing in Saskatoon by True Color Display Printing"
      description="True Color Display Printing prints and folds brochures in Saskatoon from $70 for 100 tri-fold, on 100lb gloss text paper. Tri-fold and half-fold available. Minimum 100 brochures. In-house Konica Minolta digital press with in-house folding and scoring — no outsourcing."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing prints and folds brochures in Saskatoon from $70 for 100
            tri-fold, on 100lb gloss text paper. The 100lb weight is noticeably heavier than standard 80lb flyer paper — thick
            enough to hold a fold without cracking, with a smooth gloss surface that makes full-colour
            images and brand photography pop. Folded and scored in-house on our Konica Minolta digital
            press. Minimum 100 brochures, ready in 2–3 business days.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Choose <strong>tri-fold</strong> (letter fold) for a compact format that fits in pockets
            and brochure rack displays — three equal panels, six printable sides total. Choose{" "}
            <strong>half-fold</strong> for more content space per panel — the sheet folds in half for
            four larger panels, popular for event programs, real estate feature sheets, and medical
            clinic service menus. Select your fold type in the estimator to see exact pricing at your
            quantity.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Common Saskatoon uses: medical and dental clinic service menus, real estate property
            packages, agricultural dealership spec sheets, contractor company overviews, university
            program guides, and non-profit annual reports. Supply a print-ready PDF with 1/8&quot;
            bleed. Need a layout? Our in-house designer handles tri-fold and half-fold setups from $50
            — proofs typically same day.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Need flat printed sheets instead?{" "}
            <Link href="/products/flyers" className="text-[#16C2F3] underline font-medium">
              Flyers (80lb or 100lb)
            </Link>{" "}
            start at $45/100.{" · "}
            <Link href="/products/business-cards" className="text-[#16C2F3] underline font-medium">
              Business cards
            </Link>
            {" · "}
            <Link href="/products/postcards" className="text-[#16C2F3] underline font-medium">
              Postcards
            </Link>
            {" — all printed in-house at 216 33rd St W, Saskatoon."}
          </p>
        </>
      }
      products={[
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "Business Cards", from: "from $45", slug: "business-cards" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
      ]}
      whyPoints={[
        "100lb gloss text — noticeably heavier and more premium than standard flyer paper",
        "Tri-fold and half-fold available — folded and scored in-house, not outsourced",
        "In-house Konica Minolta digital press — consistent colour, sharp images",
        "In-house designer for tri-fold and half-fold layout setup — from $50",
        "Ready in 2–3 business days; same-day rush available for +$40 flat",
        "Minimum 100 brochures — no massive run required",
      ]}
      faqs={[
        {
          q: "How much does brochure printing cost in Saskatoon?",
          a: "Tri-fold brochures at True Color start at $70 for 100, $105 for 250, and $195 for 500. Half-fold brochures add a small upcharge: $85 for 100, $115 for 250, $210 for 500. Use the estimator at /products/brochures for exact pricing.",
        },
        {
          q: "What's the difference between tri-fold and half-fold?",
          a: "Tri-fold divides the 8.5×11\" sheet into 3 equal panels — you get 6 printable sides and a compact format that fits in a pocket or brochure rack. Half-fold folds the sheet in half — you get 4 larger panels (each 5.5×8.5\"), better for content-heavy pieces like event programs or property packages.",
        },
        {
          q: "What is the minimum order for brochures?",
          a: "100 brochures is the minimum. Folding and scoring requires setup time, so below 100 the per-unit cost rises significantly. For small runs under 50 pieces, a flat flyer on heavier paper may be more cost-effective.",
        },
        {
          q: "What paper is used for brochures?",
          a: "Brochures are printed on 100lb gloss text — noticeably heavier than the 80lb paper standard for flyers. The heavier weight holds folds cleanly without cracking and gives the piece a premium feel that signals quality.",
        },
        {
          q: "How do I set up my file for a tri-fold or half-fold?",
          a: "For tri-fold: set up 3 equal panels at 3.67\" wide × 11\" tall on each side of an 8.5×11\" spread, with 1/8\" bleed. For half-fold: 2 panels at 4.25\" wide × 11\" on each side. We can send you a template — just ask. Our in-house designer also sets up layouts from scratch starting at $50.",
        },
        {
          q: "How long does brochure printing take?",
          a: "Standard turnaround is 2–3 business days after artwork approval. Same-day rush is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity.",
        },
        {
          q: "Do you offer Z-fold or accordion-fold brochures?",
          a: "Our standard options are tri-fold and half-fold. Z-fold and accordion-fold are available on request for larger quantities — call (306) 954-8688 to discuss your project.",
        },
        {
          q: "Can the brochure be designed in-house?",
          a: "Yes — our in-house designer handles tri-fold and half-fold brochure layouts from a rough brief, logo file, or existing content. Layout setup fee starts at $50. Most proofs come back same day.",
        },
      ]}
    />
  );
}
