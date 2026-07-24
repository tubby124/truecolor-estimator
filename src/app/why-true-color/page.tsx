import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, MapPin, Phone, Printer, Star, UserRoundCheck } from "lucide-react";
import { PaidCtaLink, PaidPhoneLink, PaidProductLink, PaidProductListTracker } from "@/components/paid/PaidProductLink";
import { PaidQuoteForm } from "@/components/paid/PaidQuoteForm";
import { LICENSED_REVIEW_ROUTE, PaidReviewCards } from "@/components/paid/PaidReviewCards";
import { getProduct } from "@/lib/data/products-content";
import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";

export { LICENSED_REVIEW_ROUTE };

export const metadata: Metadata = {
  title: "Compare Print Options & Order Online",
  description:
    "Choose a print product, see pricing, and order online from True Color Display Printing in Saskatoon.",
  openGraph: {
    title: "Compare Print Options & Order Online | True Color Display Printing",
    description:
      "Configure and order printing online, or request a custom quote from our Saskatoon shop.",
    url: "https://truecolorprinting.ca/why-true-color",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Print Options & Order Online | True Color Display Printing",
    description:
      "Configure and order printing online, or request a custom quote from our Saskatoon shop.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const PAID_PRODUCT_SLUGS = [
  "coroplast-signs", "stickers", "vinyl-banners", "business-cards", "flyers", "retractable-banners",
] as const;

export const PAID_PRODUCTS = PAID_PRODUCT_SLUGS.map((slug) => {
  const product = getProduct(slug);
  if (!product) throw new Error(`Missing paid product: ${slug}`);
  return {
    name: product.name,
    slug,
    href: `/products/${slug}`,
    fromPrice: product.fromPrice,
    heroImage: product.heroImage,
    tagline: product.tagline,
  };
});

const REAL_WORK = [
  {
    src: "/images/gallery/gallery-coroplast-remax-openhouse.webp",
    alt: "Finished RE/MAX coroplast open house signs printed by True Color",
    label: "Real customer signs",
    slug: "coroplast-signs",
    productName: "Coroplast Signs",
  },
  {
    src: "/images/gallery/gallery-business-cards-bd-deep-cleaning.webp",
    alt: "Finished full-colour business cards printed for a True Color customer",
    label: "Real customer cards",
    slug: "business-cards",
    productName: "Business Cards",
  },
  {
    src: "/images/gallery/gallery-banner-colorful-nails-spa.webp",
    alt: "Finished full-colour vinyl banner printed for a True Color customer",
    label: "Real customer banner",
    slug: "vinyl-banners",
    productName: "Vinyl Banners",
  },
] as const;

export default function WhyTrueColorPage() {
  return (
    <main id="main-content" tabIndex={-1} className="bg-white outline-none">
      <section className="overflow-hidden border-b border-gray-200 bg-[#f5f3ef] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c92719]">Saskatoon print shop · order online</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.035em] text-[#1c1712] sm:text-6xl">
              Real printing. Clear pricing. Local pickup.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-700 sm:text-lg">
              Choose a product, configure the details, and see your price before checkout. Your order is printed in Saskatoon and reviewed by a real person before production.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PaidCtaLink
                href="#products"
                action="browse_products"
                placement="hero"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c92719] px-6 font-black text-white transition hover:bg-[#a91f14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c92719] focus-visible:ring-offset-2"
              >
                Start my order <ArrowRight size={18} aria-hidden="true" />
              </PaidCtaLink>
              <PaidCtaLink
                href="#custom-quote"
                action="custom_quote"
                placement="hero"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 font-bold text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
              >
                Request a custom quote
              </PaidCtaLink>
            </div>
            <p className="mt-4 text-sm text-gray-600">Guest checkout · No account required · Prices shown before payment</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_24px_60px_rgba(28,23,18,0.12)] sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00718f]">Why True Color?</p>
            <ul className="mt-5 grid gap-4 text-sm text-[#1c1712] sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Visible online pricing", "Configure standard products before you pay."],
                ["Guest checkout", "Order without creating an account."],
                ["Artwork upload", "Send print files with your order."],
                ["Human help for custom work", "Request a quote when the configurator does not fit."],
              ].map(([title, copy]) => (
                <li key={title} className="rounded-xl bg-[#f5f3ef] p-4">
                  <p className="font-black">{title}</p>
                  <p className="mt-1 leading-relaxed text-gray-600">{copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-7 grid max-w-5xl grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-4 sm:gap-0 sm:p-0">
          <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
            <Star className="shrink-0 fill-yellow-400 text-yellow-400" size={19} aria-hidden="true" />
            <span className="text-xs font-bold text-[#1c1712] sm:text-sm">{RATING_VALUE} on Google · {REVIEW_COUNT} reviews</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
            <MapPin className="shrink-0 text-[#c92719]" size={20} aria-hidden="true" />
            <span className="text-xs font-bold text-[#1c1712] sm:text-sm">216 33rd St W</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
            <UserRoundCheck className="shrink-0 text-[#c92719]" size={20} aria-hidden="true" />
            <span className="text-xs font-bold text-[#1c1712] sm:text-sm">No account required</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 sm:p-4">
            <Printer className="shrink-0 text-[#c92719]" size={20} aria-hidden="true" />
            <span className="text-xs font-bold text-[#1c1712] sm:text-sm">Printed in-house</span>
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="products-heading">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c92719]">Start with the product</p>
            <h2 id="products-heading" className="mt-2 text-3xl font-black tracking-tight text-[#1c1712] sm:text-4xl">
              See the price before you commit
            </h2>
            <p className="mt-3 text-gray-600">Every card opens the live product configurator. Choose size, quantity, sides, artwork help, and rush service where available.</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <PaidProductListTracker products={PAID_PRODUCTS.map(({ slug, name }) => ({ slug, name }))} />
            {PAID_PRODUCTS.map((product) => (
              <PaidProductLink
                key={product.href}
                href={product.href}
                productSlug={product.slug}
                productName={product.name}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#16C2F3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={product.heroImage}
                    alt={`${product.name} available to order from True Color Display Printing`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </span>
                <span className="block p-3.5 sm:p-4">
                  <span className="block text-sm font-black leading-tight text-[#1c1712] sm:text-base">{product.name}</span>
                  <span className="mt-1 block text-sm font-bold text-[#c92719]">From {product.fromPrice}</span>
                  <span className="mt-1.5 hidden text-xs leading-relaxed text-gray-500 sm:line-clamp-2 sm:block">{product.tagline}</span>
                  <span className="mt-3 flex items-center gap-1 text-xs font-bold text-[#087c9d] sm:text-sm">
                    Price &amp; order
                    <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </PaidProductLink>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Not sure which product fits?{" "}
            <PaidPhoneLink placement="product_chooser_help" className="font-bold text-[#087c9d] underline underline-offset-4">
              Call (306) 954-8688
            </PaidPhoneLink>
            {" "}and we’ll help you choose.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="process-heading">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c92719]">A simple order path</p>
          <h2 id="process-heading" className="mt-2 text-3xl font-black text-[#1c1712]">From options to pickup in three steps</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ["01", "Configure and see pricing", "Choose your size, quantity, sides, and artwork support. Upload your print file with the order."],
              ["02", "Add to cart and check out", "Keep shopping, review your cart, or continue directly to guest checkout."],
              ["03", "We review and produce", "The shop reviews the order and artwork before production, then prepares it for pickup."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-black text-[#00718f]">{number}</p>
                <h3 className="mt-4 text-lg font-black text-[#1c1712]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1c1712] px-4 py-12 text-white sm:px-6 sm:py-16" aria-labelledby="location-heading">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="grid gap-3 sm:grid-cols-2">
              <figure className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                <div className="relative aspect-[4/3] bg-gray-800" data-testid="storefront-frame">
                  <Image
                    src="/images/about/shop-exterior.webp"
                    alt="True Color Display Printing storefront and entrance sign at 216 33rd St W in Saskatoon"
                    fill
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 42vw"
                  />
                </div>
                <figcaption className="px-4 py-3 text-sm font-bold">The real Saskatoon storefront</figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                <div className="relative aspect-[4/3] bg-gray-800" data-testid="roland-frame">
                  <Image
                    src="/images/gallery/gallery-shop-roland-large-format.webp"
                    alt="In-house Roland wide-format printer and cutter producing customer work at True Color"
                    fill
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 42vw"
                  />
                </div>
                <figcaption className="px-4 py-3 text-sm font-bold">Printed in-house on our Roland wide-format printer/cutter</figcaption>
              </figure>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#16C2F3]">A real local print shop</p>
              <h2 id="location-heading" className="mt-2 text-3xl font-black">Printed here. Pick up here.</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-300">216 33rd St W, Saskatoon, SK S7L 0V1</p>
              <p className="mt-1 text-sm text-gray-300">Upstairs entrance · Monday–Friday, 9 AM–5 PM</p>
              <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap lg:flex-col">
                <PaidPhoneLink placement="local_contact_block" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16C2F3] px-4 font-bold text-[#1c1712] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <Phone size={18} aria-hidden="true" />(306) 954-8688
                </PaidPhoneLink>
                <PaidCtaLink
                  href="https://www.google.com/maps/dir/?api=1&destination=216+33rd+St+W%2C+Saskatoon%2C+SK+S7L+0V1"
                  action="directions_click"
                  placement="local_contact_block"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-4 hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]"
                >
                  <MapPin size={18} aria-hidden="true" />Get Directions
                </PaidCtaLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PaidReviewCards />

      <section className="bg-[#1c1712] px-4 py-12 text-white sm:px-6 sm:py-16" aria-labelledby="shop-proof-heading">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#16C2F3]">Recent real work</p>
            <h2 id="shop-proof-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">See it. Configure it. Order it.</h2>
            <p className="mt-3 text-gray-300">These are customer jobs produced by True Color. Each image links to the matching live configurator.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {REAL_WORK.map((photo) => (
              <PaidProductLink
                key={photo.src}
                href={`/products/${photo.slug}`}
                productSlug={photo.slug}
                productName={photo.productName}
                className="group overflow-hidden rounded-2xl border border-white/15 bg-white/5 transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image src={photo.src} alt={photo.alt} fill unoptimized className="object-cover transition group-hover:scale-[1.02]" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <span className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold">
                  {photo.label}<span className="text-[#16C2F3]">Order {photo.productName} →</span>
                </span>
              </PaidProductLink>
            ))}
          </div>
        </div>
      </section>

      <div id="custom-quote" className="scroll-mt-24">
        <PaidQuoteForm />
      </div>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16" aria-labelledby="closing-cta-heading">
        <div className="mx-auto rounded-3xl bg-[#c92719] p-7 text-white shadow-lg sm:p-10">
          <h2 id="closing-cta-heading" className="text-3xl font-black">Ready to get the print job moving?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">Configure a standard product and check out online, or send the details for a human-priced custom quote.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <PaidCtaLink href="#products" action="browse_products" placement="closing" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-black text-[#1c1712] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c92719]">
              Start My Order <ArrowRight size={18} aria-hidden="true" />
            </PaidCtaLink>
            <PaidCtaLink href="#custom-quote" action="custom_quote" placement="closing" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-6 font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c92719]">
              Request My Quote
            </PaidCtaLink>
          </div>
        </div>
      </section>
    </main>
  );
}
