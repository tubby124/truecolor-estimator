import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { HeroSlider } from "@/components/home/HeroSlider";

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
    href: "/construction-signs-saskatoon",
  },
  {
    name: "Real Estate",
    img: "/images/products/heroes/realestate-hero-1200x500.webp",
    href: "/real-estate-signs-saskatoon",
  },
  {
    name: "Agriculture",
    img: "/images/products/heroes/agriculture-hero-1200x500.webp",
    href: "/agriculture-signs-saskatoon",
  },
  {
    name: "Healthcare",
    img: "/images/products/heroes/healthcare-hero-1200x500.webp",
    href: "/healthcare-printing-saskatoon",
  },
  {
    name: "Retail & Franchise",
    img: "/images/products/heroes/retail-hero-1200x500.webp",
    href: "/retail-signs-saskatoon",
  },
  {
    name: "Sports & Events",
    img: "/images/products/heroes/sports-hero-1200x500.webp",
    href: "/sports-banners-saskatoon",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* ── HERO SLIDER ──────────────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ── TURNAROUND BAR ───────────────────────────────────────────────────── */}
      <section className="bg-[#16C2F3] py-4">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-white">
          <div>
            <p className="font-bold text-base">Same-Day Available</p>
            <p className="text-sm opacity-90">In by noon, ready by 5 PM</p>
          </div>
          <div>
            <p className="font-bold text-base">Next-Day Standard</p>
            <p className="text-sm opacity-90">On all products, every time</p>
          </div>
          <div>
            <Link href="/quote" className="block hover:opacity-90 transition-opacity">
              <p className="font-bold text-base">Rush: +$40 Flat</p>
              <p className="text-sm opacity-90">Need it in hours? We do that.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-5 md:gap-10 text-sm text-gray-500">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>4.9 stars — Saskatoon local</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Pickup at 216 33rd St W</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            <span>In-house designer</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span>Live prices — no back-and-forth</span>
          </span>
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1c1712] text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                n: "1",
                title: "Get your exact price",
                desc: "Pick a product. See your number in 30 seconds. No forms, no phone tag.",
                href: "/quote",
                link: "Get a price →",
              },
              {
                n: "2",
                title: "Send your file",
                desc: "Upload a PDF, AI, or JPG. Or bring a rough sketch — our designer handles the rest.",
                href: "/services",
                link: "Design services →",
              },
              {
                n: "3",
                title: "Pick it up",
                desc: "Most orders same day or next morning. 216 33rd St W, Saskatoon.",
                href: "https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK",
                link: "Get directions →",
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#16C2F3] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {step.n}
                </div>
                <h3 className="font-bold text-[#1c1712] text-lg">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                <a href={step.href} className="text-[#16C2F3] text-sm font-semibold hover:underline">
                  {step.link}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS ───────────────────────────────────────────────────── */}
      <ReviewsSection />

      {/* ── GALLERY STRIP ────────────────────────────────────────────────────── */}
      <GalleryStrip />

      {/* ── INDUSTRIES ───────────────────────────────────────────────────────── */}
      <section className="bg-[#f4efe9] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-2">We print for</h2>
          <p className="text-gray-500 mb-10 text-lg">
            Every industry has its own deadlines and print needs. We handle all of them.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.name}
                href={ind.href}
                className="group relative h-36 md:h-44 rounded-xl overflow-hidden bg-gray-300 block"
              >
                <Image
                  src={ind.img}
                  alt={`${ind.name} printing Saskatoon — True Color`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-white font-bold text-sm md:text-base">{ind.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { number: "500+", label: "Businesses Served" },
            { number: "4.9★", label: "Google Rating" },
            { number: "Same-Day", label: "Turnaround Available" },
            { number: "Local", label: "Saskatoon SK" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-bold text-[#16C2F3]">{stat.number}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

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
            href="/quote"
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
