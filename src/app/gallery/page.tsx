import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Our Work | True Color Display Printing Saskatoon",
  description:
    "See real jobs from True Color Display Printing — coroplast signs, vinyl banners, vehicle magnets, business cards and more. Local Saskatoon print shop.",
  alternates: { canonical: "/gallery" },
};

// Gallery items from public/images/products/product/
// Add real job photos here as owner drops them in public/images/gallery/
const GALLERY_ITEMS = [
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

  // ── REAL CLIENT WORK ─────────────────────────────────────────────────────────

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

  // Vehicle Vinyl & Magnets
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

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1712] mb-3">Our Work</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Signs, banners, magnets, cards, and more — all designed, printed, and
            picked up at 216 33rd St W, Saskatoon.
          </p>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GALLERY_ITEMS.map((item, i) => (
            <Link
              key={i}
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
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                <p className="text-white font-bold text-sm">{item.label}</p>
                <p className="text-[#16C2F3] text-xs font-semibold mt-0.5">
                  {item.from} — See price →
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-5 text-lg">
            Like what you see? Your name could be on the next one.
          </p>
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get My Price →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
