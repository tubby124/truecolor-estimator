import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Phone, Star } from "lucide-react";
import { PrintIcon } from "@/components/icons/PrintIcons";
import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Choose a Print Product | True Color Display Printing",
  description:
    "Choose a print product, see pricing, and order online from True Color Display Printing in Saskatoon.",
  robots: {
    index: false,
    follow: true,
  },
};

const PRODUCTS = [
  {
    name: "Coroplast signs",
    slug: "coroplast-signs",
    href: "/products/coroplast-signs",
  },
  {
    name: "Stickers",
    slug: "stickers",
    href: "/products/stickers",
  },
  {
    name: "Vinyl banners",
    slug: "vinyl-banners",
    href: "/products/vinyl-banners",
  },
  {
    name: "Business cards",
    slug: "business-cards",
    href: "/products/business-cards",
  },
  {
    name: "Flyers",
    slug: "flyers",
    href: "/products/flyers",
  },
  {
    name: "Retractable banners",
    slug: "retractable-banners",
    href: "/products/retractable-banners",
  },
] as const;

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
              Choose a product. See pricing. Order now.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Select what you need to open the product configurator, choose your options,
              and see the price before ordering.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {PRODUCTS.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group flex min-h-36 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#16C2F3] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2 sm:min-h-40 sm:p-5"
              >
                <PrintIcon
                  slug={product.slug}
                  size={32}
                  className="text-[#e63020]"
                  aria-hidden={true}
                />
                <span>
                  <span className="block font-bold leading-tight text-[#1c1712]">
                    {product.name}
                  </span>
                  <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#087c9d]">
                    See pricing &amp; order
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            ))}
          </div>
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
            href="/reviews-widget"
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
            <a
              href="tel:+13069548688"
              className="inline-flex items-center gap-2 hover:text-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3]"
            >
              <Phone size={18} aria-hidden="true" />
              (306) 954-8688
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
