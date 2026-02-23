"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    img: "/images/products/heroes/construction-hero-1200x500.webp",
    accentWord: "Coroplast Signs",
    headline: "from $8/sqft",
    sub: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    cta: "See Exact Prices →",
    ctaHref: "/products/coroplast-signs",
  },
  {
    img: "/images/products/heroes/realestate-hero-1200x500.webp",
    accentWord: "Vehicle Magnets",
    headline: "from $24/sqft",
    sub: "30mil magnets for any vehicle. Removable, reusable, full colour.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vehicle-magnets",
  },
  {
    img: "/images/products/heroes/retail-hero-1200x500.webp",
    accentWord: "Vinyl Banners",
    headline: "from $8.25/sqft",
    sub: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vinyl-banners",
  },
  {
    img: "/images/gallery/gallery-retractable-banner-client-office.jpg",
    accentWord: "Retractable Banners",
    headline: "from $219",
    sub: "Premium stand + full-colour print. Ready for your next trade show.",
    cta: "See Exact Prices →",
    ctaHref: "/products/retractable-banners",
  },
  {
    img: "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
    accentWord: "Local. In-House.",
    headline: "Same-Day Available.",
    sub: "In by noon, ready by 5 PM on most orders. Rush adds $40 flat — no hidden fees.",
    cta: "Get a Price →",
    ctaHref: "/quote",
  },
  {
    img: "/images/products/heroes/healthcare-hero-1200x500.webp",
    accentWord: "Business Cards from $40",
    headline: "· Flyers from $45",
    sub: "Professional print on 14pt gloss stock. Picked up locally in Saskatoon.",
    cta: "See Exact Prices →",
    ctaHref: "/products/business-cards",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <section
      className="relative min-h-[560px] md:min-h-[660px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={slide.img}
            alt={slide.accentWord}
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#1c1712]/65" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 h-full flex flex-col justify-center py-20">
            <p className="text-[#16C2F3] font-bold text-lg md:text-xl uppercase tracking-wide mb-2">
              {slide.accentWord}
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-5">
              {slide.headline}
            </h1>
            <p className="text-gray-200 text-lg max-w-xl mb-9 leading-relaxed">
              {slide.sub}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={slide.ctaHref}
                className="bg-[#16C2F3] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-[#0fb0dd] transition-colors text-base"
              >
                {slide.cta}
              </Link>
              <a
                href="tel:+13069548688"
                className="border border-white/50 text-white font-semibold px-7 py-3.5 rounded-lg hover:border-white transition-colors text-base"
              >
                Call (306) 954-8688
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current
                ? "bg-[#16C2F3] scale-125"
                : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
