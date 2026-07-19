import { appRouter } from "@infinitunes/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}

export { handler as GET, handler as POST, handler as OPTIONS };
