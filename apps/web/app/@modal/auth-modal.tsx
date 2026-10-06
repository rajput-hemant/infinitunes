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

type AuthModalProps = React.PropsWithChildren<{
  title: string;
  description: string;
}>;

export function AuthModal({ title, description, children }: AuthModalProps) {
  const router = useRouter();
  const isLoginPage = usePathname() === "/login";

  function navigateBack() {
    router.back();
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && navigateBack()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 space-y-2 overflow-y-auto p-6 sm:max-w-[450px] sm:p-10">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-3xl font-normal dark:drop-shadow-md text-foreground sm:text-4xl md:text-5xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <p className="py-2 text-center text-sm text-muted-foreground">
          {isLoginPage
            ? "Don't have an account? "
            : "Already have an account? "}
          <Button
            size="sm"
            variant="link"
            className="h-5 px-0"
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
