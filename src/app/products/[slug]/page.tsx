import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { getProduct, PRODUCT_SLUGS } from "@/lib/data/products-content";

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
    title: `${product.name} Saskatoon | ${product.fromPrice} | True Color Display Printing`,
    description: `${product.tagline} ${product.description.slice(0, 100)}... Local pickup at 216 33rd St W, Saskatoon.`,
    alternates: { canonical: `/products/${slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  // Related products
  const related = product.relatedSlugs.map((s) => getProduct(s)).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-10">
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
                  className="group border border-gray-100 rounded-xl p-5 hover:border-[#16C2F3]/40 hover:shadow-md transition-all"
                >
                  <p className="font-bold text-[#1c1712] mb-1 group-hover:text-[#16C2F3] transition-colors">
                    {r.name}
                  </p>
                  <p className="text-sm text-gray-500">{r.fromPrice}</p>
                  <p className="text-[#16C2F3] text-sm mt-3 group-hover:underline">See price →</p>
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
