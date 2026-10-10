import { originOf } from "@infinitunes/auth/url";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appRoutes, userRoutes } from "./config/routes";
import { getClientKey, resolveTrustedProxy } from "./lib/client-ip";
import { buildCsp, cspHeaderName } from "./lib/csp";
import { env } from "./lib/env";

/**
 * Credential endpoints get a stricter per-client bucket on top of the global
 * one. Better Auth's own limiter (burst of 3 per 10s on sign-in/up, plus the
 * reset-password rules in `RESET_RATE_LIMITS`) stays authoritative for those
 * paths; this adds a sustained cap with a trusted client key. The reset
 * endpoints are left to Better Auth alone so they are not limited twice.
 */
const AUTH_CREDENTIAL_PATHS = new Set([
  "/api/auth/sign-in/email",
  "/api/auth/sign-up/email",
]);
const AUTH_LIMIT = { requests: 10, window: "1 m" } as const;

let redis: Redis | undefined;
const limiters = new Map<"global" | "auth", Ratelimit>();

function getRatelimit(kind: "global" | "auth") {
  let limiter = limiters.get(kind);
  if (!limiter) {
    redis ??= Redis.fromEnv();
    limiter = new Ratelimit({
      redis,
      prefix: kind === "auth" ? "@upstash/ratelimit/auth" : undefined,
      limiter:
        kind === "auth"
          ? Ratelimit.slidingWindow(AUTH_LIMIT.requests, AUTH_LIMIT.window)
          : Ratelimit.slidingWindow(
              env.RATE_LIMITING_REQUESTS_PER_SECOND,
              "1 s",
            ),
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
    const kinds: ("global" | "auth")[] =
      isAuthApi && req.method === "POST" && AUTH_CREDENTIAL_PATHS.has(pathname)
        ? ["global", "auth"]
        : ["global"];
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
  if (isAuthApi) return NextResponse.next();

  const sessionToken = getSessionCookie(req);

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

  // `CSP_ENFORCE` chooses enforcing vs report-only.
  const response = NextResponse.next();
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
 * `Origin` (browsers always do for same-origin POST; Referer is not enough).
 * Safe methods may omit both headers but must match when one is present.
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

  if (!SAFE_METHODS.has(req.method)) return isAllowed(origin);
  if (origin) return isAllowed(origin);
  if (referer) return isAllowed(referer);
  return true;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes EXCEPT /api/trpc and /api/auth (matched for rate limiting;
     *   trpc also for the origin check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/(?!trpc|auth)|_next/static|_next/image|favicon.ico).*)",
  ],
};
