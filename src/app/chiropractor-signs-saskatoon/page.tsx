import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Chiropractor Signs Saskatoon | Displays & Cards | True Color" },
  description:
    "Foamboard displays, retractable banners, and referral cards for Saskatoon chiropractors and physiotherapists. From $10/sqft. In-house designer $35. Local pickup.",
  alternates: { canonical: "/chiropractor-signs-saskatoon" },
  openGraph: {
    title: "Chiropractor Signs Saskatoon | True Color Display Printing",
    description:
      "Reception displays, retractable banners, and referral business cards for Saskatoon chiropractic and physiotherapy clinics. Same-day rush +$40 flat.",
    url: "https://truecolorprinting.ca/chiropractor-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      New patients decide whether to come back before they sit down — and your reception area
      signage is part of that first impression. Foamboard displays from $10/sqft are the standard
      for chiropractic reception areas — service menus, new patient intake info, and seasonal
      promotion boards print on lightweight 3/16&quot; board that hangs easily or stands in a
      frame. A full 18×24&quot; display starts at $45. Our in-house Roland UV printer produces
      accurate colour across every piece, so your brand reads consistently from the front window
      to the treatment room door.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Retractable banner stands from $219 are the most effective single investment for a new
      clinic opening or referral program launch. A 24×80&quot; stand in your reception area
      announces new patient specials — or set one up at a health fair to bring in walk-in traffic.
      Business cards are the backbone of a referral program: 250 two-sided cards for $45, ready
      in 1–3 business days. Print a batch for every practitioner in the clinic. New patient
      promo flyers run $45 for 100 copies on gloss stock. Same-day rush is +$40 flat when
      ordered before 10 AM.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our in-house designer handles all layout for $35 flat with a same-day proof — from referral
      card design to window decal sizing. Window decals from $11/sqft make your storefront
      identifiable from the street. For broader healthcare signage context,{" "}
      <Link
        href="/healthcare-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        see our healthcare signage page
      </Link>
      . Ordering for a dental clinic or medical office?{" "}
      <Link
        href="/dental-office-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        Visit our dental office signs page
      </Link>{" "}
      for ACP suite signs and batch business card ordering.
    </p>
  </>
);

export default function ChiropractorSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="chiropractor-signs-saskatoon"
      primaryProductSlug="foamboard-displays"
      title="Chiropractor Signs Saskatoon"
      subtitle="Reception displays, referral cards, and retractable banners for Saskatoon chiropractic and wellness clinics."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Foamboard displays and retractable banners for Saskatoon chiropractic and physiotherapy clinics printed by True Color Display Printing"
      description="New patients decide whether to come back before they sit down — your reception signage is part of that first impression. Foamboard displays from $10/sqft for service menus and seasonal promos. Retractable banners from $219 for reception areas and health fairs. Business cards 250 for $45 — the backbone of a referral program. Window decals from $11/sqft for storefront visibility. In-house designer $35 flat, same-day proof. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Foamboard reception displays from $10/sqft — exact colour on every service menu, promotion board, and intake sign",
        "Retractable banner stands from $219 — new patient specials and referral programs visible to every waiting patient",
        "250 referral business cards for $45 — print a batch per practitioner so every patient leaves with one",
        "Window decals from $11/sqft — patients spot your clinic from the street before they look it up",
        "New patient promo flyers — 100 copies for $45 on gloss stock, ready in 1–3 business days",
        "In-house designer $35 flat — referral card layout, service menu design, same-day proof",
        "Same-day rush +$40 flat — order before 10 AM for same-day completion",
      ]}
      faqs={[
        {
          q: "What signage do Saskatoon chiropractors typically order from True Color?",
          a: "The most common orders are: foamboard service menu displays for reception (from $10/sqft, 18×24\" starts at $45), retractable banner stands for new patient promotions ($219 Economy), referral business cards (250 for $45), window decals for storefront visibility (from $11/sqft), and new patient flyers for community distribution (100 for $45).",
        },
        {
          q: "What is the best display for a chiropractic reception area?",
          a: "3/16\" foam board is the standard — lightweight, clean edges, easy to hang or stand in an easel frame. Common uses: service and treatment menu, new patient welcome board, insurance and billing information, and seasonal promotion posters. 18×24\" starts at $45. Reprint seasonally without a large investment.",
        },
        {
          q: "How do retractable banners support a referral program?",
          a: "A 24×80\" retractable stand at $219 placed in your reception area is a passive referral prompt every patient sees during their visit. Common messages: \"Refer a friend — first visit free\", \"We accept WCB and SGI\", or \"Ask about our wellness packages\". Stands include carry case and replacement graphics are available separately.",
        },
        {
          q: "What business card quantity should a chiropractic clinic order for a referral campaign?",
          a: "Most clinics order 250 cards per practitioner (from $45) to start a referral program. If you have 3 practitioners and run a 6-month campaign, order 500 per person ($65 two-sided). We keep your files on record for fast reorders. Batch orders for the whole clinic get one proof round and one invoice.",
        },
        {
          q: "Can you design a service menu display for our clinic's treatment offerings?",
          a: "Yes — our in-house designer builds service menu layouts for $35 flat with a same-day proof. Bring your treatment list, pricing (if displayed), and brand colours. We size the layout for your reception wall space and prepare it for foam board printing. Standard turnaround 1–3 business days.",
        },
        {
          q: "What window decal options work for a physiotherapy or massage clinic?",
          a: "Window decals from $11/sqft (minimum $45) are common for health and wellness storefronts. Options include frosted privacy panels for treatment room windows, full-colour logo and hours graphics for the front door, and promotional decals for seasonal campaigns. All are removable without residue.",
        },
        {
          q: "How fast can you print new patient flyers for a clinic promotion?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm. 100 flyers on gloss stock from $45. If you need bulk distribution for a neighbourhood drop or community event, 500 copies run $135.",
        },
        {
          q: "Do you print vinyl banners for health fair booths or community events?",
          a: "Yes — vinyl banners from $8.25/sqft with grommets included. A standard 2×4\' booth banner is $66; a 3×6\' backdrop banner is $135. Order before 10 AM on the business day before your event and use rush turnaround (+$40 flat) to ensure same-day pickup. Bring a table cover design and we can print that too.",
        },
      ]}
    />
  );
}
