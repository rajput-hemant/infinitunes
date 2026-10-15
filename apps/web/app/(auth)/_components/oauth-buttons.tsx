"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { GitHub, Google } from "~/components/icons";

import { authSquareButtonStyles } from "./field-styles";

type OAuthProvider = "google" | "github";

type OAuthButtonProps = {
  isFormDisabled: boolean;
  /** Already passed through `safeRedirectPath`. */
  callbackUrl: string;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Starts a provider sign-in. Outside the component: the React Compiler bails out on try/finally. */
async function signInWithProvider(
  provider: OAuthProvider,
  callbackUrl: string,
  setOauthLoading: React.Dispatch<
    React.SetStateAction<OAuthProvider | undefined>
  >,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
) {
  setOauthLoading(provider);
  setIsSubmitting(true);

  try {
    // On success the browser navigates to the provider, so there is nothing to announce.
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: callbackUrl,
    });

    if (error) toast.error(error.message ?? "Something went wrong.");
  } catch (error) {
    console.error(error);
    toast.error("Something went wrong.");
  } finally {
    setIsSubmitting(false);
    setOauthLoading(undefined);
  }
}

export function OAuthButtons(props: OAuthButtonProps) {
  const { isFormDisabled, callbackUrl, setIsSubmitting } = props;

  const [oauthLoading, setOauthLoading] = React.useState<OAuthProvider>();

  async function startProviderSignIn(provider: OAuthProvider) {
    await signInWithProvider(
      provider,
      callbackUrl,
      setOauthLoading,
      setIsSubmitting,
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => startProviderSignIn("github")}
          disabled={isFormDisabled}
          className={authSquareButtonStyles}
        >
          {oauthLoading === "github" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <GitHub className="mr-2 size-4" />
          )}
          GitHub
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => startProviderSignIn("google")}
          disabled={isFormDisabled}
          className={authSquareButtonStyles}
        >
          {oauthLoading === "google" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Google className="mr-2 size-4" />
          )}
          Google
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        or
      </div>
    </div>
  );
}
