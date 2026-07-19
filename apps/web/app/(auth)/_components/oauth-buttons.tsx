"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { GitHub, Google } from "@/components/icons";

type OAuthButtonProps = {
  isFormDisabled: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
};

export function OAuthButtons(props: OAuthButtonProps) {
  const { isFormDisabled, setIsSubmitting } = props;

  const [oauthLoading, setOauthLoading] = React.useState<"google" | "github">();

  async function googleSignInHandler() {
    setOauthLoading("google");
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("You have been signed in.");
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setOauthLoading(undefined);
    }
  }

  async function githubSignInHandler() {
    setOauthLoading("github");
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("You have been signed in.");
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setOauthLoading(undefined);
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
          {oauthLoading === "google" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Google className="mr-2 size-4" />
          )}
          Google
        </Button>

        <Button
          size="sm"
          onClick={githubSignInHandler}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "github" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <GitHub className="mr-2 size-4" />
          )}
          GitHub
        </Button>
      </div>
    </>
  );
}
