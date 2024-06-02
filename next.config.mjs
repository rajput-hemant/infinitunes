import createJiti from "jiti";

// This is validation for the environment variables early in the build process.
const jiti = createJiti(new URL(import.meta.url).pathname);
jiti("./src/lib/env");

const isProd = process.env.NODE_ENV === "production";
const isDocker = process.env.IS_DOCKER === "true";

/** @type {import("next").NextConfig} */
const config = {
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
    unoptimized: isDocker,
  },
  experimental: {
    ppr: true,
    reactCompiler: isProd,
    // ...
  },
  output: isDocker ? "standalone" : undefined,
  /* ... */
};

export default config;
