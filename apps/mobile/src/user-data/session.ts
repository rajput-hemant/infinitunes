import { claimOptimisticOwner } from "@infinitunes/core/optimistic-owner";
import type { QueryKey } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { toast } from "sonner-native";

import { authClient } from "~/lib/auth-client";

/** The signed-in user's id, or `undefined` while signed out or loading. */
export function useUserId(): string | undefined {
  return authClient.useSession().data?.user.id;
}

/**
 * The cache key of a per-user query: the procedure's key plus the user id,
 * so one account's library is never served from the cache to the next, and
 * invalidating the procedure's own key still reaches every user's entry.
 */
export function userQueryKey(
  procedureKey: QueryKey,
  userId: string | undefined,
) {
  return [...procedureKey, userId];
}

/**
 * Clears optimistic likes and playlist edits when the account changes, so one
 * account's pending writes never show for the next. Mounted once at the root.
 */
export function useOptimisticOwner() {
  const userId = useUserId();
  useEffect(() => {
    claimOptimisticOwner(userId);
  }, [userId]);
}

/** Tells a signed-out listener why an action needs an account, with a way in. */
export function promptSignIn(reason: string) {
  toast.warning("Sign in to continue", {
    description: reason,
    action: { label: "Sign in", onClick: () => router.push("/login") },
  });
}
