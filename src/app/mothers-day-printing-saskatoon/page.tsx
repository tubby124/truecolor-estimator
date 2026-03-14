import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Mother's Day Printing Saskatoon | From $45 | True Color" },
  description:
    "Banners, flyers, photo prints, and window decals for Saskatoon restaurants, spas, and florists. From $45. In-house design $35. Same-day rush +$40. 216 33rd St W.",
  alternates: { canonical: "/mothers-day-printing-saskatoon" },
  openGraph: {
    title: "Mother's Day Printing Saskatoon | True Color Display Printing",
    description:
      "Mother's Day banners, flyers, photo prints, and window decals in Saskatoon from $45. In-house design $35. Same-day rush +$40. 216 33rd St W.",
    url: "https://truecolorprinting.ca/mothers-day-printing-saskatoon",
    type: "website",
  },
};

const designDirections = [
  {
    title: "Vinyl Banners for Mother's Day",
    subtitle: "13oz scrim vinyl from $8.25/sqft — grommets included, any custom size",
    aspect: "3/1" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/mothers-day/banner-floral-brunch.png",
        alt: "Mother's Day vinyl banner for restaurant brunch event — True Color Display Printing, Saskatoon SK",
        label: "Restaurant Brunch Banner",
        caption: "2×6 ft banner — $90",
      },
      {
        src: "/images/industries/mothers-day/banner-spa-wellness.png",
        alt: "Mother's Day spa and wellness promotion banner — True Color Display Printing, Saskatoon SK",
        label: "Spa & Wellness Promo",
        caption: "2×4 ft banner — $66",
      },
      {
        src: "/images/industries/mothers-day/banner-gift-shop.png",
        alt: "Mother's Day retail gift shop banner in Saskatoon — True Color Display Printing",
        label: "Gift Shop Storefront",
        caption: "3×6 ft banner — $135",
      },
    ],
  },
  {
    title: "Photo Prints & Posters",
    subtitle: "Full-colour photo prints on glossy or matte stock — from $10/sqft",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/mothers-day/photo-portrait-poster.png",
        alt: "Large format photo portrait print for Mother's Day gift — True Color Display Printing, Saskatoon SK",
        label: "Photo Portrait Poster",
        caption: "18×24\" — $45",
      },
      {
        src: "/images/industries/mothers-day/photo-family-collage.png",
        alt: "Family photo collage print for Mother's Day in Saskatoon — True Color Display Printing",
        label: "Family Collage Print",
        caption: "24×36\" — $65",
      },
      {
        src: "/images/industries/mothers-day/photo-greeting-postcard.png",
        alt: "Mother's Day photo greeting postcard printed in Saskatoon — True Color Display Printing",
        label: "Photo Greeting Postcard",
        caption: "250 cards (4×6\") — $85",
      },
    ],
  },
  {
    title: "Flyers & Window Decals",
    subtitle: "Flyers from $45 for 100 full-letter · window decals from $11/sqft",
    aspect: "3/4" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/mothers-day/flyer-brunch-menu.png",
        alt: "Mother's Day brunch menu flyer for Saskatoon restaurant — True Color Display Printing",
        label: "Brunch Menu Flyer",
        caption: "100 full-letter, 2S — $45",
      },
      {
        src: "/images/industries/mothers-day/flyer-salon-promo.png",
        alt: "Mother's Day salon promotion flyer in Saskatoon — True Color Display Printing",
        label: "Salon Promotion Flyer",
        caption: "250 full-letter, 2S — $110",
      },
      {
        src: "/images/industries/mothers-day/decal-floral-accent.png",
        alt: "Mother's Day floral window decal for Saskatoon storefront — True Color Display Printing",
        label: "Window Decal",
        caption: "From $45",
      },
    ],
  },
];

export default function MothersDayPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="mothers-day-printing-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Mother's Day Printing Saskatoon"
      subtitle="Banners from $66 · flyers from $45 · photo prints from $45 · window decals from $45. In-house design $35. Same-day rush +$40."
      heroImage="/images/products/product/banner-vinyl-colorful-800x600.webp"
      heroAlt="Mother's Day printing in Saskatoon by True Color Display Printing — vinyl banners, photo prints, flyers, and window decals"
      description="True Color Display Printing offers Mother's Day printing in Saskatoon, Saskatchewan, starting from $45 with 1–3 business day turnaround and in-house design for $35 flat. Vinyl banners start at $8.25/sqft (2×6 ft = $90), photo prints from $45 for an 18×24 inch poster and $65 for 24×36 inch, flyers from $45 for 100 full-letter double-sided, window decals from $11/sqft, and postcards from $35 for 50 cards. In-house Roland UV flatbed printer — True Color Display Printing controls colour, timeline, and quality without outsourcing. Same-day rush available for +$40 flat when ordered before 10 AM. Saskatoon restaurants, spas, salons, florists, and gift shops order banners, photo prints, and flyers from True Color Display Printing at 216 33rd St W, Saskatoon SK. In-house Photoshop designer preps layouts for $35 flat, same-day proof. Order deadline for standard turnaround: May 5, 2026. Same-day rush available up to May 7–8 for +$40 flat — call (306) 954-8688."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing offers Mother&apos;s Day printing in Saskatoon, Saskatchewan, starting from $45 with 1–3 business day turnaround and in-house design for $35 flat. Vinyl banners start at $8.25/sqft (a 2×6 ft banner is $90), photo prints and posters from $45 for 18×24&quot;, flyers from $45 for 100 full-letter double-sided, window decals from $11/sqft, and postcards from $35 for 50 cards. All printing is done in-house on a Roland UV flatbed printer — True Color Display Printing controls colour, timeline, and quality without outsourcing. Same-day rush is available for +$40 flat when ordered before 10 AM at (306) 954-8688.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            We print photos of Mom — portraits, family shots, collages — as large-format{" "}
            <Link href="/photo-poster-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              photo posters
            </Link>{" "}
            on glossy or matte stock from $45 (18×24&quot;) or $65 (24×36&quot;). Bring in a digital file, a phone photo, or a USB drive — True Color&apos;s in-house designer can clean up exposure, crop, and prep the file for $35 flat. These make a memorable last-minute gift and are ready in 1–3 business days, or same day with the +$40 rush.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Saskatoon restaurants, spas, salons, florists, and gift shops order{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>{" "}
            to announce prix fixe brunches and Mother&apos;s Day specials, dress storefronts with seasonal colour, and run{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyers
            </Link>{" "}
            to nearby households ahead of the long weekend. True Color&apos;s in-house Photoshop designer preps layouts from a rough description, logo file, or brand colours for $35 flat — most proofs come back the same day. Design and printing happen at 216 33rd St W, Saskatoon SK S7L 0V5 — no files moving between vendors, no delays.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            The standard order deadline for 1–3 business day turnaround is the Tuesday before Mother&apos;s Day (May 5 for 2026). Same-day rush is available up to May 7–8 for +$40 flat. For{" "}
            <Link href="/foamboard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              foamboard displays
            </Link>{" "}
            ($45 for 18×24&quot;) placed at entrances, or{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              full-letter flyers
            </Link>{" "}
            at $45 for 100 double-sided sheets — all are same-day eligible. Volume discounts on banners: 5% off at 5+, 10% off at 10+, 15% off at 25+. Grommets on every banner at no extra charge.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Need signage for other spring occasions? See:{" "}
            <Link href="/graduation-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              Graduation banners
            </Link>
            {" · "}
            <Link href="/event-banners" className="text-[#16C2F3] underline font-medium">
              Event banners &amp; signage
            </Link>
            {" · "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Banner printing Saskatoon
            </Link>
            {" — each page includes occasion-specific sizing guides and pricing."}
          </p>
          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Photo Posters", from: "from $10/sqft", slug: "photo-posters" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
      ]}
      whyPoints={[
        "Print photos of Mom as large-format posters from $45 — portrait, collage, or family shot",
        "In-house Roland UV flatbed printer — we print, proof, and finish without outsourcing",
        "Design in-house: $35 flat, same-day proof from your logo, photo, or rough description",
        "Same-day rush for +$40 flat when ordered before 10 AM — call (306) 954-8688 to confirm",
        "Volume discount: 5% off at 5+ banners, 10% off at 10+ banners, 15% off at 25+",
        "One shop for everything: banners, photo prints, flyers, window decals, foamboard, and signs",
      ]}
      faqs={[
        {
          q: "How much does Mother's Day printing cost in Saskatoon?",
          a: "True Color Display Printing offers Mother's Day banners from $8.25/sqft (2×6 ft = $90), photo posters from $45 (18×24\") or $65 (24×36\"), flyers from $45 for 100 full-letter double-sided, window decals from $45, and postcards from $35 for 50 cards. In-house design is $35 flat. Same-day rush is +$40 flat.",
        },
        {
          q: "Can you print photos of my mom as a large-format poster?",
          a: "Yes — True Color Display Printing prints family photos, portraits, and collages as large-format posters on glossy or matte stock. An 18×24\" photo print is $45 and a 24×36\" print is $65. Bring a digital file, USB drive, or phone photo — the in-house designer can prep the image for $35 flat. Ready in 1–3 business days, or same day with the +$40 rush.",
        },
        {
          q: "What is the order deadline for Mother's Day 2026?",
          a: "For standard 1–3 business day turnaround, True Color Display Printing recommends placing orders by Tuesday, May 5, 2026 for Mother's Day on May 10. Same-day rush is available May 7–8 for +$40 flat — call (306) 954-8688 before 10 AM to confirm capacity.",
        },
        {
          q: "What printed materials work best for a Mother's Day restaurant promotion?",
          a: "True Color Display Printing recommends vinyl banners (2×6 ft = $90) for storefront visibility, full-letter flyers ($45 for 100 double-sided) for nearby distribution, and foamboard displays ($45 for 18×24\") for lobby or entrance placement. Window decals ($45+) add seasonal colour without permanent adhesive.",
        },
        {
          q: "Can I get same-day Mother's Day printing in Saskatoon?",
          a: "Yes — True Color Display Printing offers same-day rush printing for +$40 flat on orders placed before 10 AM. Call (306) 954-8688 to confirm capacity on the day. Same-day rush is available for banners, flyers, photo prints, and most other products printed at 216 33rd St W, Saskatoon SK.",
        },
        {
          q: "Can I get my Mother's Day printing designed and printed at the same shop?",
          a: "Yes — True Color Display Printing has an in-house Photoshop designer who handles layouts from a rough brief, logo file, brand colours, or photo. Design fee is $35 flat and most proofs come back the same day. Design and printing happen at the same location — 216 33rd St W, Saskatoon SK S7L 0V5 — no files moving between vendors.",
        },
        {
          q: "What's the best banner size for a Mother's Day storefront?",
          a: "The most common Mother's Day banner sizes at True Color Display Printing are 2×6 ft ($90) for a horizontal storefront placement and 2×4 ft ($66) for a fence or patio railing. For wider spans — restaurant patios and event entrances — a 3×6 ft ($135) or 4×8 ft ($240) is standard. Grommets for hanging are included at no extra charge.",
        },
        {
          q: "What file format do I need for Mother's Day printing?",
          a: "True Color Display Printing accepts PDF at 150 dpi minimum (at print size) and JPG files for photos and simpler designs. If you have a low-resolution logo, rough layout, or just a description of what you need, the in-house designer can build the file for $35 flat. Most design proofs are returned the same business day.",
        },
      ]}
    />
  );
}
