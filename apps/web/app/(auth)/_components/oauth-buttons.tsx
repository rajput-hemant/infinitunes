"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { GitHub, Google } from "~/components/icons";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type OAuthProvider = "google" | "github";

type OAuthButtonProps = {
  isFormDisabled: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
};

export function OAuthButtons(props: OAuthButtonProps) {
  const { isFormDisabled, setIsSubmitting } = props;

  const [oauthLoading, setOauthLoading] = React.useState<OAuthProvider>();

  async function signInWithProvider(provider: OAuthProvider) {
    setOauthLoading(provider);
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.social({ provider });

      if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("You have been signed in.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setOauthLoading(undefined);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => signInWithProvider("github")}
          disabled={isFormDisabled}
          className={cn(controlStyles.text, "w-full")}
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
          variant="outline"
          onClick={() => signInWithProvider("google")}
          disabled={isFormDisabled}
          className={cn(controlStyles.text, "w-full")}
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
