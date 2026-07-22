"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  GALLERY_CATEGORIES,
  GALLERY_PRODUCT_HREFS,
  PUBLISHED_GALLERY_PROJECTS,
  type GalleryProject,
} from "@/lib/data/gallery-projects";
import { PRODUCTS } from "@/lib/data/products-content";
import { trackSelectItem } from "@/lib/analytics";

type DisplayItem = Pick<
  GalleryProject,
  | "id"
  | "src"
  | "width"
  | "height"
  | "title"
  | "caption"
  | "alt"
  | "category"
  | "productSlug"
  | "productHref"
  | "priceLabel"
>;

function catalogPriceLabel(productSlug: string, fallback = "See current price"): string {
  const fromPrice = PRODUCTS[productSlug]?.fromPrice;
  return fromPrice && fromPrice !== "Coming Soon" ? `from ${fromPrice}` : fallback;
}

const PRODUCT_SHOWCASE: readonly DisplayItem[] = [
  {
    id: "product-coroplast-yard-sign",
    src: "/images/products/product/coroplast-yard-sign-800x600.webp",
    width: 800,
    height: 600,
    title: "Coroplast Signs",
    caption: "Coroplast Signs",
    alt: "Coroplast signs printed by True Color Display Printing in Saskatoon",
    productSlug: "coroplast-signs",
    priceLabel: catalogPriceLabel("coroplast-signs"),
    productHref: GALLERY_PRODUCT_HREFS["coroplast-signs"],
    category: "Signs",
  },
  {
    id: "product-coroplast-job-site",
    src: "/images/products/product/coroplast-job-site-800x600.webp",
    width: 800,
    height: 600,
    title: "Job Site Signs",
    caption: "Job Site Signs",
    alt: "Job site signs printed by True Color Display Printing in Saskatoon",
    productSlug: "coroplast-signs",
    priceLabel: catalogPriceLabel("coroplast-signs"),
    productHref: GALLERY_PRODUCT_HREFS["coroplast-signs"],
    category: "Signs",
  },
  {
    id: "product-vinyl-banner",
    src: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    width: 800,
    height: 600,
    title: "Vinyl Banners",
    caption: "Vinyl Banners",
    alt: "Vinyl banner printing example from True Color Display Printing in Saskatoon",
    productSlug: "vinyl-banners",
    priceLabel: catalogPriceLabel("vinyl-banners"),
    productHref: GALLERY_PRODUCT_HREFS["vinyl-banners"],
    category: "Banners",
  },
  {
    id: "product-aluminum-sign",
    src: "/images/products/product/acp-aluminum-sign-800x600.webp",
    width: 800,
    height: 600,
    title: "Aluminum Composite Signs",
    caption: "Aluminum Composite Signs",
    alt: "Aluminum composite sign printed by True Color Display Printing in Saskatoon",
    productSlug: "acp-signs",
    priceLabel: catalogPriceLabel("acp-signs"),
    productHref: GALLERY_PRODUCT_HREFS["acp-signs"],
    category: "Signs",
  },
  {
    id: "product-vehicle-magnets",
    src: "/images/products/product/vehicle-magnets-800x600.webp",
    width: 800,
    height: 600,
    title: "Vehicle Magnets",
    caption: "Vehicle Magnets",
    alt: "Vehicle magnet printing example from True Color Display Printing in Saskatoon",
    productSlug: "vehicle-magnets",
    priceLabel: catalogPriceLabel("vehicle-magnets"),
    productHref: GALLERY_PRODUCT_HREFS["vehicle-magnets"],
    category: "Magnets",
  },
  {
    id: "product-business-cards",
    src: "/images/products/product/business-cards-800x600.webp",
    width: 800,
    height: 600,
    title: "Business Cards",
    caption: "Business Cards",
    alt: "Business cards printed by True Color Display Printing in Saskatoon",
    productSlug: "business-cards",
    priceLabel: catalogPriceLabel("business-cards"),
    productHref: GALLERY_PRODUCT_HREFS["business-cards"],
    category: "Cards & Print",
  },
  {
    id: "product-flyers",
    src: "/images/products/product/flyers-stack-800x600.webp",
    width: 800,
    height: 600,
    title: "Flyers",
    caption: "Flyers",
    alt: "Flyers printed by True Color Display Printing in Saskatoon",
    productSlug: "flyers",
    priceLabel: catalogPriceLabel("flyers"),
    productHref: GALLERY_PRODUCT_HREFS.flyers,
    category: "Cards & Print",
  },
  {
    id: "product-foamboard-display",
    src: "/images/products/product/foamboard-display-800x600.webp",
    width: 800,
    height: 600,
    title: "Foamboard Displays",
    caption: "Foamboard Displays",
    alt: "Foamboard display printed by True Color Display Printing in Saskatoon",
    productSlug: "foamboard-displays",
    priceLabel: catalogPriceLabel("foamboard-displays"),
    productHref: GALLERY_PRODUCT_HREFS["foamboard-displays"],
    category: "Displays",
  },
  {
    id: "product-retractable-banner",
    src: "/images/products/product/retractable-stand-600x900.webp",
    width: 600,
    height: 900,
    title: "Retractable Banner Stand",
    caption: "Retractable Banner Stand",
    alt: "Retractable banner stand from True Color Display Printing in Saskatoon",
    productSlug: "retractable-banners",
    priceLabel: catalogPriceLabel("retractable-banners"),
    productHref: GALLERY_PRODUCT_HREFS["retractable-banners"],
    category: "Displays",
  },
];

function GalleryCard({ item, isLCP = false }: { item: DisplayItem; isLCP?: boolean }) {
  const priceLabel = item.category === "Shop"
    ? item.priceLabel
    : catalogPriceLabel(item.productSlug, item.priceLabel);

  return (
    <figure className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <Link
        href={item.productHref}
        onClick={() =>
          trackSelectItem({
            item_id: item.id,
            item_name: item.title,
            item_category: item.category,
            placement: "gallery",
            destination: item.productHref,
          })
        }
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
        aria-label={`${item.title}: see pricing`}
      >
        <div className="overflow-hidden bg-gray-100">
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={isLCP}
          />
        </div>
        <figcaption className="p-4">
          <p className="text-sm font-bold leading-snug text-[#1c1712]">{item.caption}</p>
          <p className="mt-1 text-xs font-semibold text-[#0899c2]">
            {priceLabel} — See price →
          </p>
        </figcaption>
      </Link>
    </figure>
  );
}

const INITIAL_COUNT = 12;

export function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMore, setShowMore] = useState(false);
  const [showAllWork, setShowAllWork] = useState(false);

  const filtered =
    activeCategory === "All"
      ? PUBLISHED_GALLERY_PROJECTS
      : PUBLISHED_GALLERY_PROJECTS.filter((item) => item.category === activeCategory);

  const hasMore =
    activeCategory === "All" && !showAllWork && filtered.length > INITIAL_COUNT;

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" aria-label="Filter real client work">
        {GALLERY_CATEGORIES.map((category) => {
          const count =
            category === "All"
              ? PUBLISHED_GALLERY_PROJECTS.length
              : PUBLISHED_GALLERY_PROJECTS.filter((item) => item.category === category).length;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => {
                setActiveCategory(category);
                setShowAllWork(false);
              }}
              className={`min-h-[44px] cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? "bg-[#16C2F3] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
              <span
                className={`ml-1.5 text-xs ${
                  activeCategory === category ? "text-white/80" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, index) => {
          const collapsed = activeCategory === "All" && !showAllWork && index >= INITIAL_COUNT;

          return (
            <div key={item.id} className={collapsed ? "hidden" : "contents"}>
              <GalleryCard item={item} isLCP={index === 0} />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-gray-400">No items in this category yet.</p>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAllWork(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-7 py-3 font-semibold text-gray-600 transition-colors hover:border-[#16C2F3] hover:text-[#16C2F3]"
          >
            Show All {filtered.length} Projects →
          </button>
        </div>
      )}

      {!showMore ? (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-7 py-3 font-semibold text-gray-600 transition-colors hover:border-[#16C2F3] hover:text-[#16C2F3]"
          >
            View Product Showcase →
          </button>
        </div>
      ) : (
        <section className="mt-12" aria-labelledby="product-showcase-heading">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="product-showcase-heading" className="text-2xl font-bold text-[#1c1712]">
              Product Showcase
            </h2>
            <button
              type="button"
              onClick={() => setShowMore(false)}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              ← Show Less
            </button>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_SHOWCASE.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
