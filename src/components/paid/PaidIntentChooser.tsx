import { ArrowRight } from "lucide-react";
import { PaidCtaLink, PaidProductLink, PaidProductListTracker } from "@/components/paid/PaidProductLink";
import { getProduct } from "@/lib/data/products-content";
import type { AnalyticsPlacement } from "@/lib/analytics";

type ProductSlug =
  | "business-cards"
  | "stickers"
  | "flyers"
  | "photo-posters"
  | "vinyl-banners"
  | "coroplast-signs"
  | "acp-signs"
  | "window-decals"
  | "vehicle-magnets";

type ChooserProduct = {
  slug: ProductSlug;
  label?: string;
};

type PaidIntentChooserProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: readonly ChooserProduct[];
  placement: Extract<AnalyticsPlacement, "paid_print_chooser" | "paid_sign_chooser">;
  chooserTitle: string;
  quoteCopy: string;
};

export function PaidIntentChooser({
  eyebrow,
  title,
  description,
  products,
  placement,
  chooserTitle,
  quoteCopy,
}: PaidIntentChooserProps) {
  const resolvedProducts = products.map(({ slug, label }) => {
    const product = getProduct(slug);
    if (!product) throw new Error(`Missing paid chooser product: ${slug}`);
    return {
      slug,
      name: label ?? product.name,
      fromPrice: product.fromPrice,
      tagline: product.tagline,
    };
  });

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#f5f3ef] px-4 py-8 outline-none sm:px-6 sm:py-12">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c92719]">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.035em] text-[#1c1712] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg">{description}</p>
      </section>

      <section className="mx-auto mt-5 max-w-4xl rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="chooser-heading">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00718f]">Start with the product</p>
          <h2 id="chooser-heading" className="mt-2 text-2xl font-black tracking-tight text-[#1c1712] sm:text-3xl">{chooserTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">Pick the closest match. Each option opens the live configurator with exact pricing before checkout.</p>
        </div>

        <PaidProductListTracker
          products={resolvedProducts.map((product) => ({ slug: product.slug, name: product.name }))}
          itemListName={placement === "paid_print_chooser" ? "Paid print-price chooser" : "Paid sign-shop chooser"}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedProducts.map((product) => (
            <PaidProductLink
              key={product.slug}
              href={`/products/${product.slug}`}
              productSlug={product.slug}
              productName={product.name}
              placement={placement}
              itemListName={placement === "paid_print_chooser" ? "Paid print-price chooser" : "Paid sign-shop chooser"}
              className="group flex min-h-36 flex-col rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#16C2F3] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
            >
              <span className="text-base font-black text-[#1c1712]">{product.name}</span>
              <span className="mt-2 text-sm font-bold text-[#c92719]">From {product.fromPrice}</span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600">{product.tagline}</span>
              <span className="mt-auto pt-4 text-sm font-bold text-[#087c9d]">Price & order <ArrowRight className="inline" size={16} aria-hidden="true" /></span>
            </PaidProductLink>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[#f5f3ef] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h2 className="font-black text-[#1c1712]">Need something custom?</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{quoteCopy}</p>
          </div>
          <PaidCtaLink
            href="/quote"
            action="custom_quote"
            placement="hero"
            className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#1c1712] px-5 font-bold text-white transition hover:bg-[#33302c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2 sm:mt-0"
          >
            Request a custom quote
          </PaidCtaLink>
        </div>
      </section>
    </main>
  );
}
