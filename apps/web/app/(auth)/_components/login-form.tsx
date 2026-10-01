"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { loginSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Eye, EyeOff, Fingerprint, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof loginSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
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
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
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
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Passkey sign-in failed.");
    } finally {
      setIsPasskeyLoading(false);
    }
  }

  const isDisabled = isSubmitting || isPasskeyLoading;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel className="sr-only">Email</FieldLabel>
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email webauthn"
                  disabled={isDisabled}
                  placeholder="you@domain.com"
                  className="h-10 pr-8 shadow-xs"
                  {...field}
                />
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel className="sr-only">Password</FieldLabel>
              <div className="relative">
                <Input
                  type={isPassVisible ? "text" : "password"}
                  autoComplete="current-password webauthn"
                  disabled={isDisabled}
                  placeholder="••••••••••"
                  className="h-10 pr-8 shadow-xs"
                  {...field}
                />
                <Tooltip>
                  <TooltipTrigger
                    delay={150}
                    aria-label={
                      isPassVisible ? "Hide Password" : "Show Password"
                    }
                    tabIndex={-1}
                    type="button"
                    disabled={!field.value}
                    onClick={() => setIsPassVisible(!isPassVisible)}
                    className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isPassVisible ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </TooltipTrigger>

                  <TooltipContent>
                    <p className="text-xs">
                      {isPassVisible ? "Hide Password" : "Show Password"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isDisabled}
          className="h-9 w-full font-semibold shadow-md"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Login with Email
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isDisabled}
          onClick={passkeySignInHandler}
          className="h-9 w-full font-semibold shadow-md"
        >
          {isPasskeyLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 size-4" />
          )}
          Sign in with Passkey
        </Button>
      </form>

      <p className="mx-auto mt-2 text-xs text-muted-foreground hover:text-foreground">
        <Link
          href="/reset-password"
          className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-hidden"
        >
          Forgot password?
        </Link>
      </p>

      <OAuthButtons
        isFormDisabled={isDisabled}
        setIsSubmitting={setIsSubmitting}
      />
    </>
  );
}
