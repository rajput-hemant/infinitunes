import {
  NATIVE_APP_ORIGIN,
  NATIVE_ORIGIN_HEADER,
} from "@infinitunes/auth/native-app";
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
      // The session lives in secure storage, not a cookie jar: send it
      // explicitly, and name the app because native fetch sends no `Origin`
      // (the web proxy rejects mutations without one or the other).
      headers: async () => {
        const cookie = await authClient.getCookie();
        return {
          [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
          ...(cookie ? { cookie } : {}),
        };
      },
      // iOS would otherwise add cookies from the shared system store, which
      // can hold a stale session next to the stored one.
      fetch: (url, options) => fetch(url, { ...options, credentials: "omit" }),
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
