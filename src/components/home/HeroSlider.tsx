"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    img: "/images/products/product/coroplast-yard-sign-800x600.webp",
    accentWord: "Coroplast Signs",
    headline: "from $8/sqft",
    sub: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    cta: "See Exact Prices →",
    ctaHref: "/products/coroplast-signs",
  },
  {
    img: "/images/products/product/vehicle-magnets-800x600.webp",
    accentWord: "Vehicle Magnets",
    headline: "from $24/sqft",
    sub: "30mil magnets for any vehicle. Removable, reusable, full colour.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vehicle-magnets",
  },
  {
    img: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    accentWord: "Vinyl Banners",
    headline: "from $8.25/sqft",
    sub: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vinyl-banners",
  },
  {
    img: "/images/products/product/acp-aluminum-sign-800x600.webp",
    accentWord: "Aluminum Signs",
    headline: "from $13/sqft",
    sub: "3mm aluminum composite — professional, durable, outdoor-ready.",
    cta: "See Exact Prices →",
    ctaHref: "/products/acp-signs",
  },
  {
    img: "/images/products/product/business-cards-800x600.webp",
    accentWord: "Business Cards",
    headline: "250 for $40",
    sub: "14pt gloss stock, double-sided. Picked up locally in Saskatoon.",
    cta: "See Exact Prices →",
    ctaHref: "/products/business-cards",
  },
  {
    img: "/images/products/product/retractable-stand-600x900.webp",
    accentWord: "Retractable Banners",
    headline: "from $219",
    sub: "Premium stand + full-colour print. Ready for your next trade show.",
    cta: "See Exact Prices →",
    ctaHref: "/products/retractable-banners",
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
      className="relative overflow-hidden bg-[#1c1712]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
        >
          <div className="flex flex-col md:flex-row min-h-[420px] md:min-h-[500px]">
            {/* Image side — product shown fully, no cropping */}
            <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-[#13100c] flex items-center justify-center overflow-hidden">
              <Image
                src={slide.img}
                alt={slide.accentWord}
                fill
                className="object-contain p-6 md:p-10"
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Text side */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-14 py-10 bg-[#1c1712]">
              <p className="text-[#16C2F3] font-bold text-base md:text-lg uppercase tracking-wide mb-3">
                {slide.accentWord}
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5">
                {slide.headline}
              </h1>
              <p className="text-gray-300 text-base md:text-lg max-w-sm mb-8 leading-relaxed">
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
                  className="border border-white/40 text-white font-semibold px-7 py-3.5 rounded-lg hover:border-white transition-colors text-base"
                >
                  Call (306) 954-8688
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-3 h-3 rounded-full transition-all p-0 min-w-[12px] min-h-[12px] touch-manipulation ${
              i === current
                ? "bg-[#16C2F3] scale-125"
                : "bg-white/40 hover:bg-white/70"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          />
        ))}
      </div>
    </section>
  );
}
