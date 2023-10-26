"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ToastAction } from "@radix-ui/react-toast";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function AuthForm({ className, ...props }: Props) {
  const isLoginPage = usePathname() === "/login";

  const [isSubmittingEmail, _setIsSubmittingEmail] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    // setIsSubmittingEmail(true);

    // setTimeout(() => {
    //   setIsSubmittingEmail(false);
    // }, 3000);

    toast({
      title: "Uh oh! Something went wrong.",
      description:
        "This feature is not yet implemented. Please try again later.",
      action: <ToastAction altText="Try again">Try again</ToastAction>,
    });
  }

  function toastNotifier(mode: "welcome" | "error" = "welcome") {
    if (mode === "welcome") {
      toast({
        title: "Welcome!",
        description: "You've successfully signed in.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }

  async function googleSignInHandler() {
    setIsGoogleLoading(true);

    try {
      await signIn("google");
      toastNotifier();
    } catch (error) {
      toastNotifier("error");
    }

    setIsGoogleLoading(false);
  }

  async function githubSignInHandler() {
    setIsGithubLoading(true);

    try {
      await signIn("github");
      toastNotifier();
    } catch (error) {
      toastNotifier("error");
    }

    setIsGithubLoading(false);
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <form onSubmit={onSubmit} className="space-y-2">
        <Label className="sr-only" htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          placeholder="Email Address"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isSubmittingEmail}
        />

        <Label className="sr-only" htmlFor="password">
          Password
        </Label>
        <Input
          id="password"
          placeholder="Password"
          type="password"
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect="off"
          disabled={isSubmittingEmail}
        />
        {!isLoginPage && (
          <>
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Confirm Password"
              type="password"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect="off"
              disabled={isSubmittingEmail}
            />
          </>
        )}

        <Button disabled={isSubmittingEmail} className="w-full">
          {isSubmittingEmail ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoginPage ? "Signing In" : "Signing Up"}
            </>
          ) : (
            `Sign ${isLoginPage ? "In" : "Up"} with Email`
          )}
        </Button>
      </form>

      <div className="relative">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="bg-background text-muted-foreground relative mx-auto flex w-fit px-2 text-xs uppercase">
          Or continue with
        </span>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          type="button"
          variant="outline"
          disabled={isGoogleLoading}
          onClick={googleSignInHandler}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isGithubLoading}
          onClick={githubSignInHandler}
        >
          {isGithubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.GitHub className="mr-2 h-4 w-4" />
          )}
          Github
        </Button>
      </div>
    </div>
  );
}
