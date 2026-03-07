import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { HeroSlider } from "@/components/home/HeroSlider";
import { LocalShopSection } from "@/components/home/LocalShopSection";
import { ScrollRevealInit } from "@/components/home/ScrollRevealInit";
import { StatCounter } from "@/components/home/StatCounter";
import { SameDayClock } from "@/components/home/SameDayClock";

export const metadata: Metadata = {
  title: { absolute: "True Color Display Printing | Saskatoon Signs, Banners & Cards" },
  description:
    "Coroplast signs from $30. Vinyl banners from $66. Business cards from $45. In-house designer, local pickup at 216 33rd St W Saskatoon. See your exact price now — no quote forms.",
  alternates: { canonical: "/" },
};

// ─── Product grid data ─────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    name: "Coroplast Signs",
    category: "Signs",
    from: "from $30",
    desc: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    img: "/images/products/product/coroplast-yard-sign-800x600.webp",
    href: "/coroplast-signs-saskatoon",
  },
  {
    name: "Vinyl Banners",
    category: "Banners",
    from: "from $45",
    desc: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    img: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    href: "/banner-printing-saskatoon",
  },
  {
    name: "Business Cards",
    category: "Print",
    from: "from $45",
    desc: "250 cards, 14pt gloss stock. Single or double-sided.",
    img: "/images/products/product/business-cards-800x600.webp",
    href: "/business-cards-saskatoon",
  },
  {
    name: "Flyers",
    category: "Print",
    from: "from $45",
    desc: "100 flyers on 80lb or 100lb gloss. Sharp colour, clean finish.",
    img: "/images/products/product/flyers-stack-800x600.webp",
    href: "/flyer-printing-saskatoon",
  },
  {
    name: "Brochures",
    category: "Print",
    from: "from $70",
    desc: "Tri-fold or half-fold. 100lb gloss. Scored and folded in-house.",
    img: "/images/products/product/brochures-800x600.webp",
    href: "/brochure-printing-saskatoon",
  },
  {
    name: "Vehicle Magnets",
    category: "Signs",
    from: "from $45",
    desc: "30mil magnets for any vehicle. Custom size, full colour.",
    img: "/images/products/product/vehicle-magnets-800x600.webp",
    href: "/vehicle-magnets-saskatoon",
  },
  {
    name: "ACP Aluminum Signs",
    category: "Signs",
    from: "from $60",
    desc: "3mm aluminum composite. Indoor or outdoor, built to last.",
    img: "/images/products/product/acp-aluminum-sign-800x600.webp",
    href: "/aluminum-signs-saskatoon",
  },
  {
    name: "Foamboard Displays",
    category: "Displays",
    from: "from $45",
    desc: "Lightweight indoor displays for events, counters, and trade shows.",
    img: "/images/products/product/foamboard-display-800x600.webp",
    href: "/foamboard-printing-saskatoon",
  },
  {
    name: "Window Decals",
    category: "Windows",
    from: "from $45",
    desc: "Full-colour adhesive vinyl for storefronts, vehicles, and glass doors.",
    img: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    href: "/window-decals-saskatoon",
  },
  {
    name: "Perforated Window Vinyl",
    category: "Windows",
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
    href: "/banner-printing-saskatoon",
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
        text: "Printing prices at True Color Display Printing in Saskatoon start at: coroplast yard signs from $8/sqft ($30 minimum); vinyl banners from $8.25/sqft; business cards from $45 for 250 double-sided on 14pt gloss stock; vehicle magnets from $45; flyers from $45 for 100 sheets; ACP aluminum signs from $13/sqft; retractable banners from $219; window decals from $45; foamboard displays from $45; stickers from $95; postcards from $35. All prices are pre-tax — GST (5%) and PST (6%) apply at checkout. Volume discounts are automatic: coroplast at 8+ sqft saves 8%, 17+ sqft saves 17%. See your exact price for any product size and quantity instantly at truecolorprinting.ca/quote — no forms, no phone calls, no waiting for a callback. Local pickup only at 216 33rd St W, Saskatoon.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer same-day printing in Saskatoon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — True Color Display Printing offers same-day rush printing in Saskatoon for a $40 flat fee added to any order. To qualify for same-day turnaround, your order must be placed before 10 AM and you must call (306) 954-8688 to confirm production capacity for that day. The $40 rush fee applies to the entire order regardless of size or product type. Standard turnaround without the rush fee is 1–3 business days after artwork is approved. If your artwork needs design work, the in-house designer can produce a same-day proof for $35 flat — so even orders without a ready file can sometimes be completed same day. All orders are local pickup only at 216 33rd St W, Saskatoon SK. No shipping means no courier delays.",
      },
    },
    {
      "@type": "Question",
      name: "Where is True Color Display Printing located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "True Color Display Printing is located at 216 33rd St W, Saskatoon, SK S7L 0V5. The shop is open Monday through Friday, 9 AM to 5 PM. All orders are available for local pickup — there is no shipping option, which means no courier wait times and no risk of damaged prints in transit. Customers can drop off their artwork in person or upload a file online, approve a proof by email, and pick up the finished order when it is ready. For same-day pickup, orders must be placed before 10 AM and confirmed by phone at (306) 954-8688. The shop is a full-service in-house print shop with a Roland UV printer on site — no outsourcing to a third-party facility.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to call for a quote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No — True Color Display Printing has a live online estimator at truecolorprinting.ca/quote that shows your exact price in about 30 seconds. Select a product (coroplast signs, vinyl banners, business cards, vehicle magnets, flyers, brochures, ACP signs, window decals, stickers, retractable banners, and more), enter your dimensions and quantity, and the price appears instantly with no forms to fill out and no account required. The estimator covers all 16 products with full volume pricing built in. You only need to call (306) 954-8688 for same-day rush orders to confirm production capacity, or if you have a large commercial job requiring a custom quote. Design services ($35 flat) can be added to any order at checkout.",
      },
    },
    {
      "@type": "Question",
      name: "What file format do I need for printing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The preferred file formats for printing at True Color Display Printing are PDF (print-ready, with bleeds and outlines), high-resolution JPG or PNG at 150 dpi or higher at final print size, and vector formats such as AI or EPS with all fonts outlined. If your file is low resolution or needs resizing, the in-house designer can upscale and reformat artwork for $35 flat — the same price whether the job takes 10 minutes or an hour. If you have no file at all, the designer can build your artwork from scratch using a rough sketch, photo reference, or verbal description. A same-day proof is standard with design service. Upload your file directly on the product page when ordering, or email it to info@true-color.ca with your order number.",
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

      {/* ── TURNAROUND BAR ───────────────────────────────────────────────────── */}
      <section className="bg-[#0f1d2a] py-3.5">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center divide-x divide-white/20">
          <Link href="/same-day-printing-saskatoon" className="flex items-center gap-2 px-5 py-1 text-white hover:opacity-80 transition-opacity">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold">Same-Day Available</span>
            <SameDayClock />
          </Link>
          <div className="flex items-center gap-2 px-5 py-1 text-white">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">1–3 Day Standard</span>
          </div>
          <Link href="/quote" className="flex items-center gap-2 px-5 py-1 text-white hover:opacity-80 transition-opacity">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="text-sm font-semibold">Rush +$40 Flat</span>
          </Link>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="border border-gray-100 rounded-2xl shadow-sm px-8 py-5 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-500">
            <span className="reveal-section flex items-center gap-2.5 whitespace-nowrap">
              <svg className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="font-medium text-gray-700">5.0 stars · 27 reviews</span>
            </span>
            <span className="reveal-section delay-1 flex items-center gap-2.5 whitespace-nowrap">
              <svg className="w-5 h-5 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="font-medium text-gray-700">Pickup at 216 33rd St W</span>
            </span>
            <span className="reveal-section delay-2 flex items-center gap-2.5 whitespace-nowrap">
              <svg className="w-5 h-5 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              <span className="font-medium text-gray-700">In-house designer · $35 flat</span>
            </span>
            <span className="reveal-section delay-3 flex items-center gap-2.5 whitespace-nowrap">
              <svg className="w-5 h-5 shrink-0 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="font-medium text-gray-700">Live prices — no back-and-forth</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS ───────────────────────────────────────────────────── */}
      <div className="reveal-section">
        <ReviewsSection />
      </div>

      {/* ── LOCAL SHOP ───────────────────────────────────────────────────────── */}
      <LocalShopSection />

      {/* ── PRODUCT GRID ─────────────────────────────────────────────────────── */}
      <section className="reveal-section px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-2">What we print</h2>
        <p className="text-gray-500 mb-10 text-lg">
          Exact prices — no &ldquo;call for a quote.&rdquo; Pick a product and see your number now.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-transparent hover:ring-1 hover:ring-[#16C2F3]/30 transition-all duration-200"
            >
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                <Image
                  src={p.img}
                  alt={`${p.name} — True Color Display Printing Saskatoon`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="absolute top-3 left-3 z-10 bg-white/90 text-[#1c1712] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {p.category}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-bold text-[#1c1712] text-lg">{p.name}</h3>
                  <span className="text-[#16C2F3] font-bold text-sm whitespace-nowrap ml-2">
                    {p.from}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                <div className="mt-4">
                  <span className="text-sm font-semibold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                    See exact price →
                  </span>
                </div>
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
      <section className="reveal-section px-6 py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1c1712] text-center mb-12">How It Works</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Connecting line — desktop only */}
            <div
              className="hidden md:block absolute h-0.5 bg-gray-200"
              style={{ top: "22px", left: "22%", right: "22%" }}
            />
            {[
              {
                n: "1",
                title: "Get your exact price",
                desc: "Pick a product. See your number in 30 seconds. No forms, no phone tag.",
                href: "/quote",
                link: "Get a price →",
                delay: "",
              },
              {
                n: "2",
                title: "Send your file",
                desc: "Upload a PDF, AI, or JPG. Or bring a rough sketch — our designer handles the rest.",
                href: "/services",
                link: "Design services →",
                delay: "delay-2",
              },
              {
                n: "3",
                title: "Pick it up",
                desc: "Most orders same day or next morning. 216 33rd St W, Saskatoon.",
                href: "https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK",
                link: "Get directions →",
                delay: "delay-4",
              },
            ].map((step) => (
              <div key={step.n} className={`reveal-section ${step.delay} flex flex-col items-center text-center gap-3`}>
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
      <div className="reveal-section">
        <GalleryStrip />
      </div>

      {/* ── INDUSTRIES ───────────────────────────────────────────────────────── */}
      <section className="reveal-section bg-[#1c1712] px-6 py-16">
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
                  <p className="text-[#16C2F3] text-sm mt-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    {ind.tagline} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <section className="reveal-section py-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-[#1c1712]">
              <StatCounter target={500} suffix="+" />
            </p>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1.5">Businesses Served</p>
          </div>
          <div>
            <p className="text-3xl font-black text-[#1c1712]">5.0★</p>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1.5">Google Rating</p>
          </div>
          <div>
            <p className="text-3xl font-black text-[#1c1712]">1–3 days</p>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1.5">Standard Turnaround</p>
          </div>
          <div>
            <p className="text-3xl font-black text-[#1c1712]">$35</p>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1.5">In-House Design</p>
          </div>
        </div>
      </section>

      {/* ── PITCH BLOCK — Hormozi style ───────────────────────────────────────── */}
      <section className="reveal-section px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c1712] mb-8 leading-[1.15] tracking-tight">
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
          <blockquote className="border-l-4 border-[#e63020] pl-6 py-2 mb-10">
            <p className="text-xl font-semibold text-[#1c1712]">
              &ldquo;Send the file Friday. Pick it up Saturday. Done.&rdquo;
            </p>
          </blockquote>

          <Link
            href="/quote"
            className="inline-block bg-[#16C2F3] text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#0fb0dd] transition-colors btn-shimmer"
          >
            Get My Exact Price →
          </Link>
        </div>
      </section>

      {/* ── ALL PRODUCTS callout ─────────────────────────────────────────────── */}
      <section className="reveal-section bg-[#1c1712] px-6 py-14">
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
            className="shrink-0 bg-white text-[#1c1712] font-bold px-7 py-4 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap btn-shimmer"
          >
            See All Products →
          </Link>
        </div>
      </section>

      <SiteFooter />

      {/* Scroll reveal — attaches IntersectionObserver to all .reveal-section elements */}
      <ScrollRevealInit />
    </div>
  );
}
