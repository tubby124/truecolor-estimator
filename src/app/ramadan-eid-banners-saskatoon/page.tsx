import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

const designDirections = [
  {
    title: "Banner design directions",
    subtitle: "Tell us which style fits — or send your own artwork and we\u2019ll match it exactly.",
    aspect: "3/1" as const,
    items: [
      { src: "/images/seasonal/ramadan/banner-traditional.webp", alt: "Traditional Elegance — navy gold Eid banner", label: "Traditional Elegance", caption: "Navy, gold calligraphy, lanterns — mosque entrances, formal Eid prayers" },
      { src: "/images/seasonal/ramadan/banner-modern-minimal.webp", alt: "Modern Minimal — white gold crescent Eid Mubarak banner", label: "Modern Minimal", caption: "White, oversized gold crescent — university events, restaurants, professional iftars" },
      { src: "/images/seasonal/ramadan/banner-community-warm.webp", alt: "Community Warm — sunset Iftar Night 2026 banner", label: "Community / Warm", caption: "Sunset gradient, iftar table — community dinners, halal restaurants" },
    ],
  },
  {
    title: "Flyer design directions",
    subtitle: "250 glossy flyers from $110 + GST — printed same week.",
    aspect: "3/4" as const,
    items: [
      { src: "/images/seasonal/ramadan/flyer-formal-invitation.webp", alt: "Formal invitation flyer for Iftar Night — cream gold arabesque border", label: "Formal Invitation", caption: "Cream, gold arabesque border — university MSA iftars, galas" },
      { src: "/images/seasonal/ramadan/flyer-bold-announcement.webp", alt: "Bold announcement flyer for Iftar Night — dark green with food photography", label: "Bold Announcement", caption: "Dark green, food photography — community halls, mosque bulletin boards" },
      { src: "/images/seasonal/ramadan/flyer-sponsorship.webp", alt: "Sponsorship layout flyer for Ramadan charity iftar — gold tiers", label: "Sponsorship Layout", caption: "Gold/cream, tiered sponsor grid — charity iftars, mosque fundraisers" },
    ],
  },
  {
    title: "Retractable banner directions",
    subtitle: "24\u00d780\u2033 stand + print complete from $219 + GST — no separate graphic fee.",
    aspect: "3/8" as const,
    maxCols: 2 as const,
    items: [
      { src: "/images/seasonal/ramadan/retractable-welcome.webp", alt: "Welcome display retractable banner stand for Ramadan Iftar Night", label: "Welcome Display", caption: "Mosque entrances, event registration desks" },
      { src: "/images/seasonal/ramadan/retractable-sponsor-wall.webp", alt: "Sponsor recognition wall retractable banner for Ramadan charity gala", label: "Sponsor Wall", caption: "Charity galas, mosque fundraisers" },
    ],
  },
];

export const metadata: Metadata = {
  title: { absolute: "Ramadan & Eid Banners Saskatoon | From $66 | True Color" },
  description:
    "Ramadan banners, Eid al-Fitr flyers & retractable stands — from $90. Ready in 48 hours. Same-day rush available. Serving Saskatoon mosques, halal restaurants & Islamic schools. Local pickup at 216 33rd St W.",
  keywords: [
    "ramadan banners saskatoon",
    "eid banners saskatoon",
    "iftar banner printing",
    "mosque banners saskatoon",
    "muslim community print saskatoon",
    "eid al-fitr banners",
    "halal restaurant banners",
  ],
  alternates: { canonical: "/ramadan-eid-banners-saskatoon" },
  openGraph: {
    title: "Ramadan & Eid Banners Saskatoon | Iftar Night Printing | True Color",
    description:
      "Vinyl banners from $90, flyers from $110, retractable stands from $219. Printed in 48 hours. Serving Saskatoon mosques, halal restaurants & Islamic schools.",
    url: "https://truecolorprinting.ca/ramadan-eid-banners-saskatoon",
    type: "website",
  },
};

export default function RamadanEidBannersPage() {
  return (
    <IndustryPage
      canonicalSlug="ramadan-eid-banners-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Ramadan & Eid Banners Saskatoon"
      subtitle="Iftar night banners, Eid al-Fitr signage, and community event flyers — printed in 48 hours. Serving Saskatoon mosques, halal restaurants, and Islamic schools."
      heroImage="/images/seasonal/ramadan/banner-eid-mubarak.webp"
      heroAlt="Ramadan and Eid event banners printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces vinyl banners, flyers, and retractable banner stands for Ramadan and Eid events in Saskatoon. We've printed for local university student associations' Iftar Night dinners, halal restaurants running Ramadan specials, mosques welcoming Eid prayer congregations, and settlement organizations serving newcomer families. Standard turnaround: 48 hours from artwork approval. Same-day rush: +$40 flat, order before 10 AM. In-house Roland UV printer — no outsourcing, no surprises. Local pickup at 216 33rd St W, Saskatoon, Saskatchewan."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            True Color Display Printing produces vinyl banners, flyers, and retractable banner stands
            for Ramadan and Eid events in Saskatoon. We&apos;ve printed for local university student
            associations&apos; Iftar Night dinners, halal restaurants running Ramadan specials, mosques
            welcoming Eid prayer congregations, and settlement organizations serving newcomer families.
            Standard turnaround: 48 hours from artwork approval. Same-day rush: +$40 flat, order before
            10 AM. In-house Roland UV printer — no outsourcing, no surprises. Local pickup at 216 33rd
            St W, Saskatoon, Saskatchewan.
          </p>

          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "2×6ft from $90", slug: "vinyl-banners" },
        {
          name: "Retractable Banner Stands",
          from: "from $219 complete",
          slug: "retractable-banners",
        },
        { name: "Flyers", from: "250 from $110", slug: "flyers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "Vinyl banner 2×6ft Iftar dinner banner — $90 + GST, grommets included, ready in 48 hours",
        "4×8ft mosque entrance banner — $240 + GST — most popular size for Eid prayer congregations",
        "250 glossy flyers 8.5×11\" for Ramadan specials or halal store promotions — from $110 + GST",
        "Retractable banner stand with full-colour Eid print — $219 complete, no separate graphic fee",
        "Same-day rush for +$40 flat — order before 10 AM, pick up same day — call (306) 954-8688",
        "We printed Iftar Night posters for a Saskatoon university student association this week",
        "Print any language: Arabic, Urdu, Bengali, French — send outlined PDF and we match it exactly",
      ]}
      faqs={[
        {
          q: "How much do Ramadan and Eid banners cost in Saskatoon?",
          a: "A 2×6 ft Iftar dinner banner is $90 + GST at True Color Display Printing in Saskatoon. A 4×8 ft mosque entrance or Eid prayer banner is $240 + GST. All vinyl banners include hemming and grommets. Volume pricing applies automatically for larger orders.",
        },
        {
          q: "How fast can I get an Eid banner printed in Saskatoon?",
          a: "Standard turnaround is 48 hours from artwork approval. Same-day rush is available for +$40 flat if you order before 10 AM — call (306) 954-8688 to confirm capacity. Most Ramadan and Eid orders are ready within 1–2 business days.",
        },
        {
          q: "Do you print banners for mosques and Islamic community events in Saskatoon?",
          a: "Yes — True Color Display Printing serves mosques, Islamic schools, halal restaurants, and Muslim community organizations in Saskatoon. We've printed Iftar Night event signage and Eid celebration banners for local organizations. We're familiar with the visual standards expected for community events.",
        },
        {
          q: "Can you print Arabic, Urdu, or Bengali text on a banner?",
          a: "Yes — we print any language accurately. Send your artwork as a PDF with text outlined or embedded, and we'll reproduce it exactly. If you need design help with Arabic or Urdu script, our in-house designer can assist for $35–50.",
        },
        {
          q: "What banner size is right for a mosque entrance or Eid prayer hall?",
          a: "4×8 ft (the size of a sheet of plywood) is the most popular size for mosque entrances and outdoor Eid prayer banners in Saskatoon — visible from the street and substantial enough to make an impression. For indoor welcome displays or hallways, a 2×6 ft banner or a 24×80-inch retractable banner stand works well.",
        },
        {
          q: "Can I get Ramadan flyers or halal restaurant promotional flyers printed in Saskatoon?",
          a: "Yes — 250 glossy 8.5×11-inch flyers start at $110 + GST on 80lb stock, or $130 on 100lb premium gloss. Popular for halal restaurant Ramadan specials, community Iftar dinner announcements, and Islamic school event notices. Double-sided printing available.",
        },
        {
          q: "Do you keep my artwork on file for Eid al-Adha or next year's Ramadan?",
          a: "Yes — True Color keeps your print files on record after every order. For Eid al-Adha or Ramadan 2027, you call us, confirm the quantity and size, and we reprint from your saved file. No re-uploading, no design fees, zero lead time.",
        },
      ]}
    />
  );
}
