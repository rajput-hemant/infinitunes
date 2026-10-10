"use client";

import { Button } from "@infinitunes/ui/components/button";
import { LogOut } from "lucide-react";

import { useSignOut } from "~/hooks/use-sign-out";
import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

export function LogoutButton() {
  const signOut = useSignOut();

  return (
    <Button
      variant="destructive"
      onClick={signOut}
      className={cn(controlStyles.text, destructiveText)}
    >
      <LogOut aria-hidden className="mr-2 size-4" /> Log out
    </Button>
  );
}
