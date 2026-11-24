import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Order links carry a private token: never leak full URLs to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation is allowed for this site only: the rider page shares live GPS during a delivery.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Low-memory laptops: NEXT_BUILD_CPUS=1 builds pages one worker at a time.
  ...(process.env.NEXT_BUILD_CPUS ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } } : {}),
  partialPrefetching: false,
  poweredByHeader: false,
  // No Next.js dev-tools badge over the page (keeps local reviews and recordings clean).
  devIndicators: false,
  // Local testing via 127.0.0.1 (browsers that pinned HTTPS for "localhost").
  allowedDevOrigins: ["127.0.0.1"],
  // Low-memory machines: run `npx tsc --noEmit` first, then build with
  // SKIP_BUILD_TYPECHECK=1 so the build doesn't type-check a second time.
  typescript: { ignoreBuildErrors: process.env.SKIP_BUILD_TYPECHECK === "1" },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/order/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/rider/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      // The Meta Purchase bridge is framed by our own order page (later entries win).
      {
        source: "/meta-pixel-bridge",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
