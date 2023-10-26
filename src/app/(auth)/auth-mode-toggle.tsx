"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AuthModeToggle = () => {
  const isLoginPage = usePathname() === "/login";

  return (
    <div className="absolute right-4 top-4 md:right-8 md:top-8">
      <span className="text-muted-foreground hidden text-sm md:inline-block">
        {isLoginPage
          ? "Don't have an account yet?"
          : "Already have an account?"}
      </span>

      <Link
        href={isLoginPage ? "/signup" : "/login"}
        className={cn(buttonVariants({ variant: "outline" }), "ml-2")}
      >
        {isLoginPage ? "Sign up" : "Login"}
      </Link>
    </div>
  );
};

export default AuthModeToggle;
