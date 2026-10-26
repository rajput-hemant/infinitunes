import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";
import { legacySettingsRedirects } from "./lib/legacy-redirects";

const isProd = process.env.NODE_ENV === "production";

// The Content-Security-Policy (report-only, hash-based) is set in
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

// Public files keep their names when their contents change, so they cannot be
// `immutable`; a day of freshness with a week of stale-while-revalidate keeps
// revisits cheap without pinning a replaced file. Next's `/_next/static`
// output is content-hashed and already served as immutable.
const publicAssetHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=86400, stale-while-revalidate=604800",
  },
];

const config: NextConfig = {
  cacheComponents: true,
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  experimental: {
    // Pages read params/cookies, so their data is "dynamic" to the client
    // router, whose default keeps it 0s: every revisit refetched and showed
    // `loading.tsx`. Keep it for the shortest catalog TTL (REVALIDATE_SECONDS).
    // Writes stay current: `refresh()`/`router.refresh()` clear this cache.
    // Leave `static` alone, it also sets the default cacheLife stale time.
    staleTimes: { dynamic: 600 },
  },
  // Keep error/warn: server-side fallbacks (shell data, recordPlay) log through
  // console.error and would otherwise be invisible in production.
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    // Images are served as-is without Next.js optimization.
    unoptimized: true,
  },
  async redirects() {
    return legacySettingsRedirects;
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: publicAssetHeaders },
      { source: "/fonts/:path*", headers: publicAssetHeaders },
      {
        source:
          "/:icon(icon-192\\.png|icon-512\\.png|apple-icon\\.png|favicon\\.ico|favicon-16x16\\.png|favicon-32x32\\.png)",
        headers: publicAssetHeaders,
      },
    ];
  },
};

export default config;
