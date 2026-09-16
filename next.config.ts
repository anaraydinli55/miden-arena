import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.conditionNames = [
      "browser",
      "import",
      "module",
      "default",
    ];
    return config;
  },
};

export default nextConfig;
