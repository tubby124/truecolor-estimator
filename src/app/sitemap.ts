import type { MetadataRoute } from "next";

const BASE_URL = "https://truecolorprinting.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/quote", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/gallery", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/real-estate-signs-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/construction-signs-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/agriculture-signs-saskatoon", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/restaurants", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/election-signs", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/event-banners", priority: 0.7, changeFrequency: "monthly" as const },
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
