import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { getProduct, PRODUCT_SLUGS } from "@/lib/data/products-content";

// Product thumbnail images for "Customers also print" cards
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "vinyl-banners":       "/images/products/product/banner-vinyl-colorful-800x600.webp",
  "coroplast-signs":     "/images/products/product/coroplast-yard-sign-800x600.webp",
  "vehicle-magnets":     "/images/products/product/vehicle-magnets-800x600.webp",
  "acp-signs":           "/images/products/product/acp-aluminum-sign-800x600.webp",
  "flyers":              "/images/products/product/flyers-stack-800x600.webp",
  "business-cards":      "/images/products/product/business-cards-800x600.webp",
  "foamboard-displays":  "/images/products/product/foamboard-display-800x600.webp",
  "retractable-banners": "/images/products/product/retractable-stand-600x900.webp",
  "window-decals":       "/images/products/product/vinyl-window-decal-storefront-800x600.webp",
  "window-perf":         "/images/products/product/window-perf-800x600.webp",
  "vinyl-lettering":     "/images/products/product/vinyl-lettering-800x600.webp",
  "stickers":            "/images/products/product/stickers-800x600.webp",
  "postcards":           "/images/products/product/postcards-800x600.webp",
  "brochures":           "/images/products/product/brochures-800x600.webp",
  "photo-posters":       "/images/products/product/photo-posters-800x600.webp",
  "magnet-calendars":    "/images/products/product/magnet-calendars-800x600.webp",
  "coil-bound-booklets": "/images/products/product/coil-bound-booklet-hero-800x600.webp",
};


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} Saskatoon | ${product.fromPrice} | True Color`,
    description: `${product.name} in Saskatoon — ${product.tagline} From ${product.fromPrice}. Order online, local pickup at 216 33rd St W.`,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} Saskatoon | ${product.fromPrice} | True Color`,
      description: `${product.name} in Saskatoon. ${product.tagline} From ${product.fromPrice}. Local pickup at 216 33rd St W.`,
      url: `https://truecolorprinting.ca/products/${slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      locale: "en_CA",
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  // Related products
  const related = product.relatedSlugs.map((s) => getProduct(s)).filter(Boolean);

  // Extract numeric price from fromPrice string (e.g. "$30" → "30")
  const priceNum = product.fromPrice.replace(/[^0-9.]/g, "") || "0";

  // JSON-LD structured data
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    url: `https://truecolorprinting.ca/products/${slug}`,
    image: `https://truecolorprinting.ca${product.heroImage}`,
    brand: { "@type": "Brand", name: "True Color Display Printing" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "29",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      url: `https://truecolorprinting.ca/products/${slug}`,
      price: priceNum,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": ["LocalBusiness", "Store"],
        "@id": "https://truecolorprinting.ca/#localbusiness",
        name: "True Color Display Printing",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://truecolorprinting.ca/" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://truecolorprinting.ca/products" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://truecolorprinting.ca/products/${slug}` },
    ],
  };

  const faqJsonLd = product.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: product.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${product.name} Saskatoon`,
    serviceType: "Print Service",
    description: product.tagline,
    provider: {
      "@type": "LocalBusiness",
      name: "True Color Display Printing",
      url: "https://truecolorprinting.ca",
      telephone: "+13069548688",
      address: {
        "@type": "PostalAddress",
        streetAddress: "216 33rd St W",
        addressLocality: "Saskatoon",
        addressRegion: "SK",
        postalCode: "S7L 0V5",
        addressCountry: "CA",
      },
    },
    areaServed: { "@type": "City", name: "Saskatoon" },
    offers: {
      "@type": "Offer",
      price: priceNum,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-[#1c1712] transition-colors">Home</Link>
          <span>›</span>
          <Link href="/products" className="hover:text-[#1c1712] transition-colors">Products</Link>
          <span>›</span>
          <span className="text-[#1c1712] font-medium">{product.name}</span>
        </nav>

        {/* Interactive product layout — gallery + options + sticky price panel */}
        <div className="mb-8">
          {product.comingSoon ? (
            <div className="border border-amber-200 bg-amber-50 rounded-2xl p-10 text-center">
              <span className="inline-block text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-wide mb-4">
                Coming Soon
              </span>
              <h2 className="text-2xl font-bold text-[#1c1712] mb-3">{product.name}</h2>
              <p className="text-gray-600 max-w-lg mx-auto mb-6">{product.description}</p>
              <p className="text-sm text-gray-400">Pricing and online ordering coming soon. Call <a href="tel:+13069548688" className="text-[#16C2F3] hover:underline">(306) 954-8688</a> to inquire.</p>
            </div>
          ) : (
            <ProductPageClient product={product} />
          )}
        </div>

        {/* Tabs: description, specs, FAQ */}
        <div className="border-t border-gray-100 pt-8 mb-16">
          <ProductAccordion product={product} />
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-10">
            <h2 className="text-xl font-bold text-[#1c1712] mb-6">Customers also print</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {related.map((r) => r && (
                <Link
                  key={r.slug}
                  href={`/products/${r.slug}`}
                  className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-transparent hover:ring-1 hover:ring-[#16C2F3]/30 transition-all duration-200"
                >
                  {PRODUCT_IMAGE_MAP[r.slug] && (
                    <div className="relative h-28 w-full">
                      <Image
                        src={PRODUCT_IMAGE_MAP[r.slug]}
                        alt={`${r.name} — printed in Saskatoon by True Color Display Printing`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-bold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                      {r.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{r.fromPrice}</p>
                    <p className="text-[#16C2F3] text-sm mt-3 font-semibold group-hover:underline">
                      See price →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
