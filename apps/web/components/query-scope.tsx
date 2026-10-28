"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
}

let browserQueryClient: QueryClient | undefined;
let scopeId = 0;

function getQueryClient() {
  // The server must never share a client across concurrent requests.
  if (typeof window === "undefined") return makeQueryClient();

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

/**
 * TanStack Query for one subtree (an infinite list, the search palette, the
 * lyrics pane). The app root does not provide it, so only the routes that
 * render one of these ship the library. Seeded lists use a fresh client for
 * each server page; other scopes share a browser client.
 */
export function QueryScope({
  children,
  seed,
}: {
  children: ReactNode;
  seed?: object;
}) {
  const scope = useMemo(
    () => ({
      client: seed ? makeQueryClient() : getQueryClient(),
      key: ++scopeId,
    }),
    [seed],
  );
  return (
    <QueryClientProvider key={scope.key} client={scope.client}>
      {children}
    </QueryClientProvider>
  );
}
