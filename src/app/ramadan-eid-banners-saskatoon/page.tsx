import type { Metadata } from "next";
import Image from "next/image";
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
      heroImage="/images/seasonal/ramadan/banner-eid-mubarak.png"
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

          {/* Design directions — Vinyl Banners */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">Banner design directions</h3>
            <p className="text-sm text-gray-500 mb-5">Tell us which style fits — or send your own artwork and we&apos;ll match it exactly.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/banner-traditional.png" alt="Traditional Elegance — navy gold Eid banner" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Traditional Elegance</p>
                <p className="text-xs text-gray-500 mt-0.5">Navy, gold calligraphy, lanterns — mosque entrances, formal Eid prayers</p>
              </div>
              <div>
                <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/banner-modern-minimal.png" alt="Modern Minimal — white gold crescent Eid Mubarak banner" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Modern Minimal</p>
                <p className="text-xs text-gray-500 mt-0.5">White, oversized gold crescent — university events, restaurants, professional iftars</p>
              </div>
              <div>
                <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/banner-community-warm.png" alt="Community Warm — sunset Iftar Night 2026 banner" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Community / Warm</p>
                <p className="text-xs text-gray-500 mt-0.5">Sunset gradient, iftar table — community dinners, halal restaurants</p>
              </div>
            </div>
          </div>

          {/* Design directions — Flyers */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">Flyer design directions</h3>
            <p className="text-sm text-gray-500 mb-5">250 glossy flyers from $110 + GST — printed same week.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/flyer-formal-invitation.png" alt="Formal invitation flyer for Iftar Night — cream gold arabesque border" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Formal Invitation</p>
                <p className="text-xs text-gray-500 mt-0.5">Cream, gold arabesque border — university MSA iftars, galas</p>
              </div>
              <div>
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/flyer-bold-announcement.png" alt="Bold announcement flyer for Iftar Night — dark green with food photography" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Bold Announcement</p>
                <p className="text-xs text-gray-500 mt-0.5">Dark green, food photography — community halls, mosque bulletin boards</p>
              </div>
              <div>
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/flyer-sponsorship.png" alt="Sponsorship layout flyer for Ramadan charity iftar — gold tiers" fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Sponsorship Layout</p>
                <p className="text-xs text-gray-500 mt-0.5">Gold/cream, tiered sponsor grid — charity iftars, mosque fundraisers</p>
              </div>
            </div>
          </div>

          {/* Design directions — Retractable Banners */}
          <div>
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">Retractable banner directions</h3>
            <p className="text-sm text-gray-500 mb-5">24×80&quot; stand + print complete from $219 + GST — no separate graphic fee.</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
              <div>
                <div className="relative aspect-[3/8] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/retractable-welcome.png" alt="Welcome display retractable banner stand for Ramadan Iftar Night" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Welcome Display</p>
                <p className="text-xs text-gray-500 mt-0.5">Mosque entrances, event registration desks</p>
              </div>
              <div>
                <div className="relative aspect-[3/8] w-full rounded-lg overflow-hidden mb-3">
                  <Image src="/images/seasonal/ramadan/retractable-sponsor-wall.png" alt="Sponsor recognition wall retractable banner for Ramadan charity gala" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Sponsor Wall</p>
                <p className="text-xs text-gray-500 mt-0.5">Charity galas, mosque fundraisers</p>
              </div>
            </div>
          </div>
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
