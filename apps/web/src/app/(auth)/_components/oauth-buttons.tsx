"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { GitHub, Google } from "@/components/icons";
import { Button } from "@/components/ui/button";

type OAuthButtonProps = {
  isFormDisabled: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
};

export function OAuthButtons(props: OAuthButtonProps) {
  const { isFormDisabled, setIsSubmitting } = props;

  const [oauthLoading, setOauthLoading] = React.useState<"google" | "github">();

  function signInToaster(promise: Promise<unknown>) {
    toast.promise(promise, {
      loading: "Signing in...",
      success: "You have been signed in.",
      error: "Something went wrong.",
      finally: () => {
        setIsSubmitting(false);
        setOauthLoading(undefined);
      },
    });
  }
  async function googleSignInHandler() {
    setOauthLoading("google");
    setIsSubmitting(true);

    try {
      signInToaster(signIn("google"));
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
    }
  }

  async function githubSignInHandler() {
    setOauthLoading("github");
    setIsSubmitting(true);

    try {
      signInToaster(signIn("github"));
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
    }
  }
  return (
    <>
      <div className="relative py-2">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="relative mx-auto flex w-fit bg-background px-2 text-xs uppercase text-muted-foreground transition-colors duration-0">
          Or continue with
        </span>
      </div>

      <div className="mt-6 flex w-full flex-col space-y-2 text-white">
        <Button
          size="sm"
          onClick={googleSignInHandler}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "google" ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : <Google className="mr-2 size-4" />}
          Google
        </Button>

        <Button
          size="sm"
          onClick={githubSignInHandler}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "github" ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : <GitHub className="mr-2 size-4" />}
          GitHub
        </Button>
      </div>
    </>
  );
}
