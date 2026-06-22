import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Search } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/data/products-content";
import { PrintIcon } from "@/components/icons/PrintIcons";
import { PRODUCT_IMAGES } from "@/lib/data/productImages";

export const metadata: Metadata = {
  title: "Printing Products — See Prices Instantly | True Color Saskatoon",
  description:
    "Instant live pricing on signs, banners, business cards, flyers, magnets and more. No quote forms. No callbacks. See your exact price now.",
  alternates: { canonical: "/products" },
};

// Product categories for the picker
const PICKER_PRODUCTS = PRODUCT_SLUGS.map((slug) => PRODUCTS[slug]).filter(Boolean);

// SEO-page-only products — no /products/[slug] estimator yet, custom quoting only.
// These cards link out to the corresponding /[slug]-saskatoon SEO landing page.
type SeoOnlyCard = { name: string; fromPrice: string; href: string; image: string };
const SEO_ONLY_CARDS: SeoOnlyCard[] = [
  {
    name: "Freezer Labels",
    fromPrice: "from $5.50/sqft",
    href: "/freezer-labels-saskatoon",
    image: "/images/products/heroes/freezer-labels-hero-1200x500.webp",
  },
  {
    name: "Product Labels",
    fromPrice: "from $5.50/sqft",
    href: "/product-labels-saskatoon",
    image: "/images/products/heroes/product-labels-hero-1200x500.webp",
  },
  {
    name: "Cosmetic Labels",
    fromPrice: "from $5.50/sqft",
    href: "/cosmetic-labels-saskatoon",
    image: "/images/products/heroes/cosmetic-labels-hero-1200x500.webp",
  },
  {
    name: "Candle & Jar Labels",
    fromPrice: "from $5.50/sqft",
    href: "/candle-jar-labels-saskatoon",
    image: "/images/products/heroes/candle-jar-labels-hero-1200x500.webp",
  },
  {
    name: "Roll Labels",
    fromPrice: "custom-quoted",
    href: "/roll-labels-saskatoon",
    image: "/images/products/heroes/roll-labels-hero-1200x500.webp",
  },
  {
    name: "Image Upscale",
    fromPrice: "from $8/sqft",
    href: "/image-upscale-saskatoon",
    image: "/images/products/heroes/image-upscale-hero-1200x500.webp",
  },
  {
    name: "Logo Vectorization",
    fromPrice: "from $50",
    href: "/logo-vectorization-saskatoon",
    image: "/images/products/heroes/logo-vectorization-hero-1200x500.webp",
  },
];

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesProductSearch(product: (typeof PICKER_PRODUCTS)[number], query: string) {
  const haystack = [
    product.name,
    product.tagline,
    product.description,
    product.fromPrice,
    product.category,
    ...product.whoUsesThis,
    ...product.specs.flatMap((spec) => [spec.label, spec.value]),
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function matchesSeoOnlySearch(card: SeoOnlyCard, query: string) {
  return [card.name, card.fromPrice, card.href].join(" ").toLowerCase().includes(query);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawQuery = params.q?.trim() ?? "";
  const query = normalizeSearch(rawQuery);
  const pickerProducts = query
    ? PICKER_PRODUCTS.filter((product) => matchesProductSearch(product, query))
    : PICKER_PRODUCTS;
  const seoOnlyCards = query
    ? SEO_ONLY_CARDS.filter((card) => matchesSeoOnlySearch(card, query))
    : SEO_ONLY_CARDS;
  const hasResults = pickerProducts.length + seoOnlyCards.length > 0;

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

        <form
          action="/products"
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row"
        >
          <label htmlFor="product-search" className="sr-only">
            Search printing products
          </label>
          <input
            id="product-search"
            name="q"
            type="search"
            defaultValue={rawQuery}
            placeholder="Search signs, stickers, banners..."
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 px-4 text-base text-[#1c1712] outline-none transition-colors placeholder:text-gray-400 focus:border-[#16C2F3]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#16C2F3] px-5 font-bold text-white transition-colors hover:bg-[#0fb0dd] sm:flex-none"
            >
              <Search size={18} aria-hidden="true" />
              Search
            </button>
            {rawQuery && (
              <Link
                href="/products"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition-colors hover:border-[#16C2F3] hover:text-[#16C2F3]"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {rawQuery && (
          <p className="mb-6 text-sm text-gray-500">
            {hasResults
              ? `${pickerProducts.length + seoOnlyCards.length} result${pickerProducts.length + seoOnlyCards.length === 1 ? "" : "s"} for "${rawQuery}"`
              : `No products found for "${rawQuery}"`}
          </p>
        )}

        <div className="mb-8 rounded-xl border border-[#16C2F3]/30 bg-[#eefaff] px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-lg font-bold text-[#1c1712]">
              Looking for poster printing in Saskatoon?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Use the poster page for event posters, foamcore mounting, and photo poster options
              from $15.
            </p>
          </div>
          <Link
            href="/poster-printing-saskatoon"
            className="mt-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1c1712] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black sm:mt-0"
          >
            Poster pricing
          </Link>
        </div>

        {/* Product picker grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
          {pickerProducts.map((product) => {
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
                        alt={`${product.name} — True Color Display Printing Saskatoon`}
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

        {/* SEO-page-only products (labels + design services) — link to SEO landing pages */}
        {seoOnlyCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-[#1c1712] mb-2 text-center">
              Labels &amp; design services
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Custom-quoted — get full pricing and specs on each landing page.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {seoOnlyCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group relative flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:border-[#16C2F3] hover:shadow-md transition-all text-center"
                >
                  <div className="relative h-32 w-full bg-[#f8f4ef]">
                    <Image
                      src={card.image}
                      alt={`${card.name} — True Color Display Printing Saskatoon`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-[#1c1712] text-sm leading-tight">
                      {card.name}
                    </p>
                    <p className="text-xs font-semibold mt-1 text-[#16C2F3]">
                      {card.fromPrice}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
