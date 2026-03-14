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

      // ── Old WordPress URLs → new Next.js equivalents (GSC 404 cleanup 2026-03-13) ──

      // WP product pages → SEO landing pages
      {
        source: "/product/banners-and-signage",
        destination: "/banner-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product/business-card-one-side",
        destination: "/business-cards-saskatoon",
        permanent: true,
      },
      {
        source: "/product/business-card-two-side",
        destination: "/business-cards-saskatoon",
        permanent: true,
      },
      {
        source: "/product/flyers-80lb-one-side",
        destination: "/flyer-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product/flyers-80lb-two-side",
        destination: "/flyer-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product/flyers-100lb-two-side",
        destination: "/flyer-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product/retractable-banner",
        destination: "/products/retractable-banners",
        permanent: true,
      },
      {
        source: "/product/vinyl-decals-lettering-and-vehicle-decals",
        destination: "/vinyl-lettering-saskatoon",
        permanent: true,
      },

      // WP product category pages → SEO landing pages
      {
        source: "/product-category/banners-and-signage",
        destination: "/banner-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/business-cards",
        destination: "/business-cards-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/flyers-brochures-posters",
        destination: "/flyer-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/standing-banner",
        destination: "/products/retractable-banners",
        permanent: true,
      },
      {
        source: "/product-category/stickers-labels",
        destination: "/sticker-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/stickers",
        destination: "/sticker-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/vehicle-graphics-magnets",
        destination: "/vehicle-magnets-saskatoon",
        permanent: true,
      },
      {
        source: "/product-category/uncategorized",
        destination: "/",
        permanent: true,
      },

      // Old WP page slugs → new equivalents
      {
        source: "/flyers-2",
        destination: "/flyer-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/stickers",
        destination: "/sticker-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/work",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/banners-and-signage",
        destination: "/banner-printing-saskatoon",
        permanent: true,
      },
      {
        source: "/business-cards",
        destination: "/business-cards-saskatoon",
        permanent: true,
      },
      {
        source: "/retractable-banner-standing-banners",
        destination: "/products/retractable-banners",
        permanent: true,
      },
      {
        source: "/vinyl-decals-lettering-and-vehicle-decals",
        destination: "/vinyl-lettering-saskatoon",
        permanent: true,
      },
      // /contact has its own page.tsx — DO NOT redirect (would shadow the real page)
      {
        source: "/shop",
        destination: "/",
        permanent: true,
      },

      // Dead WP pages → homepage
      {
        source: "/hello-world",
        destination: "/",
        permanent: true,
      },
      {
        source: "/thank-you",
        destination: "/",
        permanent: true,
      },
      {
        source: "/our-package",
        destination: "/",
        permanent: true,
      },
      {
        source: "/my-bookings",
        destination: "/",
        permanent: true,
      },
      {
        source: "/appointment-cancellation-confirmation",
        destination: "/",
        permanent: true,
      },
      {
        source: "/comments/feed",
        destination: "/",
        permanent: true,
      },
      {
        source: "/category/uncategorized",
        destination: "/",
        permanent: true,
      },

      // WP system paths → homepage
      {
        source: "/author/:slug",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-content/:path*",
        destination: "/",
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
