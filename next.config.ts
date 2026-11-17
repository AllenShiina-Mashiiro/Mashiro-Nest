import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a minimal standalone server for Docker and self-hosted deployments.
  output: "standalone",
  // ESLint is not installed in this project; keep production builds usable.
  // Run `npm run typecheck` for the configured TypeScript check.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Covers covers hosted on S3-compatible storage and external CDNs.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
