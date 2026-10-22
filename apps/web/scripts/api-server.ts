// Dev-only API server: /api/trpc and /api/auth without Next (for mobile work).
// No proxy.ts origin check or rate limiting; never expose it publicly.
import { createAuth } from "@infinitunes/auth";
import { sessionCookiePrefix } from "@infinitunes/auth/session-cookie";
import { db } from "@infinitunes/db";
import { appRouter } from "@infinitunes/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const auth = createAuth(db, { cookiePrefix: sessionCookiePrefix() });

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: "0.0.0.0",
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: async () => ({
          db,
          session: await auth.api.getSession({ headers: req.headers }),
        }),
      });
    }
    if (pathname.startsWith("/api/auth")) return auth.handler(req);
    return new Response("Not found", { status: 404 });
  },
});

console.log(`API server on ${server.url}`);
