import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    formats: ["image/avif", "image/webp"],
  },

  // @resvg/resvg-js uses a NAPI native addon — keep it as an external server package
  // so Turbopack/webpack don't try to bundle the .node binary
  serverExternalPackages: ["@resvg/resvg-js"],

  async redirects() {
    return [
      // /restaurants → canonical geo URL
      {
        source: "/restaurants",
        destination: "/restaurant-signs-saskatoon",
        permanent: true,
      },
      // /sports-banners-saskatoon → /event-banners (temporary until sports page is built)
      {
        source: "/sports-banners-saskatoon",
        destination: "/event-banners",
        permanent: false,
      },
      // /retail-signs-saskatoon has its own page — redirect removed 2026-03-05
      // /agriculture-signs-saskatoon → keep (don't redirect — different keyword target)
      // /election-signs → keep canonical (has "Saskatoon" in title/content)
      // /vinyl-banners-saskatoon → canonical SEO page is /banner-printing-saskatoon
      {
        source: "/vinyl-banners-saskatoon",
        destination: "/banner-printing-saskatoon",
        permanent: true,
      },
      // /quote-request consolidated to /quote (2026-03-13 URL architecture restructure)
      {
        source: "/quote-request",
        destination: "/quote",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      // ── Noindex: transactional + private pages ────────────────────────────
      ...[
        "/cart",
        "/checkout",
        "/order-confirmed",
        "/pay/:path*",
        "/staff/:path*",
        "/account",
        "/account/:path*",
        "/products/:path+",
        "/api/:path*",
      ].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      // ── Security headers on all routes ───────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.trustindex.io https://*.trustindex.io https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.trustindex.io https://*.trustindex.io; img-src 'self' data: https:; connect-src 'self' https://dczbgraekmzirxknjvwe.supabase.co wss://dczbgraekmzirxknjvwe.supabase.co https://api.brevo.com https://api.clover.com https://*.trustindex.io https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://challenges.cloudflare.com; frame-src https://*.trustindex.io https://www.trustindex.io https://challenges.cloudflare.com; frame-ancestors 'none'; font-src 'self' data: https://cdn.trustindex.io https://*.trustindex.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
