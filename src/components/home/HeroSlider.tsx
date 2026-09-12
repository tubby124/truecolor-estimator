"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
const SLIDES = [
  {
    img: "/images/products/product/coroplast-yard-sign-800x600.webp",
    imgAlt: "Coroplast yard signs printed in Saskatoon, SK — True Color Display Printing",
    accentWord: "Coroplast Signs",
    headline: "from $8/sqft",
    sub: "Job site, yard, and directional signs. Survives Saskatchewan winters.",
    cta: "See Exact Prices →",
    ctaHref: "/coroplast-signs-saskatoon",
  },
  {
    img: "/images/products/product/vehicle-magnets-800x600.webp",
    imgAlt: "Vehicle magnets from $24/sqft — printed in Saskatoon by True Color Display Printing",
    accentWord: "Vehicle Magnets",
    headline: "from $24/sqft",
    sub: "30mil magnets for any vehicle. Removable, reusable, full colour.",
    cta: "See Exact Prices →",
    ctaHref: "/vehicle-magnets-saskatoon",
  },
  {
    img: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    imgAlt: "Custom vinyl banner printing Saskatoon — 13oz banners from $8.25/sqft, True Color",
    accentWord: "Vinyl Banners",
    headline: "from $8.25/sqft",
    sub: "13oz vinyl for events, storefronts, and trade shows. Any size.",
    cta: "See Exact Prices →",
    ctaHref: "/banner-printing-saskatoon",
  },
  {
    img: "/images/products/product/acp-aluminum-sign-800x600.webp",
    imgAlt: "ACP aluminum composite signs Saskatoon — from $13/sqft, 10+ year outdoor lifespan",
    accentWord: "Aluminum Signs",
    headline: "from $13/sqft",
    sub: "3mm aluminum composite — professional, durable, outdoor-ready.",
    cta: "See Exact Prices →",
    ctaHref: "/aluminum-signs-saskatoon",
  },
  {
    img: "/images/products/product/business-cards-800x600.webp",
    imgAlt: "Business cards printed in Saskatoon — 250 double-sided cards from $45, True Color",
    accentWord: "Business Cards",
    headline: "250 for $45",
    sub: "14pt gloss stock, double-sided. Picked up locally in Saskatoon.",
    cta: "See Exact Prices →",
    ctaHref: "/business-cards-saskatoon",
  },
  {
    img: "/images/products/product/retractable-stand-600x900.webp",
    imgAlt: "Retractable banner stand with full-colour print — from $219 at True Color, Saskatoon",
    accentWord: "Retractable Banners",
    headline: "from $219",
    sub: "Premium stand + full-colour print. Ready for your next trade show.",
    cta: "See Exact Prices →",
    ctaHref: "/retractable-banners-saskatoon",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the browser motion preference
    setReducedMotion(query.matches);
    const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const next = useCallback(() => setCurrent((index) => (index + 1) % SLIDES.length), []);
  const previous = () => setCurrent((index) => (index - 1 + SLIDES.length) % SLIDES.length);
  const autoplayPaused = hoverPaused || focusPaused || userPaused || reducedMotion;

  useEffect(() => {
    if (autoplayPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [autoplayPaused, next]);

  function handleTouchStart(event: React.TouchEvent) {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    // A mostly vertical gesture always remains a normal page scroll.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else previous();
    }
  }

  const slide = SLIDES[current];
  const controlClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16C2F3]";

  return (
    <section
      data-home-hero
      className="bg-[#1c1712] text-white"
      aria-label="Printing offers"
      aria-roledescription="carousel"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false);
      }}
    >
      {/* The active slide stays in document flow: text can grow without clipping.
          Reserved intro and description space keeps all six offers equally tall. */}
      <div
        id="home-offer-panel"
        data-home-hero-slide={current}
        role="group"
        aria-roledescription="slide"
        aria-label={`${current + 1} of ${SLIDES.length}`}
        className="mx-auto grid max-w-6xl md:grid-cols-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        <figure className="m-0 flex flex-col bg-[#f4efe9]">
          <div className="relative h-48 sm:h-64 md:h-auto md:min-h-[440px] md:flex-1">
            <Image
              src={slide.img}
              alt={slide.imgAlt}
              fill
              className="object-contain p-4 sm:p-7 md:p-10"
              loading="eager"
              fetchPriority={current === 0 ? "high" : "auto"}
              sizes="(max-width: 767px) 100vw, (max-width: 1152px) 50vw, 576px"
            />
          </div>
          <figcaption data-image-provenance="illustration" className="border-t border-[#1c1712]/10 px-6 py-2 text-xs font-medium text-[#5b5147]">
            Product illustration
          </figcaption>
        </figure>

        <div className="px-6 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-10">
          <div className="mb-2 min-h-10 md:min-h-24 lg:min-h-16">
            {current === 0 && (
              <p className="max-w-md text-sm font-semibold leading-5 text-white md:text-2xl md:leading-8">
                Saskatoon Print Shop — Price it. Proof it. Pick it up today.
              </p>
            )}
          </div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#16C2F3] md:text-base">
            {slide.accentWord}
          </h2>
          <p className="mb-4 text-[clamp(2rem,9vw,2.625rem)] font-black leading-[1.05] tracking-tight text-white md:text-[2rem] lg:text-5xl">
            {slide.headline}
          </p>
          <p className="mb-4 min-h-11 max-w-sm text-sm leading-[1.375rem] text-gray-300 md:mb-6 md:min-h-14 md:text-base md:leading-7">
            {slide.sub}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={slide.ctaHref}
              className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#16C2F3] px-5 py-3 text-center text-sm font-bold text-[#0f1d2a] transition-colors hover:bg-[#35cef5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16C2F3]"
            >
              {slide.cta}
            </Link>
            <Link
              href="/quote"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-2 py-2 text-center text-sm font-semibold text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16C2F3]"
            >
              Custom Quote
            </Link>
            <a
              href="tel:+13069548688"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-2 py-2 text-center text-sm font-semibold text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16C2F3]"
            >
              <span className="sm:hidden">(306) 954-8688</span>
              <span className="hidden sm:inline">Call (306) 954-8688</span>
            </a>
          </div>
        </div>
      </div>

      {/* Controls have their own space, never floating over the offer or artwork. */}
      <div data-home-hero-controls className="mx-auto flex max-w-6xl flex-col items-center gap-1 border-t border-white/10 px-4 py-2 sm:flex-row sm:justify-between sm:px-8 sm:py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={previous} aria-label="Previous slide" aria-controls="home-offer-panel" className={controlClass}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (userPaused) {
                // An explicit Play action resumes now, until a new hover/focus interaction.
                setUserPaused(false);
                setHoverPaused(false);
                setFocusPaused(false);
              } else {
                setUserPaused(true);
              }
            }}
            aria-pressed={userPaused || reducedMotion}
            aria-controls="home-offer-panel"
            disabled={reducedMotion}
            className={`${controlClass} gap-2 px-4 text-xs font-semibold disabled:cursor-default disabled:opacity-60`}
          >
            {userPaused || reducedMotion ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
            {reducedMotion ? "Autoplay off" : userPaused ? "Play offers" : "Pause offers"}
          </button>
          <button type="button" onClick={next} aria-label="Next slide" aria-controls="home-offer-panel" className={controlClass}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center" role="group" aria-label="Choose an offer">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              aria-controls="home-offer-panel"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16C2F3]"
            >
              <span aria-hidden="true" className={`h-1.5 rounded-full ${index === current ? "w-5 bg-[#16C2F3]" : "w-1.5 bg-white/40"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
