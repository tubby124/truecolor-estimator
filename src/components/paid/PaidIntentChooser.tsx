import Image from "next/image";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { PaidCtaLink, PaidPhoneLink, PaidProductLink, PaidProductListTracker } from "@/components/paid/PaidProductLink";
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
  showLocalShopProof?: boolean;
};

const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=216+33rd+St+W%2C+Saskatoon%2C+SK+S7L+0V1";

export function PaidIntentChooser({
  eyebrow,
  title,
  description,
  products,
  placement,
  chooserTitle,
  quoteCopy,
  showLocalShopProof = false,
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

        <PaidCtaLink
          href="/products"
          action="browse_products"
          placement="paid_chooser_more_products"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-bold text-[#087c9d] underline decoration-[#16C2F3] decoration-2 underline-offset-4 hover:text-[#1c1712] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
        >
          Need something else? View all products <ArrowRight size={16} aria-hidden="true" />
        </PaidCtaLink>

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

      {showLocalShopProof ? (
        <section className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-3xl bg-[#1c1712] text-white shadow-sm" aria-labelledby="local-shop-heading">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="grid grid-cols-2 gap-px bg-white/15">
              <div className="relative aspect-square bg-gray-800">
                <Image src="/images/about/shop-exterior.webp" alt="True Color Display Printing storefront at 216 33rd St W in Saskatoon" fill className="object-cover" sizes="(max-width: 640px) 50vw, 28vw" />
              </div>
              <div className="relative aspect-square bg-gray-800">
                <Image src="/images/gallery/gallery-shop-roland-large-format.webp" alt="True Color staff production equipment in the Saskatoon print shop" fill className="object-cover" sizes="(max-width: 640px) 50vw, 28vw" />
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#16C2F3]">A real local print shop</p>
              <h2 id="local-shop-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Printed here. Pick up here.</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">216 33rd St W, Saskatoon, SK S7L 0V1 · Upstairs entrance · Monday–Friday, 9 AM–5 PM.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PaidPhoneLink placement="paid_chooser_local_contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#16C2F3] px-4 text-sm font-bold text-[#1c1712] hover:bg-[#63d8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <Phone size={17} aria-hidden="true" />Call Now
                </PaidPhoneLink>
                <PaidCtaLink href={DIRECTIONS_URL} action="directions_click" placement="paid_chooser_local_contact" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-bold text-white hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]">
                  <MapPin size={17} aria-hidden="true" />Get Directions
                </PaidCtaLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
