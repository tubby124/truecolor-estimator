import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // @resvg/resvg-js uses a NAPI native addon — keep it as an external server package
  // so Turbopack/webpack don't try to bundle the .node binary
  serverExternalPackages: ["@resvg/resvg-js"],

  async headers() {
    return [
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://dczbgraekmzirxknjvwe.supabase.co wss://dczbgraekmzirxknjvwe.supabase.co https://api.brevo.com https://api.clover.com; frame-ancestors 'none'; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
