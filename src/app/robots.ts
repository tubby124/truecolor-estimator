import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const publicDisallow = [
    "/staff",
    "/api/",
    "/pay/",
    "/cart",
    "/checkout",
    "/order-confirmed",
    "/account",
    "/account/",
    "/quote/",
  ];

  return {
    rules: [
      // AI citation crawlers — ALLOW ALL for maximum LLM visibility
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",
          "PerplexityBot", "PerplexityBot-User",
          "ClaudeBot", "anthropic-ai",
          "Google-Extended", "Gemini-Web",
          "Bytespider", "cohere-ai",
          "meta-externalagent", "FacebookBot",
          "Applebot", "Applebot-Extended",
          "Amazonbot", "YouBot", "Diffbot",
          "CCBot",
        ],
        allow: "/",
        disallow: publicDisallow,
      },
      // Block commercial SEO scrapers — zero ranking value, wastes crawl budget
      {
        userAgent: [
          "AhrefsBot", "SemrushBot", "MJ12bot",
          "DotBot", "PetalBot", "DataForSeoBot", "BLEXBot",
        ],
        disallow: "/",
      },
      // Default: allow with standard blocks
      {
        userAgent: "*",
        allow: "/",
        disallow: publicDisallow,
      },
    ],
    sitemap: [
      "https://truecolorprinting.ca/sitemap.xml",
      "https://truecolorprinting.ca/image-sitemap.xml",
    ],
  };
}
