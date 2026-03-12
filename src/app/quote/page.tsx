import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/data/products-content";
import { PrintIcon } from "@/components/icons/PrintIcons";

const PRODUCT_IMAGES: Record<string, string> = {
  "coroplast-signs":     "/images/products/product/coroplast-yard-sign-800x600.webp",
  "vinyl-banners":       "/images/products/product/banner-vinyl-colorful-800x600.webp",
  "vehicle-magnets":     "/images/products/product/vehicle-magnets-800x600.webp",
  "business-cards":      "/images/products/product/business-cards-800x600.webp",
  "flyers":              "/images/products/product/flyers-stack-800x600.webp",
  "acp-signs":           "/images/products/product/acp-aluminum-sign-800x600.webp",
  "foamboard-displays":  "/images/products/product/foamboard-display-800x600.webp",
  "window-decals":       "/images/products/product/vinyl-window-decal-storefront-800x600.webp",
  "window-perf":         "/images/products/product/window-perf-800x600.webp",
  "vinyl-lettering":     "/images/products/product/vinyl-lettering-800x600.webp",
  "retractable-banners": "/images/products/product/retractable-stand-600x900.webp",
  "stickers":            "/images/products/product/stickers-800x600.webp",
  "postcards":           "/images/products/product/postcards-800x600.webp",
  "brochures":           "/images/products/product/brochures-800x600.webp",
  "photo-posters":       "/images/products/product/photo-posters-800x600.webp",
  "magnet-calendars":    "/images/products/product/magnet-calendars-800x600.webp",
};

export const metadata: Metadata = {
  title: "Get a Price | Instant Print Pricing Saskatoon",
  description:
    "Instant live pricing on signs, banners, business cards, flyers, magnets and more. No quote forms. No callbacks. See your exact price now.",
  alternates: { canonical: "/quote" },
};

// Product categories for the picker
const PICKER_PRODUCTS = PRODUCT_SLUGS.map((slug) => PRODUCTS[slug]).filter(Boolean);

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1c1712] mb-4 leading-tight">
            What are you printing?
          </h1>
          <p className="text-gray-500 text-lg">
            Pick a product — see your exact price instantly. No forms. No callbacks.
          </p>
        </div>

        {/* Product picker grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
          {PICKER_PRODUCTS.map((product) => {
            const img = PRODUCT_IMAGES[product.slug];
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className="group relative flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:border-[#16C2F3] hover:shadow-md transition-all text-center"
              >
                {product.comingSoon ? (
                  /* Coming soon: icon-only layout */
                  <div className="flex flex-col items-center gap-3 p-6">
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Coming Soon
                    </span>
                    <PrintIcon
                      slug={product.slug}
                      size={36}
                      className="text-[var(--brand)]"
                      aria-hidden={true}
                    />
                    <div>
                      <p className="font-bold text-[#1c1712] text-sm leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs font-semibold mt-1 text-gray-300">—</p>
                    </div>
                  </div>
                ) : img ? (
                  /* Photo-first card */
                  <>
                    <div className="relative h-32 w-full">
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-[#1c1712] text-sm leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs font-semibold mt-1 text-[#16C2F3]">
                        {product.fromPrice}
                      </p>
                    </div>
                  </>
                ) : (
                  /* Fallback: icon-only (slug has no image) */
                  <div className="flex flex-col items-center gap-3 p-6">
                    <PrintIcon
                      slug={product.slug}
                      size={36}
                      className="text-[var(--brand)]"
                      aria-hidden={true}
                    />
                    <div>
                      <p className="font-bold text-[#1c1712] text-sm leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs font-semibold mt-1 text-[#16C2F3]">
                        {product.fromPrice}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Not sure section */}
        <div className="bg-[#f4efe9] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-[#1c1712] mb-3">
            Not sure what you need?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Tell us what you&apos;re trying to accomplish and we&apos;ll recommend the right product.
            Our in-house designer can help with anything from a rough sketch to print-ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+13069548688"
              className="bg-[#1c1712] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-black transition-colors"
            >
              Call (306) 954-8688
            </a>
            <a
              href="mailto:info@true-color.ca"
              className="border border-gray-300 text-gray-700 font-semibold px-7 py-3.5 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
            >
              Email us
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            Walk-ins welcome · 216 33rd St W (upstairs), Saskatoon
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
