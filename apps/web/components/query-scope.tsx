"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // The server must never share a client across concurrent requests.
  if (typeof window === "undefined") return makeQueryClient();

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

/** TanStack Query for a subtree, sharing a browser client between scopes. */
export function QueryScope({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
