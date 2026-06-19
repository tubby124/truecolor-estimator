import type { MetadataRoute } from "next";

const BASE_URL = "https://truecolorprinting.ca";

// lastmod rules:
// - Set to the date the page was ACTUALLY created or last meaningfully changed
// - Only update a page's date when you change its content in that commit
// - Never use new Date() globally — all-same timestamps destroy Googlebot trust
// - See ~/.claude/rules/truecolor-seo-safety.md for the full wave system

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Core pages ───────────────────────────────────────────────────────────
    { url: `${BASE_URL}/`, lastModified: new Date("2026-05-25"), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date("2026-05-02"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/quote`, lastModified: new Date("2026-03-13"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/resources`, lastModified: new Date("2026-04-12"), changeFrequency: "monthly", priority: 0.6 },

    // ── Tier 1 SEO landing pages ──────────────────────────────────────────────
    { url: `${BASE_URL}/coroplast-signs-saskatoon`, lastModified: new Date("2026-06-04"), changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/same-day-printing-saskatoon`, lastModified: new Date("2025-11-15"), changeFrequency: "monthly", priority: 0.95 },

    // ── Product SEO pages (launched in batches Nov 2025 – Jan 2026) ──────────
    { url: `${BASE_URL}/banner-printing-saskatoon`, lastModified: new Date("2026-06-04"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/business-cards-saskatoon`, lastModified: new Date("2026-06-05"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/vehicle-magnets-saskatoon`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/vehicle-decals-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/aluminum-signs-saskatoon`, lastModified: new Date("2026-06-04"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/retractable-banners-saskatoon`, lastModified: new Date("2026-01-08"), changeFrequency: "monthly", priority: 0.8 },

    // ── Product SEO pages — sprint (2026-03-02) ───────────────────────────────
    { url: `${BASE_URL}/graphic-design-saskatoon`, lastModified: new Date("2026-06-12"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/printing-prices-saskatoon`, lastModified: new Date("2026-06-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/sign-company-saskatoon`, lastModified: new Date("2026-06-05"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/wall-graphics-saskatoon`, lastModified: new Date("2026-06-05"), changeFrequency: "monthly", priority: 0.8 },

    // ── Print product SEO pages — sprint (2026-03-03) ────────────────────────
    { url: `${BASE_URL}/flyer-printing-saskatoon`, lastModified: new Date("2026-06-05"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/brochure-printing-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/booklet-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.9 },

    // ── Service & hub SEO pages — sprint (2026-03-03) ────────────────────────
    { url: `${BASE_URL}/large-format-printing-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/trade-show-displays-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },
    // /event-signs-saskatoon removed 2026-05-05 → 301 to /banner-printing-saskatoon (cannibalization consolidation)

    // ── Industry pages (existing, launched Jan–Feb 2026) ──────────────────────
    { url: `${BASE_URL}/real-estate-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/construction-signs-saskatoon`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/agribusiness-signs-saskatchewan`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/agriculture-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/restaurant-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/election-signs`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    // /event-banners removed 2026-05-05 → 301 to /banner-printing-saskatoon (decayed parent reclaiming equity)
    // /ramadan-eid-banners-saskatoon removed from sitemap 2026-05-05 — out of season + page now noindex; restore April 2027
    { url: `${BASE_URL}/healthcare-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/dental-office-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },

    // ── Industry pages — Sprint A (2026-03-05) ────────────────────────────────
    { url: `${BASE_URL}/retail-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/window-decals-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/window-perf-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/sticker-printing-saskatoon`, lastModified: new Date("2026-06-19"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/school-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    // /trade-contractor-signs-saskatoon removed 2026-05-05 → 301 to /construction-signs-saskatoon

    // ── Product + Industry pages — Sprint B (2026-03-05) ─────────────────────
    { url: `${BASE_URL}/foamboard-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/vinyl-lettering-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/postcard-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/photo-poster-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/poster-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.9 },
    // /custom-magnets-saskatoon removed 2026-05-05 → 301 to /vehicle-magnets-saskatoon
    { url: `${BASE_URL}/gym-fitness-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/salon-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/car-dealership-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },

    // ── Industry pages — Sprint C (2026-03-05) ────────────────────────────────
    { url: `${BASE_URL}/church-banners-saskatoon`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/non-profit-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/hotel-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/law-office-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/daycare-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/chiropractor-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pharmacy-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/brewery-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/property-management-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/for-lease-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },

    // ── Label & service SEO pages — Wave 2026-05-14 product expansion ───────
    { url: `${BASE_URL}/labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/freezer-labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/product-labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/cosmetic-labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/candle-jar-labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/roll-labels-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/image-upscale-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/logo-vectorization-saskatoon`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.75 },

    // ── Label & service city-variant SEO pages — Wave 2026-05-14 programmatic expansion ──
    // Labels × Regina
    { url: `${BASE_URL}/freezer-labels-regina`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/product-labels-regina`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cosmetic-labels-regina`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/candle-jar-labels-regina`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    // Labels × Moose Jaw
    { url: `${BASE_URL}/freezer-labels-moose-jaw-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/product-labels-moose-jaw-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cosmetic-labels-moose-jaw-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/candle-jar-labels-moose-jaw-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    // Labels × Prince Albert
    { url: `${BASE_URL}/freezer-labels-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/product-labels-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cosmetic-labels-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/candle-jar-labels-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    // Image upscale × cities
    { url: `${BASE_URL}/image-upscale-regina`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE_URL}/image-upscale-moose-jaw-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE_URL}/image-upscale-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.65 },
    // Logo vectorization × cities
    { url: `${BASE_URL}/logo-vectorization-regina`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE_URL}/logo-vectorization-moose-jaw-sk`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE_URL}/logo-vectorization-prince-albert-sk`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.65 },

    // ── Seasonal pages ────────────────────────────────────────────────────────
    // /st-patricks-day-printing-saskatoon removed from sitemap 2026-05-05 — out of season + page now noindex; restore Feb 2027
    { url: `${BASE_URL}/graduation-banners-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/mothers-day-printing-saskatoon`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.85 },
    // /canada-day-printing-saskatoon — add when page is built
    // /back-to-school-signs-saskatoon — add when page is built

    // ── Cluster hub pages (2026-04-13) ───────────────────────────────────────
    { url: `${BASE_URL}/commercial-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/education-signs-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/community-printing-saskatoon`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.8 },
    // /trades-signs-saskatoon removed 2026-05-05 → 301 to /construction-signs-saskatoon

    // ── SK city/province pages ────────────────────────────────────────────────
    { url: `${BASE_URL}/banner-printing-regina`, lastModified: new Date("2026-01-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/coroplast-signs-regina`, lastModified: new Date("2026-01-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-prince-albert-sk`, lastModified: new Date("2026-01-28"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-lloydminster-sk`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-moose-jaw-sk`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-swift-current-sk`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.75 },

    // ── SK city pages — Sprint C (2026-03-05) ─────────────────────────────────
    { url: `${BASE_URL}/signs-north-battleford-sk`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-yorkton-sk`, lastModified: new Date("2026-05-29"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-estevan-sk`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-weyburn-sk`, lastModified: new Date("2026-05-25"), changeFrequency: "monthly", priority: 0.75 },

    // ── SK city×product pages (2026-04-13) ───────────────────────────────────
    // Regina
    { url: `${BASE_URL}/vehicle-magnets-regina`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/business-cards-regina`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/flyer-printing-regina`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    // Moose Jaw
    { url: `${BASE_URL}/coroplast-signs-moose-jaw-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/banner-printing-moose-jaw-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/vehicle-magnets-moose-jaw-sk`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/business-cards-moose-jaw-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/flyer-printing-moose-jaw-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    // Prince Albert
    { url: `${BASE_URL}/coroplast-signs-prince-albert-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/banner-printing-prince-albert-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/vehicle-magnets-prince-albert-sk`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/business-cards-prince-albert-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/flyer-printing-prince-albert-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    // Yorkton
    { url: `${BASE_URL}/coroplast-signs-yorkton-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/banner-printing-yorkton-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/vehicle-magnets-yorkton-sk`, lastModified: new Date("2026-05-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/business-cards-yorkton-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/flyer-printing-yorkton-sk`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7 },

    // ── Legal ─────────────────────────────────────────────────────────────────
    { url: `${BASE_URL}/privacy`, lastModified: new Date("2025-11-15"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date("2025-11-15"), changeFrequency: "yearly", priority: 0.3 },

    // NOTE: /products/* estimator pages intentionally excluded from sitemap.
    // They are utility/calculator pages, not editorial SEO pages.
    // Their canonical authority flows to the corresponding /[product]-saskatoon SEO pages.
  ];
}
