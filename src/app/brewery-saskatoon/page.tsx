import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Brewery Signs Saskatoon | Banners & Stickers | True Color" },
  description:
    "Vinyl banners, stickers, and taproom signage for Saskatoon craft breweries and distilleries. Banners from $8.25/sqft, stickers 250 for $325. Same-day rush +$40.",
  alternates: { canonical: "/brewery-saskatoon" },
  openGraph: {
    title: "Brewery Signs Saskatoon | True Color Display Printing",
    description:
      "Taproom banners, beer brand stickers, retractable stands, and window decals for Saskatoon craft breweries. Fast turnaround for seasonal launches and tap events.",
    url: "https://truecolorprinting.ca/brewery-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon craft breweries, taprooms, and distilleries move fast — seasonal beer launches,
      tap takeovers, and patio openings don&apos;t wait for a 2-week print turnaround. True Color
      prints vinyl banners from $8.25/sqft with grommets included, in-house on our Roland UV
      printer, with standard 1–3 business day turnaround. A 3×6&apos; taproom banner is $135.
      A 2×4&apos; patio sign or market booth banner is $66. Same-day rush is available for
      +$40 flat when ordered before 10 AM — your new seasonal release gets wall signage the day
      it taps.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Beer brand stickers are a craft brewery staple — hand them out at the taproom, include
      them in online orders, and use them at Saskatchewan market booths. 250 custom stickers for
      $325, printed on our Roland UV for accurate craft brand colour reproduction. Window decals
      from $11/sqft give your taproom storefront the branded look that gets people curious from
      the street. Retractable banner stands from $219 are the right tool for tap takeovers,
      festival booths, and events where you need branded presence without a permanent install.
      Foamboard menu boards from $10/sqft handle your tap list and seasonal specials in the
      taproom.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our in-house designer works with craft brand aesthetics for $35 flat with a same-day proof
      — whether your brand is rustic-industrial, bright-modern, or minimalist. We keep your
      brand files on record for fast reorders when the next seasonal batch drops. Need stickers
      for your brand?{" "}
      <Link
        href="/sticker-printing-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        See our sticker printing page
      </Link>
      . Running a launch event and need banners?{" "}
      <Link
        href="/event-banners"
        className="text-[#16C2F3] underline font-medium"
      >
        Visit our event banners page
      </Link>{" "}
      for outdoor sizes, hardware options, and rush availability.
    </p>
  </>
);

export default function BrewerySaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="brewery-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Brewery Signs Saskatoon"
      subtitle="Taproom banners, beer brand stickers, and event signage for Saskatoon craft breweries and distilleries."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Vinyl banners, stickers, and taproom signage for Saskatoon craft breweries printed by True Color Display Printing"
      description="Saskatoon craft breweries, taprooms, and distilleries rely on True Color for fast-turnaround signage that keeps up with seasonal launches and tap events. Vinyl banners from $8.25/sqft — 3×6\' taproom banner $135, grommets included. Beer brand stickers 250 for $325 on our Roland UV printer. Window decals from $11/sqft for taproom storefront branding. Retractable stands from $219 for events and tap takeovers. In-house designer $35 flat, same-day proof. Same-day rush +$40 flat. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Stickers", from: "250 for $325", slug: "stickers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "Vinyl banners from $8.25/sqft — seasonal launch banners, taproom decor, patio signs",
        "3×6\' taproom banner for $135 with grommets — ready in 1–3 business days",
        "Beer brand stickers 250 for $325 — Roland UV for accurate craft colour reproduction",
        "Window decals from $11/sqft — taproom storefront branding that drives walk-in traffic",
        "Retractable stands from $219 — tap takeovers, festival booths, market events",
        "Foamboard tap list and menu boards from $10/sqft — easy to update each season",
        "Same-day rush +$40 flat — seasonal release prints the same day it taps",
      ]}
      faqs={[
        {
          q: "What signage do Saskatoon craft breweries typically order from True Color?",
          a: "The most common orders are vinyl banners for taproom walls and seasonal launches (from $8.25/sqft), beer brand stickers for taproom giveaways and market booths (250 for $325), retractable banner stands for tap takeovers and events ($219 Economy), window decals for taproom storefronts (from $11/sqft), and foamboard tap list and menu boards (from $10/sqft).",
        },
        {
          q: "How fast can you print a banner for a seasonal beer launch?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm. A 3×6\' taproom banner is $135 with grommets included. If your seasonal release is tapping Friday, order Thursday before 10 AM with rush for same-day completion.",
        },
        {
          q: "What sticker options do you offer for beer brand merchandise and giveaways?",
          a: "We print custom die-cut and rectangular stickers in any shape on our Roland UV printer for accurate craft brand colour reproduction. 250 stickers for $325. Common brewery uses: beer brand labels for merchandise, tap handle stickers, promotional giveaway stickers for market booths, and pint glass lid stickers for crowler orders.",
        },
        {
          q: "What banner size works best for taproom wall decor?",
          a: "The most popular taproom wall banner sizes are 3×6\' ($135), 4×6\' (approx $198), and 4×8\' (approx $264). All include grommets for easy wall mounting. Retractable banner stands (24×80\", from $219) work better for temporary brand displays that move between events. We can mock up your layout before printing.",
        },
        {
          q: "Do you print signage for outdoor patio spaces and beer gardens?",
          a: "Yes — vinyl banners on heavy-duty scrim vinyl are built for Saskatchewan outdoor conditions. 2×4\' patio signs from $66 with grommets. Coroplast signs from $8/sqft work for directional and outdoor event signage. All outdoor prints use UV-resistant inks through our Roland UV printer for colour longevity in direct sun.",
        },
        {
          q: "Can you design taproom signage if we only have a logo file?",
          a: "Yes — our in-house designer creates taproom signage, tap list boards, and event banners from your logo file for $35 flat with a same-day proof. Bring your brand colours, any specific messaging (beer names, ABV, event details), and any reference images for style direction. We handle the rest.",
        },
        {
          q: "What retractable banner setup works best for a Saskatchewan craft market or festival booth?",
          a: "The Economy 24×80\" stand at $219 is the standard for market booth use — lightweight, quick to set up, and includes a carry case for transport. If you do multiple events, the Deluxe ($299) has a wider, more stable base for outdoor conditions. Order a replacement graphic set for future events without buying a new stand.",
        },
        {
          q: "Do you print window decals for taproom storefronts?",
          a: "Yes — window decals from $11/sqft (minimum $45) are a common order for Saskatoon taprooms. Popular designs include frosted privacy panels, full-colour logo and hours graphics, and seasonal promotion overlays. All decals are removable without residue so you can update for seasonal campaigns without damaging the glass.",
        },
      ]}
    />
  );
}
