import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Pharmacy Signs Saskatoon | Displays & Banners | True Color" },
  description:
    "Foamboard promo displays, flu season banners, and window decals for Saskatoon pharmacies and health stores. From $8/sqft. In-house designer $35. Local pickup.",
  alternates: { canonical: "/pharmacy-signs-saskatoon" },
  openGraph: {
    title: "Pharmacy Signs Saskatoon | True Color Display Printing",
    description:
      "Seasonal health campaign signage for Saskatoon pharmacies — flu shot banners, foamboard displays, window decals, and flyers. Same-day rush +$40 flat.",
    url: "https://truecolorprinting.ca/pharmacy-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Flu shot season opens a narrow window — patients who see your signage walk in; patients who
      don&apos;t walk past. Saskatoon independent pharmacies and health stores use foamboard
      in-store displays from $8/sqft to catch that attention: flu season announcements,
      back-to-school immunization reminders, and spring allergy promotion boards. A 24×36&quot;
      foamboard display starts at $65 — lightweight enough for a countertop easel, durable enough
      for a full season on a wall mount. Our in-house Roland UV printer produces sharp, clean
      graphics that hold up next to name-brand pharmaceutical displays.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Window decals from $11/sqft give your storefront year-round branding while doubling as
      seasonal campaign space — update them for flu season, spring allergy, and back-to-school
      without damaging the glass. Vinyl banners from $8.25/sqft (2×4&apos; for $66) work for
      outdoor promos, vaccination clinic announcements, and entrance signage. Health promotion
      flyers run $45 for 100 copies and drive countertop distribution and community drop campaigns.
      Same-day rush is available for +$40 flat when ordered before 10 AM —
      call (306) 954-8688.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our in-house designer handles seasonal campaign artwork for $35 flat with a same-day proof.
      We keep your files and brand assets on record so updating from flu season to allergy season
      is a quick edit, not a full redesign. For broader healthcare signage options,{" "}
      <Link
        href="/healthcare-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        see our healthcare signs page
      </Link>
      . Need flyers for a health promotion campaign?{" "}
      <Link
        href="/flyer-printing-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        Visit our flyer printing page
      </Link>{" "}
      for paper stock options, sizes, and bulk pricing.
    </p>
  </>
);

export default function PharmacySignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="pharmacy-signs-saskatoon"
      primaryProductSlug="foamboard-displays"
      title="Pharmacy Signs Saskatoon"
      subtitle="Seasonal health campaign displays, window decals, and banners for Saskatoon pharmacies and health stores."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Foamboard displays and vinyl banners for Saskatoon pharmacy seasonal health campaigns printed by True Color Display Printing"
      description="Flu shot season opens a narrow window — patients who see your signage walk in; patients who don't walk past. Saskatoon pharmacies use foamboard displays from $8/sqft for flu season, back-to-school immunizations, and spring allergy campaigns. Window decals from $11/sqft for year-round storefront branding. Vinyl banners from $66 for outdoor vaccination clinic announcements. Health promo flyers 100 for $45. In-house designer $35 flat, same-day proof. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Seasonal foamboard displays from $8/sqft — catch patients during flu season, allergy season, and back-to-school",
        "Window decals from $11/sqft — update seasonally, remove cleanly, no damage to glass",
        "Vinyl banners from $66 — outdoor vaccination clinic and entrance announcements with grommets included",
        "Health promo flyers — 100 for $45, countertop-ready and effective for community distribution",
        "Retractable banner stands from $219 — in-store vaccination clinic setup and health fair use",
        "In-house designer $35 flat — seasonal artwork updated fast between campaigns, same-day proof",
        "Same-day rush +$40 flat — when a vaccination clinic pops up on short notice",
      ]}
      faqs={[
        {
          q: "What signage do Saskatoon pharmacies typically order for flu season?",
          a: "The most common flu season orders are: foamboard in-store displays (24×36\" from $65) for countertop and wall mount, window decals updated with flu shot messaging (from $11/sqft), vinyl banners for the exterior entrance or parking lot announcement (2×4\' for $66), and flyers for countertop distribution (100 for $45).",
        },
        {
          q: "What is the best material for an in-store seasonal promo display?",
          a: "3/16\" foam board is the standard for pharmacy in-store displays — lightweight, reprints affordably each season. 18×24\" from $45, 24×36\" from $65. Mount on a countertop easel, hang on a wall, or use a standing frame. Our Roland UV printer produces sharp health graphics in full colour.",
        },
        {
          q: "Can you print window decals for a seasonal health campaign?",
          a: "Yes — window decals from $11/sqft (minimum $45) are ideal for seasonal pharmacy campaigns. Apply them for flu season in October, update for spring allergy season in March, and back-to-school immunizations in August. All decals are removable without residue, so seasonal updates don&apos;t damage the glass.",
        },
        {
          q: "How fast can you print signage for a vaccination clinic announcement?",
          a: "Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm. Standard turnaround is 1–3 business days after artwork approval. If a walk-in vaccination clinic is announced on short notice, we can have your banners and foamboard displays ready same day.",
        },
        {
          q: "What flyer sizes and quantities work for a pharmacy health promotion?",
          a: "8.5×11\" full-colour gloss flyers are the most common format. 100 copies for $45, 500 for $135. Place them on the counter, include in prescription bags, or use for community drop campaigns. Our designer can create a health promo flyer from your campaign brief for $35 flat.",
        },
        {
          q: "Do you print retractable banners for in-store vaccination clinic setups?",
          a: "Yes — retractable banner stands from $219 are common for vaccination clinic setups within pharmacies and health stores. A 24×80\" stand works well beside the vaccination station or at the pharmacy entrance. The Economy stand ($219) includes print and carry case. Replacement graphics are available when campaigns change.",
        },
        {
          q: "Can we reuse our seasonal signage artwork year over year?",
          a: "Yes — we keep your artwork on file. For annual campaigns like flu season, we pull your existing design, update the dates or any changed messaging, and send a revised proof. No design fee for minor text updates. Full redesigns are $35 flat.",
        },
        {
          q: "Do you print health promotion signage for compounding pharmacies and health stores?",
          a: "Yes — compounding pharmacies and independent health stores are a regular part of our client base. We print custom product promotion displays, specialty service banners (compounding, hormone therapy, specialty formulations), and window branding for health retail storefronts. All printed on our in-house Roland UV at 216 33rd St W, Saskatoon.",
        },
      ]}
    />
  );
}
