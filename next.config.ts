import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        ],
      },
      ...["/dashboard/:path*", "/admin/:path*", "/api/:path*", "/login", "/signup", "/r/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
    ];
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },

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
