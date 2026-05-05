import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Community Printing Saskatoon | Non-Profit & Church | True Color" },
  description:
    "Affordable printing for Saskatoon non-profits, churches, and community events. Banners from $8.25/sqft, coroplast from $8/sqft. Volume pricing available. True Color Display Printing.",
  alternates: { canonical: "/community-printing-saskatoon" },
  openGraph: {
    title: "Community Printing Saskatoon | True Color Display Printing",
    description:
      "Banners, signs, and printed materials for Saskatoon non-profits, churches, and community events. Volume pricing available.",
    url: "https://truecolorprinting.ca/community-printing-saskatoon",
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon non-profits, churches, and community organizations rely on True Color for
      affordable, high-quality printing that makes events and campaigns look professional
      without blowing a tight budget.{" "}
      <Link href="/non-profit-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Non-profit signs
      </Link>{" "}
      for fundraisers, awareness campaigns, and donor recognition.{" "}
      <Link href="/church-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
        Church banners
      </Link>{" "}
      for sermon series, holiday services, and community outreach.{" "}
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Event banners and signs
      </Link>{" "}
      for galas, community fairs, and seasonal celebrations. We print everything in-house —
      no outsourcing, transparent pricing, and volume discounts for organizations that print
      consistently throughout the year.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vinyl banners
      </Link>{" "}
      from $8.25/sqft are the backbone of community event signage — a 4×8 ft backdrop
      banner for a fundraiser gala is $240, and a 2×6 ft street-facing banner is $90.
      Coroplast signs from $8/sqft work for directional wayfinding, volunteer recruitment
      drives, and yard sign campaigns.{" "}
      <Link href="/ramadan-eid-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
        Ramadan and Eid banners
      </Link>{" "}
      for mosques and Islamic community centres are a specialty — culturally accurate
      layouts, Arabic script handling, and fast turnaround before the holy month begins.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-10">
      Flyers from $45 for 100 copies (80lb gloss, 8.5×11) are essential for event promotion,
      community newsletters, and program handouts. Foam board displays from $10/sqft serve
      silent auction tables, donor wall panels, and information stations. Retractable banner
      stands at $219 complete are reusable for recurring annual events. Ask about volume
      pricing for non-profit organizations — call{" "}
      <a href="tel:3069548688" className="text-[#16C2F3] underline font-medium">
        (306) 954-8688
      </a>
      . Local pickup at 216 33rd St W, Saskatoon.
    </p>
  </>
);

export default function CommunityPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="community-printing-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Community Printing Saskatoon"
      subtitle="Banners, signs, and printed materials for non-profits, churches, and community events."
      heroImage="/images/products/heroes/banner-hero-1200x500.webp"
      heroAlt="Community event banners and non-profit signs printed in Saskatoon by True Color Display Printing"
      description="Affordable printing for Saskatoon non-profits, churches, mosques, and community organizations. Vinyl banners from $8.25/sqft. Coroplast signs from $8/sqft. Foam board displays from $10/sqft. Flyers 100 for $45. Retractable banner stands from $219. Volume pricing available for non-profit organizations. In-house printing at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foam Board Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "Vinyl banners from $8.25/sqft — event backdrops, street banners, campaign displays",
        "Coroplast signs from $8/sqft — directional wayfinding, yard signs, volunteer recruitment",
        "Flyers 100 for $45 — event handouts, newsletters, donor appeals on 80lb gloss",
        "Retractable stands from $219 — reusable for recurring annual events",
        "Foam board displays from $10/sqft — donor walls, silent auction tables, info stations",
        "Volume pricing available for non-profits — call (306) 954-8688",
      ]}
      faqs={[
        {
          q: "Do you offer discounts for Saskatoon non-profit organizations?",
          a: "Yes — we offer volume pricing for non-profits that print consistently throughout the year. Call (306) 954-8688 with your organization's name and annual print needs for a quote. We work with a number of Saskatoon charities, shelters, and community organizations and understand that budgets are tight.",
        },
        {
          q: "What signage do Saskatoon churches typically order?",
          a: "The most common church orders are: vinyl banners for sermon series and special services (4×8 ft is $240), coroplast yard signs for holiday drives and community events ($8/sqft), retractable banner stands for the lobby or entrance ($219 complete), flyers for program handouts (100 for $45), and foam board displays for info stations and donor walls ($10/sqft).",
        },
        {
          q: "Can you print Ramadan and Eid banners for Islamic community centres in Saskatoon?",
          a: "Yes — we have experience printing Ramadan and Eid banners with Arabic script and culturally appropriate layouts. We handle custom artwork or work from your existing files. Standard vinyl banners at $8.25/sqft, turnaround 1–3 business days. Call ahead to confirm availability before Ramadan begins.",
        },
        {
          q: "What's the most cost-effective setup for a community fundraiser event in Saskatoon?",
          a: "A cost-effective fundraiser package typically includes: one or two 3×8 ft vinyl backdrop banners ($180 each), a set of coroplast directional signs ($45 minimum for a few pieces), 100–200 flyers ($45–$65), and a retractable stand for registration or information ($219). Total is typically $500–$800 depending on quantity. Volume discounts apply on larger orders.",
        },
        {
          q: "How do I reuse signage for recurring annual community events?",
          a: "Retractable banner stands are reusable — only the print needs replacing. Replacement graphics for an existing stand are $89. Vinyl banners are inexpensive enough to reprint annually for updated dates and themes. We keep your artwork on file so reorders are fast and colour-consistent year over year.",
        },
        {
          q: "Can you print flyers and programs for a community gala or fundraiser dinner?",
          a: "Yes — 80lb gloss flyers start at 100 for $45 (8.5×11 inch, 2-sided). Programs on heavier 14pt gloss are also available. Postcards for save-the-date mailings start at 50 for $40. Our in-house designer can create event layouts from your content for $35 flat with same-day proof.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
      ]}
    />
  );
}
