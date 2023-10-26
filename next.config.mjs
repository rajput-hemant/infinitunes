import "./src/lib/env.mjs";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["c.saavncdn.com", "c.sop.saavncdn.com"],
    unoptimized: true,
  },
  experimental: {
    swcPlugins: [["@swc-jotai/react-refresh", {}]],
    serverActions: true,
  },
  /* ... */
};

export default config;
