import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @resvg/resvg-js uses a NAPI native addon — keep it as an external server package
  // so Turbopack/webpack don't try to bundle the .node binary
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
