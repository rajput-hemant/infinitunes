"use client";

import { resetOptimisticState } from "@infinitunes/core/optimistic-owner";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * The auth client (with the passkey plugin) is imported on click, so it stays
 * out of every page's first load. It lives outside the hook: the React Compiler
 * cannot lower a dynamic import() inside a component.
 */
function loadAuthClient() {
  return import("@infinitunes/auth/client");
}

/**
 * Signs the current user out, then loads home afresh (a soft /login would open the login modal over the page).
 * Better Auth resolves `{ error }` instead of rejecting, so a failed request is
 * turned into a rejection for the toast (and never redirects).
 */
export function useSignOut() {
  return useCallback(() => {
    resetOptimisticState();
    toast.promise(
      loadAuthClient()
        .then(({ authClient }) =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                // A full load: soft-refreshing from the signed-in tree left the
                // login link prefetching a stale intercepted route (404s), and it
                // drops every per-user client cache.
                window.location.assign("/");
              },
            },
          }),
        )
        .then(({ error }) => {
          if (error) throw new Error(error.message ?? "Sign out failed");
        }),
      {
        loading: "Signing out...",
        success: "You have been signed out.",
        error: "Something went wrong.",
      },
    );
  }, []);
}
