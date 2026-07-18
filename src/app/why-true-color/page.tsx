import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BadgeDollarSign, Clock3, MapPin, Phone, Star, UserRoundCheck } from "lucide-react";
import { PaidPhoneLink, PaidProductLink, PaidProductListTracker } from "@/components/paid/PaidProductLink";
import { getProduct } from "@/lib/data/products-content";
import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Compare Print Options & Order Online",
  description:
    "Choose a print product, see pricing, and order online from True Color Display Printing in Saskatoon.",
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

export const LICENSED_REVIEW_ROUTE = "/reviews-widget" as const;

export default function WhyTrueColorPage() {
  return (
    <main id="main-content">
      <section className="border-b border-gray-100 bg-[#f8f8f8] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#e63020]">
              Start your order
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1c1712] sm:text-5xl">
              Compare print options. See your price. Order online.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Choose what you need, configure the details, upload your artwork, and order
              for Saskatoon pickup. Guest checkout is available—no account required.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-4 sm:gap-0 sm:p-0">
            <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
              <Star className="shrink-0 fill-yellow-400 text-yellow-400" size={19} aria-hidden="true" />
              <span className="text-xs font-bold text-[#1c1712] sm:text-sm">{RATING_VALUE} from {REVIEW_COUNT} reviews</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
              <BadgeDollarSign className="shrink-0 text-[#e63020]" size={20} aria-hidden="true" />
              <span className="text-xs font-bold text-[#1c1712] sm:text-sm">Pricing before checkout</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:border-r sm:border-gray-100 sm:p-4">
              <UserRoundCheck className="shrink-0 text-[#e63020]" size={20} aria-hidden="true" />
              <span className="text-xs font-bold text-[#1c1712] sm:text-sm">No account required</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-4">
              <MapPin className="shrink-0 text-[#e63020]" size={20} aria-hidden="true" />
              <span className="text-xs font-bold text-[#1c1712] sm:text-sm">Local Saskatoon pickup</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </span>
                <span className="block p-3.5 sm:p-4">
                  <span className="block text-sm font-black leading-tight text-[#1c1712] sm:text-base">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-[#e63020]">From {product.fromPrice}</span>
                  <span className="mt-1.5 hidden text-xs leading-relaxed text-gray-500 sm:line-clamp-2 sm:block">
                    {product.tagline}
                  </span>
                  <span className="mt-3 flex items-center gap-1 text-xs font-bold text-[#087c9d] sm:text-sm">
                    Price &amp; order
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </PaidProductLink>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-gray-600">
            Not sure which product fits?{" "}
            <PaidPhoneLink placement="product_chooser_help" className="font-bold text-[#087c9d] underline-offset-4 hover:underline">
              Call (306) 954-8688
            </PaidPhoneLink>
            {" "}and we&apos;ll help you choose.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="what-to-expect">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e63020]">
              What to expect
            </p>
            <h2 id="what-to-expect" className="mt-2 text-2xl font-black text-[#1c1712] sm:text-3xl">
              A direct path from product to pickup
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <ArrowRight className="text-[#16C2F3]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-[#1c1712]">Instant pricing and ordering</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Pricing updates as you configure the product, before you add it to your cart.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <MapPin className="text-[#16C2F3]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-[#1c1712]">Local production and pickup</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Orders are produced in Saskatoon and available for local pickup at 216 33rd St W.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Clock3 className="text-[#16C2F3]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-[#1c1712]">Rush process</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                When rush service is available, select it while configuring your product and review
                the updated order before checkout.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-[#f8f8f8] px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-yellow-500">
              <Star className="fill-current" size={22} aria-hidden="true" />
              <span className="text-xl font-black text-[#1c1712]">{RATING_VALUE} out of 5</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-[#1c1712]">Verified customer reviews</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Based on {REVIEW_COUNT} reviews. Open the licensed review page to read customer feedback.
            </p>
          </div>
          <a
            href={LICENSED_REVIEW_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1c1712] px-6 font-bold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
          >
            Read customer reviews
          </a>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[#1c1712] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-black">True Color Display Printing</h2>
          <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
            <a
              href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]"
            >
              <MapPin size={18} aria-hidden="true" />
              216 33rd St W, Saskatoon, SK
            </a>
            <PaidPhoneLink
              placement="local_contact_block"
              className="inline-flex items-center gap-2 hover:text-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]"
            >
              <Phone size={18} aria-hidden="true" />
              (306) 954-8688
            </PaidPhoneLink>
          </div>
        </div>
      </section>
    </main>
  );
}
