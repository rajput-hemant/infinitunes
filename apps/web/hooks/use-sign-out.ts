"use client";

import { authClient } from "@infinitunes/auth/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Signs the current user out, then sends them to /login with fresh server data.
 * Better Auth resolves `{ error }` instead of rejecting, so a failed request is
 * turned into a rejection for the toast (and never redirects).
 */
export function useSignOut() {
  const router = useRouter();

  return useCallback(() => {
    toast.promise(
      authClient
        .signOut({
          fetchOptions: {
            onSuccess: () => {
              router.replace("/login");
              router.refresh();
            },
          },
        })
        .then(({ error }) => {
          if (error) throw new Error(error.message ?? "Sign out failed");
        }),
      {
        loading: "Signing out...",
        success: "You have been signed out.",
        error: "Something went wrong.",
      },
    );
  }, [router]);
}
