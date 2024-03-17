"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
      <DialogContent className="gap-0 space-y-2 p-10 sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-3xl font-normal drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl md:text-5xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <p className="py-2 text-center text-sm text-muted-foreground">
          {isLoginPage ?
            "Don't have an account? "
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

        <Separator />

        <DialogFooter className="flex pt-2">
          <DialogClose asChild>
            <Button
              variant="secondary"
              onClick={navigateBack}
              className="w-full border text-lg font-semibold shadow-sm"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
