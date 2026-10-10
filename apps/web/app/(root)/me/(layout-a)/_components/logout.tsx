"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

export function LogoutButton() {
  const router = useRouter();

  async function signOutHandler() {
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
  }
  return (
    <Button
      variant="destructive"
      onClick={signOutHandler}
      className={cn(controlStyles.text, destructiveText)}
    >
      <LogOut className="mr-2 size-4" /> Logout
    </Button>
  );
}
