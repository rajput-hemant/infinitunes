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
import { env } from "./lib/env";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(env.RATE_LIMITING_REQUESTS_PER_SECOND, "1s"),
});

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Origin / Referer check for /api/trpc requests
  if (pathname.startsWith("/api/trpc") && req.method !== "OPTIONS") {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");

    const allowedOrigin =
      env.AUTH_URL ?? (host ? `${nextUrl.protocol}//${host}` : null);

    let isSameOrigin = false;

    if (origin && allowedOrigin) {
      try {
        isSameOrigin = new URL(origin).origin === new URL(allowedOrigin).origin;
      } catch {
        isSameOrigin = false;
      }
    } else if (referer && allowedOrigin) {
      try {
        isSameOrigin =
          new URL(referer).origin === new URL(allowedOrigin).origin;
      } catch {
        isSameOrigin = false;
      }
    } else if (!origin && !referer) {
      // Same-origin server-to-server calls or direct internal fetches might omit origin/referer
      isSameOrigin = true;
    }

    if (!isSameOrigin) {
      return NextResponse.json(
        { error: { message: "Forbidden: Invalid origin or referer" } },
        { status: 403 },
      );
    }
  }

  if (env.ENABLE_RATE_LIMITING === "true" && env.NODE_ENV === "production") {
    const id = getIP(req) || "anonymous";
    const { limit, pending, remaining, reset, success } =
      await ratelimit.limit(id);

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

  return NextResponse.next();
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
