import type { MetadataRoute } from "next";

const BASE_URL = "https://truecolorprinting.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    // Core
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/quote", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/gallery", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/services", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/quote-request", priority: 0.6, changeFrequency: "monthly" as const },
    // SEO landing pages — Tier 1 (highest priority keywords)
    { url: "/coroplast-signs-saskatoon", priority: 0.95, changeFrequency: "monthly" as const },
    { url: "/same-day-printing-saskatoon", priority: 0.95, changeFrequency: "monthly" as const },
    { url: "/banner-printing-saskatoon", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/business-cards-saskatoon", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/agribusiness-signs-saskatchewan", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/healthcare-signs-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/dental-office-signs-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/vehicle-magnets-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/aluminum-signs-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/retractable-banners-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    // Industry pages
    { url: "/real-estate-signs-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/construction-signs-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "/agriculture-signs-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/restaurant-signs-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/election-signs", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/event-banners", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/ramadan-eid-banners-saskatoon", priority: 0.85, changeFrequency: "monthly" as const },
    // Legal
    { url: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const productSlugs = [
    "coroplast-signs",
    "vinyl-banners",
    "acp-signs",
    "vehicle-magnets",
    "flyers",
    "business-cards",
    "foamboard-displays",
    "retractable-banners",
    "window-decals",
    "window-perf",
    "vinyl-lettering",
    "stickers",
    "postcards",
    "brochures",
    "photo-posters",
    "magnet-calendars",
  ];

  return [
    ...staticPages.map(({ url, priority, changeFrequency }) => ({
      url: `${BASE_URL}${url}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...productSlugs.map((slug) => ({
      url: `${BASE_URL}/products/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
