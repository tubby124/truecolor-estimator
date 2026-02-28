import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

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
      // /agriculture-signs-saskatoon → keep (don't redirect — different keyword target)
      // /election-signs → keep canonical (has "Saskatoon" in title/content)
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
        "/quote/:path+",
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
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.trustindex.io https://*.trustindex.io; style-src 'self' 'unsafe-inline' https://cdn.trustindex.io https://*.trustindex.io; img-src 'self' data: https:; connect-src 'self' https://dczbgraekmzirxknjvwe.supabase.co wss://dczbgraekmzirxknjvwe.supabase.co https://api.brevo.com https://api.clover.com https://*.trustindex.io; frame-src https://*.trustindex.io https://www.trustindex.io; frame-ancestors 'none'; font-src 'self' data: https://cdn.trustindex.io https://*.trustindex.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
