import {
  NATIVE_APP_ORIGIN,
  NATIVE_ORIGIN_HEADER,
} from "@infinitunes/auth/native-app";
import { sessionCookiePrefix } from "@infinitunes/auth/session-cookie";
import { originOf } from "@infinitunes/auth/url";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appRoutes, userRoutes } from "./config/routes";
import { legacyArtistPath } from "./lib/artist-route";
import { getClientKey, resolveTrustedProxy } from "./lib/client-ip";
import { buildCsp, cspHeaderName } from "./lib/csp";
import { env } from "./lib/env";
import { LIMITS, OG_PATH, limiterKinds } from "./lib/rate-limit-scope";
import type { LimiterKind } from "./lib/rate-limit-scope";
import { searchRouteAction } from "./lib/search-route";

let redis: Redis | undefined;
const limiters = new Map<LimiterKind, Ratelimit>();

function getRatelimit(kind: LimiterKind) {
  let limiter = limiters.get(kind);
  if (!limiter) {
    redis ??= Redis.fromEnv();
    limiter = new Ratelimit({
      redis,
      prefix: kind === "global" ? undefined : `@upstash/ratelimit/${kind}`,
      limiter:
        kind === "global"
          ? Ratelimit.slidingWindow(
              env.RATE_LIMITING_REQUESTS_PER_SECOND,
              "1 s",
            )
          : Ratelimit.slidingWindow(LIMITS[kind].requests, LIMITS[kind].window),
    });
    limiters.set(kind, limiter);
  }
  return limiter;
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isTrpc = pathname.startsWith("/api/trpc");

  if (isTrpc && !isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: { message: "Forbidden: Invalid origin" } },
      { status: 403 },
    );
  }

  const isAuthApi = pathname.startsWith("/api/auth");

  if (env.ENABLE_RATE_LIMITING === "true" && env.NODE_ENV === "production") {
    const id = getClientKey(
      req.headers,
      resolveTrustedProxy(env.TRUSTED_PROXY, process.env.VERCEL),
    );
    const kinds = limiterKinds({
      pathname,
      method: req.method,
      headers: req.headers,
    });
    for (const kind of kinds) {
      let result: Awaited<ReturnType<Ratelimit["limit"]>>;
      try {
        result = await getRatelimit(kind).limit(id);
      } catch (error) {
        // Fail open: a Redis outage must not take sign-in or pages down.
        console.error(
          `[proxy:ratelimit] ${kind} limiter failed; allowing`,
          error,
        );
        continue;
      }
      const { limit, pending, remaining, reset, success } = result;

      if (result.reason === "timeout") {
        console.error(`[proxy:ratelimit] ${kind} limiter timed out; allowing`);
      }

      if (!success) {
        return NextResponse.json(
          {
            error: {
              message: "Too many requests",
              limit,
              pending,
              remaining,
              reset: `${reset - Date.now()}ms`,
            },
          },

          {
            status: 429,
            headers: {
              "x-ratelimit-limit": limit.toString(),
              "x-ratelimit-remaining": remaining.toString(),
              "retry-after": Math.max(
                1,
                Math.ceil((reset - Date.now()) / 1000),
              ).toString(),
            },
          },
        );
      }
    }
  }

  // Better Auth owns origin checks, sessions and responses for its routes.
  if (isAuthApi || pathname === OG_PATH) return NextResponse.next();

  const sessionToken = getSessionCookie(req, {
    cookiePrefix: sessionCookiePrefix(),
  });

  const isUserRoute = userRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isUserRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Auth pages are deliberately not redirected here: the proxy only sees that a
  // session cookie exists, not whether it is valid, so a stale cookie would lock
  // the user out of /login. The (auth) layout redirects real sessions instead.

  const paths = pathname.split("/").slice(1);

  if (paths.length === 2 && appRoutes.includes(`/${paths[0]}`)) {
    return NextResponse.redirect(new URL(`/${paths[0]}`, nextUrl));
  }

  if (isTrpc) return NextResponse.next();

  // Artist tabs used to live in the name slug (`<name>-songs`); they are child
  // routes now, so old links and bookmarks move permanently to the tab route.
  if (req.method === "GET" || req.method === "HEAD") {
    const tabPath = legacyArtistPath(pathname);
    if (tabPath) {
      const target = new URL(tabPath, nextUrl);
      target.search = nextUrl.search;
      return NextResponse.redirect(target, 308);
    }
  }

  let response = NextResponse.next();
  if (req.method === "GET" || req.method === "HEAD") {
    const search = searchRouteAction(pathname);
    if (search?.kind === "redirect") {
      const target = new URL(search.pathname, nextUrl);
      target.search = nextUrl.search;
      return NextResponse.redirect(target, 308);
    }
    if (search?.kind === "rewrite") {
      const target = new URL(search.pathname, nextUrl);
      target.search = nextUrl.search;
      response = NextResponse.rewrite(target);
    }
    // A path no route owns: Next renders `not-found.tsx` with a real 404.
    if (search?.kind === "notFound") {
      response = NextResponse.rewrite(new URL("/_search-not-found", nextUrl));
    }
  }

  // `CSP_ENFORCE` chooses enforcing vs report-only.
  response.headers.set(
    cspHeaderName(),
    buildCsp({
      isDev: env.NODE_ENV === "development",
      umami: Boolean(env.UMAMI_WEBSITE_ID),
    }),
  );
  return response;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for /api/trpc. State-changing methods must send a matching
 * `Origin` (browsers always do for same-origin POST; Referer is not enough),
 * or come from the native app. Safe methods may omit both headers but must
 * match when one is present.
 */
function isSameOriginRequest(req: NextRequest): boolean {
  if (req.method === "OPTIONS") return true;

  // The request's own host (browsers cannot forge it cross-site) plus the
  // configured public URL, so previews and alternate domains keep working.
  const host = req.headers.get("host");
  const allowed = [
    originOf(host ? `${req.nextUrl.protocol}//${host}` : null),
    originOf(env.AUTH_URL ?? null),
  ].filter((o): o is string => o !== null);
  const isAllowed = (value: string | null) => {
    const o = originOf(value);
    return o !== null && allowed.includes(o);
  };
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!SAFE_METHODS.has(req.method)) {
    return origin ? isAllowed(origin) : isNativeAppRequest(req.headers);
  }
  if (origin) return isAllowed(origin);
  if (referer) return isAllowed(referer);
  return true;
}

/**
 * A request without `Origin` from the native app, which names itself in
 * `expo-origin` and sends its session cookie explicitly, never ambiently.
 * A browser cannot produce one: it sends `Origin` and `Sec-Fetch-Site` on
 * every POST, and a cross-site page can set a custom header only after a
 * CORS preflight, which this app never grants.
 */
function isNativeAppRequest(headers: Headers): boolean {
  return (
    headers.get(NATIVE_ORIGIN_HEADER) === NATIVE_APP_ORIGIN &&
    !headers.has("sec-fetch-site")
  );
}

export const config = {
  // Static assets and non-limited API routes skip the proxy, see PROXY_MATCHER.
  // Next requires a literal here, so the pattern is mirrored (and asserted
  // equal) in tests/mocked/proxy.test.ts.
  matcher: [
    "/((?!api/(?!trpc|auth|og)|_next/|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|css|js|map|txt|xml|json|webmanifest|mp3|mp4)$).*)",
  ],
};
