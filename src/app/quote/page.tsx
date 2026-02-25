import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/data/products-content";

export const metadata: Metadata = {
  title: "Get a Price | True Color Display Printing Saskatoon",
  description:
    "Instant live pricing on signs, banners, business cards, flyers, magnets and more. No quote forms. No callbacks. See your exact price now.",
  alternates: { canonical: "/quote" },
};

// Product categories for the picker
const PICKER_PRODUCTS = PRODUCT_SLUGS.map((slug) => PRODUCTS[slug]).filter(Boolean);

// Icons per product (simple emoji — clean enough for this purpose)
const PRODUCT_ICONS: Record<string, string> = {
  "coroplast-signs": "🪧",
  "vinyl-banners": "🎌",
  "business-cards": "🃏",
  "flyers": "📄",
  "vehicle-magnets": "🧲",
  "acp-signs": "🔲",
  "foamboard-displays": "🖼️",
  "retractable-banners": "📋",
  "window-decals": "🪟",
  "window-perf": "👁️",
  "vinyl-lettering": "✂️",
  "stickers": "🔖",
  "postcards": "📮",
  "brochures": "📑",
  "photo-posters": "🎨",
  "magnet-calendars": "📅",
};

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-5xl mx-auto px-6 py-14">
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
          {PICKER_PRODUCTS.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="group flex flex-col items-center gap-3 p-6 border border-gray-100 rounded-2xl hover:border-[#16C2F3] hover:shadow-md transition-all text-center"
            >
              <span className="text-4xl" role="img" aria-label={product.name}>
                {PRODUCT_ICONS[product.slug] || "🖨️"}
              </span>
              <div>
                <p className="font-bold text-[#1c1712] text-sm leading-tight">
                  {product.name}
                </p>
                <p className="text-[#16C2F3] text-xs font-semibold mt-1">
                  {product.fromPrice}
                </p>
              </div>
            </Link>
          ))}
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
          <p className="text-xs text-gray-400 mt-4">
            📍 Walk-ins welcome · 216 33rd St W (upstairs), Saskatoon
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
