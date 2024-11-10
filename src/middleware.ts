import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { NextRequest } from "next/server";

import { appRoutes } from "./config/routes";
import { env } from "./lib/env";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(env.RATE_LIMITING_REQUESTS_PER_SECOND, "1s"),
});

export async function middleware(req: NextRequest) {
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
        }
      );
    }
  }

  const { nextUrl } = req;
  const paths = nextUrl.pathname.split("/").slice(1);

  if (paths.length === 2 && appRoutes.includes(`/${paths[0]}`)) {
    return NextResponse.redirect(new URL(`/${paths[0]}`, nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
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
