import type { Metadata } from "next";
import styles from "./picker.module.css";
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

// Explicitly verified illustrative placements only; unresolved origins stay unlabelled.
// Receipt: docs/operations/MOBILE-VISUAL-MODERNIZATION-20260912.md.
const ILLUSTRATIVE_PICKER_SLUGS = new Set([
  "vinyl-banners", "vehicle-magnets", "acp-signs", "flyers", "business-cards",
  "foamboard-displays", "vinyl-lettering", "coroplast-signs", "retractable-banners",
  "boat-registration-numbers",
]);

// Design services — genuinely not printed products, so they have no estimator.
// These cards link out to the corresponding /[slug]-saskatoon SEO landing page.
//
// The five label cards that used to live here (freezer / product / cosmetic /
// candle & jar / roll) moved into the main grid on 2026-08-06 as real orderable
// products. They are the same vinyl as `stickers` and now price through the live
// sticker engine. See the LABEL FAMILY block in src/lib/data/products-content.ts
// for why their old "from $5.50/sqft" anchor was wrong and must not come back.
type SeoOnlyCard = { name: string; fromPrice: string; href: string; image: string };
const SEO_ONLY_CARDS: SeoOnlyCard[] = [
  {
    name: "Image Upscale",
    fromPrice: "$20 flat",
    href: "/image-upscale-saskatoon",
    image: "/images/products/heroes/image-upscale-hero-1200x500.webp",
  },
  {
    name: "Logo Vectorization",
    fromPrice: "$40 flat",
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
    <div className={styles.picker}>
      <SiteNav />

      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-14">
        {/* Header */}
        <div className="mb-7 text-left sm:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-[#1c1712] mb-3 leading-tight tracking-tight">
            What are you printing?
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Pick a product — see your exact price instantly. No forms. No callbacks.
          </p>
        </div>

        <form
          action="/products"
          className="mb-6 flex flex-col gap-2 rounded-xl border border-[#dedbd6] bg-white p-2 sm:flex-row"
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
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#16C2F3] px-5 font-bold text-[#0f1d2a] transition-colors hover:bg-[#0fb0dd] sm:flex-none"
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
        <div className={`${styles.grid} mb-12`}>
          {pickerProducts.map((product) => {
            const img = PRODUCT_IMAGES[product.slug];
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className={styles.card}
              >
                {product.comingSoon ? (
                  /* Coming soon: icon-only layout */
                  <div className={styles.iconCard}>
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
                      <p className="font-semibold text-[#1c1712] text-base leading-snug">
                        {product.name}
                      </p>
                      <p className="text-sm font-semibold mt-1 text-gray-500">—</p>
                    </div>
                  </div>
                ) : img ? (
                  /* Photo-first card */
                  <>
                    <div className={styles.image}>
                      <Image
                        src={img}
                        alt={`${product.name} — True Color Display Printing Saskatoon`}
                        fill
                        className="object-contain"
                        loading="lazy"
                        sizes="(max-width: 639px) 104px, (max-width: 767px) calc((100vw - 80px) / 3), (max-width: 1023px) calc((100vw - 96px) / 4), 232px"
                      />
                    </div>
                    <div className={styles.details}>
                      <p className="font-semibold text-[#1c1712] text-base leading-snug">
                        {product.name}
                      </p>
                      <p className="text-base font-bold mt-2 text-[#006b8f]">
                        {product.fromPrice}
                      </p>
                      {ILLUSTRATIVE_PICKER_SLUGS.has(product.slug) && (
                        <span data-image-provenance="illustration" className="mt-2 block text-xs leading-4 text-[#655c53]">
                          Product illustration
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  /* Fallback: icon-only (slug has no image) */
                  <div className={styles.iconCard}>
                    <PrintIcon
                      slug={product.slug}
                      size={36}
                      className="text-[var(--brand)]"
                      aria-hidden={true}
                    />
                    <div>
                      <p className="font-semibold text-[#1c1712] text-base leading-snug">
                        {product.name}
                      </p>
                      <p className="text-base font-bold mt-2 text-[#006b8f]">
                        {product.fromPrice}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Design services — not printed products, so no estimator. Link to SEO landing pages. */}
        {seoOnlyCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-[#1c1712] mb-2 text-left">
              Design services
            </h2>
            <p className="text-gray-600 text-sm mb-6 text-left">
              Artwork work, not printing — full details and pricing on each page.
            </p>
            <div className={styles.grid}>
              {seoOnlyCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={styles.card}
                >
                  <div className={styles.image}>
                    <Image
                      src={card.image}
                      alt={`${card.name} — True Color Display Printing Saskatoon`}
                      fill
                      className="object-contain"
                      loading="lazy"
                      sizes="(max-width: 639px) 104px, (max-width: 767px) calc((100vw - 80px) / 3), (max-width: 1023px) calc((100vw - 96px) / 4), 232px"
                    />
                  </div>
                  <div className={styles.details}>
                    <p className="font-semibold text-[#1c1712] text-base leading-snug">
                      {card.name}
                    </p>
                    <p className="text-base font-bold mt-2 text-[#006b8f]">
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
