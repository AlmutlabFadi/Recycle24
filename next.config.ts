import type { NextConfig } from "next";
import { config } from "dotenv";

// Load .env file
config();

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./prisma/dev.db",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
