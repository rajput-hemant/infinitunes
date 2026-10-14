"use client";

import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { controlStyles } from "~/lib/control-styles";

type AuthModalProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthModal({ title, description, children }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-(--r-lg) p-6 sm:max-w-120">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-center font-heading text-[1.75rem]/8 font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-5 text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <p className="py-2 text-center text-sm text-muted-foreground">
          {isLoginPage
            ? "Don't have an account? "
            : "Already have an account? "}
          <Button
            variant="link"
            className={controlStyles.text}
            onClick={() => router.replace(isLoginPage ? "/signup" : "/login")}
          >
            {isLoginPage ? "Sign up" : "Login"}
          </Button>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
