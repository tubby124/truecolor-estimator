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
    src: "/images/products/product/coroplast-fence-construction-800x600.webp",
    label: "Construction Signage",
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
    src: "/images/products/product/banner-13oz-1200x400.webp",
    label: "Event Banners",
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
    src: "/images/products/product/acp-sign-brick-wall-800x600.webp",
    label: "Exterior ACP Sign",
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
    src: "/images/products/product/magnet-truck-construction-800x600.webp",
    label: "Truck Door Magnets",
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

const CATEGORIES = ["All", "Signs", "Banners", "Magnets", "Cards & Print", "Displays"];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1712] mb-3">Our Work</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Real jobs. Real Saskatoon businesses. Every product shown here was
            designed, printed, and picked up at 216 33rd St W.
          </p>
        </div>

        {/* Category note — static for now, JS filter available if needed */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                cat === "All"
                  ? "bg-[#1c1712] text-white"
                  : "bg-[#f4efe9] text-gray-600"
              }`}
            >
              {cat}
            </span>
          ))}
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

        {/* Add photos note */}
        <div className="mt-12 p-6 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
          <p className="font-medium text-gray-600 mb-1">More photos coming soon</p>
          <p>
            Drop real job photos in{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              public/images/gallery/
            </code>{" "}
            — they&apos;ll appear here automatically.
          </p>
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
