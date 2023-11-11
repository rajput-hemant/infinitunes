import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "./lib/env.mjs";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(env.RATE_LIMITING_REQUESTS_PER_SECOND, "1s"),
});

export async function middleware(req: NextRequest) {
  if (env.ENABLE_RATE_LIMITING && env.NODE_ENV === "production") {
    const id = req.ip ?? "anonymous";
    const { limit, pending, remaining, reset, success } = await ratelimit.limit(
      id ?? "anonymous"
    );

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

  return NextResponse.next();
}
