"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import galleryData from "@/lib/data/gallery-industries.json";

type IndustryImage = {
  src: string;
  label: string;
  productType: string;
  aspect: string;
};

type Industry = {
  slug: string;
  name: string;
  landingPage: string;
  images: IndustryImage[];
};

const industries: Industry[] = galleryData.industries;

const INDUSTRY_DESCRIPTIONS: Record<string, string> = {
  healthcare:
    "Saskatchewan clinics and healthcare providers use coroplast directional signs, vinyl banners for patient campaigns, ACP directory panels for lobbies, foamboard education displays, and retractable stands for health fairs and reception areas.",
  agriculture:
    "Saskatchewan farms and seed companies rely on coroplast gate signs, biosecurity warnings, vinyl trade show banners, seasonal sale banners, and magnetic door signs for farm trucks and service vehicles.",
  agribusiness:
    "Equipment dealers and ag supply retailers across Saskatchewan use ACP fascia signage, warehouse identification panels, retractable trade show displays, product spec sheet flyers, seasonal promotional flyers, and direct mail postcards.",
};

const PRODUCT_BADGE_COLORS: Record<string, string> = {
  "Vinyl Banner": "bg-blue-600/90",
  "Coroplast Sign": "bg-emerald-600/90",
  "ACP Sign": "bg-slate-700/90",
  "Vehicle Magnet": "bg-amber-600/90",
  "Retractable Banner": "bg-violet-600/90",
  Foamboard: "bg-rose-600/90",
  Flyer: "bg-cyan-700/90",
  Postcard: "bg-orange-600/90",
};

function getAspectClass(aspect: string): string {
  switch (aspect) {
    case "3/1":
      return "aspect-[3/1]";
    case "3/8":
      return "aspect-[3/8]";
    case "3/4":
      return "aspect-[3/4]";
    case "4/3":
    default:
      return "aspect-[4/3]";
  }
}

function IndustryCard({
  image,
  landingPage,
}: {
  image: IndustryImage;
  landingPage: string;
}) {
  const badgeColor =
    PRODUCT_BADGE_COLORS[image.productType] || "bg-gray-700/90";

  return (
    <Link
      href={landingPage}
      className="group relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer block break-inside-avoid mb-5"
    >
      <div className={`relative w-full ${getAspectClass(image.aspect)}`}>
        <Image
          src={image.src}
          alt={`${image.label} — ${image.productType} design example for Saskatchewan businesses — True Color Display Printing`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Product type badge — always visible */}
        <span
          className={`absolute top-3 left-3 ${badgeColor} text-white text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full backdrop-blur-sm`}
        >
          {image.productType}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
          <p className="text-white font-bold text-sm leading-snug">
            {image.label}
          </p>
          <p className="text-[#16C2F3] text-xs font-semibold mt-1">
            See pricing for your industry →
          </p>
        </div>
      </div>
    </Link>
  );
}

export function IndustryShowcase() {
  const [activeSlug, setActiveSlug] = useState<string>("all");

  const activeIndustry = industries.find((i) => i.slug === activeSlug);
  const visibleImages: { image: IndustryImage; landingPage: string }[] =
    activeSlug === "all"
      ? industries.flatMap((ind) =>
          ind.images.map((img) => ({ image: img, landingPage: ind.landingPage }))
        )
      : activeIndustry
        ? activeIndustry.images.map((img) => ({
            image: img,
            landingPage: activeIndustry.landingPage,
          }))
        : [];

  return (
    <div>
      {/* Industry filter tabs */}
      <div
        className="flex flex-wrap gap-2 mb-8"
        role="tablist"
        aria-label="Filter by industry"
      >
        <button
          role="tab"
          aria-selected={activeSlug === "all"}
          onClick={() => setActiveSlug("all")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[44px] cursor-pointer ${
            activeSlug === "all"
              ? "bg-[#1c1712] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Industries
          <span
            className={`ml-1.5 text-xs ${
              activeSlug === "all" ? "text-white/70" : "text-gray-400"
            }`}
          >
            {industries.reduce((sum, i) => sum + i.images.length, 0)}
          </span>
        </button>

        {industries.map((industry) => (
          <button
            key={industry.slug}
            role="tab"
            aria-selected={activeSlug === industry.slug}
            onClick={() => setActiveSlug(industry.slug)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[44px] cursor-pointer ${
              activeSlug === industry.slug
                ? "bg-[#1c1712] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {industry.name}
            <span
              className={`ml-1.5 text-xs ${
                activeSlug === industry.slug ? "text-white/70" : "text-gray-400"
              }`}
            >
              {industry.images.length}
            </span>
          </button>
        ))}
      </div>

      {/* Per-industry description */}
      {activeIndustry && INDUSTRY_DESCRIPTIONS[activeIndustry.slug] && (
        <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-2xl">
          {INDUSTRY_DESCRIPTIONS[activeIndustry.slug]}
        </p>
      )}

      {/* Masonry grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="columns-1 sm:columns-2 lg:columns-3 gap-5"
        >
          {visibleImages.map(({ image, landingPage }, i) => (
            <IndustryCard key={`${activeSlug}-${i}`} image={image} landingPage={landingPage} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Industry CTA */}
      {activeIndustry && (
        <div className="mt-8 text-center">
          <Link
            href={activeIndustry.landingPage}
            className="inline-flex items-center gap-2 bg-[#1c1712] text-white font-semibold px-7 py-3.5 rounded-lg hover:bg-[#2a2520] transition-colors min-h-[44px]"
          >
            View {activeIndustry.name} Pricing →
          </Link>
        </div>
      )}

      {activeSlug === "all" && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Select an industry above to see targeted designs and pricing for
            your business.
          </p>
        </div>
      )}
    </div>
  );
}
