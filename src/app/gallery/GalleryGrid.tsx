"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// ── REAL CLIENT WORK ──────────────────────────────────────────────────────────
// TO ADD NEW PHOTOS:
//   1. Drop file into: public/images/gallery/
//   2. Add an entry here in REAL_WORK
const REAL_WORK = [
  // Banners
  {
    src: "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
    label: "Outdoor Storefront Banner — Best Donairs",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/gallery/gallery-vinyl-banner-windshield-masters.webp",
    label: "Vinyl Banner — Windshield Masters",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  // Vehicle Signage
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.jpg",
    label: "Van Vinyl Branding — Ayotte Plumbing",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle Signage",
  },
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-full-side.jpg",
    label: "Full Side Vinyl — Ayotte Service Van",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle Signage",
  },
  {
    src: "/images/gallery/gallery-vehicle-decal-windshield-masters.webp",
    label: "Door Magnet — Windshield Masters",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle Signage",
  },
  // Coroplast Signs
  {
    src: "/images/gallery/gallery-coroplast-realtor-keyshape.jpg",
    label: "Custom-Shape Sign — Boyes Group Realtor",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-coroplast-circle-made-in-canada.jpg",
    label: "Custom Circle Sign — Made in Canada",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-coroplast-retail-zaks-pricing.jpg",
    label: "Retail Pricing Signs — Zak's",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-design-retail-weve-moving.jpg",
    label: "We're Moving Announcement Sign",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  // Retractable Banners
  {
    src: "/images/gallery/gallery-retractable-banner-financial-office.jpg",
    label: "Retractable Banner — Financial Services",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  {
    src: "/images/gallery/gallery-retractable-banner-client-office.jpg",
    label: "Retractable Banner — Client Delivery",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  // Window Decals
  {
    src: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    label: "Window Decals — Swiss Barber",
    from: "from $65",
    slug: "vinyl-banners",
    category: "Window Decals",
  },
  {
    src: "/images/gallery/gallery-window-decal-pact-agriculture.jpg",
    label: "Office Window Decals — PACT",
    from: "from $65",
    slug: "vinyl-banners",
    category: "Window Decals",
  },
  // Business Cards & Print
  {
    src: "/images/gallery/gallery-business-cards-bd-deep-cleaning.jpg",
    label: "Business Cards — BD Deep Cleaning",
    from: "from $40",
    slug: "business-cards",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-loyalty-card-prairie-cannabis.jpg",
    label: "Loyalty Card — Prairie Cannabis",
    from: "from $40",
    slug: "business-cards",
    category: "Cards & Print",
  },
  // Flyers & Large Format
  {
    src: "/images/gallery/gallery-flyers-boxed-marketing.jpg",
    label: "Marketing Flyers — Boxed Order",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-flyer-pulse-strategies.jpg",
    label: "Professional Flyer — Pulse Strategies CPA",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-large-format-realtor-poster.jpg",
    label: "Large Format Print — Kevin Appl REALTOR",
    from: "from $30",
    slug: "flyers",
    category: "Cards & Print",
  },
  // Magnets
  {
    src: "/images/gallery/gallery-magnet-calendar-shuttle.jpg",
    label: "Calendar Magnet — Prairie Path Shuttle",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Magnets",
  },
  // Behind the Scenes
  {
    src: "/images/gallery/gallery-shop-roland-large-format.jpg",
    label: "Roland TrueVIS — In-House Printing",
    from: "Our Shop",
    slug: "coroplast-signs",
    category: "Behind the Scenes",
  },
];

// ── PRODUCT SHOWCASE (ChatGPT renders) ───────────────────────────────────────
const PRODUCT_SHOWCASE = [
  {
    src: "/images/products/product/coroplast-yard-sign-800x600.webp",
    label: "Coroplast Signs",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/products/product/coroplast-job-site-800x600.webp",
    label: "Job Site Signs",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    label: "Vinyl Banners",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/products/product/acp-aluminum-sign-800x600.webp",
    label: "Aluminum Composite Signs",
    from: "from $60",
    slug: "acp-signs",
    category: "Signs",
  },
  {
    src: "/images/products/product/vehicle-magnets-800x600.webp",
    label: "Vehicle Magnets",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Magnets",
  },
  {
    src: "/images/products/product/business-cards-800x600.webp",
    label: "Business Cards",
    from: "from $40",
    slug: "business-cards",
    category: "Cards & Print",
  },
  {
    src: "/images/products/product/flyers-stack-800x600.webp",
    label: "Flyers",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/products/product/foamboard-display-800x600.webp",
    label: "Foamboard Displays",
    from: "from $45",
    slug: "foamboard-displays",
    category: "Displays",
  },
  {
    src: "/images/products/product/retractable-stand-600x900.webp",
    label: "Retractable Banner Stand",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
];

type GalleryItem = {
  src: string;
  label: string;
  from: string;
  slug: string;
  category: string;
};

function GalleryCard({ item }: { item: GalleryItem }) {
  return (
    <Link
      href={`/products/${item.slug}`}
      className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3]"
    >
      <Image
        src={item.src}
        alt={`${item.label} — True Color Display Printing Saskatoon`}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
        <p className="text-white font-bold text-sm">{item.label}</p>
        <p className="text-[#16C2F3] text-xs font-semibold mt-0.5">
          {item.from} — See price →
        </p>
      </div>
    </Link>
  );
}

export function GalleryGrid() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Real client work — always shown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {REAL_WORK.map((item, i) => (
          <GalleryCard key={i} item={item} />
        ))}
      </div>

      {/* Product showcase — behind "View More" */}
      {!showMore ? (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowMore(true)}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 font-semibold px-7 py-3 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            View Product Showcase →
          </button>
        </div>
      ) : (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1c1712]">Product Showcase</h2>
            <button
              onClick={() => setShowMore(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Show Less
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCT_SHOWCASE.map((item, i) => (
              <GalleryCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
