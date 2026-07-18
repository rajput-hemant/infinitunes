"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function signOutHandler() {
    toast.promise(signOut, {
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
