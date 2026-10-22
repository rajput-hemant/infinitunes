import {
  NATIVE_APP_ORIGIN,
  NATIVE_ORIGIN_HEADER,
} from "@infinitunes/auth/native-app";
import type { AppRouter } from "@infinitunes/trpc/types";
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { authClient } from "./auth-client";
import { env } from "./env";
import { queryClient } from "./query-client";

const endpoint = `${env.apiUrl}/api/trpc`;

const transport = {
  url: endpoint,
  transformer: superjson,
  // The session lives in secure storage, not a cookie jar: send it
  // explicitly, and name the app because native fetch sends no `Origin`
  // (the web proxy rejects mutations without one or the other). The cookie
  // is served from memory after the first read (`cachedStorage`).
  headers: async () => {
    const cookie = await authClient.getCookie();
    return {
      [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
      ...(cookie ? { cookie } : {}),
    };
  },
  // iOS would otherwise add cookies from the shared system store, which
  // can hold a stale session next to the stored one.
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, credentials: "omit" }),
};

/**
 * Imperative calls (`await trpcClient.song.details.query(...)`): playback,
 * mutations, anything outside a component's render.
 *
 * The home feed is the slowest query and every tab mounts at cold start, so it
 * goes in its own request: batched, it held every other query back and was held
 * back by them.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.path === "home.home",
      true: httpLink(transport),
      false: httpBatchLink({
        ...transport,
        // The route rejects batches over `maxBatchSize` (20); split before that.
        maxItems: 20,
        maxURLLength: 2083,
      }),
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
