import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { HeroSlider } from "@/components/home/HeroSlider";
import { LocalShopSection } from "@/components/home/LocalShopSection";

export const metadata: Metadata = {
  title: { absolute: "True Color Display Printing | Saskatoon Signs, Banners & Cards" },
  description:
    "Coroplast signs from $30. Vinyl banners from $66. Business cards from $40. In-house designer, local pickup at 216 33rd St W Saskatoon. See your exact price now — no quote forms.",
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
  {
    name: "Foamboard Displays",
    from: "from $45",
    desc: "Lightweight indoor displays for events, counters, and trade shows.",
    img: "/images/products/product/foamboard-display-800x600.webp",
    href: "/products/foamboard-displays",
  },
  {
    name: "Window Decals",
    from: "from $45",
    desc: "Full-colour adhesive vinyl for storefronts, vehicles, and glass doors.",
    img: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    href: "/products/window-decals",
  },
  {
    name: "Perforated Window Vinyl",
    from: "from $40",
    desc: "One-way vision graphics. Full colour outside, see-through inside.",
    img: "/images/products/product/window-perf-800x600.webp",
    href: "/products/window-perf",
  },
];

// ─── Industry tiles ────────────────────────────────────────────────────────────

const INDUSTRIES = [
  {
    name: "Construction",
    tagline: "Site signs, banners & hoarding boards",
    img: "/images/products/heroes/construction-hero-1200x500.webp",
    href: "/construction-signs-saskatoon",
  },
  {
    name: "Real Estate",
    tagline: "Yard signs, cards & feature sheets",
    img: "/images/products/heroes/realestate-exp-hero-1200x500.webp",
    href: "/real-estate-signs-saskatoon",
  },
  {
    name: "Agriculture",
    tagline: "Farm & field signage",
    img: "/images/products/heroes/agriculture-hero-1200x500.webp",
    href: "/agriculture-signs-saskatoon",
  },
  {
    name: "Healthcare",
    tagline: "Clinic wayfinding & banners",
    img: "/images/products/heroes/healthcare-hero-1200x500.webp",
    href: "/healthcare-signs-saskatoon",
  },
  {
    name: "Retail & Restaurants",
    tagline: "Window decals, banners & menus",
    img: "/images/products/heroes/retail-hero-1200x500.webp",
    href: "/restaurant-signs-saskatoon",
  },
  {
    name: "Sports & Events",
    tagline: "Banners, backdrops & event signage",
    img: "/images/products/heroes/sports-hero-1200x500.webp",
    href: "/sports-banners-saskatoon",
  },
];

// ─── Schema ────────────────────────────────────────────────────────────────────

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does printing cost in Saskatoon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Coroplast signs start at $30. Vinyl banners start at $66. Business cards are $40 for 250 double-sided. See exact prices for any size and quantity at truecolorprinting.ca/quote — no quote forms needed.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer same-day printing in Saskatoon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — same-day rush printing is available for an additional $40 flat fee on any order. Order before 10 AM and call (306) 954-8688 to confirm capacity. Standard turnaround is 1–3 business days.",
      },
    },
    {
      "@type": "Question",
      name: "Where is True Color Display Printing located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "216 33rd St W, Saskatoon, SK S7L 0V5. Open Monday–Friday 9 AM–5 PM. Free local pickup on all orders — no shipping wait.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to call for a quote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No — use the online estimator at truecolorprinting.ca/quote to see your exact price in 30 seconds. Pick your product, size, and quantity. No forms, no phone tag, no waiting.",
      },
    },
    {
      "@type": "Question",
      name: "What file format do I need for printing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PDF or JPG at 150 dpi minimum. No file? Our in-house designer handles artwork prep from a rough sketch or low-res logo, starting at $35. Vector files (AI, EPS) are also accepted.",
      },
    },
  ],
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
      />
      <SiteNav />

      {/* ── HERO SLIDER ──────────────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ── LOCAL SHOP ───────────────────────────────────────────────────────── */}
      <LocalShopSection />

      {/* ── TURNAROUND BAR ───────────────────────────────────────────────────── */}
      <section className="bg-[#16C2F3] py-4">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-white">
          <div>
            <Link href="/same-day-printing-saskatoon" className="block hover:opacity-90 transition-opacity">
              <p className="font-bold text-base">Same-Day Available</p>
              <p className="text-sm opacity-90">In by noon, ready by 5 PM</p>
            </Link>
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

      {/* ── GOOGLE REVIEWS ───────────────────────────────────────────────────── */}
      <ReviewsSection />

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

        {/* Also offer additional products */}
        <div className="mt-8 p-5 bg-[#f4efe9] rounded-xl">
          <p className="font-bold text-[#1c1712] mb-3">Also available — all priced live:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Brochures from $70", href: "/products/brochures" },
              { label: "Postcards from $35", href: "/products/postcards" },
              { label: "Stickers from $95", href: "/products/stickers" },
              { label: "Photo Posters from $15", href: "/products/photo-posters" },
              { label: "Magnet Calendars from $45", href: "/products/magnet-calendars" },
              { label: "Retractable Banners from $219", href: "/products/retractable-banners" },
              { label: "Vinyl Lettering from $40", href: "/products/vinyl-lettering" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-block bg-white border border-gray-200 text-[#1c1712] text-sm font-medium px-3 py-1.5 rounded-full hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
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

      {/* ── GALLERY STRIP ────────────────────────────────────────────────────── */}
      <GalleryStrip />

      {/* ── INDUSTRIES ───────────────────────────────────────────────────────── */}
      <section className="bg-[#1c1712] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">We print for</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Every industry has its own deadlines and print needs. We handle all of them.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.name}
                href={ind.href}
                className="group relative h-56 md:h-64 rounded-xl overflow-hidden block ring-1 ring-white/10 hover:ring-[#16C2F3] transition-all duration-300"
              >
                <Image
                  src={ind.img}
                  alt={`${ind.name} printing Saskatoon — True Color`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-white font-bold text-lg leading-tight">{ind.name}</p>
                  <p className="text-[#16C2F3] text-sm mt-1">{ind.tagline} →</p>
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
                href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V5"
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

      {/* ── ALL PRODUCTS callout ─────────────────────────────────────────────── */}
      <section className="bg-[#1c1712] px-6 py-14">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              16 products. All priced live. No quote forms.
            </h2>
            <p className="text-gray-400">
              Retractable banners from $219 · Brochures from $70 · Postcards from $35 · Stickers from $95 · Photo posters from $15 · Vinyl lettering from $40 · Magnet calendars from $45 — see your exact price in 30 seconds.
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
