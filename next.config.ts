import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Covers can point at any S3 / CDN host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
