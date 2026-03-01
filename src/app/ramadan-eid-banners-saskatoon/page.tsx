import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Ramadan & Eid Banners Saskatoon | Iftar Night Printing | True Color",
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
      // TODO: Replace hero with a Ramadan/community event photo once available
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Ramadan and Eid event banners printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces vinyl banners, flyers, and retractable banner stands for Ramadan and Eid events in Saskatoon. We've printed for local university student associations' Iftar Night dinners, halal restaurants running Ramadan specials, mosques welcoming Eid prayer congregations, and settlement organizations serving newcomer families. Standard turnaround: 48 hours from artwork approval. Same-day rush: +$40 flat, order before 10 AM. In-house Roland UV printer — no outsourcing, no surprises. Local pickup at 216 33rd St W, Saskatoon, Saskatchewan."
      products={[
        { name: "Vinyl Banners", from: "2×6ft from $90", slug: "vinyl-banners" },
        {
          name: "Retractable Banner Stands",
          from: "from $219 complete",
          slug: "retractable-banners",
        },
        { name: "Flyers", from: "250 from $110", slug: "flyers" },
        { name: "Window Decals", from: "from $8/sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "Vinyl banner 2×6ft Iftar dinner banner — $90 + GST, grommets included, ready in 48 hours",
        "4×8ft mosque entrance banner — $216 + GST — most popular size for Eid prayer congregations",
        "250 glossy flyers 8.5×11\" for Ramadan specials or halal store promotions — from $110 + GST",
        "Retractable banner stand with full-colour Eid print — $219 complete, no separate graphic fee",
        "Same-day rush for +$40 flat — order before 10 AM, pick up same day — call (306) 954-8688",
        "We printed Iftar Night posters for a Saskatoon university student association this week",
        "Print any language: Arabic, Urdu, Bengali, French — send outlined PDF and we match it exactly",
      ]}
      faqs={[
        {
          q: "How much do Ramadan and Eid banners cost in Saskatoon?",
          a: "A 2×6 ft Iftar dinner banner is $90 + GST at True Color Display Printing in Saskatoon. A 4×8 ft mosque entrance or Eid prayer banner is $216 + GST. All vinyl banners include hemming and grommets. Volume pricing applies automatically for larger orders.",
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
