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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Props = {
  children: React.ReactNode;
};

const AuthModal = ({ children }: Props) => {
  const router = useRouter();
  const isLoginPage = usePathname() === "/login";

  function navigateBack() {
    router.back();
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && navigateBack()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogDescription className="text-center">
            {isLoginPage
              ? "Don't have an account? "
              : "Already have an account? "}
            <Button
              variant="link"
              className="px-0"
              onClick={() => router.replace(isLoginPage ? "/signup" : "/login")}
            >
              {isLoginPage ? "Sign up" : "Login"}
            </Button>
            .
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {children}

        <Separator className="mt-2" />

        <DialogFooter className="my-4 flex">
          <DialogClose asChild>
            <Button
              variant="secondary"
              onClick={navigateBack}
              className="w-full text-lg font-semibold"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
