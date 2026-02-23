import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ReviewsSection } from "@/components/home/ReviewsSection";

export const metadata: Metadata = {
  title: "True Color Display Printing | Saskatoon Signs, Banners & Cards",
  description:
    "Coroplast signs from $30. Vinyl banners from $45. Business cards from $40. In-house designer, local pickup at 216 33rd St W Saskatoon. See your exact price now — no quote forms.",
  alternates: { canonical: "/" },
};

// ─── Product grid data ─────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    name: "Coroplast Signs",
    from: "from $30",
    desc: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    img: "/images/products/product/coroplast-yard-sign-800x600.webp",
    href: "/products/coroplast-signs",
  },
  {
    name: "Vinyl Banners",
    from: "from $45",
    desc: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    img: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    href: "/products/vinyl-banners",
  },
  {
    name: "Business Cards",
    from: "from $40",
    desc: "250 cards, 14pt gloss stock. Single or double-sided.",
    img: "/images/products/product/business-cards-800x600.webp",
    href: "/products/business-cards",
  },
  {
    name: "Flyers",
    from: "from $45",
    desc: "100 flyers on 80lb gloss. Sharp colour, clean finish.",
    img: "/images/products/product/flyers-stack-800x600.webp",
    href: "/products/flyers",
  },
  {
    name: "Vehicle Magnets",
    from: "from $45",
    desc: "30mil magnets for any vehicle. Custom size, full colour.",
    img: "/images/products/product/vehicle-magnets-800x600.webp",
    href: "/products/vehicle-magnets",
  },
  {
    name: "ACP Aluminum Signs",
    from: "from $60",
    desc: "3mm aluminum composite. Indoor or outdoor, built to last.",
    img: "/images/products/product/acp-aluminum-sign-800x600.webp",
    href: "/products/acp-signs",
  },
];

// ─── Industry tiles ────────────────────────────────────────────────────────────

const INDUSTRIES = [
  {
    name: "Construction",
    img: "/images/products/heroes/construction-hero-1200x500.webp",
    href: "#",
  },
  {
    name: "Real Estate",
    img: "/images/products/heroes/realestate-hero-1200x500.webp",
    href: "#",
  },
  {
    name: "Agriculture",
    img: "/images/products/heroes/agriculture-hero-1200x500.webp",
    href: "#",
  },
  {
    name: "Healthcare",
    img: "/images/products/heroes/healthcare-hero-1200x500.webp",
    href: "#",
  },
  {
    name: "Retail & Franchise",
    img: "/images/products/heroes/retail-hero-1200x500.webp",
    href: "#",
  },
  {
    name: "Sports & Events",
    img: "/images/products/heroes/sports-hero-1200x500.webp",
    href: "#",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#1c1712] text-white px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            See your exact price<br />
            <span className="text-[#16C2F3]">in 30 seconds.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-3 max-w-2xl">
            No quote forms. No callbacks. No waiting 7 days for Toronto to ship it.
          </p>
          <p className="text-base text-gray-400 mb-10 max-w-xl">
            Signs, banners, business cards, magnets, flyers — all in one shop.
            In-house designer. Local Saskatoon pickup at 216 33rd St W.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold text-lg px-8 py-4 rounded-md hover:bg-[#0fb0dd] transition-colors"
            >
              See Exact Prices →
            </Link>
            <a
              href="tel:+13069548688"
              className="border border-gray-600 text-gray-300 font-semibold text-base px-6 py-4 rounded-md hover:border-gray-400 hover:text-white transition-colors"
            >
              Call (306) 954-8688
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-5 md:gap-10 text-sm text-gray-500">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
            <span>Saskatoon local</span>
          </span>
          <span className="whitespace-nowrap">📍 Pickup at 216 33rd St W</span>
          <span className="whitespace-nowrap">✏️ In-house designer</span>
          <span className="whitespace-nowrap">💰 Live prices — no back-and-forth</span>
        </div>
      </section>

      {/* ── PRODUCT GRID ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-2">What we print</h2>
        <p className="text-gray-500 mb-10 text-lg">
          Exact prices — no &ldquo;call for a quote.&rdquo; Pick a product and see your number now.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-[#16C2F3]/40"
            >
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                <Image
                  src={p.img}
                  alt={`${p.name} — True Color Display Printing Saskatoon`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-bold text-[#1c1712] text-lg">{p.name}</h3>
                  <span className="text-[#16C2F3] font-bold text-sm whitespace-nowrap ml-2">
                    {p.from}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                <p className="text-[#16C2F3] text-sm font-semibold mt-4 group-hover:underline">
                  See exact price →
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Also offer retractable banner stand */}
        <div className="mt-8 p-5 bg-[#f4efe9] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-[#1c1712]">Retractable Banner Stands</p>
            <p className="text-sm text-gray-500">Economy stand from $219. Banner included.</p>
          </div>
          <Link
            href="/products/retractable-banners"
            className="text-[#16C2F3] text-sm font-bold whitespace-nowrap hover:underline"
          >
            See price →
          </Link>
        </div>
      </section>

      {/* ── INDUSTRIES ───────────────────────────────────────────────────────── */}
      <section className="bg-[#f4efe9] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-2">We print for</h2>
          <p className="text-gray-500 mb-10 text-lg">
            Every industry has its own deadlines and print needs. We handle all of them.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="relative h-36 md:h-44 rounded-xl overflow-hidden bg-gray-300"
              >
                <Image
                  src={ind.img}
                  alt={`${ind.name} printing Saskatoon — True Color`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-white font-bold text-sm md:text-base">{ind.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS ───────────────────────────────────────────────────── */}
      <ReviewsSection />

      {/* ── PITCH BLOCK — Hormozi style ───────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-8 leading-tight">
            Cheaper than Staples.<br />
            Faster than waiting 7 days.<br />
            Bring us anything.
          </h2>

          <div className="space-y-5 text-gray-600 text-lg mb-10">
            <p>
              Coroplast signs from{" "}
              <strong className="text-[#1c1712]">$30</strong>. Vinyl banners from{" "}
              <strong className="text-[#1c1712]">$45</strong>. 250 business cards for{" "}
              <strong className="text-[#1c1712]">$40</strong>. Prices you can see right now,
              without emailing anyone.
            </p>
            <p>
              Got a rough sketch? A low-res logo? No file at all? Our in-house designer
              handles artwork prep, upscaling, and layout — from your napkin sketch to
              print-ready in the same visit.
            </p>
            <p>
              One shop. One order. Local pickup at{" "}
              <a
                href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0N6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#16C2F3] hover:underline"
              >
                216 33rd St W, Saskatoon
              </a>
              . No shipping wait. No Toronto turnaround time.
            </p>
          </div>

          {/* Pull quote */}
          <blockquote className="border-l-4 border-[#16C2F3] pl-6 py-2 mb-10">
            <p className="text-xl font-semibold text-[#1c1712]">
              &ldquo;Send the file Friday. Pick it up Saturday. Done.&rdquo;
            </p>
          </blockquote>

          <Link
            href="/quote"
            className="inline-block bg-[#16C2F3] text-white font-bold text-lg px-8 py-4 rounded-md hover:bg-[#0fb0dd] transition-colors"
          >
            Get My Exact Price →
          </Link>
        </div>
      </section>

      {/* ── FOAMBOARD + MORE PRODUCTS callout ────────────────────────────────── */}
      <section className="bg-[#1c1712] px-6 py-14">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Also: Foamboard, decals, photo prints & more.
            </h2>
            <p className="text-gray-400">
              Foamboard counter displays from $45. Retractable banner stands from $219.
              Stickers, photo posters, and more. All priced live on our estimator.
            </p>
          </div>
          <Link
            href="/staff"
            className="shrink-0 bg-white text-[#1c1712] font-bold px-7 py-4 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            See All Products →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
