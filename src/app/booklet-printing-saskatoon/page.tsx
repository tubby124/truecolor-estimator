import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Booklet Printing Saskatoon | Coil-Bound | True Color" },
  description:
    "Coil-bound booklet printing in Saskatoon from $1,625 for 25 books. 80lb or 100lb gloss interior, 14pt cover, 12mm black plastic coil. In-house, 3–5 day turnaround. Pickup 216 33rd St W.",
  alternates: { canonical: "/booklet-printing-saskatoon" },
  openGraph: {
    title: "Booklet Printing Saskatoon | Coil-Bound | True Color Display Printing",
    description:
      "Coil-bound booklet printing in Saskatoon. 80lb or 100lb gloss interior, 14pt cover, 12mm plastic coil. From $65/book at 25 copies. In-house production.",
    url: "https://truecolorprinting.ca/booklet-printing-saskatoon",
    type: "website",
  },
};

export default function BookletPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="booklet-printing-saskatoon"
      primaryProductSlug="coil-bound-booklets"
      title="Booklet Printing Saskatoon"
      subtitle="Coil-bound booklets from $65/book. 80lb or 100lb gloss interior, 14pt cover, 12mm plastic coil. In-house production."
      heroImage="/images/products/product/coil-bound-booklet-hero-800x600.webp"
      heroAlt="Coil-bound booklet printing in Saskatoon by True Color Display Printing"
      description="True Color Display Printing prints and binds coil-bound booklets in Saskatoon. 80lb or 100lb gloss interior, 14pt gloss cover, 12mm black plastic coil — printed, cut, punched, and bound in-house at 216 33rd St W. Minimum 25 books."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing prints and binds coil-bound booklets in Saskatoon from $65/book
            (minimum 25 copies). Booklets are printed on 80lb or 100lb gloss text interior pages with a
            14pt gloss coated cover and 12mm black plastic coil — cut, punched, and bound in-house at
            216 33rd St W, Saskatoon. No outsourcing, no shipping delays.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Choose <strong>Premium (80lb Gloss Interior)</strong> for a professional, full-colour
            booklet that holds up to regular handling — the right choice for most government documents,
            training manuals, school handbooks, and conference materials. Choose{" "}
            <strong>Ultra Premium (100lb + Laminated Cover)</strong> for a noticeably thicker interior
            and a gloss laminated cover that resists scuffs and moisture — the standard for government
            program guides, contractor bid packages, and corporate annual reports where quality signals matter.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Standard format is 8.5×11&quot;, double-sided throughout, at approximately 80 pages (40 sheets).
            Custom page counts are available — call or email with your specs and we will quote accordingly.
            Pricing is per-lot: 25 books from $1,625, 50 from $2,750, 100 from $4,800, 250 from $10,000.
            The more you order, the lower the per-book cost — from $65/book down to $40/book.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Need flat printed sheets instead?{" "}
            <Link href="/products/flyers" className="text-[#16C2F3] underline font-medium">
              Flyers (80lb or 100lb)
            </Link>{" "}
            start at $45/100.{" · "}
            <Link href="/brochure-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Tri-fold brochures
            </Link>{" "}
            from $70/100 — all printed in-house at 216 33rd St W, Saskatoon.
          </p>
        </>
      }
      products={[
        { name: "Coil-Bound Booklets", from: "from $1,625", slug: "coil-bound-booklets" },
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "Business Cards", from: "from $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "80lb or 100lb gloss text interior — same press, sharper colour than copy-centre output",
        "12mm black plastic coil — opens completely flat, stays flat through regular use",
        "14pt gloss cover — standard unlaminated (Premium) or gloss laminated (Ultra Premium)",
        "Printed, cut, punched, and bound in-house — no outsourcing, no shipping delays",
        "Ready in 3–5 business days; same-day rush available for +$40 flat",
        "Minimum 25 books — physical sample copy available before full run",
      ]}
      faqs={[
        {
          q: "How much does booklet printing cost in Saskatoon?",
          a: "Coil-bound booklets at True Color start at $1,625 for 25 copies on the Premium (80lb) tier — $65 per book. At 50 copies it's $2,750 ($55/book), at 100 copies $4,800 ($48/book), and at 250 copies $10,000 ($40/book). Ultra Premium (100lb + laminated cover) adds roughly $8–10 per book. Use the estimator at /products/coil-bound-booklets for exact pricing.",
        },
        {
          q: "What is the minimum order for booklet printing?",
          a: "25 books is the minimum. Below that, the per-book cost rises significantly because of setup, binding labour, and the coil punch setup. For single draft copies or presentations, we can do a one-off — call (306) 954-8688 for a one-copy quote.",
        },
        {
          q: "What paper and cover do you use for booklets?",
          a: "Interior pages are printed on 80lb gloss text (Premium) or 100lb gloss text (Ultra Premium). The cover is 14pt gloss coated — standard unlaminated on Premium, or gloss laminated on Ultra Premium. Both use a 12mm black plastic coil binding.",
        },
        {
          q: "What is the difference between Premium and Ultra Premium booklets?",
          a: "Premium uses 80lb gloss text interior pages — vibrant full-colour print, the same weight used for quality flyers. Ultra Premium upgrades to 100lb gloss text, which is noticeably thicker and heavier, plus adds a gloss laminated cover that resists scuffs and moisture. At 100 copies the difference is about $8 per book.",
        },
        {
          q: "How many pages can a coil-bound booklet have?",
          a: "The catalog pricing is based on approximately 80 pages (40 double-sided sheets). If your document is 40 pages, 52 pages, 120 pages, or any other count, email or call with your specs and we will quote it. Pricing adjusts proportionally to the number of sheets.",
        },
        {
          q: "Can I see a sample before committing to the full run?",
          a: "Yes — and we recommend it. We will print one physical copy of your chosen tier at cost before you approve the full order. This is especially useful for Ultra Premium: holding the laminated cover in your hand tends to settle the decision.",
        },
        {
          q: "How do I submit files for booklet printing?",
          a: "Supply a print-ready PDF at 8.5×11\" with 1/8\" bleed on all four sides, double-sided layout throughout. If your file is not set up correctly, drop it off or email it and we will check at no charge before you commit.",
        },
        {
          q: "How long does booklet printing take in Saskatoon?",
          a: "Standard turnaround is 3–5 business days after artwork approval. Same-day rush is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity.",
        },
      ]}
    />
  );
}
