"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  async function signOutHandler() {
    toast.promise(authClient.signOut(), {
      loading: "Signing out...",
      success: "You have been signed out.",
      error: "Something went wrong.",
    });
  }
  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={signOutHandler}
      className="w-24"
    >
      <LogOut className="mr-2 size-4" /> Logout
    </Button>
  );
}
