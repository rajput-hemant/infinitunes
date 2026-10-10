"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { loginSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import { Fingerprint, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { asRoute, cn, safeRedirectPath } from "~/lib/utils";

import { EmailField } from "./email-field";
import {
  authLinkStyles,
  authPrimaryButtonStyles,
  authSquareLgButtonStyles,
} from "./field-styles";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";

type LoginFormData = z.infer<typeof loginSchema>;

const defaultValues: LoginFormData = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = safeRedirectPath(
    searchParams.get("callbackUrl") || searchParams.get("redirect"),
  );
  const authError = searchParams.get("error");

  React.useEffect(() => {
    if (authError === "OAuthAccountNotLinked") {
      toast.error("OAuth Account Not Linked", {
        description: "This account is already linked with another provider.",
      });
    }
  }, [authError]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  async function onSubmit(formData: LoginFormData) {
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("You have been signed in.");
        router.push(asRoute(callbackUrl));
        router.refresh();
      }
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function passkeySignInHandler() {
    setIsPasskeyLoading(true);

    try {
      const { error } = await authClient.signIn.passkey();

      if (error) {
        if (error.message?.toLowerCase().includes("cancel")) {
          toast.info("Passkey sign-in was cancelled.");
        } else {
          toast.error(error.message ?? "Passkey sign-in failed.");
        }
      } else {
        toast.success("You have been signed in.");
        router.push(asRoute(callbackUrl));
        router.refresh();
      }
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Passkey sign-in failed.",
      );
      toast.error("Passkey sign-in failed.");
    } finally {
      setIsPasskeyLoading(false);
    }
  }

  const isDisabled = isSubmitting || isPasskeyLoading;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="order-2 grid gap-4"
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <EmailField
              field={field}
              fieldState={fieldState}
              autoComplete="email webauthn"
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              field={field}
              fieldState={fieldState}
              label="Password"
              labelAction={
                <Link
                  href="/forgot-password"
                  className={cn(
                    authLinkStyles,
                    "rounded-sm text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  Forgot password?
                </Link>
              }
              autoComplete="current-password webauthn"
              disabled={isDisabled}
            />
          )}
        />

        <Button
          type="submit"
          disabled={isDisabled}
          className={authPrimaryButtonStyles}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Login with Email
        </Button>
      </form>

      <div className="order-1 grid gap-4">
        <Button
          type="button"
          variant="secondary"
          disabled={isDisabled}
          onClick={passkeySignInHandler}
          className={authSquareLgButtonStyles}
        >
          {isPasskeyLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 size-4" />
          )}
          Sign in with passkey
        </Button>

        <OAuthButtons
          isFormDisabled={isDisabled}
          callbackUrl={callbackUrl}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </div>
  );
}
