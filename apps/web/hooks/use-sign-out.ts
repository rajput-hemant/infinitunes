"use client";

import { authClient } from "@infinitunes/auth/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

/** Signs the current user out, then sends them to /login with fresh server data. */
export function useSignOut() {
  const router = useRouter();

  return useCallback(() => {
    toast.promise(
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/login");
            router.refresh();
          },
        },
      }),
      {
        loading: "Signing out...",
        success: "You have been signed out.",
        error: "Something went wrong.",
      },
    );
  }, [router]);
}
