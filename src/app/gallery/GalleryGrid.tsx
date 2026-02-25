"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// ── REAL CLIENT WORK ──────────────────────────────────────────────────────────
// TO ADD NEW PHOTOS:
//   1. Drop file into: public/images/gallery/
//   2. Add an entry here in REAL_WORK
const REAL_WORK = [
  // ── Behind the Scenes ──
  {
    src: "/images/gallery/gallery-shop-roland-large-format.jpg",
    label: "Roland TrueVIS — In-House Printing",
    from: "Our Shop",
    slug: "coroplast-signs",
    category: "Shop",
  },
  {
    src: "/images/gallery/gallery-shop-roland-ag-banner.jpg",
    label: "Roland Printing — Agricultural Banner Run",
    from: "Our Shop",
    slug: "vinyl-banners",
    category: "Shop",
  },
  {
    src: "/images/gallery/gallery-shop-roland-saskatoon-cabs.jpg",
    label: "Roland Printing — Saskatoon Cabs Decals",
    from: "Our Shop",
    slug: "stickers",
    category: "Shop",
  },

  // ── Signs ──
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
  {
    src: "/images/gallery/gallery-coroplast-remax-openhouse.jpg",
    label: "Open House Sign — RE/MAX Aman Singh",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-coroplast-71st-storage.jpg",
    label: "Roadside Directional Sign — 71st Street Storage",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-coroplast-parking-signs.jpg",
    label: "Private Parking Signs — Batch Order",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-coroplast-bjm-graduation.jpg",
    label: "Grad Yard Sign — Bishop James Mahoney",
    from: "from $30",
    slug: "coroplast-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-acp-cargem-auto-sales.jpg",
    label: "ACP Sign — CARGEM Auto Sales",
    from: "from $60",
    slug: "acp-signs",
    category: "Signs",
  },
  {
    src: "/images/gallery/gallery-acp-mia-casa-construction.jpg",
    label: "ACP Sign — Mia Casa Construction",
    from: "from $60",
    slug: "acp-signs",
    category: "Signs",
  },

  // ── Banners ──
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
  {
    src: "/images/gallery/gallery-banner-habesha-convenience.jpg",
    label: "Storefront Banner — Habesha Convenience Store",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/gallery/gallery-banner-colorful-nails-spa.jpg",
    label: "Salon Banner — Colorful Nails & Spa",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/gallery/gallery-banner-hello-warman-petshop.jpg",
    label: "Large Format Banner — Hello Warman Pet Shop",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/gallery/gallery-banner-ericsson-5g.jpg",
    label: "Large Format Event Banner — Ericsson 5G",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },
  {
    src: "/images/gallery/gallery-banner-karuna-vitamin.jpg",
    label: "Trade Show Backdrop — Karuna Skincare",
    from: "from $45",
    slug: "vinyl-banners",
    category: "Banners",
  },

  // ── Retractable Banners ──
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
  {
    src: "/images/gallery/gallery-retractable-borna-realtor.jpg",
    label: "Retractable Banner — Borna Development Realtor",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  {
    src: "/images/gallery/gallery-retractable-shammi-realtor.jpg",
    label: "Retractable Banner — Divine Kreation Realty",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  {
    src: "/images/gallery/gallery-retractable-wfg-insurance.jpg",
    label: "Retractable Banner — WFG Insurance Agent",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  {
    src: "/images/gallery/gallery-retractable-two-men-truck.jpg",
    label: "Retractable Banner — Two Men and a Truck",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },
  {
    src: "/images/gallery/gallery-retractable-lilians-hair.jpg",
    label: "Retractable Banner — Lilian's Hair Studio",
    from: "from $219",
    slug: "retractable-banners",
    category: "Displays",
  },

  // ── Vehicle Signage ──
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.jpg",
    label: "Van Vinyl Branding — Ayotte Plumbing",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle",
  },
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-full-side.jpg",
    label: "Full Side Vinyl — Ayotte Service Van",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle",
  },
  {
    src: "/images/gallery/gallery-vehicle-decal-windshield-masters.webp",
    label: "Door Magnet — Windshield Masters",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle",
  },
  {
    src: "/images/gallery/gallery-vehicle-vinyl-south-stream.jpg",
    label: "Truck Wrap — South Stream Seafood",
    from: "from $45",
    slug: "vehicle-magnets",
    category: "Vehicle",
  },
  {
    src: "/images/gallery/gallery-vinyl-lettering-skbk-trailer.jpg",
    label: "Trailer Lettering — SKBK Construction",
    from: "from $40",
    slug: "vinyl-lettering",
    category: "Vehicle",
  },

  // ── Window & Vinyl ──
  {
    src: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    label: "Window Decals — Swiss Barber",
    from: "from $65",
    slug: "window-decals",
    category: "Window & Vinyl",
  },
  {
    src: "/images/gallery/gallery-window-decal-pact-agriculture.jpg",
    label: "Office Window Decals — PACT",
    from: "from $65",
    slug: "window-decals",
    category: "Window & Vinyl",
  },
  {
    src: "/images/gallery/gallery-window-decal-skull-car.jpg",
    label: "Custom Window Decal — Die-Cut Skull",
    from: "from $65",
    slug: "window-decals",
    category: "Window & Vinyl",
  },
  {
    src: "/images/gallery/gallery-vinyl-lettering-cowry-kitchen.jpg",
    label: "Storefront Vinyl Lettering — Cowry Cabinets",
    from: "from $40",
    slug: "vinyl-lettering",
    category: "Window & Vinyl",
  },
  {
    src: "/images/gallery/gallery-vinyl-lettering-mags.jpg",
    label: "Large Cut Vinyl Letters — MAGS",
    from: "from $40",
    slug: "vinyl-lettering",
    category: "Window & Vinyl",
  },

  // ── Cards & Print ──
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
  {
    src: "/images/gallery/gallery-business-cards-nofal-barber.jpg",
    label: "Business Cards — Nofal Barber Shop",
    from: "from $40",
    slug: "business-cards",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-business-cards-lilians-hair.jpg",
    label: "Business Cards — Lilian's Hair Studio",
    from: "from $40",
    slug: "business-cards",
    category: "Cards & Print",
  },
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
  {
    src: "/images/gallery/gallery-flyer-nissen-ramen.jpg",
    label: "Restaurant Flyer — Nissen Dim Sum Ramen",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-flyer-sprayright-agri.jpg",
    label: "Agricultural Flyer — SprayRight",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-flyer-axis-health.jpg",
    label: "Rack Cards — Axis Health Center",
    from: "from $45",
    slug: "flyers",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-postcards-oxenfree-crafts.jpg",
    label: "Postcards — Oxenfree Crafts",
    from: "from $35",
    slug: "postcards",
    category: "Cards & Print",
  },
  {
    src: "/images/gallery/gallery-stickers-dyck-farms.jpg",
    label: "Sticker Sheets — Dyck Farms",
    from: "from $95",
    slug: "stickers",
    category: "Cards & Print",
  },

  // ── Magnets ──
  {
    src: "/images/gallery/gallery-magnet-calendar-shuttle.jpg",
    label: "Calendar Magnet — Prairie Path Shuttle",
    from: "from $45",
    slug: "magnet-calendars",
    category: "Magnets",
  },
  {
    src: "/images/gallery/gallery-magnet-calendar-lyndell-concrete.jpg",
    label: "Calendar Magnet — Lyndell Concrete Supply",
    from: "from $45",
    slug: "magnet-calendars",
    category: "Magnets",
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

const CATEGORIES = [
  "All",
  "Shop",
  "Signs",
  "Banners",
  "Displays",
  "Vehicle",
  "Window & Vinyl",
  "Cards & Print",
  "Magnets",
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMore, setShowMore] = useState(false);

  const filtered =
    activeCategory === "All"
      ? REAL_WORK
      : REAL_WORK.filter((item) => item.category === activeCategory);

  return (
    <>
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "All"
              ? REAL_WORK.length
              : REAL_WORK.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-[#16C2F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
              <span
                className={`ml-1.5 text-xs ${
                  activeCategory === cat ? "text-white/80" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Real client work */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item, i) => (
          <GalleryCard key={i} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">No items in this category yet.</p>
      )}

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
