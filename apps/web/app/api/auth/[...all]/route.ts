import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "~/lib/auth";
import { resolveTrustedProxy, withTrustedClientIp } from "~/lib/client-ip";
import { env } from "~/lib/env";

const handlers = toNextJsHandler(auth);

// Stamp the trusted client IP so Better Auth's limiter never reads the
// forgeable x-forwarded-for (same TRUSTED_PROXY logic as proxy.ts).
const withClientIp =
  (handler: (request: Request) => Promise<Response>) => (request: Request) =>
    handler(
      withTrustedClientIp(
        request,
        resolveTrustedProxy(env.TRUSTED_PROXY, process.env.VERCEL),
      ),
    );

export const GET = withClientIp(handlers.GET);
export const POST = withClientIp(handlers.POST);
