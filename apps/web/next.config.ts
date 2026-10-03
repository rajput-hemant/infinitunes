import path from "path";

import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";
import { IMAGE_CDN_HOSTS } from "./lib/image-hosts";

const isProd = process.env.NODE_ENV === "production";
const isDocker = process.env.IS_DOCKER === "true";

// A CSP is intentionally not set here: it needs a nonce/allowlist pass over the
// analytics script and inline theme bootstrap first (see review notes).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const config: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  compiler: { removeConsole: isProd },
  images: {
    remotePatterns: [
      ...IMAGE_CDN_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
    ],
    unoptimized: !isDocker,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  output: isDocker ? "standalone" : undefined,
  outputFileTracingRoot: isDocker ? path.join(__dirname, "../../") : undefined,
};

export default config;
