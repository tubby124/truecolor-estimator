import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

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
    areaServed: { "@type": "City", name: "Saskatoon" },
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute bottom-0 left-0 px-6 py-8 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
            {title}
          </h1>
          <p className="text-gray-200 text-base md:text-lg">{subtitle}</p>
        </div>
      </section>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">
        {/* Description */}
        <p className="text-gray-600 text-lg leading-relaxed mb-12 max-w-2xl">
          {descriptionNode ?? description}
        </p>

        {/* Products */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">
            What you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="group border border-gray-100 rounded-xl p-5 hover:border-[#16C2F3] hover:shadow-md transition-all"
              >
                <p className="font-bold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                  {p.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">{p.from}</p>
                <p className="text-[#16C2F3] text-sm mt-3 font-semibold group-hover:underline">
                  See price →
                </p>
              </Link>
            ))}
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
                <span className="text-[#16C2F3] font-bold shrink-0 mt-0.5">✓</span>
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
          <div className="space-y-6 max-w-2xl">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 pb-6">
                <p className="font-semibold text-[#1c1712] mb-2">{faq.q}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
