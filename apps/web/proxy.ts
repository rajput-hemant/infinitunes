import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  appRoutes,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  userRoutes,
} from "./config/routes";
import { buildCsp, CSP_REPORT_ONLY_HEADER } from "./lib/csp";
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

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  const paths = pathname.split("/").slice(1);

  if (paths.length === 2 && appRoutes.includes(`/${paths[0]}`)) {
    return NextResponse.redirect(new URL(`/${paths[0]}`, nextUrl));
  }

  if (isTrpc) return NextResponse.next();

  // Report-only: observe violations before ever enforcing. Next applies the
  // nonce to its own scripts from the request header (dynamic pages only).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    isDev: env.NODE_ENV === "development",
    umami: Boolean(env.UMAMI_WEBSITE_ID),
  });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_REPORT_ONLY_HEADER, csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_REPORT_ONLY_HEADER, csp);
  return response;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * CSRF guard for /api/trpc. State-changing methods must send a matching
 * `Origin` (browsers always do for same-origin POST; Referer is not enough).
 * Safe methods may omit both headers but must match when one is present.
 */
function isSameOriginRequest(req: NextRequest): boolean {
  if (req.method === "OPTIONS") return true;

  const host = req.headers.get("host");
  const allowed = originOf(
    env.AUTH_URL ?? (host ? `${req.nextUrl.protocol}//${host}` : null),
  );
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!SAFE_METHODS.has(req.method)) {
    return allowed !== null && originOf(origin) === allowed;
  }
  if (origin) return allowed !== null && originOf(origin) === allowed;
  if (referer) return allowed !== null && originOf(referer) === allowed;
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
  // @ts-expect-error ip is not available in NextRequest
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }
  return ip;
}
