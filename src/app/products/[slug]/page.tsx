import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { getProduct, PRODUCT_SLUGS } from "@/lib/data/products-content";
import { PrintIcon } from "@/components/icons/PrintIcons";

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
    image: product.heroImage,
    brand: { "@type": "Brand", name: "True Color Display Printing" },
    offers: {
      "@type": "Offer",
      price: priceNum,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      seller: { "@type": "LocalBusiness", name: "True Color Display Printing" },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://truecolorprinting.ca/" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://truecolorprinting.ca/quote" },
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

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-[#1c1712] transition-colors">Home</Link>
          <span>›</span>
          <Link href="/quote" className="hover:text-[#1c1712] transition-colors">Products</Link>
          <span>›</span>
          <span className="text-[#1c1712] font-medium">{product.name}</span>
        </nav>

        {/* Interactive product layout — gallery + options + sticky price panel */}
        <div className="mb-16">
          <ProductPageClient product={product} />
        </div>

        {/* Tabs: description, specs, FAQ */}
        <div className="border-t border-gray-100 pt-10 mb-16">
          <ProductAccordion product={product} />
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-10">
            <h2 className="text-xl font-bold text-[#1c1712] mb-6">Customers also print</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => r && (
                <Link
                  key={r.slug}
                  href={`/products/${r.slug}`}
                  className="group border border-gray-100 rounded-xl p-5 hover:border-[#16C2F3]/40 hover:shadow-md transition-all flex items-center gap-4"
                >
                  <PrintIcon
                    slug={r.slug}
                    size={28}
                    className="text-[var(--brand)] shrink-0"
                    aria-hidden={true}
                  />
                  <div>
                    <p className="font-bold text-[#1c1712] mb-1 group-hover:text-[#16C2F3] transition-colors">
                      {r.name}
                    </p>
                    <p className="text-sm text-gray-500">{r.fromPrice}</p>
                    <p className="text-[#16C2F3] text-sm mt-1 group-hover:underline">See price →</p>
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
