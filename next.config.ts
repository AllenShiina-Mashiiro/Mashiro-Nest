import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ESLint is not installed in this project; keep production builds usable.
  // Run `npm run typecheck` for the configured TypeScript check.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Covers can point at any S3 / CDN host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
