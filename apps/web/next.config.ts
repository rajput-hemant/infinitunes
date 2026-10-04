import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";
import { IMAGE_CDN_HOSTS } from "./lib/image-hosts";

const isProd = process.env.NODE_ENV === "production";

// The Content-Security-Policy (report-only, per-request nonce) is set in
// `proxy.ts`, not here.
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
  // Keep error/warn: server-side fallbacks (shell data, recordPlay) log through
  // console.error and would otherwise be invisible in production.
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    // Images are served as-is; enabling the Next optimizer on Vercel is a
    // pending decision.
    unoptimized: true,
    remotePatterns: [
      ...IMAGE_CDN_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
