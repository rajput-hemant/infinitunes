import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./src/lib/env";

const isProd = process.env.NODE_ENV === "production";
const isDocker = process.env.IS_DOCKER === "true";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "c.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "c.sop.saavncdn.com",
      },
    ],
    unoptimized: !isDocker,
  },
  experimental: {
    ppr: true,
    reactCompiler: isProd ? true : undefined,
    // ...
  },
  output: isDocker ? "standalone" : undefined,
  /* ... */
};

export default config;
