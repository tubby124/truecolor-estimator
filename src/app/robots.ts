import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Google-Extended"],
        allow: "/",
        disallow: ["/staff", "/api/", "/pay/", "/cart", "/checkout", "/order-confirmed", "/account"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/staff", "/api/", "/pay/", "/cart", "/checkout", "/order-confirmed", "/account"],
      },
    ],
    sitemap: "https://truecolorprinting.ca/sitemap.xml",
  };
}
