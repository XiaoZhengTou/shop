import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow unoptimized SVG placeholders
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Future: add external image domains here
    // remotePatterns: [{ protocol: "https", hostname: "example.com" }],
  },
  // Ensure proper headers for mobile access
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
