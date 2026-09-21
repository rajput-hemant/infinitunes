import { db } from "@infinitunes/db";
import { appRouter } from "@infinitunes/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { getSession } from "~/lib/auth";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => ({ db, session: await getSession() }),
  });
}

export { handler as GET, handler as POST, handler as OPTIONS };
