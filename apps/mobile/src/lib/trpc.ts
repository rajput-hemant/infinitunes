import type { AppRouter } from "@infinitunes/trpc/types";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { authClient } from "./auth-client";
import { env } from "./env";
import { queryClient } from "./query-client";

/**
 * Imperative calls (`await trpcClient.song.details.query(...)`): playback,
 * mutations, anything outside a component's render.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.apiUrl}/api/trpc`,
      transformer: superjson,
      // Native fetch has no cookie jar: send the stored session explicitly.
      headers: async () => {
        const cookie = await authClient.getCookie();
        return cookie ? { cookie } : {};
      },
    }),
  ],
});

/**
 * Query and mutation options for TanStack Query hooks, e.g.
 * `useQuery(trpc.home.home.queryOptions({}))`.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
