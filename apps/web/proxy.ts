import { originOf } from "@infinitunes/auth/url";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appRoutes, userRoutes } from "./config/routes";
import { buildCsp, cspHeaderName } from "./lib/csp";
import { env } from "./lib/env";

let ratelimit: Ratelimit | undefined;

function getRatelimit() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(
        env.RATE_LIMITING_REQUESTS_PER_SECOND,
        "1s",
      ),
    });
  }
  return ratelimit;
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

  if (env.ENABLE_RATE_LIMITING === "true" && env.NODE_ENV === "production") {
    const id = getIP(req) || "anonymous";
    const { limit, pending, remaining, reset, success } =
      await getRatelimit().limit(id);

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
          },
        },
      );
    }
  }

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

  // Next applies the nonce to its own scripts from the request header (dynamic
  // pages only). `CSP_ENFORCE` chooses enforcing vs report-only.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    isDev: env.NODE_ENV === "development",
    umami: Boolean(env.UMAMI_WEBSITE_ID),
  });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const header = cspHeaderName();
  requestHeaders.set(header, csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(header, csp);
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
     * - api routes EXCEPT /api/trpc (which is matched for rate limiting & origin check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/(?!trpc)|_next/static|_next/image|favicon.ico).*)",
  ],
};

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",").at(0)?.trim() ||
    ""
  );
}
