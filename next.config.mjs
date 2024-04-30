import createJiti from "jiti";

// This is validation for the environment variables early in the build process.
const jiti = createJiti(new URL(import.meta.url).pathname);
jiti("./src/lib/env");

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
    unoptimized: true,
  },
  experimental: {
    // ...
  },
  output: "standalone",
  /* ... */
};

export default config;
