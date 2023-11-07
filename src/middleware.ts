import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1s"),
});

export async function middleware(req: NextRequest) {
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
          reset,
        },
      },
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  return NextResponse.next();
}
