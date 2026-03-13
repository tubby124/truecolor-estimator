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
    { url: `${BASE_URL}/`, lastModified: new Date("2026-03-13"), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/quote`, lastModified: new Date("2025-11-20"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date("2026-03-13"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date("2026-03-11"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date("2026-03-12"), changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: new Date("2025-12-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/quote-request`, lastModified: new Date("2026-03-10"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/resources`, lastModified: new Date("2026-01-20"), changeFrequency: "monthly", priority: 0.6 },

    // ── Tier 1 SEO landing pages ──────────────────────────────────────────────
    { url: `${BASE_URL}/coroplast-signs-saskatoon`, lastModified: new Date("2025-11-15"), changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/same-day-printing-saskatoon`, lastModified: new Date("2025-11-15"), changeFrequency: "monthly", priority: 0.95 },

    // ── Product SEO pages (launched in batches Nov 2025 – Jan 2026) ──────────
    { url: `${BASE_URL}/banner-printing-saskatoon`, lastModified: new Date("2026-01-10"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/business-cards-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/vehicle-magnets-saskatoon`, lastModified: new Date("2025-12-10"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/aluminum-signs-saskatoon`, lastModified: new Date("2025-12-18"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/retractable-banners-saskatoon`, lastModified: new Date("2026-01-08"), changeFrequency: "monthly", priority: 0.8 },

    // ── Product SEO pages — sprint (2026-03-02) ───────────────────────────────
    { url: `${BASE_URL}/graphic-design-saskatoon`, lastModified: new Date("2026-03-02"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/sign-company-saskatoon`, lastModified: new Date("2026-03-02"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/wall-graphics-saskatoon`, lastModified: new Date("2026-03-02"), changeFrequency: "monthly", priority: 0.8 },

    // ── Print product SEO pages — sprint (2026-03-03) ────────────────────────
    { url: `${BASE_URL}/flyer-printing-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/brochure-printing-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },

    // ── Service & hub SEO pages — sprint (2026-03-03) ────────────────────────
    { url: `${BASE_URL}/large-format-printing-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/trade-show-displays-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/event-signs-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.85 },

    // ── Industry pages (existing, launched Jan–Feb 2026) ──────────────────────
    { url: `${BASE_URL}/real-estate-signs-saskatoon`, lastModified: new Date("2026-01-20"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/construction-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/agribusiness-signs-saskatchewan`, lastModified: new Date("2025-12-15"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/agriculture-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/restaurant-signs-saskatoon`, lastModified: new Date("2026-01-08"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/election-signs`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/event-banners`, lastModified: new Date("2026-01-15"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/ramadan-eid-banners-saskatoon`, lastModified: new Date("2026-02-01"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/healthcare-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/dental-office-signs-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },

    // ── Industry pages — Sprint A (2026-03-05) ────────────────────────────────
    { url: `${BASE_URL}/retail-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/window-decals-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/sticker-printing-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/school-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/trade-contractor-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },

    // ── Product + Industry pages — Sprint B (2026-03-05) ─────────────────────
    { url: `${BASE_URL}/foamboard-printing-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/vinyl-lettering-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/postcard-printing-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/photo-poster-printing-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/custom-magnets-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/gym-fitness-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/salon-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/car-dealership-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },

    // ── Industry pages — Sprint C (2026-03-05) ────────────────────────────────
    { url: `${BASE_URL}/church-banners-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/non-profit-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/hotel-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/law-office-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/daycare-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/chiropractor-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pharmacy-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/brewery-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/property-management-signs-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.8 },

    // ── Seasonal pages ────────────────────────────────────────────────────────
    { url: `${BASE_URL}/st-patricks-day-printing-saskatoon`, lastModified: new Date("2026-02-25"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/graduation-banners-saskatoon`, lastModified: new Date("2026-03-12"), changeFrequency: "monthly", priority: 0.85 },
    // /mothers-day-printing-saskatoon — add when page is built
    // /canada-day-printing-saskatoon — add when page is built
    // /back-to-school-signs-saskatoon — add when page is built

    // ── SK city/province pages ────────────────────────────────────────────────
    { url: `${BASE_URL}/banner-printing-regina`, lastModified: new Date("2026-01-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/coroplast-signs-regina`, lastModified: new Date("2026-01-25"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-prince-albert-sk`, lastModified: new Date("2026-01-28"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-lloydminster-sk`, lastModified: new Date("2026-01-28"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-moose-jaw-sk`, lastModified: new Date("2026-01-30"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-swift-current-sk`, lastModified: new Date("2026-01-30"), changeFrequency: "monthly", priority: 0.75 },

    // ── SK city pages — Sprint C (2026-03-05) ─────────────────────────────────
    { url: `${BASE_URL}/signs-north-battleford-sk`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/signs-yorkton-sk`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-estevan-sk`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/printing-weyburn-sk`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.75 },

    // ── Legal ─────────────────────────────────────────────────────────────────
    { url: `${BASE_URL}/privacy`, lastModified: new Date("2025-11-15"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date("2025-11-15"), changeFrequency: "yearly", priority: 0.3 },

    // NOTE: /products/* estimator pages intentionally excluded from sitemap.
    // They are utility/calculator pages, not editorial SEO pages.
    // Their canonical authority flows to the corresponding /[product]-saskatoon SEO pages.
  ];
}
