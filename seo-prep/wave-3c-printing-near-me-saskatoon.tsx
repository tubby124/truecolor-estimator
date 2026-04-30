// ============================================================================
// WAVE 3C DRAFT — DO NOT MOVE INTO src/app/ UNTIL 2026-05-11 OR LATER
// ============================================================================
// Target slug: /printing-near-me-saskatoon
// Owns: "printing near me", "print shop near me", "color printing near me",
//       "colour printing near me"
// Anti-cannibalization: hub-links to product pages, never competes for
// product-specific keywords (per targeting-map.md)
// ============================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Printing Near Me Saskatoon | Local Print Shop | True Color" },
  description:
    "Print shop near me in Saskatoon — local pickup at 216 33rd St W. Banners from $66, business cards from $45, flyers from $45, signs from $30. Same-day rush +$40.",
  alternates: { canonical: "/printing-near-me-saskatoon" },
  openGraph: {
    title: "Printing Near Me Saskatoon | True Color Display Printing",
    description:
      "Local Saskatoon print shop — banners, business cards, flyers, signs, stickers. Same-day rush available. Pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/printing-near-me-saskatoon",
    type: "website",
  },
};

export default function PrintingNearMeSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-near-me-saskatoon"
      title="Printing Near Me Saskatoon"
      subtitle="Local print shop at 216 33rd St W — banners, business cards, flyers, signs, stickers. Same-day rush +$40 when ordered before 10 AM. Pickup, no shipping delays."
      heroImage="/images/products/product/banner-vinyl-colorful-800x600.webp"
      heroAlt="Local Saskatoon print shop — True Color Display Printing at 216 33rd St W"
      description="True Color Display Printing is a local Saskatoon print shop at 216 33rd St W — banners, business cards, flyers, signs, stickers, vinyl, vehicle magnets, foamboard, ACP aluminum. Full-colour Roland UV printer in-house. Standard turnaround 1–3 business days. Same-day rush available for +$40 flat when ordered before 10 AM. In-house designer $35 flat with same-day proof. Local pickup means no shipping delays."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Looking for a print shop near you in Saskatoon? True Color Display Printing
            is at <strong>216 33rd St W</strong> — full-colour banners, business cards,
            flyers, signs, stickers, vehicle magnets, ACP aluminum, foamboard displays,
            vinyl lettering, and more. Everything is printed in-house on our Roland UV
            printer. Picked up locally — no shipping delays, no hidden courier fees.
            Standard turnaround <strong>1–3 business days</strong>. Need it today?
            Same-day rush is <strong>+$40 flat</strong> when ordered before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common print runs we handle every day:{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            (from $66 for 2×4ft),{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            (250 for $45),{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyers
            </Link>{" "}
            (100 for $45),{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast yard signs
            </Link>{" "}
            (from $30),{" "}
            <Link href="/sticker-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              die-cut vinyl stickers
            </Link>{" "}
            (100 for $160). Bigger jobs and trade show packages welcome — see{" "}
            <Link href="/sign-company-saskatoon" className="text-[#16C2F3] underline font-medium">
              sign company Saskatoon
            </Link>{" "}
            for the full sign menu.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Don&apos;t have artwork ready? Our in-house designer prepares files for{" "}
            <strong>$35 flat</strong> with same-day digital proof. Bring a logo, a rough
            sketch, or a Word doc — we build the print-ready file. Call{" "}
            <strong>(306) 954-8688</strong> or visit the shop directly. Open Mon–Fri.
            We&apos;re a 5-minute drive from Riversdale, 8th Street, and downtown
            Saskatoon — and we ship across Saskatchewan when local pickup isn&apos;t
            convenient.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Stickers", from: "100 for $160", slug: "stickers" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "Local pickup at 216 33rd St W — no shipping delays, no courier fees",
        "Roland UV printer in-house — same colour quality every run, no outsourcing",
        "Same-day rush +$40 flat when ordered before 10 AM — most jobs out by 4 PM",
        "In-house designer $35 flat with same-day proof — bring any rough idea",
        "Real prices on every product — banners $66, BCs $45, flyers $45, signs $30, stickers $160 (no \"contact for pricing\" runaround)",
        "Saskatoon-owned, family-run — staff who answer the phone are the same people printing your job",
        "Wide format + commercial print under one roof — fewer vendors to coordinate for trade shows + grand openings",
      ]}
      faqs={[
        {
          q: "Where is True Color Display Printing located in Saskatoon?",
          a: "We're at 216 33rd St W (upstairs), Saskatoon SK S7L 0V1. Five-minute drive from downtown, Riversdale, and 8th Street. Free parking on-site. Call (306) 954-8688 to confirm capacity for same-day rush jobs.",
        },
        {
          q: "Do you offer same-day printing in Saskatoon?",
          a: "Yes — same-day production is available for a +$40 flat rush fee when the order is placed before 10 AM. Most products qualify (business cards, flyers, banners, coroplast signs, stickers). Call (306) 954-8688 first to confirm capacity for the day.",
        },
        {
          q: "What does it cost to print at a local Saskatoon shop?",
          a: "Real entry prices: vinyl banners from $66 (2×4ft), business cards from $45 (250), flyers from $45 (100), coroplast signs from $30, die-cut stickers from $160 (100). All include full-colour print. Same-day rush +$40. In-house designer $35 if you need artwork built.",
        },
        {
          q: "Can I bring my file in person, or do I have to email?",
          a: "Both work. Email files to info@true-color.ca, upload via the estimator on truecolorprinting.ca, or bring a USB to the shop. Accepted formats: PDF, AI, EPS, high-res PNG/JPG. PDF at 150 dpi minimum is preferred for everything except large-format banners (300 dpi).",
        },
        {
          q: "What types of printing do you do at True Color?",
          a: "Wide-format (vinyl banners, coroplast yard signs, ACP aluminum signs, foamboard displays, retractable banners, window decals, vinyl lettering, vehicle magnets, wall graphics) and commercial print (business cards, flyers, brochures, postcards, stickers, photo posters, magnet calendars, coil-bound booklets). Everything full-colour, in-house, on a Roland UV printer + Konica Minolta digital press.",
        },
        {
          q: "Do you do colour printing for businesses near me?",
          a: "Yes — every job is full-colour CMYK printed on Roland UV (wide-format, vinyl, rigid materials) or Konica Minolta digital press (paper, business cards, flyers, brochures, stickers). Saskatchewan-based businesses, contractors, real estate, healthcare, restaurants, agriculture, retail — we print across most industries. See sign-company-saskatoon for the full menu.",
        },
        {
          q: "Is True Color cheaper than the chain print shops?",
          a: "On most product runs, yes — we publish real prices and don't pad with retail markup. Banners from $66 for 2×4ft (chain shops typically $90–110). Business cards 250 for $45 (chain shops typically $60–80). The places we are NOT cheapest: bulk paper jobs over 1,000 units (chains have a paper-cost advantage). For everything else — local Saskatoon shop, real numbers, no surprise upcharges.",
        },
        {
          q: "Can I get a quote without giving my email?",
          a: "Yes — call (306) 954-8688 directly and we'll quote on the phone. The website estimator at /products gives instant prices without an email. Email/contact form is only required if you want a written PDF quote attached to your inquiry.",
        },
      ]}
    />
  );
}
