import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

const INDUSTRY_PRODUCT_IMAGES: Record<string, string> = {
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
};

export interface IndustryProduct {
  name: string;
  from: string;
  slug: string;
}

export interface IndustryPageProps {
  title: string;
  subtitle: string;
  heroImage: string;
  heroAlt: string;
  description: string;
  /** Optional JSX override for description — use when links are needed. `description` is still used for schema. */
  descriptionNode?: React.ReactNode;
  products: IndustryProduct[];
  whyPoints: string[];
  faqs: { q: string; a: string }[];
  /** URL slug for this page (e.g. "coroplast-signs-saskatoon") — used for BreadcrumbList schema */
  canonicalSlug?: string;
  /** Product page slug for the primary CTA (e.g. "coroplast-signs") — links to /products/[slug] estimator */
  primaryProductSlug?: string;
}

export function IndustryPage({
  title,
  subtitle,
  heroImage,
  heroAlt,
  description,
  descriptionNode,
  products,
  whyPoints,
  faqs,
  canonicalSlug,
  primaryProductSlug,
}: IndustryPageProps) {
  const BASE_URL = "https://truecolorprinting.ca";

  // ── Structured data ──────────────────────────────────────────────────────────
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    serviceType: "Print Service",
    provider: {
      "@type": "LocalBusiness",
      name: "True Color Display Printing",
      url: BASE_URL,
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
    areaServed: [
      { "@type": "City", name: "Saskatoon" },
      { "@type": "AdministrativeArea", name: "Saskatchewan" },
    ],
    description,
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  const breadcrumbSchema = canonicalSlug ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: title, item: `${BASE_URL}/${canonicalSlug}` },
    ],
  } : null;

  const ctaHref = primaryProductSlug ? `/products/${primaryProductSlug}` : "/quote";

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      )}
      <SiteNav />

      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 px-6 py-8 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
            {title}
          </h1>
          <p className="text-gray-200 text-base md:text-lg mb-4">{subtitle}</p>
          <Link
            href={ctaHref}
            className="inline-block bg-[#16C2F3] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get My Price →
          </Link>
        </div>
      </section>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">
        {/* Description */}
        {descriptionNode ? (
          <div className="text-gray-600 text-lg leading-relaxed mb-12 max-w-2xl space-y-4">
            {descriptionNode}
          </div>
        ) : (
          <p className="text-gray-600 text-lg leading-relaxed mb-12 max-w-2xl">
            {description}
          </p>
        )}

        {/* Products */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">
            What you need
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => {
              const img = INDUSTRY_PRODUCT_IMAGES[p.slug];
              return (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-transparent hover:ring-1 hover:ring-[#16C2F3]/30 transition-all duration-200"
                >
                  {img && (
                    <div className="relative h-28 w-full">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-bold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{p.from}</p>
                    <p className="text-[#16C2F3] text-sm mt-3 font-semibold group-hover:underline">
                      See price →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Why True Color */}
        <div className="bg-[#f4efe9] rounded-2xl p-8 mb-14">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-5">
            Why True Color?
          </h2>
          <ul className="space-y-3">
            {whyPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-gray-700">
                <Check className="w-4 h-4 text-[#16C2F3] shrink-0 mt-1" strokeWidth={2.5} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA — links to product estimator if primaryProductSlug provided, otherwise /quote */}
        <div className="text-center mb-14">
          <Link
            href={ctaHref}
            className="bg-[#16C2F3] text-white font-bold text-lg px-10 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get My Price →
          </Link>
          <p className="text-sm text-gray-400 mt-3">
            Instant price. No forms. Local pickup at 216 33rd St W, Saskatoon.
          </p>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">
            Frequently asked
          </h2>
          <div className="max-w-2xl">
            {faqs.map((faq) => (
              <details key={faq.q} className="border-b border-gray-100 group">
                <summary className="flex items-center justify-between py-5 cursor-pointer font-semibold text-[#1c1712] list-none">
                  <span className="pr-4">{faq.q}</span>
                  <svg
                    className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="pb-5 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
