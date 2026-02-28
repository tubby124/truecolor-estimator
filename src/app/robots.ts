import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/staff", "/api/", "/pay/", "/cart", "/checkout", "/order-confirmed", "/account"],
      },
    ],
    sitemap: "https://truecolorprinting.ca/sitemap.xml",
  };
}
