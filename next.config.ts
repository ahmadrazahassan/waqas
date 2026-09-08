import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next 16 defaults: qualities is [75], minimumCacheTTL is 4h, redirects cap at 3.
  // Local images with query strings need localPatterns. Use remotePatterns, never
  // the deprecated `domains` key.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  // Every internal href is checked against the real route tree at build time,
  // so a broken link fails the build instead of shipping.
  typedRoutes: true,
};

export default nextConfig;
