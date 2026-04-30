// ============================================================================
// WAVE 3C DRAFT — DO NOT MOVE INTO src/app/ UNTIL 2026-05-11 OR LATER
// ============================================================================
// Target slug: /printing-services-saskatoon
// Owns: "printing services saskatoon", "printing services near me",
//       "printing service near me"
// Currently bouncing off homepage at pos 7.83 with 0% CTR
// Anti-cannibalization: B2B services menu angle, hub-links to top-level
// products. Different content angle from /printing-near-me-saskatoon.
// ============================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Printing Services Saskatoon | B2B Print Shop | True Color" },
  description:
    "Full-service Saskatoon printing — banners, signs, business cards, flyers, brochures, stickers, vehicle decals, trade show displays. Roland UV in-house. Pickup at 216 33rd St W.",
  alternates: { canonical: "/printing-services-saskatoon" },
  openGraph: {
    title: "Printing Services Saskatoon | True Color Display Printing",
    description:
      "Saskatoon B2B printing — wide-format, commercial print, vehicle graphics, trade show displays. Roland UV + Konica Minolta in-house. Same-day rush available.",
    url: "https://truecolorprinting.ca/printing-services-saskatoon",
    type: "website",
  },
};

export default function PrintingServicesSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-services-saskatoon"
      title="Printing Services Saskatoon"
      subtitle="Full-service Saskatoon print shop — wide-format, commercial print, vehicle graphics, trade show displays. Roland UV + Konica Minolta in-house. Pickup at 216 33rd St W."
      heroImage="/images/products/product/coroplast-yard-sign-800x600.webp"
      heroAlt="Saskatoon printing services — wide-format and commercial print at True Color Display Printing"
      description="Full printing services in Saskatoon for businesses, contractors, real estate, restaurants, healthcare, agriculture, retail, schools, and non-profits. Wide-format (banners, coroplast, ACP, foamboard, retractable, window vinyl, vehicle graphics, wall graphics) plus commercial print (business cards, flyers, brochures, postcards, stickers, posters, booklets) under one roof. In-house Roland UV printer + Konica Minolta digital press. Same-day rush +$40 flat. In-house designer $35 flat with same-day proof. Standard turnaround 1–3 business days. Local pickup at 216 33rd St W."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing offers full printing services in Saskatoon — one
            shop for wide-format, commercial print, vehicle graphics, and trade show
            displays. We serve Saskatchewan businesses across construction, real estate,
            agriculture, healthcare, retail, restaurants, schools, churches, and
            non-profits. Two production lines run side by side: a{" "}
            <strong>Roland UV printer</strong> for vinyl, rigid materials, and
            decals; and a <strong>Konica Minolta digital press</strong> for paper,
            cards, flyers, and brochures. Single-source means consistent colour across a
            full brand kit — banner + business cards + flyers all match.
          </p>
          <p className="text-gray-600 leading-relaxed">
            <strong>Wide-format services:</strong>{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            (from $66),{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast yard signs
            </Link>{" "}
            (from $30),{" "}
            <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              ACP aluminum signs
            </Link>{" "}
            (from $60),{" "}
            <Link href="/foamboard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              foamboard displays
            </Link>{" "}
            (from $45),{" "}
            <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              retractable banner stands
            </Link>
            ,{" "}
            <Link href="/window-decals-saskatoon" className="text-[#16C2F3] underline font-medium">
              window decals
            </Link>{" "}
            ($11/sqft),{" "}
            <Link href="/vinyl-lettering-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl lettering
            </Link>{" "}
            (from $40),{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            (from $45), and{" "}
            <Link href="/wall-graphics-saskatoon" className="text-[#16C2F3] underline font-medium">
              wall graphics
            </Link>
            .
          </p>
          <p className="text-gray-600 leading-relaxed">
            <strong>Commercial print services:</strong>{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            (250 for $45),{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyers
            </Link>{" "}
            (100 for $45),{" "}
            <Link href="/brochure-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              tri-fold and half-fold brochures
            </Link>
            ,{" "}
            <Link href="/postcard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              postcards
            </Link>
            ,{" "}
            <Link href="/sticker-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              die-cut vinyl stickers
            </Link>{" "}
            (100 for $160),{" "}
            <Link href="/poster-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-colour posters
            </Link>
            , and{" "}
            <Link href="/booklet-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              coil-bound booklets
            </Link>
            .
          </p>
          <p className="text-gray-600 leading-relaxed">
            <strong>B2B fit:</strong> volume discounts on every product line. Net-30
            terms available for established businesses with a{" "}
            <Link href="/quote-request" className="text-[#16C2F3] underline font-medium">
              quote request
            </Link>
            . Wave invoicing with line-item GST/PST breakdown for clean bookkeeping.
            Email packages and PDF proofs sent directly to your project manager. Local
            pickup at 216 33rd St W or shipping across Saskatchewan. Standard turnaround{" "}
            <strong>1–3 business days</strong>; rush <strong>+$40 flat</strong> for
            same-day before 10 AM. In-house designer{" "}
            <strong>$35 flat</strong> if you need artwork built or fixed.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Brochures", from: "from $70", slug: "brochures" },
        { name: "Trade Show Display Kits", from: "from $700", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Two production lines under one roof — Roland UV for wide-format + Konica Minolta for paper, consistent colour across full brand kits",
        "Real prices published on every product — no \"contact for pricing\" runaround",
        "Same-day rush +$40 flat when ordered before 10 AM, on most products",
        "In-house designer $35 flat with same-day digital proof — bring any rough idea, we build the print-ready file",
        "Net-30 terms for established Saskatchewan businesses — Wave-invoiced with line-item GST/PST",
        "Trade show packages: retractable banners + foamboard + business cards + brochures shipped together with one PO",
        "Sole-source means fewer vendors to coordinate for grand openings, rebrands, multi-location rollouts",
      ]}
      faqs={[
        {
          q: "What printing services does True Color offer in Saskatoon?",
          a: "Wide-format: vinyl banners, coroplast yard signs, ACP aluminum, foamboard, retractable banner stands, window decals, vinyl lettering, vehicle magnets, wall graphics. Commercial print: business cards, flyers, brochures, postcards, stickers, photo posters, coil-bound booklets, magnet calendars. All full-colour, in-house, on Roland UV + Konica Minolta presses.",
        },
        {
          q: "Do you offer B2B printing services for Saskatchewan businesses?",
          a: "Yes — volume discounts on every product line, net-30 terms for established accounts (request via /quote-request), Wave invoicing with line-item GST/PST breakdown, multi-product trade show packages, and PDF proofs sent directly to project managers. Common B2B accounts: construction, real estate, healthcare, restaurants, agriculture, retail, schools.",
        },
        {
          q: "How much do printing services cost in Saskatoon?",
          a: "Real entry prices: vinyl banners from $66 (2×4ft), coroplast signs from $30, ACP aluminum from $60, foamboard from $45, vinyl lettering from $40, vehicle magnets from $45, business cards 250 for $45, flyers 100 for $45, brochures from $70, stickers 100 for $160. Volume discounts at 250+, 500+, 1,000+. Same-day rush +$40 flat. Designer $35 flat.",
        },
        {
          q: "Can you handle a full trade show or grand opening package?",
          a: "Yes — retractable banner stand + foamboard easel display + business cards + brochures + take-away stickers can all ship together on one PO. Common kit: 1× retractable ($175), 1× 24×36 foamboard ($45), 250 business cards ($45), 100 brochures ($70), 100 stickers ($160). Total kit ~$495 plus optional $35 design fee. Add 4×8ft coroplast signs for outside pickup signage.",
        },
        {
          q: "What's your turnaround time on commercial print services?",
          a: "Standard 1–3 business days after artwork approval. Same-day rush +$40 flat when ordered before 10 AM (most products qualify). For multi-product orders (e.g. trade show packages), longest-lead-time item sets the schedule. Call (306) 954-8688 to confirm capacity for tight deadlines.",
        },
        {
          q: "Do you offer design services or only printing?",
          a: "Both. In-house designer $35 flat with same-day digital proof. Bring a logo, rough sketch, Word doc, or even a verbal description — we build the print-ready file. Common asks: business card layout, flyer design from a service menu, banner copy from event details, vehicle magnet layout. Logo recreation from a low-res JPG is $75 flat.",
        },
        {
          q: "Do you ship printing across Saskatchewan or only Saskatoon?",
          a: "We ship across SK and AB. Local Saskatoon pickup at 216 33rd St W is preferred for rush jobs (no carrier delays). Common shipping destinations: Regina, Prince Albert, Moose Jaw, Yorkton, Lloydminster, Estevan, Weyburn, North Battleford. Shipping cost depends on size + weight — we quote on the order confirmation.",
        },
        {
          q: "What file format do I need for printing services?",
          a: "PDF at 150 dpi minimum (300 dpi for wide-format banners) is preferred. We also accept Adobe Illustrator (.ai), Photoshop (.psd), EPS, and high-res PNG/JPG. Bleed of 1/8\" on all sides for full-bleed designs. No file? In-house designer $35 flat builds the print-ready file from a rough idea.",
        },
      ]}
    />
  );
}
