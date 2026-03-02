"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const GALLERY_IMAGES = [
  // Real client work (4)
  {
    src: "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
    alt: "Outdoor storefront banner — Best Donairs, True Color Display Printing Saskatoon",
  },
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.jpg",
    alt: "Van vinyl branding — Ayotte Plumbing, True Color Display Printing Saskatoon",
  },
  {
    src: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    alt: "Window decals — Swiss Barber, True Color Display Printing Saskatoon",
  },
  {
    src: "/images/gallery/gallery-coroplast-realtor-keyshape.jpg",
    alt: "Custom-shape coroplast sign — Boyes Group Realtor, True Color Display Printing Saskatoon",
  },
  // Product showcase (4)
  {
    src: "/images/products/product/coroplast-yard-sign-800x600.webp",
    alt: "Coroplast yard sign — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/vehicle-magnets-800x600.webp",
    alt: "Vehicle magnets — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    alt: "Colourful vinyl banner — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/acp-aluminum-sign-800x600.webp",
    alt: "ACP aluminum sign — True Color Display Printing Saskatoon",
  },
];

export function GalleryStrip() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Close on ESC key
  useEffect(() => {
    if (activeIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIdx(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx]);

  return (
    <>
      <section className="bg-[#1c1712] px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Our work speaks for itself
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GALLERY_IMAGES.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setActiveIdx(i)}
                className="relative h-40 overflow-hidden rounded-lg w-full group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                aria-label={`Enlarge: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {/* Hover overlay hint */}
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                    View
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Bottom row: gallery link + Instagram */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <Link
              href="/gallery"
              className="text-white font-semibold text-sm hover:underline"
            >
              See full gallery →
            </Link>
            <a
              href="https://www.instagram.com/truecolorprint"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-sm hover:text-gray-200 transition-colors"
            >
              Follow @truecolorprint on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-4"
            onClick={() => setActiveIdx(null)}
            aria-modal
            role="dialog"
            aria-label="Image lightbox"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={GALLERY_IMAGES[activeIdx].src}
                alt={GALLERY_IMAGES[activeIdx].alt}
                width={1200}
                height={900}
                className="object-contain w-full h-auto max-h-[82vh] rounded-xl"
                priority
              />
              {/* Caption */}
              <p className="text-white/50 text-xs text-center mt-3 px-4 leading-relaxed">
                {GALLERY_IMAGES[activeIdx].alt}
              </p>
              {/* Close button */}
              <button
                onClick={() => setActiveIdx(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Prev / Next */}
              {activeIdx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(activeIdx - 1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}
              {activeIdx < GALLERY_IMAGES.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(activeIdx + 1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
