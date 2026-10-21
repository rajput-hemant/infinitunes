import { getErrorCode } from "@infinitunes/core/error-code";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { addNetworkStateListener } from "expo-network";
import { AppState } from "react-native";

// React Native has no window focus or `online` events: report foregrounding
// and connectivity so queries refetch on return and pause while offline.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active"),
  );
  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) =>
    setOnline(state.isConnected !== false),
  );
  return () => subscription.remove();
});

const MAX_RETRIES = 3;

/** Codes that name a request or entity that will not change on a second try. */
const FINAL_CODES = new Set([
  "NOT_FOUND",
  "BAD_REQUEST",
  "FORBIDDEN",
  "UNAUTHORIZED",
]);

/**
 * TanStack's default three retries, minus the failures a retry cannot fix: a
 * missing entity stays missing (retrying would hold the skeleton for seconds
 * before the not-found state), and a rejected input or session stays rejected.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const code = getErrorCode(error);
  return failureCount < MAX_RETRIES && !(code && FINAL_CODES.has(code));
}

/** The app's single query cache, shared by hooks and the tRPC options proxy. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Catalog data changes slowly; the web caches it for 10 to 60 minutes.
      staleTime: 5 * 60 * 1000,
      retry: shouldRetry,
    },
  },
});
