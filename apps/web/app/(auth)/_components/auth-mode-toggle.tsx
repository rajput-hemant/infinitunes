"use client";

import { buttonVariants } from "@infinitunes/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

export function AuthModeToggle() {
  const isLoginPage = usePathname() === "/login";

  return (
    <Link
      href={isLoginPage ? "/signup" : "/login"}
      className={cn(
        buttonVariants({ variant: "outline" }),
        controlStyles.text,
        "absolute right-4 top-4 hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background md:right-8 md:top-8",
      )}
    >
      {isLoginPage ? "Sign Up" : "Login"}
    </Link>
  );
}
