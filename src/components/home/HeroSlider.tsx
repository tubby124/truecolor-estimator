"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuoteModal } from "@/components/QuoteModal";

const SLIDES = [
  {
    img: "/images/products/product/coroplast-yard-sign-800x600.webp",
    imgAlt: "Coroplast yard signs printed in Saskatoon, SK — True Color Display Printing",
    accentWord: "Coroplast Signs",
    headline: "from $8/sqft",
    sub: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    cta: "See Exact Prices →",
    ctaHref: "/products/coroplast-signs",
  },
  {
    img: "/images/products/product/vehicle-magnets-800x600.webp",
    imgAlt: "Vehicle magnets from $24/sqft — printed in Saskatoon by True Color Display Printing",
    accentWord: "Vehicle Magnets",
    headline: "from $24/sqft",
    sub: "30mil magnets for any vehicle. Removable, reusable, full colour.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vehicle-magnets",
  },
  {
    img: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    imgAlt: "Custom vinyl banner printing Saskatoon — 13oz banners from $8.25/sqft, True Color",
    accentWord: "Vinyl Banners",
    headline: "from $8.25/sqft",
    sub: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    cta: "See Exact Prices →",
    ctaHref: "/products/vinyl-banners",
  },
  {
    img: "/images/products/product/acp-aluminum-sign-800x600.webp",
    imgAlt: "ACP aluminum composite signs Saskatoon — from $13/sqft, 10+ year outdoor lifespan",
    accentWord: "Aluminum Signs",
    headline: "from $13/sqft",
    sub: "3mm aluminum composite — professional, durable, outdoor-ready.",
    cta: "See Exact Prices →",
    ctaHref: "/products/acp-signs",
  },
  {
    img: "/images/products/product/business-cards-800x600.webp",
    imgAlt: "Business cards printed in Saskatoon — 250 double-sided cards from $45, True Color",
    accentWord: "Business Cards",
    headline: "250 for $45",
    sub: "14pt gloss stock, double-sided. Picked up locally in Saskatoon.",
    cta: "See Exact Prices →",
    ctaHref: "/products/business-cards",
  },
  {
    img: "/images/products/product/retractable-stand-600x900.webp",
    imgAlt: "Retractable banner stand with full-colour print — from $219 at True Color, Saskatoon",
    accentWord: "Retractable Banners",
    headline: "from $219",
    sub: "Premium stand + full-colour print. Ready for your next trade show.",
    cta: "See Exact Prices →",
    ctaHref: "/products/retractable-banners",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [paused, setPaused] = useState(false);
  // Detect mobile after mount to choose animation type.
  // SSR defaults to false (mobile-first) — client hydration sets the real value.
  // On mobile we use opacity crossfade (no x-transform) to avoid iOS Safari's
  // known bug where overflow:hidden doesn't clip absolutely-positioned children
  // that use CSS transform-based animations.
  const [isMobile, setIsMobile] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  // Touch swipe — horizontal swipe changes slide, vertical scroll unaffected
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const slide = SLIDES[current];

  // Mobile: opacity crossfade — no x-transform, no Safari overflow:hidden bug
  // Desktop: spring x-slide animation
  const mobileVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };
  const desktopVariants = {
    enter: (d: number) => ({ x: `${d * 100}%` }),
    center: { x: 0 },
    exit: (d: number) => ({ x: `${d * -100}%` }),
  };

  return (
    <section
      className="relative overflow-hidden bg-[#1c1712] min-h-[420px] md:min-h-[500px] isolate"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/*
        AnimatePresence: only 1–2 slides in the DOM at once.
        Mobile: opacity crossfade (safe on iOS Safari — no transform overflow bug).
        Desktop: x-axis spring slide (full animation).
        The section's overflow:hidden + isolate clips entering/exiting slides.
      */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={isMobile ? mobileVariants : desktopVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={
            isMobile
              ? { duration: 0.35, ease: "easeInOut" }
              : { type: "spring", stiffness: 300, damping: 32, mass: 0.8 }
          }
          className="absolute inset-0 flex flex-col md:flex-row"
        >
          {/* Image side */}
          <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-[#13100c] flex items-center justify-center overflow-hidden">
            <Image
              src={slide.img}
              alt={slide.imgAlt}
              fill
              className="object-contain p-6 md:p-10"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Text side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-14 py-10 bg-[#1c1712]">
            {current === 0 && (
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-4">
                Saskatoon Print Shop — Price it. Proof it. Pick it up today.
              </h1>
            )}
            <h2 className="text-[#16C2F3] font-bold text-base md:text-lg uppercase tracking-wide mb-3">
              {slide.accentWord}
            </h2>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5">
              {slide.headline}
            </p>
            <p className="text-gray-300 text-base md:text-lg max-w-sm mb-8 leading-relaxed">
              {slide.sub}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={slide.ctaHref}
                className="bg-[#16C2F3] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-[#0fb0dd] transition-colors text-base btn-shimmer"
              >
                {slide.cta}
              </Link>
              <button
                onClick={() => setQuoteOpen(true)}
                className="border border-white/40 text-white font-semibold px-7 py-3.5 rounded-lg hover:border-white transition-colors text-base"
              >
                Custom Quote
              </button>
              <a
                href="tel:+13069548688"
                className="border border-white/40 text-white font-semibold px-7 py-3.5 rounded-lg hover:border-white transition-colors text-base"
              >
                Call (306) 954-8688
              </a>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

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

      {/* Slide progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
        <div
          key={current}
          className="h-full bg-[#16C2F3] slide-progress-bar"
        />
      </div>

      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </section>
  );
}
