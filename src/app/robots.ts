import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",
          "PerplexityBot", "PerplexityBot-User",
          "ClaudeBot", "anthropic-ai",
          "Google-Extended", "Gemini-Web",
          "Bytespider", "cohere-ai",
          "meta-externalagent",
          "Applebot", "Applebot-Extended",
          "Amazonbot", "YouBot", "Diffbot",
        ],
        allow: "/",
        disallow: ["/staff", "/api/", "/pay/", "/cart", "/checkout", "/order-confirmed", "/account"],
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/staff", "/api/", "/pay/", "/cart", "/checkout", "/order-confirmed", "/account"],
      },
    ],
    sitemap: [
      "https://truecolorprinting.ca/sitemap.xml",
      "https://truecolorprinting.ca/image-sitemap.xml",
    ],
  };
}
