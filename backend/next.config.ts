import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Parent lockfiles confuse Turbopack; pin root to this backend package.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
