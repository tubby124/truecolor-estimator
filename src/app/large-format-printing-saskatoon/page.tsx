import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Large Format Printing Saskatoon | In-House | True Color" },
  description:
    "Large format printing in Saskatoon — coroplast signs, vinyl banners, ACP aluminum, retractable displays, and foamboard. In-house Roland UV printer, 1–3 day turnaround. 216 33rd St W.",
  alternates: { canonical: "/large-format-printing-saskatoon" },
  openGraph: {
    title: "Large Format Printing Saskatoon | True Color Display Printing",
    description:
      "Coroplast, vinyl banners, ACP aluminum signs, retractable displays — all printed in-house. 1–3 day turnaround in Saskatoon.",
    url: "https://truecolorprinting.ca/large-format-printing-saskatoon",
    type: "website",
  },
};

export default function LargeFormatPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="large-format-printing-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Large Format Printing Saskatoon"
      subtitle="Coroplast signs, vinyl banners, ACP aluminum, and retractable displays — printed in-house on our Roland UV printer."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Large format printing Saskatoon — vinyl banners, coroplast signs, and ACP aluminum signs printed in-house"
      description="True Color Display Printing is Saskatoon's in-house large format print shop. We print coroplast signs, vinyl banners up to any length, aluminum composite (ACP) signs, retractable banner stands, foamboard displays, vehicle magnets, and window graphics entirely on our Roland UV printer — no outsourcing to Calgary or Winnipeg, no supplier delays. Standard turnaround is 1–3 business days. Same-day rush available for +$40 flat."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing is Saskatoon&apos;s in-house large format print shop.
            We print{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>
            ,{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            {" "}up to any length,{" "}
            <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              aluminum composite (ACP) signs
            </Link>
            , retractable banner stands, foamboard displays, vehicle magnets, and window
            graphics entirely on our Roland UV printer — no outsourcing to Calgary or Winnipeg,
            no supplier wait times. Standard turnaround is 1–3 business days.
            Same-day rush is available for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Large format is our core business. Coroplast signs start at $8/sqft for single-sided
            and are the go-to for job sites, yard signage, and outdoor advertising. Vinyl banners
            on 13oz scrim start at $8.25/sqft — wind-resistant, UV-stable, outdoor-rated
            for Saskatchewan seasons. ACP aluminum signs start at $13/sqft and are the
            professional-grade choice for storefronts, permanent outdoor signs, and interior
            wayfinding. All sizes available — from a 1×2 display panel to a 4×8 full-sheet sign.
            We can cut to custom dimensions.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Our in-house Photoshop designer handles files that aren&apos;t print-ready — low-res
            logos, Word documents, rough sketches — and produces professional artwork for $35
            flat with same-day proofs. No outsourcing your design either. We work with
            commercial accounts, marketing agencies, property managers, contractors, retailers,
            and individual business owners. Quantity discounts apply at 10+ and 25+ pieces.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We&apos;re at 216 33rd St W, Saskatoon — local pickup, no shipping risk.
            Use our{" "}
            <Link href="/quote" className="text-[#16C2F3] underline font-medium">
              instant quote tool
            </Link>
            {" "}to get a price in 30 seconds, or call (306) 954-8688.
            Also see our{" "}
            <Link href="/sign-company-saskatoon" className="text-[#16C2F3] underline font-medium">
              sign company Saskatoon
            </Link>
            {" "}page for a full overview of everything we produce.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "Roland UV printer in-house — no outsourcing to Calgary or Winnipeg, ever",
        "Vinyl banners from $8.25/sqft — 13oz scrim, outdoor-rated, any size up to full sheet",
        "Coroplast signs from $8/sqft — 4mm or 6mm flute, single or double-sided",
        "ACP aluminum signs from $13/sqft — professional-grade, outdoor-rated, permanent mounting",
        "Retractable banner stands from $219 — Economy, Deluxe, and Premium options",
        "In-house designer: bring any file, get print-ready artwork from $35 same day",
        "1–3 business day standard turnaround from artwork approval",
        "Quantity discounts at 10+ and 25+ pieces on coroplast, banners, and ACP",
      ]}
      faqs={[
        {
          q: "What large format printing do you offer in Saskatoon?",
          a: "We print: vinyl banners (any size, 13oz scrim, from $8.25/sqft), coroplast signs (from $8/sqft), aluminum ACP signs (from $13/sqft), retractable banner stands (from $219), foamboard displays (from $45), vehicle magnets (from $24/sqft), window decals, and window perf. All printed in-house on our Roland UV printer.",
        },
        {
          q: "How much does large format printing cost in Saskatoon?",
          a: "Prices depend on material and size. A 4×8 coroplast sign is $232 single-sided. A 3×8 vinyl banner is $180. A 4×8 ACP aluminum sign is $320 single-sided. Retractable banners from $219. Quantity discounts start at 10+ pieces. Use the instant quote tool on our website for exact pricing.",
        },
        {
          q: "What's the largest size you can print?",
          a: "Our Roland printer handles rolls up to 54 inches wide for vinyl banners — we can print banners as long as needed by seaming panels. For rigid materials like coroplast and ACP, we cut standard sheets (4×8 ft) and can arrange custom configurations. Call (306) 954-8688 for oversized quote requests.",
        },
        {
          q: "Do you outsource your large format printing?",
          a: "No — everything is printed in-house at our Saskatoon shop at 216 33rd St W. We own and operate a Roland UV printer. No sending jobs to Calgary, no waiting on couriers, no third-party quality issues. We control every step from file to finished print.",
        },
        {
          q: "How long does large format printing take in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Many orders with print-ready files are complete in 1 business day. Same-day rush is +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm availability.",
        },
        {
          q: "Can you handle large commercial orders?",
          a: "Yes — we handle commercial accounts and bulk orders for contractors, property managers, retailers, marketing agencies, and real estate brokerages. Volume discounts apply at 10+ and 25+ pieces. Call (306) 954-8688 or email info@true-color.ca to discuss commercial pricing.",
        },
        {
          q: "What file format do you need for large format printing?",
          a: "Ideal: PDF or AI at 100% size, 100 DPI minimum (150+ preferred for banner-scale). We also accept PSD, EPS, and high-res JPEG/PNG. Don't have a print-ready file? Our in-house designer can prep your artwork from a logo, Word doc, or rough sketch — from $35, proof same day.",
        },
        {
          q: "Where can I get large format printing in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688, info@true-color.ca. We're open Monday to Friday. In-house Roland UV printing, 1–3 day turnaround, in-house designer, same-day rush available.",
        },
      ]}
    />
  );
}
