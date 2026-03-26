import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["aroma-pulse.vercel.app", "localhost"],
    },
  },
};

export default nextConfig;
