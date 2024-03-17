"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthModeToggle() {
  const isLoginPage = usePathname() === "/login";

  return (
    <Link
      href={isLoginPage ? "/signup" : "/login"}
      className={cn(
        buttonVariants({ size: "sm", variant: "outline" }),
        "absolute right-4 top-4 w-20 transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background md:right-8 md:top-8"
      )}
    >
      {isLoginPage ? "Sign Up" : "Login"}
    </Link>
  );
}
