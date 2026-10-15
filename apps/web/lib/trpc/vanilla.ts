import type { AppRouter } from "@infinitunes/trpc/types";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

/**
 * The imperative tRPC client: play buttons, radio starts and the player call it
 * directly, so a route without a list or a search box never loads TanStack Query.
 * Components that need a cache (infinite lists, search, lyrics) wrap themselves
 * in `QueryScope` and pass this client's calls as their `queryFn`.
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      maxURLLength: 2083,
      transformer: superjson,
    }),
  ],
});
