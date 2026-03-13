import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Banner Printing Saskatoon | From $8.25/sqft | True Color" },
  description:
    "Vinyl banner printing in Saskatoon from $8.25/sqft. Any size, grommets included. Events, storefronts, trade shows. Same-day rush +$40. Pickup 216 33rd St W.",
  alternates: { canonical: "/banner-printing-saskatoon" },
  openGraph: {
    title: "Banner Printing Saskatoon | True Color Display Printing",
    description:
      "Vinyl banners from $8.25/sqft in Saskatoon. Any size, grommets included, same-day rush available.",
    url: "https://truecolorprinting.ca/banner-printing-saskatoon",
    type: "website",
  },
};

export default function BannerPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="banner-printing-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Banner Printing Saskatoon"
      subtitle="13oz vinyl banners from $8.25/sqft. Any size. Grommets included. Same-day rush available."
      heroImage="/images/products/product/banner-vinyl-colorful-800x600.webp"
      heroAlt="Vinyl banner printing in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces 13oz vinyl banners for Saskatoon businesses, events, and organizations. Any custom size, full colour, grommets included as standard. Volume pricing applies automatically — 5% off at 5+ banners, 10% off at 10+ banners, 15% off at 25+ banners. We print in-house on our Roland UV printer, which means faster turnaround and colour consistency you can rely on. Same-day rush available for +$40 flat."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            A vinyl banner is a full-colour print on 13oz scrim vinyl, finished with grommets for hanging — the standard format for outdoor advertising, events, storefronts, and trade shows in Saskatchewan. True Color Display Printing produces custom vinyl banners in Saskatoon from $8.25/sqft, printed in-house on a Roland UV printer with 1–3 business day turnaround. A 2×6 ft banner is $90. Same-day rush available for +$40 flat.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Compared to rigid signage (coroplast or ACP): vinyl banners are lightweight, flexible, and easy to hang from fences, walls, or overhead structures with grommets. Compared to retractable banner stands: outdoor vinyl banners are lower cost per sqft and suited for larger spans. 13oz scrim vinyl is rated 2–3 years outdoor use in prairie UV conditions.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing produces 13oz vinyl banners for Saskatoon businesses, events,
            and organizations. Any custom size, full colour, grommets included as standard. Volume
            pricing applies automatically — 5% off at 5+ banners, 10% off at 10+ banners, 15% off at 25+
            banners. In-house Roland UV printer — faster turnaround, consistent colour. Same-day rush
            available for +$40 flat.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            13oz scrim vinyl is the industry standard for outdoor banners in Saskatchewan. It handles
            wind, rain, and the UV exposure of a prairie summer without curling, peeling, or fading.
            Grommets are set every 24 inches along all four edges as standard — no extra charge, no
            forgetting to ask. For banners that need to hang from a horizontal rod or pipe, pole
            pockets are available on request. Banner stands and retractable pull-ups are also available
            if you need a freestanding display instead.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Saskatoon businesses and organizations use True Color for grand opening banners, seasonal
            storefront promotions, trade show backdrops, Riders game day setups, community event
            signage, school fundraiser banners, and construction site hoardings. Most orders are ready
            in 1–3 business days. If you need it faster, same-day rush is available for a flat +$40
            fee on orders placed before 10 AM — call (306) 954-8688 to confirm capacity.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Need banners for a specific occasion? See:{" "}
            <Link href="/event-banners" className="text-[#16C2F3] underline font-medium">
              Event banners &amp; signage
            </Link>
            {" · "}
            <Link href="/graduation-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              Graduation banners
            </Link>
            {" · "}
            <Link href="/st-patricks-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              St. Patrick&apos;s Day printing
            </Link>
            {" · "}
            <Link href="/ramadan-eid-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              Ramadan &amp; Eid banners
            </Link>
            {" — each page includes occasion-specific sizing guides and pricing."}
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "13oz scrim vinyl — outdoor-rated, wind-resistant, no curling or peeling",
        "Grommets included as standard every 2 ft — no extra charge",
        "Volume discount: 5% off at 5+ banners, 10% off at 10+ banners, 15% off at 25+ banners",
        "Any custom size up to 4 ft wide by any length (split-panel for wider prints)",
        "Same-day rush for +$40 flat when ordered before 10 AM — call to confirm",
        "In-house Roland UV printer — we control colour and timeline, no outsourcing",
      ]}
      faqs={[
        {
          q: "How much does banner printing cost in Saskatoon?",
          a: "Vinyl banners at True Color start at $8.25/sqft. A 2×6 ft banner is $90. A 3×8 ft banner is $180. Volume discounts: 5% off at 5+ banners, 10% at 10+, 15% at 25+. Use the calculator at /products/vinyl-banners to get your exact price.",
        },
        {
          q: "What's included in the banner price?",
          a: "Full-colour printing on 13oz vinyl and grommets every 2 ft are included as standard. Hemming is included. Pole pockets are available on request — mention it in your order notes.",
        },
        {
          q: "How long does banner printing take in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is available for +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm capacity.",
        },
        {
          q: "What's the maximum banner size you print?",
          a: "Standard roll width is 4 ft. For banners wider than 4 ft, we can print in panels and stitch them together. There's no practical length limit. Most event banners are 2–3 ft high by 4–10 ft wide.",
        },
        {
          q: "Can I get a retractable banner stand?",
          a: "Yes — a retractable banner stand with full-colour printing starts at $219. Popular for trade shows, events, and in-store displays. Standard banner stands take a 33×79\" print.",
        },
        {
          q: "What file format do you need for banners?",
          a: "PDF at 150 dpi minimum (at print size). JPG files are accepted for simpler designs. If you have a low-res logo or rough layout, our in-house designer can prep it for $35–$50.",
        },
        {
          q: "Do you print banners for Saskatoon events and trade shows?",
          a: "Yes — event and trade show banners are one of our most common orders. Step-and-repeat backdrops, sponsor banners, entrance banners, booth banners, and directional signage are all standard jobs. For trade show setups, retractable banner stands ($219 complete) are popular because they pack down into a carry bag. See the event banners page for occasion-specific guides.",
        },
        {
          q: "Can I get a banner designed and printed at the same shop?",
          a: "Yes — True Color has an in-house Photoshop designer who handles banner layouts from a rough brief, logo file, or description. Standard layout fee is $35. Most proofs come back same day. Design and print happen in the same building — no files moving between vendors, no delays.",
        },
      ]}
    />
  );
}
